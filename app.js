"use strict";

const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 10_000;
const MAX_GRID_SIZE = 20;
const MAX_FILES = 20;
const PRESETS = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  story: [1080, 1920],
  "instagram-landscape": [1080, 566],
  landscape: [1200, 630],
  hd: [1920, 1080],
  youtube: [1280, 720],
  "x-header": [1500, 500],
  "facebook-cover": [820, 312],
  "linkedin-banner": [1584, 396],
  "pinterest-pin": [1000, 1500],
  avatar: [512, 512],
  thumbnail: [320, 320],
  a4: [2480, 3508]
};

const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const uploadEmpty = document.querySelector("#upload-empty");
const previewWrap = document.querySelector("#preview-wrap");
const previewImage = document.querySelector("#preview-image");
const previewGrid = document.querySelector("#preview-grid");
const previewBadge = document.querySelector("#preview-badge");
const fileError = document.querySelector("#file-error");
const widthInput = document.querySelector("#width-input");
const heightInput = document.querySelector("#height-input");
const aspectButton = document.querySelector("#aspect-button");
const qualityInput = document.querySelector("#quality-input");
const compressQualityInput = document.querySelector("#compress-quality");
const convertButton = document.querySelector("#convert-button");
const columnsInput = document.querySelector("#columns-input");
const rowsInput = document.querySelector("#rows-input");
const presetSelect = document.querySelector("#preset-select");

let queue = [];
let pdfQueue = [];
let selectedId = null;
let aspectLocked = true;
let selectedMode = "convert";
let rotateDegrees = 0;
let flipped = false;
let selectedFormats = { convert: "image/jpeg", compress: "image/jpeg", split: "image/jpeg" };
let nextId = 1;
let processing = false;
let previewKey = "";
let readyDownloads = [];
let language = "en";
let nextPdfId = 1;

const originalText = new Map(
  Array.from(document.querySelectorAll("[data-i18n]"), (element) => [element, element.textContent])
);
const englishText = window.LokaTranslations.english;
const indonesianText = window.LokaTranslations.indonesian;
const dynamicText = {
  id: {
    queueEmptyCaption: "Belum ada yang masuk. Kita tungguin.",
    queueCaptionOne: "masuk. Pilih satu buat preview.",
    queueCaptionMany: "masuk. Pilih satu buat preview.",
    downloadsCaption: "file individual siap. Pilih satu atau unduh semuanya satu per satu.",
    downloadOne: "Unduh ↗",
    downloadAll: "Unduh semua ↗",
    selectFile: "Pilih",
    removeFile: "Hapus file",
    avifUnsupported: "AVIF belum didukung browser ini.",
    splitCount: "potongan per gambar",
    createGrid: "Bikin {count} file satuan",
    processMany: "Proses {count} gambar → file satuan",
    processImage: "Proses gambar",
    compressDownload: "Kompres & download",
    splitNote: "Tiap potongan bisa diunduh sendiri. Nggak pakai ZIP.",
    multipleNote: "Hasilnya tersedia sebagai file satuan.",
    privacyNote: "File kamu nggak ke mana-mana. Janji.",
    processing: "Memproses…",
    processingCount: "Memproses {current}/{total}…",
    splitProcessing: "Bikin potongan…",
    splitLimit: "Maksimal 200 potongan per proses supaya browser tetap lancar.",
    splitInvalid: "Kolom dan baris harus berisi angka dari 1 sampai 20.",
    splitDimension: "Jumlah kolom atau baris tidak boleh lebih besar dari dimensi gambar terkecil di antrean.",
    unsupported: "{format} belum didukung browser ini. Coba JPG, PNG, WEBP, BMP, atau TIFF.",
    downloadStarted: "Unduhan satu per satu sudah dimulai.",
    resultLabel: "HASIL",
    waitForProcessing: "Tunggu proses yang lagi jalan sampai selesai dulu ya.",
    queueFull: "Antrean sudah penuh. Maksimal {max} gambar sekali jalan.",
    queueLimit: "Maksimal {max} gambar sekali jalan. {count} file tidak ditambahkan.",
    notImage: "{name}: file ini bukan gambar, jadi dilewati.",
    tooManyPixels: "{name}: melebihi batas 40 megapiksel dan dilewati.",
    cannotOpen: "{name}: tidak dapat dibuka, file ini dilewati.",
    invalidDimensions: "Lebar dan tinggi harus berupa angka dari 1 sampai 10.000 piksel.",
    outputTooLarge: "Ukuran hasil terlalu besar. Batas maksimalnya 40 megapiksel.",
    aspectLocked: "Kunci rasio gambar",
    aspectFree: "Rasio ukuran bebas",
    unexpectedProcessError: "Ada yang gagal saat memproses gambar.",
    unexpectedSplitError: "Ada yang gagal saat bikin grid.",
    pdfQueueCaption: "file PDF atau gambar dipilih.",
    pdfQueueEmpty: "Pilih setidaknya satu file PDF atau gambar.",
    pdfInvalidFile: "{name}: pilih file PDF atau gambar.",
    pdfTooLarge: "{name}: ukuran file harus kurang dari 100 MB.",
    pdfImagesOnly: "Pilih file gambar untuk Images → one PDF.",
    pdfOnly: "Pilih file PDF untuk fitur ini.",
    pdfMergeNeedsTwo: "Pilih minimal dua file PDF untuk digabungkan.",
    pdfPageLimit: "Maksimal 200 halaman PDF untuk satu proses.",
    pdfProcessImages: "Buat PDF",
    pdfProcessPages: "Ubah halaman menjadi gambar",
    pdfProcessSplit: "Pisahkan PDF",
    pdfProcessMerge: "Gabungkan PDF",
    pdfLoadError: "Fitur PDF gagal dimuat. Muat ulang halaman lalu coba lagi.",
    pdfActionImagesNote: "Setiap gambar menjadi satu halaman di dalam satu PDF.",
    pdfActionPagesNote: "Ekspor setiap halaman PDF menjadi file gambar.",
    pdfActionSplitNote: "Simpan setiap halaman PDF sebagai file PDF terpisah.",
    pdfActionMergeNote: "Gabungkan PDF yang dipilih sesuai urutannya.",
    sourceFormatMismatch: "Format sumber yang dipilih tidak cocok dengan semua file di antrean. Pilih Deteksi otomatis atau file dengan format yang sesuai."
  },
  en: {
    queueEmptyCaption: "Nothing here yet. Drop your first image to get started.",
    queueCaptionOne: "added. Select one to preview.",
    queueCaptionMany: "added. Select one to preview.",
    downloadsCaption: "individual files are ready. Download one or grab them one by one.",
    downloadOne: "Download ↗",
    downloadAll: "Download all ↗",
    selectFile: "Select",
    removeFile: "Remove file",
    avifUnsupported: "AVIF export isn't supported by this browser.",
    splitCount: "tiles per image",
    createGrid: "Create {count} individual files",
    processMany: "Process {count} images → individual files",
    processImage: "Process image",
    compressDownload: "Compress & download",
    splitNote: "Download each tile on its own. No ZIP files.",
    multipleNote: "Your results are ready as individual files.",
    privacyNote: "Your files stay right here. Promise.",
    processing: "Processing…",
    processingCount: "Processing {current}/{total}…",
    splitProcessing: "Making tiles…",
    splitLimit: "Keep it to 200 tiles per run so your browser stays smooth.",
    splitInvalid: "Columns and rows must be numbers from 1 to 20.",
    splitDimension: "Columns or rows can't exceed the smallest image dimensions in the queue.",
    unsupported: "{format} export isn't supported by this browser. Try JPG, PNG, WEBP, BMP, or TIFF.",
    downloadStarted: "Individual downloads have started.",
    resultLabel: "RESULT",
    waitForProcessing: "Please wait for the current process to finish before adding images.",
    queueFull: "Your queue is full. You can process up to {max} images at once.",
    queueLimit: "You can process up to {max} images at once. {count} files were not added.",
    notImage: "{name}: this file isn't an image, so it was skipped.",
    tooManyPixels: "{name}: this image exceeds the 40-megapixel limit, so it was skipped.",
    cannotOpen: "{name}: this file couldn't be opened, so it was skipped.",
    invalidDimensions: "Width and height must be numbers between 1 and 10,000 pixels.",
    outputTooLarge: "The output is too large. The maximum size is 40 megapixels.",
    aspectLocked: "Lock aspect ratio",
    aspectFree: "Unlock aspect ratio",
    unexpectedProcessError: "Something went wrong while processing the images.",
    unexpectedSplitError: "Something went wrong while splitting the images.",
    pdfQueueCaption: "PDF or image files selected.",
    pdfQueueEmpty: "Choose at least one PDF or image file.",
    pdfInvalidFile: "{name}: choose a PDF or image file.",
    pdfTooLarge: "{name}: files must be smaller than 100 MB.",
    pdfImagesOnly: "Choose image files for Images → one PDF.",
    pdfOnly: "Choose PDF files for this tool.",
    pdfMergeNeedsTwo: "Select at least two PDF files to merge.",
    pdfPageLimit: "PDF operations are limited to 200 pages per run.",
    pdfProcessImages: "Create PDF",
    pdfProcessPages: "Convert pages to images",
    pdfProcessSplit: "Split PDF",
    pdfProcessMerge: "Merge PDFs",
    pdfLoadError: "PDF tools could not load. Refresh the page and try again."
  }
};

