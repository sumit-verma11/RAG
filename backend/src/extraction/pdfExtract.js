import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';

async function loadPdf(filePath) {
  const data = new Uint8Array(await readFile(filePath));
  return getDocument({ data }).promise;
}

async function extractTextLayer(pdf) {
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return text;
}

async function renderPageToPng(page) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toBuffer('image/png');
}

async function extractViaOcr(pdf) {
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const png = await renderPageToPng(page);
    const { data } = await Tesseract.recognize(png, 'eng');
    text += data.text + '\n';
  }
  return text;
}

export async function extractPdf(filePath) {
  const pdf = await loadPdf(filePath);
  const textLayer = await extractTextLayer(pdf);
  if (textLayer.trim().length > 0) return textLayer;
  return extractViaOcr(pdf);
}
