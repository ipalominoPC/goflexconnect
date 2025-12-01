/**
 * Watermark utility for applying GoFlexConnect logo to exports
 * Only applies watermark when user is on free tier
 */

/**
 * Applies a logo watermark to a canvas element
 * @param canvas - The canvas to watermark
 * @param userPlan - User's subscription plan ('free' or 'pro')
 * @returns Promise that resolves when watermark is applied
 */
export async function applyLogoWatermark(
  canvas: HTMLCanvasElement,
  userPlan: string = 'free'
): Promise<void> {
  if (userPlan === 'pro') {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const watermarkWidth = 80;
      const watermarkHeight = (img.height / img.width) * watermarkWidth;
      const margin = 16;
      const x = canvas.width - watermarkWidth - margin;
      const y = canvas.height - watermarkHeight - margin;

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, x, y, watermarkWidth, watermarkHeight);
      ctx.restore();

      resolve();
    };

    img.onerror = () => {
      console.warn('Failed to load watermark logo');
      resolve();
    };

    img.src = '/icons/logo-256.png';
  });
}

/**
 * Loads the logo image for use in PDF watermarks
 * @param userPlan - User's subscription plan ('free' or 'pro')
 * @returns Promise with base64 image data or null if pro plan
 */
export async function loadLogoForPdf(userPlan: string = 'free'): Promise<string | null> {
  if (userPlan === 'pro') {
    return null;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };

    img.onerror = () => {
      console.warn('Failed to load watermark logo for PDF');
      resolve(null);
    };

    img.src = '/icons/logo-256.png';
  });
}

/**
 * Gets the user's plan from settings
 * Defaults to 'free' if not set
 */
export function getUserPlan(settings: any): string {
  return settings?.plan || 'free';
}

/**
 * Example: Export canvas as image with watermark
 *
 * Usage in a component:
 *
 * ```typescript
 * import { applyLogoWatermark, getUserPlan } from '../utils/watermark';
 *
 * const handleExportImage = async () => {
 *   const canvas = canvasRef.current;
 *   if (!canvas) return;
 *
 *   const userPlan = getUserPlan(settings);
 *   await applyLogoWatermark(canvas, userPlan);
 *
 *   const dataUrl = canvas.toDataURL('image/png');
 *   const link = document.createElement('a');
 *   link.download = 'heatmap.png';
 *   link.href = dataUrl;
 *   link.click();
 * };
 * ```
 */

/**
 * Example: Create PDF with watermark (requires jsPDF library)
 *
 * Usage in a component:
 *
 * ```typescript
 * import { jsPDF } from 'jspdf';
 * import { loadLogoForPdf, getUserPlan } from '../utils/watermark';
 *
 * const handleExportPdf = async () => {
 *   const doc = new jsPDF();
 *
 *   // Add content to PDF
 *   doc.text('Report Title', 20, 20);
 *
 *   // Add watermark if on free plan
 *   const userPlan = getUserPlan(settings);
 *   const logoData = await loadLogoForPdf(userPlan);
 *
 *   if (logoData) {
 *     const pageWidth = doc.internal.pageSize.getWidth();
 *     const pageHeight = doc.internal.pageSize.getHeight();
 *     const watermarkWidth = 60;
 *     const watermarkHeight = 20; // Adjust based on logo aspect ratio
 *     const margin = 16;
 *
 *     doc.saveGraphicsState();
 *     doc.setGState(new doc.GState({ opacity: 0.7 }));
 *     doc.addImage(
 *       logoData,
 *       'PNG',
 *       pageWidth - watermarkWidth - margin,
 *       pageHeight - watermarkHeight - margin,
 *       watermarkWidth,
 *       watermarkHeight
 *     );
 *     doc.restoreGraphicsState();
 *   }
 *
 *   doc.save('report.pdf');
 * };
 * ```
 */
