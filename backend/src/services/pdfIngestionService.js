const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");
const pdf = require("pdf-parse");

const execFileAsync = promisify(execFile);

const DEFAULT_PDF_DIRECTORIES = {
  en: path.resolve(__dirname, "../../../../../english files"),
  ne: path.resolve(__dirname, "../../../../../nepali files")
};

function normaliseText(value) {
  return String(value || "").replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n[ \t]*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function chunkText(text, size = 1400, overlap = 220) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf("\n\n", end), text.lastIndexOf(". ", end), text.lastIndexOf(" ", end));
      if (boundary > start + Math.floor(size * 0.55)) end = boundary + 1;
    }
    const content = text.slice(start, end).trim();
    if (content) chunks.push(content);
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

function stableId(language, sourceFile, page, chunkIndex) {
  return crypto.createHash("sha256").update(`${language}:${sourceFile}:${page}:${chunkIndex}`).digest("hex");
}

async function extractPdfPages(filePath) {
  const data = await fs.readFile(filePath);
  const parsed = await pdf(data, { pagerender: async (page) => (await page.getTextContent()).items.map((item) => item.str).join(" ") });
  // pdf-parse separates rendered pages with blank lines; leading spaces are common,
  // so do not require a non-whitespace character immediately after the separator.
  const pages = String(parsed.text || "").split(/\n{2,}/).map(normaliseText).filter(Boolean);
  if (!pages.length) throw new Error("No extractable text was found (the PDF may be scanned and need OCR).");
  return pages;
}

async function extractOcrPages(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lawyersathi-nepali-ocr-"));
  try {
    const sourceCopy = path.join(tempDir, "source.pdf");
    await fs.copyFile(filePath, sourceCopy);
    const parsed = await pdf(await fs.readFile(filePath));
    const pages = [];
    for (let page = 1; page <= parsed.numpages; page += 1) {
      const imagePrefix = path.join(tempDir, `page-${page}`);
      const imagePath = `${imagePrefix}.png`;
      await execFileAsync("pdftoppm", ["-f", String(page), "-l", String(page), "-r", "120", "-singlefile", "-png", sourceCopy, imagePrefix], { maxBuffer: 1024 * 1024 * 10 });
      const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", "-l", "nep", "--psm", "6"], { maxBuffer: 1024 * 1024 * 10 });
      await fs.rm(imagePath, { force: true });
      const text = normaliseText(stdout);
      if (text) pages.push(text);
    }
    if (!pages.length) throw new Error("Nepali OCR produced no extractable text.");
    return pages;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function extractPaddleOcrPages(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "lawyersathi-nepali-paddle-"));
  try {
    const sourceCopy = path.join(tempDir, "source.pdf");
    const imagePrefix = path.join(tempDir, "page");
    await fs.copyFile(filePath, sourceCopy);
    await execFileAsync("pdftoppm", ["-r", "150", "-png", sourceCopy, imagePrefix], { maxBuffer: 1024 * 1024 * 10 });
    const imagePaths = (await fs.readdir(tempDir))
      .filter((name) => /^page-\d+\.png$/i.test(name))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      .map((name) => path.join(tempDir, name));
    if (!imagePaths.length) throw new Error("PDF rendering produced no images for PaddleOCR.");
    const imageListPath = path.join(tempDir, "images.txt");
    await fs.writeFile(imageListPath, imagePaths.join("\n"), "utf8");
    const bridgePath = path.resolve(__dirname, "../scripts/paddle_ocr_pages.py");
    const { stdout } = await execFileAsync("python", [bridgePath, "--image-list", imageListPath], {
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True" },
      maxBuffer: 1024 * 1024 * 50
    });
    const jsonLine = String(stdout).split(/\r?\n/).reverse().find((line) => line.trim().startsWith("["));
    if (!jsonLine) throw new Error("PaddleOCR did not return page text.");
    const pages = JSON.parse(jsonLine).map(normaliseText);
    if (!pages.some(Boolean)) throw new Error("PaddleOCR produced no extractable text.");
    return pages;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function listPdfFiles(language) {
  if (!DEFAULT_PDF_DIRECTORIES[language]) throw new Error(`Unsupported corpus language: ${language}`);
  const configuredDirectory = language === "ne" ? process.env.NEPALI_PDF_SOURCE_DIR : process.env.ENGLISH_PDF_SOURCE_DIR;
  const directory = path.resolve(configuredDirectory || DEFAULT_PDF_DIRECTORIES[language]);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")).map((entry) => entry.name).sort();
  if (!files.length) throw new Error(`No PDF files found in ${directory}`);
  return { directory, files };
}

async function loadPdfChunks(language, selectedFiles) {
  const { directory, files: availableFiles } = await listPdfFiles(language);
  const files = selectedFiles || availableFiles;
  const chunks = [];
  for (const fileName of files) {
    const filePath = path.join(directory, fileName);
    const pages = language === "ne" && process.env.NEPALI_OCR === "true"
      ? process.env.NEPALI_OCR_ENGINE === "paddle"
        ? await extractPaddleOcrPages(filePath)
        : await extractOcrPages(filePath)
      : await extractPdfPages(filePath);
    pages.forEach((pageText, pageOffset) => chunkText(pageText).forEach((text, chunkOffset) => chunks.push({
      id: stableId(language, fileName, pageOffset + 1, chunkOffset), text,
      metadata: { title: path.basename(fileName, path.extname(fileName)), sourceFile: fileName, page: pageOffset + 1, chunk: chunkOffset + 1, language, category: "Nepal criminal law" }
    })));
  }
  return { directory, files, chunks };
}

module.exports = { listPdfFiles, loadPdfChunks };