document.querySelector("#browse-button").addEventListener("click", () => fileInput.click());
document.querySelector("#change-image").addEventListener("click", () => fileInput.click());
document.querySelector("#clear-queue").addEventListener("click", clearQueue);
document.querySelector("#download-all").addEventListener("click", downloadAllResults);
fileInput.addEventListener("change", () => {
  if (fileInput.files) addFiles(fileInput.files);
  fileInput.value = "";
});
const pdfFileInput = document.querySelector("#pdf-file-input");
const imageSourceFormat = document.querySelector("#image-source-format");
const pdfSourceFormat = document.querySelector("#pdf-source-format");
const pdfTargetFormat = document.querySelector("#pdf-target-format");
document.querySelector("#pdf-browse-button").addEventListener("click", () => pdfFileInput.click());
document.querySelector("#pdf-clear-queue").addEventListener("click", clearPdfQueue);
pdfFileInput.addEventListener("change", () => {
  if (pdfFileInput.files) addPdfFiles(pdfFileInput.files);
  pdfFileInput.value = "";
});
document.querySelector("#pdf-action").addEventListener("change", () => {
  updatePdfAction();
  syncPdfRouteFromAction();
  updateSettings();
});
pdfTargetFormat.addEventListener("change", syncPdfRouteFromControls);
document.querySelector("#convert-format").addEventListener("change", () => {
  selectedFormats.convert = document.querySelector("#convert-format").value;
  updateSettings();
});
imageSourceFormat.addEventListener("change", updateSettings);
document.querySelector("#swap-image-formats").addEventListener("click", () => {
  const output = document.querySelector("#convert-format");
  const source = imageSourceFormat.value === "auto"
    ? queue[0]?.file.type || "image/png"
    : imageSourceFormat.value;
  const previousTarget = output.value;
  imageSourceFormat.value = previousTarget;
  const reverseTarget = Array.from(output.options).some((option) => option.value === source) ? source : "image/png";
  output.value = reverseTarget;
  selectedFormats.convert = reverseTarget;
  updateSettings();
});
pdfSourceFormat.addEventListener("change", syncPdfRouteFromControls);
pdfTargetFormat.addEventListener("change", syncPdfRouteFromControls);
document.querySelector("#swap-pdf-formats").addEventListener("click", () => {
  if (pdfSourceFormat.value === "image") {
    pdfSourceFormat.value = "pdf";
    pdfTargetFormat.value = "image/png";
  } else {
    pdfSourceFormat.value = "image";
    pdfTargetFormat.value = "application/pdf";
  }
  syncPdfRouteFromControls();
});

const pdfDropZone = document.querySelector("#pdf-drop-zone");
for (const eventName of ["dragenter", "dragover"]) {
  pdfDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    pdfDropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  pdfDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    pdfDropZone.classList.remove("is-dragging");
  });
}
pdfDropZone.addEventListener("drop", (event) => {
  if (event.dataTransfer?.files) addPdfFiles(event.dataTransfer.files);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}
dropZone.addEventListener("drop", (event) => {
  if (event.dataTransfer && event.dataTransfer.files) addFiles(event.dataTransfer.files);
});

document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});
document.querySelectorAll(".tool-card[data-tool-category]").forEach((card) => {
  card.addEventListener("click", () => setMode(card.dataset.toolCategory === "document" ? "pdf" : "convert"));
});
document.querySelectorAll(".format-options").forEach((group) => {
  const select = group.querySelector(".format-select");
  select.addEventListener("change", () => {
    if (processing) return;
    const mode = group.classList.contains("split-format-options")
      ? "split"
      : group.classList.contains("compress-format-options")
        ? "compress"
        : "convert";
    selectedFormats[mode] = select.value;
    updateSettings();
  });
});

