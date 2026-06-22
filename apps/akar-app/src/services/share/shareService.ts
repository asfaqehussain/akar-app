import Share, { Social } from 'react-native-share';

export const shareService = {
  /**
   * Shares the proof image and description directly to WhatsApp.
   * 
   * @param imageUri Local path or URL of the image
   * @param message Text message description
   */
  async shareToWhatsApp(imageUri: string, message: string): Promise<void> {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required for sharing');
      }

      await Share.shareSingle({
        title: 'Share Proof Photo',
        message: message,
        url: imageUri,
        social: Social.Whatsapp,
        type: 'image/jpeg',
      });
    } catch (error: any) {
      console.error('WhatsApp sharing failed:', error);
      throw new Error(`Sharing failed: ${error?.message || error}`);
    }
  }
};
