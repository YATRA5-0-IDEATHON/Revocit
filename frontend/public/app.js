const savedLanguage = localStorage.getItem("lawyersathi_lang");
const state = { lang: savedLanguage === "ne" ? "ne" : "en" };

const i18n = {
  en: {
    topbar: "Trusted legal guidance for citizens, law firms, and institutions.",
    navPlatform: "Platform",
    navServices: "Our services",
    navAbout: "About us",
    navSubscription: "Subscription",
    navProfile: "Profile",
    navStart: "Get started",
    navLogout: "Log out",
    navSecurity: "Security",
    navUseCases: "Use Cases",
    navChat: "Open Chat",
    eyebrow: "Legal AI, Built for Nepal",
    heroTitle: "Professional legal assistance with clear answers and cited sources.",
    heroSub: "Use a dedicated chat workspace for legal questions, research support, and case preparation flows across citizen, law firm, and government contexts.",
    startChat: "Start Chat",
    heroChatTitle: "Ask Lawyersathi AI",
    heroChatSub: "Chat with source-grounded RAG answers",
    learnMore: "Learn More",
    statRag: "Source-grounded answers",
    statLang: "Bilingual interface",
    statAlways: "Instant support",
    panelTitle: "What You Get",
    panelOne: "Dedicated chat experience",
    panelTwo: "Mode-based legal guidance",
    panelThree: "Evidence-aware response flow",
    panelFour: "Citations in every key answer",
    platformTitle: "Standard Platform Structure",
    platformSub: "Clear information architecture, clean navigation, and focused workflows.",
    feature1Title: "Landing + Workspace",
    feature1Text: "A clean homepage introduces capability, while chat runs in a dedicated workspace page.",
    feature2Title: "Structured Output",
    feature2Text: "Answers include legal direction, actionable next steps, and source citations for traceability.",
    feature3Title: "Role-based Modes",
    feature3Text: "Switch between Citizen, Law Firm, and Government contexts without changing screens.",
    securityTitle: "Professional Safety Layer",
    securitySub: "Sensitive queries are handled with caution prompts, and responses are grounded in legal content retrieval.",
    useCaseTitle: "Primary Use Cases",
    useCase1: "Citizen legal guidance",
    useCase2: "Law firm research support",
    useCase3: "Government query assistance",
    footerText: "Practical legal guidance, designed for more confident decisions in Nepal.",
    footerExplore: "Explore", footerWorkspace: "Legal workspace", footerAccount: "Account", footerLogin: "Log in", footerProfile: "Your profile", footerTagline: "Source-aware legal guidance",
    howKicker: "Simple by design", howTitle: "Clear answers, in three thoughtful steps.", howText: "Start with your question, choose the context that matches your need, and receive a structured response with sources.", howLink: "Try the legal workspace", step1Title: "Ask your question", step1Text: "Describe the issue in everyday language or legal terms.", step2Title: "Choose your context", step2Text: "Tailor guidance for citizens, firms, or public institutions.", step3Title: "Review with confidence", step3Text: "Use structured next steps and source references to move forward.", ctaKicker: "A clearer place to start", ctaTitle: "Bring focus to your legal questions.", ctaText: "Explore the workspace built for careful, source-aware guidance.", ctaButton: "Create your account"
  },
  ne: {
    topbar: "नागरिक, कानुनी संस्था र सरकारी निकायका लागि विश्वासयोग्य कानुनी मार्गदर्शन।",
    navPlatform: "प्लेटफर्म",
    navServices: "हाम्रा सेवाहरू",
    navAbout: "हाम्रो बारेमा",
    navSubscription: "सदस्यता",
    navProfile: "प्रोफाइल",
    navStart: "सुरु गर्नुहोस्",
    navLogout: "लग आउट",
    navSecurity: "सुरक्षा",
    navUseCases: "प्रयोग क्षेत्र",
    navChat: "च्याट खोल्नुहोस्",
    eyebrow: "नेपालका लागि कानुनी एआई",
    heroTitle: "स्पष्ट उत्तर र स्रोतसहित व्यावसायिक कानुनी सहायक।",
    heroSub: "कानुनी प्रश्न, अनुसन्धान सहयोग र मुद्दा तयारीका लागि छुट्टै च्याट कार्यक्षेत्र प्रयोग गर्नुहोस्।",
    startChat: "च्याट सुरु गर्नुहोस्",
    heroChatTitle: "Lawyersathi AI लाई सोध्नुहोस्",
    heroChatSub: "स्रोतमा आधारित RAG उत्तरसँग च्याट गर्नुहोस्",
    learnMore: "थप जान्नुहोस्",
    statRag: "स्रोत-आधारित उत्तर",
    statLang: "द्विभाषिक इन्टरफेस",
    statAlways: "तुरुन्त सहयोग",
    panelTitle: "मुख्य सुविधा",
    panelOne: "समर्पित च्याट अनुभव",
    panelTwo: "मोड-आधारित कानुनी मार्गदर्शन",
    panelThree: "प्रमाण-सचेत उत्तर प्रवाह",
    panelFour: "मुख्य उत्तरमा सन्दर्भ स्रोत",
    platformTitle: "मानक प्लेटफर्म संरचना",
    platformSub: "स्पष्ट सूचना संरचना, सफा नेभिगेसन र केन्द्रित कार्यप्रवाह।",
    feature1Title: "ल्यान्डिङ + कार्यक्षेत्र",
    feature1Text: "मुख्य पृष्ठले सेवा चिनाउँछ, च्याट छुट्टै कार्यक्षेत्रमा सञ्चालन हुन्छ।",
    feature2Title: "संरचित आउटपुट",
    feature2Text: "उत्तरमा कानुनी दिशा, कार्यसूची र सन्दर्भ स्रोत समावेश हुन्छ।",
    feature3Title: "भूमिका-आधारित मोड",
    feature3Text: "Citizen, Law Firm र Government सन्दर्भ एकै स्क्रिनमा परिवर्तन गर्न सकिन्छ।",
    securityTitle: "व्यावसायिक सुरक्षा तह",
    securitySub: "संवेदनशील प्रश्नमा सावधानी सन्देश देखाइन्छ र उत्तर कानुनी सामग्रीबाट पुनःप्राप्त गरिन्छ।",
    useCaseTitle: "मुख्य प्रयोग क्षेत्र",
    useCase1: "नागरिक कानुनी मार्गदर्शन",
    useCase2: "कानुनी संस्था अनुसन्धान सहयोग",
    useCase3: "सरकारी प्रश्न सहायता",
    footerText: "नेपालमा थप आत्मविश्वासपूर्ण निर्णयका लागि व्यावहारिक कानुनी मार्गदर्शन।",
    footerExplore: "अन्वेषण", footerWorkspace: "कानुनी कार्यक्षेत्र", footerAccount: "खाता", footerLogin: "लग इन", footerProfile: "तपाईंको प्रोफाइल", footerTagline: "स्रोतमा आधारित कानुनी मार्गदर्शन",
    howKicker: "सरल र स्पष्ट", howTitle: "तीन स्पष्ट चरणमा कानुनी उत्तर।", howText: "आफ्नो प्रश्न सोध्नुहोस्, आवश्यकताअनुसारको सन्दर्भ छान्नुहोस् र स्रोतसहित संरचित उत्तर पाउनुहोस्।", howLink: "कानुनी कार्यक्षेत्र प्रयोग गर्नुहोस्", step1Title: "आफ्नो प्रश्न सोध्नुहोस्", step1Text: "दैनिक भाषामा वा कानुनी शब्द प्रयोग गरेर समस्या वर्णन गर्नुहोस्।", step2Title: "आफ्नो सन्दर्भ छान्नुहोस्", step2Text: "नागरिक, कानुनी संस्था वा सार्वजनिक निकायका लागि उपयुक्त मार्गदर्शन छान्नुहोस्।", step3Title: "विश्वासका साथ समीक्षा गर्नुहोस्", step3Text: "अगाडि बढ्न संरचित चरण र स्रोत सन्दर्भ प्रयोग गर्नुहोस्।", ctaKicker: "सुरु गर्ने अझ स्पष्ट ठाउँ", ctaTitle: "आफ्ना कानुनी प्रश्नमा स्पष्टता ल्याउनुहोस्।", ctaText: "सावधानीपूर्ण र स्रोतमा आधारित मार्गदर्शनका लागि तयार गरिएको कार्यक्षेत्र प्रयोग गर्नुहोस्।", ctaButton: "आफ्नो खाता बनाउनुहोस्"
  }
};

