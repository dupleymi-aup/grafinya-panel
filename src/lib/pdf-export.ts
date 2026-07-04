import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PdfExportOptions {
  /** The DOM element to capture */
  element: HTMLElement;
  /** PDF filename (without extension) */
  filename: string;
  /** Optional title to add as a header */
  title?: string;
  /** Landscape orientation */
  landscape?: boolean;
}

/**
 * Export a DOM element as a PDF document.
 * Captures the element via html2canvas, then adds it to a jsPDF page.
 */
export async function exportElementToPdf(options: PdfExportOptions): Promise<void> {
  const { element, filename, title, landscape = false } = options;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: getComputedStyle(element).backgroundColor || "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const pdf = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;
  const titleHeight = title ? 12 : 0;

  if (title) {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, margin, margin + 6);
  }

  const availableHeight = pdfHeight - margin * 2 - titleHeight;
  const ratio = Math.min(contentWidth / imgWidth, availableHeight / imgHeight);
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;

  const xOffset = margin + (contentWidth - scaledWidth) / 2;
  const yOffset = margin + titleHeight;

  pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight);

  const date = new Date().toISOString().slice(0, 10);
  pdf.save(`${filename}_${date}.pdf`);
}