widthInput.addEventListener("input", () => {
  presetSelect.value = "original";
  const selected = getSelectedItem();
  const width = parseDimension(widthInput.value);
  if (aspectLocked && selected && width) {
    const dimensions = orientedDimensions(selected.image);
    heightInput.value = Math.max(1, Math.round(width * dimensions.height / dimensions.width));
  }
});
heightInput.addEventListener("input", () => {
  presetSelect.value = "original";
  const selected = getSelectedItem();
  const height = parseDimension(heightInput.value);
  if (aspectLocked && selected && height) {
    const dimensions = orientedDimensions(selected.image);
    widthInput.value = Math.max(1, Math.round(height * dimensions.width / dimensions.height));
  }
});
aspectButton.addEventListener("click", () => {
  aspectLocked = !aspectLocked;
  aspectButton.classList.toggle("is-locked", aspectLocked);
  aspectButton.setAttribute("aria-pressed", String(aspectLocked));
  aspectButton.title = text(aspectLocked ? "aspectLocked" : "aspectFree");
});
presetSelect.addEventListener("change", applyPreset);
qualityInput.addEventListener("input", () => {
  document.querySelector("#quality-value").textContent = `${qualityInput.value}%`;
});
compressQualityInput.addEventListener("input", () => {
  document.querySelector("#compress-quality-value").textContent = `${compressQualityInput.value}%`;
});
columnsInput.addEventListener("input", updateSplitPreview);
rowsInput.addEventListener("input", updateSplitPreview);
document.querySelector("#rotate-button").addEventListener("click", () => {
  if (processing) return;
  rotateDegrees = (rotateDegrees + 90) % 360;
  updateTransformButtons();
  if (presetSelect.value === "original") applyPreset();
  updateSelectedPreview();
});
document.querySelector("#flip-button").addEventListener("click", () => {
  if (processing) return;
  flipped = !flipped;
  updateTransformButtons();
  updateSelectedPreview();
});
document.querySelector("#language-toggle").addEventListener("click", () => {
  applyLanguage(language === "id" ? "en" : "id");
});
document.querySelectorAll(".avif-option").forEach((button) => {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  probe.toBlob((blob) => {
    if (!blob || blob.type !== "image/avif") {
      button.disabled = true;
      button.parentElement.title = text("avifUnsupported");
    }
  }, "image/avif");
});
convertButton.addEventListener("click", processQueue);
window.addEventListener("resize", updateSplitPreview);

function addPdfFiles(fileList) {
  if (processing) {
    showPdfError(text("waitForProcessing"));
    return;
  }
  clearPdfError();
  const incoming = Array.from(fileList);
  const remaining = MAX_FILES - pdfQueue.length;
  if (remaining <= 0) {
    showPdfError(formatText("queueFull", { max: MAX_FILES }));
    return;
  }
  if (incoming.length > remaining) {
    showPdfError(formatText("queueLimit", { max: MAX_FILES, count: incoming.length - remaining }));
  }

  for (const file of incoming.slice(0, remaining)) {
    if (!isPdfFile(file) && !file.type.startsWith("image/")) {
      showPdfError(formatText("pdfInvalidFile", { name: file.name }));
      continue;
    }
    if (file.size > 100 * 1024 * 1024) {
      showPdfError(formatText("pdfTooLarge", { name: file.name }));
      continue;
    }
    pdfQueue.push({ id: nextPdfId++, file, status: "Siap" });
  }
  renderPdfQueue();
}

function renderPdfQueue() {
  const list = document.querySelector("#pdf-queue-list");
  list.replaceChildren();
  if (!pdfQueue.length) {
    const empty = document.createElement("div");
    empty.className = "queue-empty";
    empty.textContent = text("pdfQueueEmpty");
    list.append(empty);
  } else {
    for (const item of pdfQueue) {
      const row = document.createElement("div");
      row.className = "queue-item pdf-queue-item";
      const mark = document.createElement("span");
      mark.className = "pdf-file-mark";
      mark.textContent = isPdfFile(item.file) ? "PDF" : "IMG";
      const details = document.createElement("span");
      details.className = "queue-file";
      const name = document.createElement("strong");
      name.textContent = item.file.name;
      const size = document.createElement("span");
      size.textContent = formatBytes(item.file.size);
      details.append(name, size);
      const status = document.createElement("span");
      status.className = "queue-status";
      status.textContent = localizedStatus(item.status);
      const remove = document.createElement("button");
      remove.className = "remove-file";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `${text("removeFile")} ${item.file.name}`);
      remove.disabled = processing;
      remove.addEventListener("click", () => removePdfFile(item.id));
      row.append(mark, details, status, remove);
      list.append(row);
    }
  }
  document.querySelector("#pdf-queue-count").textContent = pdfQueue.length;
  document.querySelector("#pdf-queue-caption").textContent = pdfQueue.length
    ? `${pdfQueue.length} ${text("pdfQueueCaption")}`
    : "";
  const clearButton = document.querySelector("#pdf-clear-queue");
  clearButton.hidden = pdfQueue.length === 0;
  clearButton.disabled = processing;
  updateSettings();
}

function removePdfFile(id) {
  if (processing) return;
  pdfQueue = pdfQueue.filter((item) => item.id !== id);
  renderPdfQueue();
}

function clearPdfQueue() {
  if (processing) return;
  pdfQueue = [];
  clearPdfError();
  renderPdfQueue();
}

function isPdfFile(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function updatePdfAction() {
  const action = document.querySelector("#pdf-action").value;
  document.querySelector("#pdf-route-picker").hidden = action === "split-pdf" || action === "merge-pdf";
  document.querySelector("#pdf-action-note").dataset.i18n = `pdfAction${{
    "images-to-pdf": "Images",
    "pdf-to-images": "Pages",
    "split-pdf": "Split",
    "merge-pdf": "Merge"
  }[action]}Note`;
  const noteKey = document.querySelector("#pdf-action-note").dataset.i18n;
  document.querySelector("#pdf-action-note").textContent = text(noteKey);
}

function syncPdfRouteFromControls() {
  if (pdfSourceFormat.value === "image") {
    pdfTargetFormat.value = "application/pdf";
    document.querySelector("#pdf-action").value = "images-to-pdf";
  } else {
    if (pdfTargetFormat.value === "application/pdf") pdfTargetFormat.value = "image/png";
    document.querySelector("#pdf-action").value = "pdf-to-images";
  }
  updatePdfAction();
  updateSettings();
}

function syncPdfRouteFromAction() {
  const action = document.querySelector("#pdf-action").value;
  if (action === "images-to-pdf") {
    pdfSourceFormat.value = "image";
    pdfTargetFormat.value = "application/pdf";
  } else if (action === "pdf-to-images") {
    pdfSourceFormat.value = "pdf";
    if (!["image/png", "image/jpeg"].includes(pdfTargetFormat.value)) pdfTargetFormat.value = "image/png";
  } else {
    pdfSourceFormat.value = "pdf";
    pdfTargetFormat.value = "application/pdf";
  }
}

function matchesImageSource(file, sourceFormat) {
  if (sourceFormat === "auto") return true;
  const extensions = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/bmp": ["bmp"],
    "image/tiff": ["tif", "tiff"],
    "image/svg+xml": ["svg"],
    "image/gif": ["gif"],
    "image/avif": ["avif"]
  };
  const extension = file.name.split(".").pop().toLowerCase();
  return extensions[sourceFormat]?.includes(extension) || false;
}

