import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_PAGES = 200;
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 10_000;
const RENDER_TIMEOUT_MS = 60_000;

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.bundle.mjs", document.baseURI).toString();

export async function imagesToPdf(files) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const image = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is not available in this browser.");
      context.drawImage(image, 0, 0);
      const png = await canvasBlob(canvas);
      const embedded = await pdf.embedPng(await png.arrayBuffer());
      const page = pdf.addPage([image.width * 0.75, image.height * 0.75]);
      page.drawImage(embedded, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    } finally {
      image.close();
    }
  }
  return [{ name: `${safeBaseName(files[0]?.name || "images")}-images.pdf`, blob: pdfBlob(await pdf.save()) }];
}

export async function pdfToImages(file, format) {
  const pdf = await loadPdf(file);
  try {
    if (pdf.numPages > MAX_PAGES) {
      throw new Error(`${file.name}: PDFs are limited to ${MAX_PAGES} pages per run.`);
    }
    const outputs = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          1,
          MAX_DIMENSION / baseViewport.width,
          MAX_DIMENSION / baseViewport.height,
          Math.sqrt(MAX_PIXELS / (baseViewport.width * baseViewport.height))
        );
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is not available in this browser.");
        await renderPdfPage(page.render({ canvasContext: context, viewport }));
        const blob = await canvasBlob(canvas, format);
        outputs.push({
          name: `${safeBaseName(file.name)}-page-${String(pageNumber).padStart(3, "0")}.${format === "image/jpeg" ? "jpg" : "png"}`,
          blob
        });
      } finally {
        page.cleanup();
      }
    }
    return outputs;
  } finally {
    await pdf.destroy();
  }
}

export async function splitPdf(file) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  if (source.getPageCount() > MAX_PAGES) {
    throw new Error(`${file.name}: PDFs are limited to ${MAX_PAGES} pages per run.`);
  }
  const outputs = [];
  for (let pageIndex = 0; pageIndex < source.getPageCount(); pageIndex += 1) {
    const pdf = await PDFDocument.create();
    const [page] = await pdf.copyPages(source, [pageIndex]);
    pdf.addPage(page);
    outputs.push({
      name: `${safeBaseName(file.name)}-page-${String(pageIndex + 1).padStart(3, "0")}.pdf`,
      blob: pdfBlob(await pdf.save())
    });
  }
  return outputs;
}

export async function countPdfPages(file) {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  return pdf.getPageCount();
}

export async function mergePdfs(files) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const currentPageCount = merged.getPageCount();
    const pageCount = source.getPageCount();
    if (currentPageCount + pageCount > MAX_PAGES) {
      throw new Error(`Merged PDF files are limited to ${MAX_PAGES} pages.`);
    }
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return [{ name: "merged-document.pdf", blob: pdfBlob(await merged.save()) }];
}

async function loadPdf(file) {
  return pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false
  }).promise;
}

async function renderPdfPage(renderTask) {
  let timeoutId;
  const timeout = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      renderTask.cancel();
      reject(new Error("Rendering this PDF page took too long. Try a smaller or simpler PDF."));
    }, RENDER_TIMEOUT_MS);
  });
  try {
    await Promise.race([renderTask.promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function canvasBlob(canvas, type = "image/png") {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("The browser could not export this page image."));
      else resolve(blob);
    }, type, type === "image/jpeg" ? 0.92 : undefined);
  });
}

function pdfBlob(bytes) {
  return new Blob([bytes], { type: "application/pdf" });
}

function safeBaseName(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-") || "document";
}
