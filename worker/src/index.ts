export interface Env {
  PROOFS_R2: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY?: string;
  FIREBASE_SERVICE_ACCOUNT?: string; // JSON string of service account key
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      // 1. GET /api/images/:proofId -> Serve image directly from R2
      if (url.pathname.startsWith('/api/images/') && request.method === 'GET') {
        const proofId = url.pathname.split('/').pop();
        if (!proofId) {
          return new Response('Missing proof ID', { status: 400 });
        }

        const objectKey = `proofs/${proofId}.jpg`;
        const object = await env.PROOFS_R2.get(objectKey);

        if (!object) {
          return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Content-Type', 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(object.body, { headers });
      }

      // 2. GET /api/proofs -> Optional endpoint to list proofs directly
      if (url.pathname === '/api/proofs' && request.method === 'GET') {
        // Fetch proofs from Firestore REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/proofs?pageSize=100`;
        const response = await fetch(firestoreUrl);
        
        if (!response.ok) {
          const errText = await response.text();
          return new Response(`Firestore read failed: ${errText}`, { status: response.status });
        }

        const data = await response.json() as any;
        const documents = data.documents || [];

        // Format Firestore JSON format to flat JSON
        const proofs = documents.map((doc: any) => {
          const fields = doc.fields || {};
          const nameParts = doc.name.split('/');
          const docId = nameParts[nameParts.length - 1];

          return {
            proofId: docId,
            timestamp: fields.timestamp?.stringValue || '',
            latitude: parseFloat(fields.latitude?.doubleValue || fields.latitude?.integerValue || '0'),
            longitude: parseFloat(fields.longitude?.doubleValue || fields.longitude?.integerValue || '0'),
            accuracy: fields.accuracy ? parseFloat(fields.accuracy.doubleValue || fields.accuracy.integerValue) : null,
            mocked: !!fields.mocked?.booleanValue,
            imageHash: fields.imageHash?.stringValue || '',
            isRooted: !!fields.isRooted?.booleanValue,
            deviceName: fields.deviceName?.stringValue || '',
            deviceModel: fields.deviceModel?.stringValue || '',
            osVersion: fields.osVersion?.stringValue || '',
            imageUrl: fields.imageUrl?.stringValue || '',
            createdAt: fields.createdAt?.stringValue || '',
          };
        });

        return new Response(JSON.stringify(proofs), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 3. POST /api/upload -> Upload Image and save metadata
      if (url.pathname === '/api/upload' && request.method === 'POST') {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const metadataStr = formData.get('metadata') as string | null;

        if (!imageFile || !metadataStr) {
          return new Response(JSON.stringify({ error: 'Missing image or metadata fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        const metadata = JSON.parse(metadataStr);
        const { proofId } = metadata;

        if (!proofId) {
          return new Response(JSON.stringify({ error: 'Missing proofId in metadata' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }

        // Upload to R2 Bucket
        const r2Key = `proofs/${proofId}.jpg`;
        const imageBuffer = await imageFile.arrayBuffer();
        await env.PROOFS_R2.put(r2Key, imageBuffer, {
          httpMetadata: { contentType: 'image/jpeg' },
        });

        // The URL of the image served by the worker itself
        const protocol = url.protocol;
        const host = url.host;
        const imageUrl = `${protocol}//${host}/api/images/${proofId}`;

        // Save metadata to Firestore via REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/proofs/${proofId}`;
        
        const firestoreDocument = {
          fields: {
            proofId: { stringValue: proofId },
            timestamp: { stringValue: metadata.timestamp || new Date().toISOString() },
            latitude: { doubleValue: Number(metadata.latitude) },
            longitude: { doubleValue: Number(metadata.longitude) },
            altitude: metadata.altitude !== null && metadata.altitude !== undefined ? { doubleValue: Number(metadata.altitude) } : { nullValue: null },
            accuracy: metadata.accuracy !== null && metadata.accuracy !== undefined ? { doubleValue: Number(metadata.accuracy) } : { nullValue: null },
            mocked: { booleanValue: !!metadata.mocked },
            imageHash: { stringValue: metadata.imageHash || '' },
            isRooted: { booleanValue: !!metadata.isRooted },
            deviceName: { stringValue: metadata.deviceName || 'Unknown' },
            deviceModel: { stringValue: metadata.deviceModel || 'Unknown Device' },
            osVersion: { stringValue: metadata.osVersion || 'Unknown' },
            imageUrl: { stringValue: imageUrl },
            createdAt: { stringValue: new Date().toISOString() },
          },
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // If service account credentials exist, obtain access token
        if (env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            const token = await getServiceAccountToken(env.FIREBASE_SERVICE_ACCOUNT);
            headers['Authorization'] = `Bearer ${token}`;
          } catch (e: any) {
            console.error('Service account token error:', e);
          }
        }

        const firestoreResponse = await fetch(firestoreUrl, {
          method: 'PATCH', // PATCH works to create or update the document by ID
          body: JSON.stringify(firestoreDocument),
          headers,
        });

        if (!firestoreResponse.ok) {
          const errText = await firestoreResponse.text();
          throw new Error(`Firestore REST error: ${errText}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            proofId,
            imageUrl,
            message: 'Proof saved successfully.',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      return new Response('Not Found', { status: 404 });
    } catch (err: any) {
      console.error('Worker fetch error:', err);
      return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// Minimal self-contained RS256 signing for Google OAuth2
async function getServiceAccountToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  
  // Clean private key PEM format
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  let pem = sa.private_key.replace(/\n/g, '');
  pem = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter));
  
  // Decode base64 to binary ArrayBuffer
  const rawBinary = atob(pem);
  const rawLength = rawBinary.length;
  const binaryArray = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; i++) {
    binaryArray[i] = rawBinary.charCodeAt(i);
  }

  // Import PKCS#8 formatted private key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryArray.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // JWT Header
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');

  // JWT Claim Set (Scope for Firestore API)
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  ).replace(/=/g, '');

  // Sign Token
  const message = `${header}.${claimSet}`;
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    enc.encode(message)
  );

  // Convert signature to base64url
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signedJwt = `${message}.${signature}`;

  // Exchange JWT for access token
  const oauthResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  });

  if (!oauthResponse.ok) {
    const errText = await oauthResponse.text();
    throw new Error(`Google OAuth error: ${errText}`);
  }

  const oauthData = await oauthResponse.json() as any;
  return oauthData.access_token;
}
