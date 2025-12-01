/**
 * Image Compression Utility
 *
 * Compresses images to reduce file size for storage and PDF embedding.
 * Target: < 150KB, max 1200px on longest edge, 0.7 quality
 * Removes EXIF data for privacy and smaller size.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  targetSizeKB: 150,
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to base64 data URL of compressed image
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > opts.maxWidth || height > opts.maxHeight) {
            if (aspectRatio > 1) {
              // Landscape
              width = opts.maxWidth;
              height = width / aspectRatio;
            } else {
              // Portrait
              height = opts.maxHeight;
              width = height * aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas (this removes EXIF data)
          ctx.drawImage(img, 0, 0, width, height);

          // Try to compress to target size
          let quality = opts.quality;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // If still too large, reduce quality iteratively
          const targetBytes = opts.targetSizeKB * 1024;
          let attempts = 0;
          const maxAttempts = 5;

          while (
            compressedDataUrl.length > targetBytes &&
            quality > 0.3 &&
            attempts < maxAttempts
          ) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            attempts++;
          }

          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Promise resolving to array of base64 data URLs
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Get estimated size of a base64 data URL in KB
 * @param dataUrl - Base64 data URL
 * @returns Size in KB
 */
export function getBase64SizeKB(dataUrl: string): number {
  // Remove data URL prefix
  const base64 = dataUrl.split(',')[1] || dataUrl;
  // Base64 encoding increases size by ~33%
  const sizeBytes = (base64.length * 3) / 4;
  return sizeBytes / 1024;
}

/**
 * Validate if file is an image
 * @param file - File to validate
 * @returns true if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Convert blob to base64 data URL
 * @param blob - Blob to convert
 * @returns Promise resolving to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress and validate image before upload
 * @param file - Image file to process
 * @param options - Compression options
 * @returns Promise resolving to compressed image data URL
 * @throws Error if file is not an image or compression fails
 */
export async function processImageForUpload(
  file: File,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; sizeKB: number }> {
  if (!isImageFile(file)) {
    throw new Error('File must be an image');
  }

  const dataUrl = await compressImage(file, options);
  const sizeKB = getBase64SizeKB(dataUrl);

  return { dataUrl, sizeKB };
}

/**
 * Compress image and return as File for direct upload to storage
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed File
 */
export async function compressImageToFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!isImageFile(file)) {
    console.warn('[compressImageToFile] File is not an image, returning original:', file.type);
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > opts.maxWidth || height > opts.maxHeight) {
            if (width > height) {
              width = opts.maxWidth;
              height = width / aspectRatio;
            } else {
              height = opts.maxHeight;
              width = height * aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );

              const originalSize = (file.size / 1024).toFixed(2);
              const compressedSize = (compressedFile.size / 1024).toFixed(2);
              const reduction = (
                ((file.size - compressedFile.size) / file.size) *
                100
              ).toFixed(1);

              console.log(
                `[compressImageToFile] Compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`
              );

              resolve(compressedFile);
            },
            'image/jpeg',
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