function addFiles(fileList) {
  if (processing) {
    showError(text("waitForProcessing"));
    return;
  }
  clearError();
  const incoming = Array.from(fileList);
  let added = 0;
  const remaining = MAX_FILES - queue.length;
  if (remaining <= 0) {
    showError(formatText("queueFull", { max: MAX_FILES }));
    return;
  }
  if (incoming.length > remaining) {
    showError(formatText("queueLimit", { max: MAX_FILES, count: incoming.length - remaining }));
  }

  for (const file of incoming.slice(0, remaining)) {
    if (!file.type.startsWith("image/")) {
      showError(formatText("notImage", { name: file.name }));
      continue;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    const item = { id: nextId++, file, image, url, status: "Memuat…", resultSize: null, error: null, ready: false };
    image.onload = () => {
      if (!queue.includes(item)) {
        URL.revokeObjectURL(url);
        return;
      }
      if (image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
        URL.revokeObjectURL(url);
        queue = queue.filter((entry) => entry.id !== item.id);
        if (selectedId === item.id) {
          selectedId = queue[0] ? queue[0].id : null;
          applyPreset();
        }
        showError(formatText("tooManyPixels", { name: file.name }));
        renderQueue();
        return;
      }
      item.ready = true;
      item.status = "Siap";
      if (!selectedId) {
        selectedId = item.id;
      }
      if (selectedId === item.id) applyPreset();
      renderQueue();
      updateSettings();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      if (!queue.includes(item)) return;
      queue = queue.filter((entry) => entry.id !== item.id);
      if (selectedId === item.id) {
        selectedId = queue[0] ? queue[0].id : null;
        applyPreset();
      }
      showError(formatText("cannotOpen", { name: file.name }));
      renderQueue();
    };
    image.src = url;
    queue.push(item);
    added += 1;
  }

  if (added) {
    renderQueue();
    updateSettings();
  }
}

function renderQueue() {
  const list = document.querySelector("#queue-list");
  list.replaceChildren();
  if (!queue.length) {
    readyDownloads = [];
    renderDownloads();
    const empty = document.createElement("div");
    empty.className = "queue-empty";
    const message = document.createElement("span");
    const arrow = document.createElement("span");
    message.textContent = language === "en" ? "YOUR FILES WILL SHOW UP HERE" : "FILE KAMU NANTI MUNCUL DI SINI";
    arrow.textContent = "↗";
    empty.append(message, arrow);
    list.append(empty);
    uploadEmpty.hidden = false;
    previewWrap.hidden = true;
  } else {
    uploadEmpty.hidden = true;
    previewWrap.hidden = false;
    for (const item of queue) {
      const row = document.createElement("div");
      row.className = `queue-item${item.id === selectedId ? " is-selected" : ""}`;
      row.dataset.id = item.id;
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.setAttribute("aria-label", `${text("selectFile")} ${item.file.name}`);
      row.innerHTML = `
        <img class="queue-thumb" src="${item.url}" alt="">
        <span class="queue-file"><strong></strong><span></span></span>
        <span class="queue-status${item.status === "Selesai" ? " is-done" : ""}"></span>
        <button class="remove-file" type="button" aria-label="Hapus file">×</button>`;
      row.querySelector(".queue-file strong").textContent = item.file.name;
      row.querySelector(".remove-file").setAttribute("aria-label", text("removeFile"));
      row.querySelector(".queue-file span").textContent = item.resultSize === null
        ? `${item.image.naturalWidth || "…"} × ${item.image.naturalHeight || "…"} · ${formatBytes(item.file.size)}`
        : `${formatBytes(item.file.size)} → ${formatBytes(item.resultSize)}`;
      row.querySelector(".queue-status").textContent = localizedStatus(item.status);
      row.addEventListener("click", (event) => {
        if (event.target.closest(".remove-file")) {
          removeFile(item.id);
          return;
        }
        selectFile(item.id);
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectFile(item.id);
        }
      });
      list.append(row);
    }
  }

  document.querySelector("#queue-count").textContent = queue.length;
  document.querySelector("#queue-caption").textContent = queue.length
    ? `${queue.length} ${language === "en" ? (queue.length === 1 ? "image" : "images") : "gambar"} ${text(queue.length === 1 ? "queueCaptionOne" : "queueCaptionMany")}`
    : text("queueEmptyCaption");
  const clearButton = document.querySelector("#clear-queue");
  clearButton.hidden = queue.length === 0;
  clearButton.disabled = processing;
  document.querySelectorAll(".remove-file").forEach((button) => {
    button.disabled = processing;
  });
  updateSelectedPreview();
  updateSettings();
}

function renderDownloads() {
  const panel = document.querySelector("#downloads-panel");
  const list = document.querySelector("#downloads-list");
  list.replaceChildren();
  panel.hidden = readyDownloads.length === 0;
  document.querySelector("#downloads-count").textContent = readyDownloads.length;
  document.querySelector("#downloads-caption").textContent = readyDownloads.length
    ? `${readyDownloads.length} ${text("downloadsCaption")}`
    : "";
  document.querySelector("#download-all").disabled = readyDownloads.length === 0;
  for (const file of readyDownloads) {
    const row = document.createElement("div");
    row.className = "download-item";
    const fileInfo = document.createElement("span");
    fileInfo.className = "download-file";
    const name = document.createElement("strong");
    const size = document.createElement("span");
    name.textContent = file.name;
    size.textContent = formatBytes(file.blob.size);
    fileInfo.append(name, size);
    const button = document.createElement("button");
    button.className = "download-one";
    button.type = "button";
    button.textContent = text("downloadOne");
    button.addEventListener("click", () => downloadBlob(file.blob, file.name));
    row.append(fileInfo, button);
    list.append(row);
  }
}

async function downloadAllResults() {
  const button = document.querySelector("#download-all");
  if (!readyDownloads.length || button.disabled) return;
  button.disabled = true;
  for (const file of readyDownloads) {
    downloadBlob(file.blob, file.name);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
  }
  button.disabled = false;
  document.querySelector("#downloads-caption").textContent = text("downloadStarted");
}

function selectFile(id) {
  if (processing) return;
  selectedId = id;
  applyPreset();
  renderQueue();
}

function removeFile(id) {
  if (processing) return;
  const removed = queue.find((item) => item.id === id);
  if (removed) URL.revokeObjectURL(removed.url);
  queue = queue.filter((item) => item.id !== id);
  if (selectedId === id) {
    selectedId = queue[0] ? queue[0].id : null;
    applyPreset();
  }
  renderQueue();
}

