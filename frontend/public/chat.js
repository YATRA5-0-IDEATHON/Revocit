const savedLanguage = localStorage.getItem("lawyersathi_lang");
const state = {
  lang: savedLanguage === "ne" ? "ne" : "en",
  user: null,
  draftMode: new URLSearchParams(window.location.search).get("draft") === "1",
  draftIntake: {}
};

const i18n = {
  en: {
    modeTitle: "Consultation Mode",
    audienceLabel: "Audience",
    tipsTitle: "Suggested prompts",
    chatTitle: "Legal Assistant Workspace",
    chatSub: "Ask a legal question and receive source-grounded responses.",
    backHome: "Back to Home",
    systemMsg: "Welcome. Ask your legal question to begin.",
    sendBtn: "Ask Assistant",
    thinking: "Preparing response...",
    sources: "Sources", draftOn: "Draft on", draftOff: "Draft"
    ,citizen: "Citizen", lawFirm: "Law Firm", government: "Government", promptOne: "Social violence reporting process", promptTwo: "Law firm review checklist", promptThree: "Government legal action checklist", statusReady: "Workspace ready", placeholder: "Type your legal question..."
  },
  ne: {
    modeTitle: "परामर्श मोड",
    audienceLabel: "प्रयोगकर्ता प्रकार",
    tipsTitle: "सुझाव प्रश्नहरू",
    chatTitle: "कानुनी सहायक कार्यक्षेत्र",
    chatSub: "कानुनी प्रश्न सोध्नुहोस् र स्रोत-आधारित उत्तर पाउनुहोस्।",
    backHome: "मुख्य पृष्ठमा फर्कनुहोस्",
    systemMsg: "स्वागत छ। सुरु गर्न कानुनी प्रश्न सोध्नुहोस्।",
    sendBtn: "सहायकलाई सोध्नुहोस्",
    thinking: "उत्तर तयार हुँदैछ...",
    sources: "स्रोतहरू", draftOn: "मस्यौदा चालु", draftOff: "मस्यौदा",
    citizen: "नागरिक", lawFirm: "कानुनी संस्था", government: "सरकार", promptOne: "सामाजिक हिंसा उजुरी प्रक्रिया", promptTwo: "कानुनी संस्था समीक्षा सूची", promptThree: "सरकारी कानुनी कार्य सूची", statusReady: "कार्यस्थान तयार छ", placeholder: "आफ्नो कानुनी प्रश्न लेख्नुहोस्..."
  }
};

function decodeLegacyText(value) {
  if (typeof value !== "string" || !/[\u00c2\u00c3\u00e0\u00e2]/.test(value)) return value;
  try { return decodeURIComponent(escape(value)); } catch { return value; }
}

Object.values(i18n).forEach((bundle) => Object.keys(bundle).forEach((key) => {
  bundle[key] = decodeLegacyText(bundle[key]);
}));

function t(key) {
  return (i18n[state.lang] || i18n.en)[key] || key;
}

function applyLanguage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => { node.nodeValue = decodeLegacyText(node.nodeValue); });
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.getAttribute("data-i18n-placeholder")); });
  document.documentElement.lang = state.lang === "ne" ? "ne" : "en";
  document.querySelectorAll("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === state.lang));
  renderDraftMode();
}

function renderDraftMode() {
  const button = document.getElementById("draftMode");
  if (!button) return;
  button.classList.toggle("active", state.draftMode);
  button.setAttribute("aria-pressed", String(state.draftMode));
  button.textContent = state.draftMode ? t("draftOn") : t("draftOff");
}

function renderUsage() {
  const node = document.getElementById("usageStatus");
  if (!node || !state.user) return;
  if (state.user.unlimitedQuestions) {
    node.textContent = state.lang === "ne" ? "असीमित प्रश्न पहुँच" : "Unlimited question access";
    return;
  }
  node.textContent = `${state.user.questionsRemaining} ${state.lang === "ne" ? "प्रश्न बाँकी" : "questions remaining"} · ${state.user.plan === "professional" ? "Professional" : state.user.plan === "standard" ? "Standard" : "Free trial"}`;
}

async function loadSession() {
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    const data = await response.json();
    if (data.user) {
      state.user = data.user;
      renderUsage();
      return;
    }
  } catch { /* Show the in-workspace sign-in prompt below. */ }

  document.getElementById("usageStatus").textContent = state.lang === "ne" ? "च्याट सुरु गर्न लग इन गर्नुहोस्" : "Log in to start chatting";
  document.getElementById("question").disabled = true;
  document.getElementById("send").disabled = true;
  appendMessage("assistant", `<p>${state.lang === "ne" ? "कानुनी सहायक प्रयोग गर्न आफ्नो खातामा लग इन गर्नुहोस्।" : "Please log in to your account to use the legal assistant."} <a href="/login.html">${state.lang === "ne" ? "लग इन गर्नुहोस्" : "Log in"}</a> ${state.lang === "ne" ? "वा" : "or"} <a href="/signup.html">${state.lang === "ne" ? "खाता बनाउनुहोस्" : "create an account"}</a>.</p>`);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function appendMessage(role, html) {
  const thread = document.getElementById("thread");
  const article = document.createElement("article");
  article.className = `message ${role}`;
  article.innerHTML = html;
  thread.appendChild(article);
  article.scrollIntoView({ block: "start", behavior: "smooth" });
}

