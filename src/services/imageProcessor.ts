export interface WatermarkData {
  azimuth: number;
  lat: number;
  lon: number;
  projectName: string;
  label?: string; // NEW: Carrier designation
  isPro: boolean;
}

export const processInstallImage = async (
  originalFile: Blob,
  data: WatermarkData
): Promise<{ blob: Blob; thumb: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // 1. WHATSAPP-STYLE SCALING (Max 1600px edge)
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 2. WATERMARKING ENGINE (If not PRO)
      if (!data.isPro) {
        const padding = width * 0.02;
        
        // Setup Shadow/Outline for all text
        ctx.shadowColor = "black";
        ctx.shadowBlur = 7;
        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.round(width * 0.005);

        // TOP LEFT: Tactical Data
        ctx.textAlign = "left";
        
        // 2a. Azimuth & GPS (White)
        ctx.fillStyle = "white";
        ctx.font = `bold ${Math.round(width * 0.025)}px Inter, sans-serif`;
        ctx.strokeText(`AZIMUTH: ${data.azimuth}°`, padding, padding * 2.5);
        ctx.fillText(`AZIMUTH: ${data.azimuth}°`, padding, padding * 2.5);
        
        ctx.font = `bold ${Math.round(width * 0.018)}px Inter, sans-serif`;
        ctx.strokeText(`GPS: ${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}`, padding, padding * 4.5);
        ctx.fillText(`GPS: ${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}`, padding, padding * 4.5);

        // 2b. Carrier Designation (Dynamic Color)
        const getCarrierColor = (label?: string) => {
          const l = label?.toLowerCase() || '';
          if (l.includes('verizon')) return '#FF0000'; // Verizon Red
          if (l.includes('at&t')) return '#00A8E0';   // AT&T Blue
          if (l.includes('t-mobile')) return '#E20074'; // T-Mobile Magenta
          return '#FFFFFF'; // Default White
        };

        const carrierColor = getCarrierColor(data.label);
        ctx.fillStyle = carrierColor;
        ctx.font = `black italic ${Math.round(width * 0.022)}px Inter, sans-serif`;
        const carrierText = `DONOR: ${data.label?.toUpperCase() || 'UNKNOWN'}`;
        ctx.strokeText(carrierText, padding, padding * 7);
        ctx.fillText(carrierText, padding, padding * 7);

        // 2c. Site Name (White, smaller)
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `bold ${Math.round(width * 0.015)}px Inter, sans-serif`;
        ctx.fillText(`SITE: ${data.projectName.toUpperCase()}`, padding, padding * 9);

        // BOTTOM LEFT: Branding (Neon Blue #27AAE1)
        ctx.fillStyle = "#27AAE1"; 
        ctx.font = `italic bold ${Math.round(width * 0.022)}px Inter, sans-serif`;
        ctx.strokeText("GOFLEXCONNECT", padding, height - padding);
        ctx.fillText("GOFLEXCONNECT", padding, height - padding);

        // BOTTOM RIGHT: URL (White)
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = `${Math.round(width * 0.015)}px Inter, sans-serif`;
        ctx.fillText("www.goflexconnect.com", width - padding, height - padding);
      }

      // 3. WHATSAPP-STYLE COMPRESSION (JPEG 0.75)
      canvas.toBlob(
        (blob) => {
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = 150;
          thumbCanvas.height = 150;
          const tCtx = thumbCanvas.getContext('2d')!;
          tCtx.drawImage(canvas, 0, 0, 150, 150);

          resolve({
            blob: blob!,
            thumb: thumbCanvas.toDataURL('image/jpeg', 0.6)
          });
        },
        'image/jpeg',
        0.75
      );
    };
    img.src = URL.createObjectURL(originalFile);
  });
};