function clearQueue() {
  if (processing) return;
  for (const item of queue) URL.revokeObjectURL(item.url);
  queue = [];
  selectedId = null;
  previewKey = "";
  rotateDegrees = 0;
  flipped = false;
  updateTransformButtons();
  clearError();
  renderQueue();
}

function getSelectedItem() {
  return queue.find((item) => item.id === selectedId) || null;
}

function updateSelectedPreview() {
  const item = getSelectedItem();
  if (!item) return;
  document.querySelectorAll(".queue-item").forEach((row) => {
    row.classList.toggle("is-selected", Number(row.dataset.id) === selectedId);
  });
  const key = `${item.id}:${item.image.naturalWidth}:${item.image.naturalHeight}:${rotateDegrees}:${flipped}`;
  if (item.ready && key !== previewKey) {
    previewKey = key;
    const dimensions = orientedDimensions(item.image);
    const scale = Math.min(1, 1200 / Math.max(dimensions.width, dimensions.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(dimensions.width * scale));
    canvas.height = Math.max(1, Math.round(dimensions.height * scale));
    const context = getContext(canvas);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(rotateDegrees * Math.PI / 180);
    context.scale(flipped ? -1 : 1, 1);
    context.drawImage(item.image, -item.image.naturalWidth * scale / 2, -item.image.naturalHeight * scale / 2, item.image.naturalWidth * scale, item.image.naturalHeight * scale);
    previewImage.src = canvas.toDataURL("image/png");
  }
  updateSplitPreview();
}

function setMode(mode) {
  if (processing) return;
  selectedMode = mode;
  document.querySelector(".mode-tabs").hidden = mode === "pdf";
  const category = mode === "pdf" ? "document" : "image";
  document.querySelectorAll(".tool-card[data-tool-category]").forEach((card) => {
    const active = card.dataset.toolCategory === category;
    card.classList.toggle("is-active", active);
    card.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  for (const panel of ["convert", "compress", "split", "pdf"]) {
    document.querySelector(`#panel-${panel}`).hidden = panel !== mode;
  }
  document.querySelector("#image-workspace").hidden = mode === "pdf";
  document.querySelector("#pdf-workspace").hidden = mode !== "pdf";
  updateSettings();
  updateSplitPreview();
}

function applyPreset() {
  const preset = PRESETS[presetSelect.value];
  const selected = getSelectedItem();
  if (preset) {
    widthInput.value = preset[0];
    heightInput.value = preset[1];
  } else if (selected) {
    const dimensions = orientedDimensions(selected.image);
    widthInput.value = dimensions.width;
    heightInput.value = dimensions.height;
  }
}

function updateSettings() {
  document.querySelectorAll(".format-select").forEach((select) => {
    select.disabled = processing;
  });
  document.querySelector("#pdf-action").disabled = processing;
  imageSourceFormat.disabled = processing;
  document.querySelector("#swap-image-formats").disabled = processing;
  pdfSourceFormat.disabled = processing;
  pdfTargetFormat.disabled = processing;
  document.querySelector("#swap-pdf-formats").disabled = processing;
  document.querySelector("#quality-row").hidden = ["image/png", "image/bmp", "image/tiff", "image/svg+xml"].includes(selectedFormats.convert);
  document.querySelector("#compress-quality-row").hidden = ["image/png", "image/bmp", "image/tiff", "image/svg+xml"].includes(selectedFormats.compress);
  const compressionNote = selectedFormats.compress === "image/svg+xml"
    ? (language === "en" ? "embedded PNG" : "PNG tertanam")
    : ["image/bmp", "image/tiff"].includes(selectedFormats.compress)
    ? (language === "en" ? "uncompressed" : "tanpa kompres")
    : language === "en" ? "optimized" : "optimized";
  document.querySelector("#compress-format-label").textContent = `${formatLabel(selectedFormats.compress)} · ${compressionNote}`;
  document.querySelector("#split-summary").textContent = `${(parseGridDimension(columnsInput.value) || 1) * (parseGridDimension(rowsInput.value) || 1)} ${text("splitCount")}`;

  const label = document.querySelector("#convert-label");
  if (selectedMode === "pdf") {
    const action = document.querySelector("#pdf-action").value;
    label.textContent = text(({
      "images-to-pdf": "pdfProcessImages",
      "pdf-to-images": "pdfProcessPages",
      "split-pdf": "pdfProcessSplit",
      "merge-pdf": "pdfProcessMerge"
    })[action]);
    document.querySelector("#convert-note").textContent = text("privacyNote");
    convertButton.disabled = pdfQueue.length === 0 || processing;
    return;
  }
  if (selectedMode === "split") {
    const count = (parseGridDimension(columnsInput.value) || 1) * (parseGridDimension(rowsInput.value) || 1) * queue.length;
    label.textContent = formatText("createGrid", { count });
  } else if (queue.length > 1) {
    label.textContent = formatText("processMany", { count: queue.length });
  } else {
    label.textContent = selectedMode === "compress" ? text("compressDownload") : text("processImage");
  }
  document.querySelector("#convert-note").textContent = selectedMode === "split"
    ? text("splitNote")
    : queue.length > 1
      ? text("multipleNote")
      : text("privacyNote");
  convertButton.disabled = queue.length === 0 || queue.some((item) => !item.ready) || processing;
}

function updateTransformButtons() {
  document.querySelector("#rotate-button").classList.toggle("is-active", rotateDegrees !== 0);
  document.querySelector("#flip-button").classList.toggle("is-active", flipped);
  document.querySelector("#flip-button").setAttribute("aria-pressed", String(flipped));
}

async function processQueue() {
  if (processing) return;
  if (selectedMode === "pdf") {
    await processPdfQueue();
    return;
  }
  if (!queue.length) return;
  clearError();
  if (selectedMode === "convert" && !queue.every((item) => matchesImageSource(item.file, imageSourceFormat.value))) {
    showError(text("sourceFormatMismatch"));
    return;
  }
  if (selectedMode === "split") {
    await splitQueue();
    return;
  }

  const settings = selectedMode === "convert" ? getConvertSettings() : getCompressSettings();
  if (!settings) return;
  processing = true;
  readyDownloads = [];
  renderDownloads();
  updateSettings();
  setButtonLabel(text("processing"));
  const results = [];
  try {
    for (const [index, item] of queue.entries()) {
      item.status = "Proses";
      item.error = null;
      renderQueue();
      const oriented = createOrientedCanvas(item.image);
      const dimensions = targetDimensions(item, settings, oriented.width, oriented.height);
      const canvas = drawOutput(oriented, dimensions.width, dimensions.height, settings.fit, settings.format);
      const blob = await encodeCanvas(canvas, settings.format, settings.quality);
      const expectedType = settings.format;
      if (blob.type !== expectedType) {
        throw new Error(`Browser ini tidak mendukung ekspor ${formatLabel(expectedType)}. Coba format lain.`);
      }
      const outputName = `${baseName(item.file.name)}-${dimensions.width}x${dimensions.height}.${extensionFor(settings.format)}`;
      results.push({ name: outputName, blob });
      item.status = "Selesai";
      item.resultSize = blob.size;
      renderQueue();
      await yieldToBrowser();
      if (index < queue.length - 1) setButtonLabel(formatText("processingCount", { current: index + 1, total: queue.length }));
    }
    readyDownloads = results;
    renderDownloads();
  } catch (error) {
    showError(error instanceof Error ? error.message : text("unexpectedProcessError"));
    for (const item of queue) {
      if (item.status === "Proses") item.status = "Gagal";
    }
    renderQueue();
  } finally {
    processing = false;
    updateSettings();
  }
}

async function processPdfQueue() {
  if (!pdfQueue.length || processing) return;
  clearPdfError();
  const action = document.querySelector("#pdf-action").value;
  const files = pdfQueue.map((item) => item.file);
  const images = files.filter((file) => file.type.startsWith("image/"));
  const pdfs = files.filter(isPdfFile);
  if (action === "images-to-pdf" && images.length !== files.length) {
    showPdfError(text("pdfImagesOnly"));
    return;
  }
  if (action !== "images-to-pdf" && pdfs.length !== files.length) {
    showPdfError(text("pdfOnly"));
    return;
  }
  if (action === "merge-pdf" && pdfs.length < 2) {
    showPdfError(text("pdfMergeNeedsTwo"));
    return;
  }
  if (!window.PDFTools) {
    showPdfError(text("pdfLoadError"));
    return;
  }

  processing = true;
  readyDownloads = [];
  renderDownloads();
  pdfQueue.forEach((item) => { item.status = "Proses"; });
  renderPdfQueue();
  setButtonLabel(text("processing"));
  try {
    let outputs;
    if (action === "images-to-pdf") {
      outputs = await window.PDFTools.imagesToPdf(images);
    } else if (action === "pdf-to-images") {
      outputs = [];
      await validatePdfPageLimit(pdfs);
      for (const file of pdfs) {
        outputs.push(...await window.PDFTools.pdfToImages(file, pdfTargetFormat.value));
      }
    } else if (action === "split-pdf") {
      outputs = [];
      await validatePdfPageLimit(pdfs);
      for (const file of pdfs) {
        outputs.push(...await window.PDFTools.splitPdf(file));
      }
    } else {
      outputs = await window.PDFTools.mergePdfs(pdfs);
    }
    if (outputs.length > 200) {
      throw new Error(text("pdfPageLimit"));
    }
    readyDownloads = outputs;
    pdfQueue.forEach((item) => { item.status = "Selesai"; });
    renderDownloads();
  } catch (error) {
    showPdfError(error instanceof Error ? error.message : text("unexpectedProcessError"));
    pdfQueue.forEach((item) => { item.status = "Gagal"; });
  } finally {
    processing = false;
    renderPdfQueue();
    updateSettings();
  }
}

async function validatePdfPageLimit(files) {
  let pageCount = 0;
  for (const file of files) {
    pageCount += await window.PDFTools.countPdfPages(file);
    if (pageCount > 200) throw new Error(text("pdfPageLimit"));
  }
}

function getConvertSettings() {
  const width = parseDimension(widthInput.value);
  const height = parseDimension(heightInput.value);
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    showError(text("invalidDimensions"));
    return null;
  }
  if (width * height > MAX_PIXELS) {
    showError(text("outputTooLarge"));
    return null;
  }
  return {
    format: selectedFormats.convert,
    quality: Number(qualityInput.value) / 100,
    customWidth: width,
    customHeight: height,
    fit: document.querySelector("#fit-select").value
  };
}

function getCompressSettings() {
  return {
    format: selectedFormats.compress,
    quality: Number(compressQualityInput.value) / 100,
    maxEdge: Number(document.querySelector("#max-edge").value),
    fit: "contain"
  };
}

function targetDimensions(item, settings, sourceWidth, sourceHeight) {
  if (settings.maxEdge !== undefined) {
    const scale = settings.maxEdge && Math.max(sourceWidth, sourceHeight) > settings.maxEdge
      ? settings.maxEdge / Math.max(sourceWidth, sourceHeight)
      : 1;
    return { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) };
  }
  const width = settings.width || settings.customWidth || sourceWidth;
  const height = settings.height || settings.customHeight || sourceHeight;
  return { width, height };
}

function createOrientedCanvas(image) {
  const swap = rotateDegrees % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? image.naturalHeight : image.naturalWidth;
  canvas.height = swap ? image.naturalWidth : image.naturalHeight;
  const context = getContext(canvas);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(rotateDegrees * Math.PI / 180);
  context.scale(flipped ? -1 : 1, 1);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas;
}

function drawOutput(source, width, height, fit, format) {
  const outputWidth = width.cropWidth || width;
  const outputHeight = width.cropHeight || height;
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = getContext(canvas);
  if (format === "image/jpeg") {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, outputWidth, outputHeight);
  }
  if (fit === "stretch") {
    context.drawImage(source, 0, 0, outputWidth, outputHeight);
    return canvas;
  }

  const scale = fit === "cover"
    ? Math.max(outputWidth / source.width, outputHeight / source.height)
    : Math.min(outputWidth / source.width, outputHeight / source.height);
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  context.drawImage(source, (outputWidth - drawWidth) / 2, (outputHeight - drawHeight) / 2, drawWidth, drawHeight);
  return canvas;
}

