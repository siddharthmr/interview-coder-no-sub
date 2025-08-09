// ImageProcessor.ts
const sharp = require("sharp")

export class ImageProcessor {
  /**
   * Resizes an image buffer to 1080p height while maintaining original aspect ratio
   * @param buffer - The input image buffer
   * @returns Promise<Buffer> - The resized image buffer
   */
  public static async resizeTo1080p(buffer: Buffer): Promise<Buffer> {
    const maxHeight = 1080

    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      
      if (!metadata.width || !metadata.height) {
        console.warn("Could not get image dimensions, returning original")
        return buffer
      }

      // If image height is already 1080p or smaller, return original
      if (metadata.height <= maxHeight) {
        console.log(`Image height ${metadata.height} already within 1080p limit`)
        return buffer
      }

      // Calculate the scaling factor based on height only to maintain aspect ratio
      const scale = maxHeight / metadata.height
      const newWidth = Math.round(metadata.width * scale)
      const newHeight = maxHeight

      console.log(`Resizing image from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight}`)

      const resizedBuffer = await image
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3, // High quality resampling
          withoutEnlargement: true // Don't enlarge images smaller than target
        })
        .png({ 
          quality: 95, // High quality PNG
          compressionLevel: 6 // Balanced compression
        })
        .toBuffer()

      return resizedBuffer
    } catch (error) {
      console.error("Error resizing image:", error)
      // Return original buffer if resizing fails
      return buffer
    }
  }

  /**
   * Gets the dimensions of an image buffer
   * @param buffer - The input image buffer
   * @returns Promise<{width: number, height: number} | null>
   */
  public static async getDimensions(buffer: Buffer): Promise<{width: number, height: number} | null> {
    try {
      const metadata = await sharp(buffer).metadata()
      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height }
      }
      return null
    } catch (error) {
      console.error("Error getting image dimensions:", error)
      return null
    }
  }
}
