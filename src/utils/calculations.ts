import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Measurement, ThresholdConfig, ProjectStats, MetricType } from '../types';
import { LOGO_BASE64 } from '../assets/logo';
import { InstallPhoto } from '../services/installDatabase';

export function getMetricValue(measurement: Measurement, metric: MetricType): number {
  return measurement[metric] as number;
}

/**
 * TRUTH ULTRA-SMOOTH COLOR ENGINE
 * 14-Tier granularity to ensure "cloud" transitions instead of sharp bands.
 */
export function getIBwaveColor(value: number): string {
  // POOR / CRITICAL (RED SPECTRUM)
  if (value < -112) return 'rgb(140, 0, 0)';
  if (value < -110) return 'rgb(180, 0, 0)';
  if (value < -108) return 'rgb(220, 20, 20)';
  if (value < -105) return 'rgb(255, 60, 60)';

  // MARGINAL (YELLOW/ORANGE SPECTRUM)
  if (value < -102) return 'rgb(217, 119, 6)';
  if (value < -100) return 'rgb(234, 179, 8)';
  if (value < -98)  return 'rgb(245, 158, 11)';
  if (value < -95)  return 'rgb(251, 191, 36)';

  // GOOD / EXCELLENT (GREEN SPECTRUM)
  if (value < -92)  return 'rgb(132, 204, 22)';
  if (value < -88)  return 'rgb(74, 222, 128)';
  if (value < -84)  return 'rgb(34, 197, 94)';
  if (value < -80)  return 'rgb(22, 163, 74)';
  if (value < -70)  return 'rgb(21, 128, 61)';
  return 'rgb(20, 83, 45)';
}

/**
 * Legacy Color Mapping (Maintained for non-heatmap UI consistency)
 */
export function getColorForValue(value: number, metric: MetricType, thresholds: ThresholdConfig, benchmarkMode: boolean = false, rsrpTarget: number = -100): string {
  if (benchmarkMode && metric === 'rsrp') {
    return value >= rsrpTarget ? '#27AAE1' : '#ef4444';
  }
  if (metric === 'rsrp') {
    if (value >= -95) return '#22c55e';
    if (value >= -105) return '#eab308';
    return '#ef4444';
  }
  return value >= -10 ? '#22c55e' : '#ef4444';
}

export function exportToCSV(measurements: Measurement[]): string {
  const headers = ['#', 'Timestamp', 'Carrier', 'Tech', 'RSRP', 'RSRQ', 'SINR'];
  const rows = measurements.map((m: any) => [
    m.locationNumber,
    new Date(m.timestamp).toISOString(),
    m.carrierName || 'T-Mobile',
    m.techType || 'LTE',
    m.rsrp, m.rsrq, m.sinr
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

const drawGFCHeader = (doc: jsPDF, title: string, projectName: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const blueGlow = [39, 170, 225]; 
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');
  const logoX = 14; const logoY = 10; const logoSize = 25;
  const centerX = logoX + (logoSize / 2);
  const centerY = logoY + (logoSize / 2);
  for (let r = 18; r > 0; r--) {
    const alpha = (18 - r) / 100;
    doc.setGState(new (doc as any).GState({ opacity: alpha }));
    doc.setFillColor(blueGlow[0], blueGlow[1], blueGlow[2]);
    doc.circle(centerX, centerY, r, 'F');
  }
  doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
  try { doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoSize, logoSize); } catch (e) {}
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const brandX = 44;
  const brandY = 22;
  doc.setTextColor(blueGlow[0], blueGlow[1], blueGlow[2]);
  doc.text('GoFlex', brandX, brandY);
  const goFlexWidth = doc.getTextWidth('GoFlex');
  doc.setTextColor(255, 255, 255);
  doc.text('Connect', brandX + goFlexWidth, brandY);
  doc.setTextColor(blueGlow[0], blueGlow[1], blueGlow[2]);
  doc.setFontSize(10);
  doc.text(title, brandX, 28);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(`Project: ${projectName}`, brandX, 36);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('www.goflexconnect.com', pageWidth - 14, 15, { align: 'right' });
};

export async function exportToPDF(measurements: Measurement[], projectName: string, mapImage?: string | null, benchmarkMode: boolean = false, rsrpTarget: number = -100) {
  const doc = new jsPDF();
  drawGFCHeader(doc, benchmarkMode ? `Compliance Report (Target: ${rsrpTarget}dBm)` : 'Pro Site Report', projectName);
  const tableData = measurements.map((m: any, index) => [
    index + 1, m.carrierName || 'T-Mobile', m.techType || 'LTE',
    m.rsrp + ' dBm', m.rsrq + ' dB', m.sinr + ' dB',
    m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'N/A'
  ]);
  autoTable(doc, {
    startY: 50,
    head: [['#', 'Carrier', 'Tech', 'RSRP', 'RSRQ', 'SINR', 'Time']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 7 }
  });
  if (mapImage) {
    doc.addPage();
    doc.addImage(mapImage, 'JPEG', 15, 20, 180, 0);
  }
  return doc.output('blob');
}

export async function exportInstallPDF(photos: InstallPhoto[], projectName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const blueColor = [39, 170, 225];
  drawGFCHeader(doc, 'Donor Azimuth Report', projectName);
  const summaryData = photos.map((p, i) => [
    i + 1, p.label || 'Unknown', `${p.azimuth.toString().padStart(3, '0')}°`, `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
  ]);
  autoTable(doc, {
    startY: 50,
    head: [['#', 'Asset Designation', 'Azimuth', 'GPS Location']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 8 }
  });
  for (const photo of photos) {
    doc.addPage();
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(photo.imageBlob);
    });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${photo.label || 'Donor Antenna'} Alignment`, 15, 20);
    doc.addImage(base64Image, 'JPEG', 15, 30, 180, 0);
    autoTable(doc, {
      startY: 180,
      head: [['System Property', 'Verified Field Data']],
      body: [
        ['Antenna Label', photo.label || 'Unknown'],
        ['Recorded Azimuth', `${photo.azimuth.toString().padStart(3, '0')}°`],
        ['GPS Latitude', photo.latitude.toFixed(6)],
        ['GPS Longitude', photo.longitude.toFixed(6)],
        ['Verification Status', 'Field Validated']
      ],
      theme: 'grid',
      headStyles: { fillColor: blueColor, textColor: 255 },
      styles: { fontSize: 9 }
    });
    const footerY = 285;
    try { doc.addImage(LOGO_BASE64, 'PNG', 15, footerY - 6, 8, 8); } catch (e) {}
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.text('GoFlex', 25, footerY);
    const textWidth = doc.getTextWidth('GoFlex');
    doc.setTextColor(51, 65, 85);
    doc.text('Connect App', 25 + textWidth + 1, footerY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('www.goflexconnect.com', pageWidth - 15, footerY, { align: 'right' });
  }
  return doc.output('blob');
}

export async function generateMapSnapshot(floorPlanUrl: string, measurements: Measurement[], benchmarkMode: boolean = false, rsrpTarget: number = -100): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1200;
      canvas.height = (img.height / img.width) * 1200;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      measurements.forEach(m => {
        const x = m.x * canvas.width; const y = m.y * canvas.height;
        ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = benchmarkMode ? (m.rsrp >= rsrpTarget ? '#27AAE1' : '#ef4444') : (m.rsrp >= -90 ? '#22c55e' : m.rsrp >= -105 ? '#eab308' : '#ef4444');
        ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
      });
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve('');
    img.src = floorPlanUrl;
  });
}