async function splitQueue() {
  const columns = parseGridDimension(columnsInput.value);
  const rows = parseGridDimension(rowsInput.value);
  if (!columns || !rows) {
    showError(text("splitInvalid"));
    return;
  }
  if (columns * rows * queue.length > 200) {
    showError(text("splitLimit"));
    return;
  }
  if (queue.some((item) => columns > orientedDimensions(item.image).width || rows > orientedDimensions(item.image).height)) {
    showError(text("splitDimension"));
    return;
  }

  processing = true;
  readyDownloads = [];
  renderDownloads();
  updateSettings();
  setButtonLabel(text("splitProcessing"));
  const files = [];
  const outputFormat = selectedFormats.split;
  try {
    for (const [fileIndex, item] of queue.entries()) {
      item.status = "Proses";
      renderQueue();
      const source = createOrientedCanvas(item.image);
      const base = baseName(item.file.name);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const left = Math.floor(column * source.width / columns);
          const top = Math.floor(row * source.height / rows);
          const right = Math.floor((column + 1) * source.width / columns);
          const bottom = Math.floor((row + 1) * source.height / rows);
          const canvas = document.createElement("canvas");
          canvas.width = right - left;
          canvas.height = bottom - top;
          const context = getContext(canvas);
          if (outputFormat === "image/jpeg") {
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          context.drawImage(source, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
          const blob = await encodeCanvas(canvas, outputFormat, Number(qualityInput.value) / 100);
          files.push({
            name: `${String(fileIndex + 1).padStart(2, "0")}-${base}-${String(row + 1).padStart(2, "0")}-${String(column + 1).padStart(2, "0")}.${extensionFor(outputFormat)}`,
            blob
          });
          await yieldToBrowser();
        }
      }
      item.status = "Selesai";
      item.resultSize = null;
      renderQueue();
    }
    readyDownloads = files;
    renderDownloads();
  } catch (error) {
    showError(error instanceof Error ? error.message : text("unexpectedSplitError"));
    for (const item of queue) {
      if (item.status === "Proses") item.status = "Gagal";
    }
    renderQueue();
  } finally {
    processing = false;
    updateSettings();
  }
}

