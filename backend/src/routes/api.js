const express = require("express");
const { queryRag, indexDocuments } = require("../services/ragService");
const { formatDocument, convertDate, buildCaseDraft } = require("../services/legalToolsService");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "lawyersathi-api" });
});

router.post("/rag/query", async (req, res) => {
  const query = String(req.body?.query || "").trim();
  const lang = String(req.body?.lang || "en").trim();
  const audience = String(req.body?.audience || "citizen").trim();
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  const result = await queryRag({ query, lang, audience, topK: 4 });
  res.json(result);
});

router.post("/rag/reindex", async (req, res) => {
  const result = await indexDocuments();
  res.json(result);
});

router.post("/draft-case", (req, res) => {
  const claimant = String(req.body?.claimant || "Claimant").trim();
  const respondent = String(req.body?.respondent || "Respondent").trim();
  const summary = String(req.body?.summary || "No summary provided").trim();
  const lang = String(req.body?.lang || "en").trim();
  res.json(buildCaseDraft({ claimant, respondent, summary, lang }));
});

router.post("/date/convert", (req, res) => {
  const mode = String(req.body?.mode || "ad-to-bs").trim();
  const value = String(req.body?.value || "").trim();
  if (!value) {
    return res.status(400).json({ error: "value is required" });
  }

  try {
    const result = convertDate(mode, value);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "date conversion failed" });
  }
});

router.post("/format-document", (req, res) => {
  const text = String(req.body?.text || "");
  if (!text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  res.json(formatDocument(text));
});

module.exports = router;