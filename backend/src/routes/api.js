const express = require("express");
const { queryRag, indexDocuments } = require("../services/ragService");
const { formatDocument, convertDate, buildCaseDraft } = require("../services/legalToolsService");
const { createUser, authenticate, getSessionUser, signSession, publicUser, activatePlan, recordQuestion, sessionAgeMs } = require("../services/authService");

const router = express.Router();

function getCookie(req, name) {
  const entry = String(req.headers.cookie || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function setSession(res, user) {
  res.cookie("lawyersathi_session", signSession(user), { httpOnly: true, sameSite: "lax", path: "/", maxAge: sessionAgeMs, secure: process.env.NODE_ENV === "production" });
}

router.get("/auth/me", (req, res) => {
  const user = getSessionUser(getCookie(req, "lawyersathi_session"));
  res.json({ user: user ? publicUser(user) : null });
});

router.post("/auth/signup", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: "Enter a name, a valid email, and a password of at least 8 characters." });
  try { const user = createUser({ name, email, password }); setSession(res, user); res.status(201).json({ user: publicUser(user) }); }
  catch (error) { res.status(400).json({ error: error.message }); }
});

router.post("/auth/login", (req, res) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const user = authenticate({ email, password });
  if (!user) return res.status(401).json({ error: "Email or password is incorrect." });
  setSession(res, user); res.json({ user: publicUser(user) });
});

router.post("/auth/logout", (req, res) => { res.clearCookie("lawyersathi_session", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" }); res.status(204).end(); });

router.post("/subscription/select", (req, res) => {
  const user = getSessionUser(getCookie(req, "lawyersathi_session"));
  const plan = String(req.body?.plan || "");
  if (!user) return res.status(401).json({ error: "Please log in to select a subscription." });
  if (!["standard", "professional"].includes(plan)) return res.status(400).json({ error: "Choose a valid subscription." });
  const updatedUser = activatePlan(user.id, plan);
  res.json({ user: publicUser(updatedUser) });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "lawyersathi-api" });
});

router.post("/rag/query", async (req, res) => {
  const user = getSessionUser(getCookie(req, "lawyersathi_session"));
  if (!user) return res.status(401).json({ error: "Please log in to use the legal workspace.", code: "login_required" });
  const query = String(req.body?.query || "").trim();
  const lang = String(req.body?.lang || "en").trim();
  const audience = String(req.body?.audience || "citizen").trim();
  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }
  const questionAllowance = recordQuestion(user.id);
  if (!questionAllowance.allowed) return res.status(402).json({ error: "Your five free questions have been used. Choose a subscription to continue.", code: "subscription_required" });

  const result = await queryRag({ query, lang, audience, topK: 4 });
  res.json(result);
});

router.post("/rag/reindex", async (req, res) => {
  const language = req.body?.language;
  if (language && !["en", "ne"].includes(language)) return res.status(400).json({ error: "language must be en or ne" });
  const result = await indexDocuments({ language });
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
