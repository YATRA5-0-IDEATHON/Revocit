const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const pdf = require("pdf-parse");

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

async function loadPdfChunks(language) {
  if (!DEFAULT_PDF_DIRECTORIES[language]) throw new Error(`Unsupported corpus language: ${language}`);
  const configuredDirectory = language === "ne" ? process.env.NEPALI_PDF_SOURCE_DIR : process.env.ENGLISH_PDF_SOURCE_DIR;
  const directory = path.resolve(configuredDirectory || DEFAULT_PDF_DIRECTORIES[language]);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")).map((entry) => entry.name).sort();
  if (!files.length) throw new Error(`No PDF files found in ${directory}`);
  const chunks = [];
  for (const fileName of files) {
    const pages = await extractPdfPages(path.join(directory, fileName));
    pages.forEach((pageText, pageOffset) => chunkText(pageText).forEach((text, chunkOffset) => chunks.push({
      id: stableId(language, fileName, pageOffset + 1, chunkOffset), text,
      metadata: { title: path.basename(fileName, path.extname(fileName)), sourceFile: fileName, page: pageOffset + 1, chunk: chunkOffset + 1, language, category: "Nepal criminal law" }
    })));
  }
  return { directory, files, chunks };
}

module.exports = { loadPdfChunks };
