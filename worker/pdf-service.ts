import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { Journal, Entry, ExportOptions } from '@shared/types';
/**
 * Server-side PDF generation for Cloudflare Workers.
 * Constructs a book-like journal archive using jsPDF.
 */
export async function generateServerPdf(
  journal: Journal,
  entries: Entry[],
  options: ExportOptions
): Promise<Uint8Array> {
  // @ts-expect-error - jspdf types in worker can be tricky
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });
  const primaryColor = options.highContrast ? '#000000' : '#1c1917';
  const secondaryColor = options.highContrast ? '#000000' : '#78716c';
  const pageHeight = 297;
  const pageWidth = 210;
  const margin = 20;
  const safeBottom = 275;
  const addFooter = (pageNum: number) => {
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    doc.text(`Lumina Archive — Page ${pageNum}`, pageWidth / 2, 287, { align: 'center' });
  };
  doc.setFillColor(options.highContrast ? '#ffffff' : '#fdfcfb');
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(primaryColor);
  doc.setFont('times', 'bold');
  doc.setFontSize(42);
  const titleLines = doc.splitTextToSize(options.title || journal.title, 160);
  doc.text(titleLines, pageWidth / 2, 100, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(16);
  doc.text(`A legacy preserved by ${options.author}`, pageWidth / 2, 130, { align: 'center' });
  if (options.startDate || options.endDate) {
    doc.setFontSize(11);
    const start = options.startDate ? format(new Date(options.startDate), 'MMMM yyyy') : 'Origins';
    const end = options.endDate ? format(new Date(options.endDate), 'MMMM yyyy') : 'Present';
    doc.text(`${start} — ${end}`, pageWidth / 2, 145, { align: 'center' });
  }
  if (options.customMessage) {
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    const msgLines = doc.splitTextToSize(options.customMessage, 140);
    doc.text(msgLines, pageWidth / 2, 180, { align: 'center' });
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('GENERATED VIA LUMINA INTELLIGENCE EDGE', pageWidth / 2, 275, { align: 'center' });
  doc.addPage();
  addFooter(2);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('Archive Index', margin, 30);
  const filteredEntries = entries
    .filter(e => {
      const d = new Date(e.date);
      if (options.startDate && d < new Date(options.startDate)) return false;
      if (options.endDate && d > new Date(options.endDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let tocY = 50;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  filteredEntries.slice(0, 30).forEach((entry, idx) => {
    const dateStr = format(new Date(entry.date), 'MMM dd, yyyy');
    const titleStr = entry.title || 'Untitled Reflection';
    doc.text(`${idx + 1}.`, margin, tocY);
    doc.text(dateStr, margin + 10, tocY);
    doc.text(titleStr.substring(0, 50), margin + 45, tocY);
    tocY += 7;
  });
  let currentPage = 2;
  filteredEntries.forEach((entry) => {
    doc.addPage();
    currentPage++;
    addFooter(currentPage);
    let currentY = 30;
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text(format(new Date(entry.date), 'EEEE, MMMM do, yyyy'), margin, currentY);
    currentY += 12;
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    const splitTitle = doc.splitTextToSize(entry.title || 'Untitled Reflection', 170);
    doc.text(splitTitle, margin, currentY);
    currentY += (splitTitle.length * 10) + 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    const content = entry.content || '— Empty entry —';
    const splitContent = doc.splitTextToSize(content, 170);
    splitContent.forEach((line: string) => {
      if (currentY > safeBottom) {
        doc.addPage();
        currentPage++;
        addFooter(currentPage);
        currentY = 30;
      }
      doc.text(line, margin, currentY);
      currentY += 7;
    });
    if (options.includeTags && entry.tags?.length > 0) {
      if (currentY > safeBottom - 10) {
        doc.addPage();
        currentPage++;
        addFooter(currentPage);
        currentY = 30;
      }
      currentY += 10;
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor);
      doc.text(`Keywords: ${entry.tags.join(', ')}`, margin, currentY);
    }
  });
  return new Uint8Array(doc.output('arraybuffer'));
}