function updateSplitPreview() {
  const selected = getSelectedItem();
  const columns = parseGridDimension(columnsInput.value) || 1;
  const rows = parseGridDimension(rowsInput.value) || 1;
  previewGrid.replaceChildren();
  previewGrid.hidden = selectedMode !== "split" || !selected || (columns === 1 && rows === 1);
  if (previewGrid.hidden) {
    previewBadge.hidden = true;
    return;
  }
  const dimensions = orientedDimensions(selected.image);
  const frameWidth = previewWrap.clientWidth;
  const frameHeight = previewWrap.clientHeight;
  const scale = Math.min(frameWidth / dimensions.width, frameHeight / dimensions.height);
  const imageWidth = dimensions.width * scale;
  const imageHeight = dimensions.height * scale;
  previewGrid.style.cssText = `left:${(frameWidth - imageWidth) / 2}px;top:${(frameHeight - imageHeight) / 2}px;width:${imageWidth}px;height:${imageHeight}px`;
  for (let column = 1; column < columns; column += 1) {
    const line = document.createElement("span");
    line.style.cssText = `left:${column * 100 / columns}%;top:0;width:1px;height:100%`;
    previewGrid.append(line);
  }
  for (let row = 1; row < rows; row += 1) {
    const line = document.createElement("span");
    line.style.cssText = `left:0;top:${row * 100 / rows}%;width:100%;height:1px`;
    previewGrid.append(line);
  }
  previewBadge.textContent = `${columns} × ${rows} · ${columns * rows} potongan`;
  previewBadge.hidden = false;
}

function orientedDimensions(image) {
  const swap = rotateDegrees % 180 !== 0;
  return swap
    ? { width: image.naturalHeight, height: image.naturalWidth }
    : { width: image.naturalWidth, height: image.naturalHeight };
}

function getContext(canvas) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia di browser ini.");
  return context;
}

function encodeCanvas(canvas, format, quality) {
  if (format === "image/bmp") return Promise.resolve(canvasToBmp(canvas));
  if (format === "image/tiff") return Promise.resolve(canvasToTiff(canvas));
  if (format === "image/svg+xml") return canvasToSvg(canvas);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Browser gagal mengonversi gambar."));
      else if (blob.type !== format) reject(new Error(formatText("unsupported", { format: formatLabel(format) })));
      else resolve(blob);
    }, format, quality);
  });
}

async function canvasToSvg(canvas) {
  const png = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Browser gagal membuat gambar PNG untuk SVG."));
      else resolve(blob);
    }, "image/png");
  });
  const imageData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Browser gagal menyiapkan gambar untuk SVG."));
    reader.onload = () => {
      if (typeof reader.result !== "string") reject(new Error("Browser gagal menyiapkan gambar untuk SVG."));
      else resolve(reader.result);
    };
    reader.readAsDataURL(png);
  });
  const { width, height } = canvas;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${imageData}"/></svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

function canvasToTiff(canvas) {
  const { width, height } = canvas;
  const pixelSize = width * height * 3;
  const pixelOffset = 140;
  const header = new Uint8Array(pixelOffset);
  const view = new DataView(header.buffer);
  view.setUint8(0, 0x49);
  view.setUint8(1, 0x49);
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  view.setUint16(8, 10, true);
  const entries = [
    [256, 4, 1, width],
    [257, 4, 1, height],
    [258, 3, 3, 134],
    [259, 3, 1, 1],
    [262, 3, 1, 2],
    [273, 4, 1, pixelOffset],
    [277, 3, 1, 3],
    [278, 4, 1, height],
    [279, 4, 1, pixelSize],
    [284, 3, 1, 1]
  ];
  entries.forEach(([tag, type, count, value], index) => {
    const offset = 10 + index * 12;
    view.setUint16(offset, tag, true);
    view.setUint16(offset + 2, type, true);
    view.setUint32(offset + 4, count, true);
    if (type === 3 && count === 1) view.setUint16(offset + 8, value, true);
    else view.setUint32(offset + 8, value, true);
  });
  view.setUint32(130, 0, true);
  view.setUint16(134, 8, true);
  view.setUint16(136, 8, true);
  view.setUint16(138, 8, true);

  const rgba = getContext(canvas).getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(pixelSize);
  for (let source = 0, target = 0; source < rgba.length; source += 4) {
    const alpha = rgba[source + 3] / 255;
    rgb[target++] = Math.round(rgba[source] * alpha + 255 * (1 - alpha));
    rgb[target++] = Math.round(rgba[source + 1] * alpha + 255 * (1 - alpha));
    rgb[target++] = Math.round(rgba[source + 2] * alpha + 255 * (1 - alpha));
  }
  return new Blob([header, rgb], { type: "image/tiff" });
}

function canvasToBmp(canvas) {
  const { width, height } = canvas;
  const rowSize = Math.ceil(width * 3 / 4) * 4;
  const pixelSize = rowSize * height;
  const header = new Uint8Array(54);
  const view = new DataView(header.buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, 54 + pixelSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelSize, true);

  const imageData = getContext(canvas).getImageData(0, 0, width, height).data;
  const pixels = new Uint8Array(pixelSize);
  const padding = rowSize - width * 3;
  for (let y = 0; y < height; y += 1) {
    const sourceRow = (height - y - 1) * width * 4;
    const outputRow = y * rowSize;
    for (let x = 0; x < width; x += 1) {
      const source = sourceRow + x * 4;
      const target = outputRow + x * 3;
      const alpha = imageData[source + 3] / 255;
      pixels[target] = Math.round(imageData[source + 2] * alpha + 255 * (1 - alpha));
      pixels[target + 1] = Math.round(imageData[source + 1] * alpha + 255 * (1 - alpha));
      pixels[target + 2] = Math.round(imageData[source] * alpha + 255 * (1 - alpha));
    }
    if (padding) pixels.fill(0, outputRow + width * 3, outputRow + rowSize);
  }
  return new Blob([header, pixels], { type: "image/bmp" });
}