async function queryAssistant(prompt) {
  const audience = document.getElementById("audience").value;
  if (state.draftMode) {
    const intakeResponse = await fetch("/api/draft/intake", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, draft: state.draftIntake })
    });
    const intake = await intakeResponse.json();
    if (!intakeResponse.ok) throw new Error(intake.error || "Draft intake failed");
    state.draftIntake = intake.draft || {};
    if (!intake.ready) return { intakeQuestion: intake.question };

    const draftResponse = await fetch("/api/draft-case", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.draftIntake)
    });
    const draft = await draftResponse.json();
    if (!draftResponse.ok) throw new Error(draft.error || "Draft generation failed");
    state.draftIntake = {};
    return { draftPayload: draft };
  }

  const response = await fetch("/api/rag/query", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: prompt, audience, lang: state.lang })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function formatMessage(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function openDraftPdf(payload) {
  sessionStorage.setItem("lawyersathi_pending_draft", JSON.stringify(payload));
  const draftWindow = window.open("/draft.html?generated=1", "_blank");
  if (!draftWindow) window.location.assign("/draft.html?generated=1");
}

function renderAssistantResult(result) {
  const notice = result.notice ? `<p><strong>${escapeHtml(result.notice)}</strong></p>` : "";
  const nextSteps = (result.nextSteps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const citations = (result.citations || [])
    .map((item) => {
      const title = String(item.title || "").replace(/_[A-Za-z0-9]{5,}$/i, "").replace(/_/g, " ");
      return `<li><strong>${escapeHtml(title)}</strong>${item.page ? ` — ${state.lang === "ne" ? "पृष्ठ" : "page"} ${escapeHtml(item.page)}` : ""}</li>`;
    })
    .join("");

  appendMessage(
    "assistant",
    `${notice}<p>${formatMessage(result.answer || "")}</p>
     ${nextSteps ? `<ul>${nextSteps}</ul>` : ""}
     <div class="citations">
       <strong>${t("sources")}</strong>
       <ul>${citations}</ul>
     </div>`
  );
}

async function submitQuestion(prompt) {
  if (!state.user) return;
  const trimmed = String(prompt || "").trim();
  if (!trimmed) {
    return;
  }

  appendMessage("user", `<p>${escapeHtml(trimmed)}</p>`);
  const loadingId = `loading-${Date.now()}`;
  appendMessage("assistant", `<p id="${loadingId}">${escapeHtml(t("thinking"))}</p>`);

  try {
    const result = await queryAssistant(trimmed);
    const loadingNode = document.getElementById(loadingId);
    if (loadingNode) {
      loadingNode.closest("article")?.remove();
    }
    if (result.draftPayload) {
      openDraftPdf(result.draftPayload);
      renderAssistantResult({ answer: result.draftPayload.draft, citations: result.draftPayload.citations });
      appendMessage("assistant", `<p>${escapeHtml(state.lang === "ne" ? "मस्यौदाको PDF खुल्दैछ। प्रिन्ट संवादमा ‘Save as PDF’ छान्नुहोस्।" : "The draft PDF is opening. Choose ‘Save as PDF’ in the print dialog.")}</p>`);
    } else if (result.intakeQuestion) {
      appendMessage("assistant", `<p>${formatMessage(result.intakeQuestion)}</p>`);
    } else {
      renderAssistantResult(result);
    }
    renderUsage();
  } catch (error) {
    const loadingNode = document.getElementById(loadingId);
    if (loadingNode) {
      loadingNode.closest("article")?.remove();
      appendMessage("assistant", `<p>${escapeHtml(error.message)}</p>`);
    }
  }
}

document.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
  state.lang = button.dataset.lang;
  localStorage.setItem("lawyersathi_lang", state.lang);
  applyLanguage();
  renderUsage();
}));

document.getElementById("draftMode").addEventListener("click", () => {
  state.draftMode = !state.draftMode;
  state.draftIntake = {};
  renderDraftMode();
});

document.getElementById("send").addEventListener("click", () => {
  const input = document.getElementById("question");
  const value = input.value;
  input.value = "";
  submitQuestion(value);
});

document.getElementById("question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("send").click();
  }
});

document.querySelectorAll(".prompt-chip").forEach((button) => {
  button.addEventListener("click", () => {
    submitQuestion(button.dataset.prompt || "");
  });
});

applyLanguage();
loadSession();
if (state.draftMode) {
  appendMessage("assistant", `<p>${escapeHtml(state.lang === "ne" ? "कुन प्रकारको जाहेरी दरखास्त बनाउन चाहनुहुन्छ? उदाहरण: ‘मलाई बलात्कारको केस हाल्न छ’। तपाईंलाई थाहा भएका घटना विवरण पनि यही सन्देशमा लेख्न सक्नुहुन्छ; त्यसपछि म आवश्यक बाँकी विवरणको स्पष्ट सूची दिन्छु।" : "What type of complaint do you want to prepare? You may include any incident details you already know; I will then list the specific remaining required details.")}</p>`);
}
