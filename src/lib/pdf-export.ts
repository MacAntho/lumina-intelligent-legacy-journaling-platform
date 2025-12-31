import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  doc.text('Preserved via Lumina Intelligence', 105, 270, { align: 'center' });
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
  filteredEntries.slice(0, 20).forEach((entry, i) => {
    doc.setFontSize(12);
    const dateStr = format(new Date(entry.date), 'MMMM do, yyyy');
    const titleStr = entry.title || 'Untitled Entry';
    doc.text(`${i + 1}. ${dateStr}`, 20, yPos);
    doc.text(titleStr, 120, yPos);
    yPos += 10;
  });
  if (filteredEntries.length > 20) {
    doc.setFontSize(10);
    doc.text(`... and ${filteredEntries.length - 20} more entries.`, 20, yPos);
  }
  // CONTENT PAGES
  filteredEntries.forEach((entry) => {
    doc.addPage();
    // Header
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text(format(new Date(entry.date), 'EEEE, MMMM do, yyyy'), 20, 20);
    // Title
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.setFont('times', 'bold');
    doc.text(entry.title || 'Untitled Entry', 20, 35);
    // Body
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const splitContent = doc.splitTextToSize(entry.content, 170);
    doc.text(splitContent, 20, 50);
    let currentY = 50 + (splitContent.length * 7);
    // Tags
    if (options.includeTags && entry.tags?.length > 0) {
      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor);
      doc.text(`Tags: ${entry.tags.join(', ')}`, 20, currentY);
    }
    // Images (Simple Placeholder for this implementation)
    if (options.includeImages && entry.images?.length > 0) {
      currentY += 20;
      doc.text('[Images attached in digital archive]', 20, currentY);
    }
  });
  // BACK PAGE
  doc.addPage();
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(14);
  doc.text('Your legacy is secured.', 105, 140, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Exported on ${format(new Date(), 'PPPP')}`, 105, 150, { align: 'center' });
  return doc;
}