function yieldToBrowser() {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

function parseDimension(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseGridDimension(value) {
  const parsed = parseDimension(value);
  return parsed > 0 && parsed <= MAX_GRID_SIZE ? parsed : 0;
}

function extensionFor(format) {
  return format === "image/jpeg" ? "jpg"
    : format === "image/png" ? "png"
      : format === "image/bmp" ? "bmp"
        : format === "image/tiff" ? "tif"
          : format === "image/svg+xml" ? "svg"
          : format === "image/avif" ? "avif"
          : "webp";
}

function formatLabel(format) {
  return format === "image/jpeg" ? "JPG"
    : format === "image/png" ? "PNG"
      : format === "image/bmp" ? "BMP"
        : format === "image/tiff" ? "TIFF"
        : format === "image/svg+xml" ? "SVG"
        : format === "image/avif" ? "AVIF"
          : "WEBP";
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-") || "gambar";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function localizedStatus(status) {
  if (language !== "en") return status;
  return ({ "Memuat…": "Loading…", "Siap": "Ready", "Proses": "Processing", "Selesai": "Done", "Gagal": "Failed" })[status] || status;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function setButtonLabel(text) {
  document.querySelector("#convert-label").textContent = text;
}

function showError(message) {
  const translated = language === "en" ? ({
    "File yang dipilih bukan gambar. Silakan pilih file gambar.": "That file isn't an image. Choose an image file instead.",
    "Gambar melebihi batas 40 megapiksel. Silakan gunakan gambar yang lebih kecil.": "This image is over the 40-megapixel limit. Try a smaller image.",
    "Gambar tidak dapat dibuka. Coba file gambar yang lain.": "This image couldn't be opened. Try another file.",
    "Lebar dan tinggi harus berupa angka dari 1 sampai 10.000 piksel.": "Width and height must be between 1 and 10,000 pixels.",
    "Ukuran hasil terlalu besar. Batas maksimalnya 40 megapiksel.": "The output is too large. The limit is 40 megapixels.",
    "Tunggu proses yang lagi jalan sampai selesai dulu ya.": "Wait for the current task to finish before changing the queue.",
    [`Antrean sudah penuh. Maksimal ${MAX_FILES} gambar sekali jalan.`]: `The queue is full. The limit is ${MAX_FILES} images at a time.`,
    "Canvas tidak tersedia di browser ini.": "Canvas is unavailable in this browser.",
    "Browser gagal mengonversi gambar.": "The browser couldn't convert this image."
  })[message] || message : message;
  fileError.textContent = translated;
  fileError.hidden = false;
}

function showPdfError(message) {
  const error = document.querySelector("#pdf-file-error");
  error.textContent = message;
  error.hidden = false;
}

function clearPdfError() {
  const error = document.querySelector("#pdf-file-error");
  error.textContent = "";
  error.hidden = true;
}

function clearError() {
  fileError.textContent = "";
  fileError.hidden = true;
}

renderQueue();
renderPdfQueue();
updatePdfAction();
updateSettings();
applyLanguage("en");

function text(key) {
  if (language === "en") return englishText[key] || dynamicText.en[key] || key;
  return dynamicText.id[key] || key;
}

function formatText(key, values = {}) {
  return text(key).replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}

function applyLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language;
  for (const [element, original] of originalText) {
    const translations = language === "en" ? englishText : indonesianText;
    const translation = translations[element.dataset.i18n];
    element.textContent = translation ?? original;
  }
  const toggle = document.querySelector("#language-toggle");
  toggle.textContent = language === "en" ? "ID" : "EN";
  toggle.setAttribute("aria-label", language === "en" ? "Switch to Indonesian" : "Switch to English");
  document.querySelector(".top-links").setAttribute("aria-label", language === "en" ? "Site links" : "Info");
  document.querySelector(".workbench").setAttribute("aria-label", language === "en" ? "Image editor" : "Editor gambar");
  document.querySelector("#downloads-panel").setAttribute("aria-label", language === "en" ? "Download results" : "Hasil unduhan");
  document.querySelector(".compress-format-row > span").textContent = text("resultLabel");
  previewImage.alt = language === "en" ? "Image preview" : "Pratinjau gambar";
  document.querySelector(".mode-tabs").setAttribute("aria-label", language === "en" ? "Processing mode" : "Mode pengolahan");
  document.querySelector("#convert-format").setAttribute("aria-label", language === "en" ? "Output format" : "Format output");
  document.querySelector("#compress-format").setAttribute("aria-label", language === "en" ? "Compression output format" : "Format output kompres");
  document.querySelector("#split-format").setAttribute("aria-label", language === "en" ? "Tile format" : "Format potongan");
  document.querySelector("#pdf-workspace").setAttribute("aria-label", language === "en" ? "PDF tools" : "Alat PDF");
  document.querySelector("#pdf-action").setAttribute("aria-label", text("pdfActionLabel"));
  document.querySelector(".tool-picker").setAttribute("aria-label", language === "en" ? "Choose a tool category" : "Pilih kategori alat");
  imageSourceFormat.setAttribute("aria-label", language === "en" ? "Image source format" : "Format sumber gambar");
  pdfSourceFormat.setAttribute("aria-label", language === "en" ? "PDF source format" : "Format sumber PDF");
  pdfTargetFormat.setAttribute("aria-label", language === "en" ? "PDF output format" : "Format hasil PDF");
  document.querySelectorAll(".swap-formats").forEach((button) => {
    button.setAttribute("aria-label", language === "en" ? "Swap source and output formats" : "Tukar format sumber dan hasil");
    button.title = language === "en" ? "Swap formats" : "Tukar format";
  });
  document.querySelectorAll(".tool-card.is-unavailable").forEach((card) => {
    const categoryName = card.querySelector(".tool-card-name").textContent;
    card.title = language === "en"
      ? `${categoryName} conversion needs a server-side engine`
      : `Konversi ${categoryName.toLowerCase()} memerlukan mesin di server`;
  });
  document.querySelector("#rotate-button").title = language === "en" ? "Rotate 90 degrees" : "Putar 90 derajat";
  document.querySelector("#flip-button").title = language === "en" ? "Flip horizontally" : "Balik secara horizontal";
  aspectButton.title = text(aspectLocked ? "aspectLocked" : "aspectFree");
  document.querySelectorAll(".avif-option").forEach((option) => {
    if (option.disabled) {
      option.parentElement.title = text("avifUnsupported");
    }
  });
  renderQueue();
  renderPdfQueue();
  updatePdfAction();
  updateSettings();
  renderDownloads();
}
