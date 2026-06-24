import ImageMarker, { ImageFormat } from 'react-native-image-marker';

interface WatermarkMetadata {
  proofId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isMocked: boolean;
}

/**
 * Overlays verification metadata onto the given image.
 * 
 * @param imagePath The local filepath of the image (without file:// scheme)
 * @param metadata The metadata to embed
 * @returns The file path of the watermarked image
 */
export async function burnWatermark(
  imagePath: string,
  metadata: WatermarkMetadata
): Promise<string> {
  const { proofId, timestamp, latitude, longitude, accuracy, isMocked } = metadata;

  // Format accuracy for display
  const accuracyText = accuracy ? ` (±${accuracy.toFixed(1)}m)` : '';
  const mockAlert = isMocked ? ' [MOCKED GPS WARNING]' : '';

  // Create formatted text strings for the watermark
  const lines = [
    `PROOF ID: ${proofId}`,
    `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accuracyText}${mockAlert}`,
    `TIME: ${timestamp}`,
  ];

  // We place each line with a slight vertical offset (Y-offset) from the bottom-left.
  // In react-native-image-marker, we can add multiple text overlays in `watermarkTexts`.
  // Using relative positions or Y offsets:
  const textOptions = lines.map((line, index) => {
    // Offset each line vertically by a percentage or pixel count.
    // For standard bottom-left, we can use Y positions like '92%', '95%', '98%'.
    const yPercent = 85 + index * 4; // 85%, 89%, 93% from top
    return {
      text: line,
      position: {
        X: '4%',
        Y: `${yPercent}%`,
      },
      style: {
        color: '#FFFFFF',
        fontSize: 100,
        bold: true,
        fontName: 'Helvetica-Bold',
        shadowStyle: {
          dx: 2,
          dy: 2,
          radius: 3,
          color: '#000000',
        },
      },
    };
  });

  try {
    const formattedPath = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

    const markedImagePath = await ImageMarker.markText({
      backgroundImage: {
        src: formattedPath,
        scale: 1.0,
      },
      watermarkTexts: textOptions,
      quality: 90,
      filename: `marked_${proofId}`,
      saveFormat: ImageFormat.jpg,
    });

    return markedImagePath;
  } catch (error) {
    console.error('Failed to burn watermark:', error);
    throw new Error('Watermark embedding failed.');
  }
}
