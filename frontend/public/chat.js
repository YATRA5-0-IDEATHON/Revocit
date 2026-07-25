const state = {
  lang: "en",
  user: null
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
    sources: "Sources"
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
    sources: "स्रोतहरू",
    citizen: "नागरिक", lawFirm: "कानुनी संस्था", government: "सरकार", promptOne: "सामाजिक हिंसा उजुरी प्रक्रिया", promptTwo: "कानुनी संस्था समीक्षा सूची", promptThree: "सरकारी कानुनी कार्य सूची", statusReady: "कार्यस्थान तयार छ", placeholder: "आफ्नो कानुनी प्रश्न लेख्नुहोस्..."
  }
};

function t(key) {
  return i18n[state.lang][key] || key;
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.getAttribute("data-i18n-placeholder")); });
  document.documentElement.lang = state.lang === "ne" ? "ne" : "en";
  document.querySelectorAll("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === state.lang));
}

function renderUsage() {
  const node = document.getElementById("usageStatus");
  if (!node || !state.user) return;
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
  const response = await fetch("/api/rag/query", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: prompt,
      audience,
      lang: state.lang
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function renderAssistantResult(result) {
  const nextSteps = (result.nextSteps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const citations = (result.citations || [])
    .map((item) => {
      const title = String(item.title || "").replace(/_[A-Za-z0-9]{5,}$/i, "").replace(/_/g, " ");
      return `<li><strong>${escapeHtml(title)}</strong>${item.page ? ` — ${state.lang === "ne" ? "पृष्ठ" : "page"} ${escapeHtml(item.page)}` : ""}</li>`;
    })
    .join("");

  appendMessage(
    "assistant",
    `<p>${escapeHtml(result.answer || "")}</p>
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
    renderAssistantResult(result);
    if (state.user?.plan === "trial") { state.user.questionsRemaining = Math.max(0, state.user.questionsRemaining - 1); renderUsage(); }
  } catch (error) {
    const loadingNode = document.getElementById(loadingId);
    if (loadingNode) {
      loadingNode.closest("article")?.remove();
      if (String(error.message).includes("five free questions")) {
        appendMessage("assistant", `<p>${escapeHtml(error.message)} <a href="/subscription.html">${state.lang === "ne" ? "सदस्यता छान्नुहोस्" : "Choose a subscription"}</a></p>`);
      } else appendMessage("assistant", `<p>${escapeHtml(error.message)}</p>`);
    }
  }
}

document.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
  state.lang = button.dataset.lang;
  applyLanguage();
  renderUsage();
}));

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
