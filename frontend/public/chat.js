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
  document.getElementById("langToggle").textContent = state.lang === "en" ? "नेपाली" : "English";
}

function renderUsage() {
  const node = document.getElementById("usageStatus");
  if (!node || !state.user) return;
  node.textContent = state.user.plan === "trial"
    ? `${state.user.questionsRemaining} ${state.lang === "ne" ? "निःशुल्क प्रश्न बाँकी" : "free questions remaining"}`
    : `${state.user.plan === "professional" ? "Professional" : "Standard"} ${state.lang === "ne" ? "सदस्यता" : "subscription"}`;
}

async function loadSession() {
  const response = await fetch("/api/auth/me", { credentials: "same-origin" });
  const data = await response.json();
  if (!data.user) { window.location.replace("/login.html"); return; }
  state.user = data.user;
  renderUsage();
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
  thread.scrollTop = thread.scrollHeight;
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
    .map((item) => `<li><strong>${escapeHtml(item.title)}</strong> (${escapeHtml(item.category)})</li>`)
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

document.getElementById("langToggle").addEventListener("click", () => {
  state.lang = state.lang === "en" ? "ne" : "en";
  applyLanguage();
  renderUsage();
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
