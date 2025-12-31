import jsPDF from 'jspdf';
import type { Journal, Entry, ExportOptions } from '@shared/types';
import { format } from 'date-fns';
export async function generateJournalPdf(journal: Journal, entries: Entry[], options: ExportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const primaryColor = options.highContrast ? '#000000' : '#1c1917';
  const secondaryColor = options.highContrast ? '#000000' : '#78716c';
  const pageHeight = 297;
  const margin = 20;
  const safeBottom = 270;
  // PAGE 1: COVER
  doc.setFillColor(options.highContrast ? '#ffffff' : '#fdfcfb');
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(primaryColor);
  doc.setFont('times', 'normal');
  doc.setFontSize(48);
  doc.text(options.title || journal.title, 105, 100, { align: 'center' });
  doc.setFontSize(18);
  doc.text(`By ${options.author}`, 105, 120, { align: 'center' });
  if (options.startDate || options.endDate) {
    doc.setFontSize(12);
    const dateRange = `${options.startDate ? format(new Date(options.startDate), 'MMM yyyy') : 'Beginning'} - ${options.endDate ? format(new Date(options.endDate), 'MMM yyyy') : 'Present'}`;
    doc.text(dateRange, 105, 135, { align: 'center' });
  }
  if (options.customMessage) {
    doc.setFontSize(14);
    doc.setFont('times', 'italic');
    const splitMsg = doc.splitTextToSize(options.customMessage, 140);
    doc.text(splitMsg, 105, 180, { align: 'center' });
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Preserved via Lumina Intelligence', 105, 275, { align: 'center' });
  // PAGE 2: TABLE OF CONTENTS
  doc.addPage();
  doc.setFontSize(24);
  doc.text('Table of Contents', 20, 30);
  let yPos = 50;
  const filteredEntries = entries
    .filter(e => {
      const d = new Date(e.date);
      if (options.startDate && d < new Date(options.startDate)) return false;
      if (options.endDate && d > new Date(options.endDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  filteredEntries.slice(0, 25).forEach((entry, i) => {
    doc.setFontSize(10);
    const dateStr = format(new Date(entry.date), 'MMM dd, yyyy');
    const titleStr = entry.title || 'Untitled Entry';
    doc.text(`${i + 1}. ${dateStr}`, 20, yPos);
    doc.text(titleStr.length > 40 ? titleStr.substring(0, 37) + '...' : titleStr, 65, yPos);
    yPos += 8;
  });
  if (filteredEntries.length > 25) {
    doc.setFontSize(10);
    doc.text(`... and ${filteredEntries.length - 25} more entries.`, 20, yPos);
  }
  // CONTENT PAGES
  filteredEntries.forEach((entry) => {
    doc.addPage();
    let currentY = 20;
    // Header (Date)
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.setFont('times', 'normal');
    doc.text(format(new Date(entry.date), 'EEEE, MMMM do, yyyy'), 20, currentY);
    currentY += 15;
    // Title
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.setFont('times', 'bold');
    const splitTitle = doc.splitTextToSize(entry.title || 'Untitled Entry', 170);
    doc.text(splitTitle, 20, currentY);
    currentY += (splitTitle.length * 10) + 5;
    // Body
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const content = entry.content || '— No written content for this reflection —';
    const splitContent = doc.splitTextToSize(content, 170);
    splitContent.forEach((line: string) => {
      if (currentY > safeBottom) {
        doc.addPage();
        currentY = 30;
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor);
      }
      doc.text(line, 20, currentY);
      currentY += 7;
    });
    // Metadata
    if (options.includeTags && entry.tags?.length > 0) {
      if (currentY > safeBottom - 10) {
        doc.addPage();
        currentY = 30;
      }
      currentY += 10;
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor);
      doc.text(`Tags: ${entry.tags.join(', ')}`, 20, currentY);
    }
  });
  return doc;
}