function decodeLegacyText(value) {
  if (typeof value !== "string" || !/[\u00c2\u00c3\u00e0\u00e2]/.test(value)) return value;
  try { return decodeURIComponent(escape(value)); } catch { return value; }
}

Object.values(i18n).forEach((bundle) => Object.keys(bundle).forEach((key) => {
  bundle[key] = decodeLegacyText(bundle[key]);
}));

function applyLanguage() {
  const bundle = i18n[state.lang] || i18n.en;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = bundle[key] || node.textContent;
  });
  document.documentElement.lang = state.lang === "ne" ? "ne" : "en";
  const button = document.getElementById("langToggle");
  if (button) {
    button.textContent = state.lang === "en" ? "नेपाली" : "English";
  }
}

document.getElementById("langToggle")?.addEventListener("click", () => {
  state.lang = state.lang === "en" ? "ne" : "en";
  localStorage.setItem("lawyersathi_lang", state.lang);
  // Translate only from canonical page markup. Reloading prevents partial
  // translations from surviving navigation or browser page restoration.
  window.location.reload();
});

// Keep the homepage selector in the same final navbar position as every
// other content page, rather than leaving it in a page-specific top bar.
const homepageLanguageToggle = document.getElementById("langToggle");
const homepageNavLinks = document.querySelector(".nav-links");
if (homepageLanguageToggle && homepageNavLinks) homepageNavLinks.appendChild(homepageLanguageToggle);

applyLanguage();

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  const expectedLanguage = localStorage.getItem("lawyersathi_lang") === "ne" ? "ne" : "en";
  if (document.documentElement.lang !== expectedLanguage) window.location.reload();
});
