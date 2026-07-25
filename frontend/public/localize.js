(() => {
  const lang = localStorage.getItem("lawyersathi_lang") === "ne" ? "ne" : "en";
  const ne = {
    "Our services": "हाम्रा सेवाहरू", "About us": "हाम्रो बारेमा", "Subscription": "सदस्यता", "Profile": "प्रोफाइल", "Open Chat": "च्याट खोल्नुहोस्", "Get started": "सुरु गर्नुहोस्", "Log out": "लग आउट", "Legal workspace": "कानुनी कार्यक्षेत्र", "Explore": "अन्वेषण", "Account": "खाता", "Log in": "लग इन", "Practical legal guidance, designed for Nepal.": "नेपालका लागि तयार गरिएको व्यावहारिक कानुनी मार्गदर्शन।", "Source-aware legal guidance": "स्रोतमा आधारित कानुनी मार्गदर्शन",
    "How Lawyersathi helps": "Lawyersathi ले कसरी सहयोग गर्छ", "Legal support designed around real questions.": "वास्तविक प्रश्नमा आधारित कानुनी सहयोग।", "Explore practical tools for individuals, legal professionals, and public institutions—built to make legal information clearer and easier to act on.": "व्यक्ति, कानुन व्यवसायी र सार्वजनिक निकायका लागि कानुनी जानकारीलाई स्पष्ट र प्रयोगयोग्य बनाउने व्यावहारिक उपकरणहरू प्रयोग गर्नुहोस्।", "Legal question guidance": "कानुनी प्रश्न मार्गदर्शन", "Ask questions in clear, everyday language and receive structured guidance to help you understand possible next steps.": "स्पष्ट दैनिक भाषामा प्रश्न सोध्नुहोस् र सम्भावित अर्को कदम बुझ्न संरचित मार्गदर्शन पाउनुहोस्।", "Source-aware research": "स्रोतमा आधारित अनुसन्धान", "Review responses with cited legal sources so you can trace important information and continue your research thoughtfully.": "उद्धृत कानुनी स्रोतसहितका उत्तर समीक्षा गर्नुहोस् र महत्त्वपूर्ण जानकारी पछ्याउँदै अनुसन्धान अगाडि बढाउनुहोस्।", "Context-based assistance": "सन्दर्भअनुसार सहयोग", "Choose Citizen, Law Firm, or Government mode to get guidance shaped around the situation you are working in.": "आफ्नो अवस्थाअनुसारको मार्गदर्शनका लागि नागरिक, कानुनी संस्था वा सरकारी मोड छान्नुहोस्।", "Start with your question": "आफ्नो प्रश्नबाट सुरु गर्नुहोस्", "Use the legal workspace today.": "आजै कानुनी कार्यक्षेत्र प्रयोग गर्नुहोस्।", "Choose your consultation context and start a focused conversation.": "परामर्शको सन्दर्भ छान्नुहोस् र केन्द्रित संवाद सुरु गर्नुहोस्।",
    "Choose your access": "आफ्नो पहुँच छान्नुहोस्", "Start free. Upgrade when you need more.": "निःशुल्क सुरु गर्नुहोस्। आवश्यक पर्दा स्तर बढाउनुहोस्।", "Every new account includes five free legal questions. Choose a subscription whenever you want uninterrupted access to the legal workspace.": "प्रत्येक नयाँ खातामा पाँच निःशुल्क कानुनी प्रश्न हुन्छन्। निरन्तर पहुँचका लागि आवश्यक पर्दा सदस्यता छान्नुहोस्।", "Free trial": "निःशुल्क परीक्षण", "questions included": "प्रश्न समावेश", "Five source-grounded questions": "स्रोतमा आधारित पाँच प्रश्न", "Citizen consultation mode": "नागरिक परामर्श मोड", "No payment required": "भुक्तानी आवश्यक छैन", "Use free questions": "निःशुल्क प्रश्न प्रयोग गर्नुहोस्", "Unlimited legal questions": "असीमित कानुनी प्रश्न", "All consultation modes": "सबै परामर्श मोड", "Saved workspace access": "सुरक्षित कार्यक्षेत्र पहुँच", "Choose Standard": "स्ट्यान्डर्ड छान्नुहोस्", "Everything in Standard": "स्ट्यान्डर्डका सबै सुविधा", "Priority research workspace": "प्राथमिकता अनुसन्धान कार्यक्षेत्र", "Professional workflow support": "व्यावसायिक कार्यप्रवाह सहयोग", "Choose Professional": "प्रोफेसनल छान्नुहोस्",
    "Our purpose": "हाम्रो उद्देश्य", "Making legal guidance easier to begin.": "कानुनी मार्गदर्शन सुरु गर्न सजिलो बनाउने।", "Lawyersathi is a Nepal-focused legal technology platform designed to help people find structured, source-aware guidance when they need it most.": "Lawyersathi नेपाल केन्द्रित कानुनी प्रविधि प्लेटफर्म हो, जसले आवश्यक समयमा संरचित र स्रोतमा आधारित मार्गदर्शन खोज्न सहयोग गर्छ।", "Clarity first": "पहिले स्पष्टता", "We make complex legal information easier to understand and act on.": "हामी जटिल कानुनी जानकारीलाई बुझ्न र प्रयोग गर्न सजिलो बनाउँछौँ।", "Built with care": "सावधानीपूर्वक निर्माण", "Responsible prompts, context, and traceable sources guide the experience.": "जिम्मेवार निर्देशन, सन्दर्भ र पछ्याउन मिल्ने स्रोतले अनुभवलाई मार्गदर्शन गर्छ।", "For every context": "हरेक सन्दर्भका लागि", "From individual questions to law-firm research and institutional workflows.": "व्यक्तिगत प्रश्नदेखि कानुनी संस्था अनुसन्धान र संस्थागत कार्यप्रवाहसम्म।",
    "Welcome back": "फेरि स्वागत छ", "Continue your legal research with confidence.": "विश्वासका साथ कानुनी अनुसन्धान जारी राख्नुहोस्।", "Access your saved workspace and keep your legal questions, answers, and sources organized in one place.": "सुरक्षित कार्यक्षेत्रमा पहुँच पाउनुहोस् र कानुनी प्रश्न, उत्तर र स्रोत एकै ठाउँमा व्यवस्थित राख्नुहोस्।", "Enter your details to access your account.": "खातामा पहुँचका लागि आफ्ना विवरण हाल्नुहोस्।", "Email address": "इमेल ठेगाना", "Password": "पासवर्ड", "Enter your password": "आफ्नो पासवर्ड हाल्नुहोस्", "New to Lawyersathi?": "Lawyersathi मा नयाँ हुनुहुन्छ?", "Create an account": "खाता बनाउनुहोस्",
    "A better starting point for legal questions.": "कानुनी प्रश्नका लागि अझ राम्रो सुरुआत।", "Create your account to access a focused legal workspace built around source-aware answers and structured next steps.": "स्रोतमा आधारित उत्तर र संरचित अर्को कदमका लागि तयार कार्यक्षेत्र पहुँच गर्न खाता बनाउनुहोस्।", "Start your Lawyersathi workspace in a few moments.": "केही क्षणमै आफ्नो Lawyersathi कार्यक्षेत्र सुरु गर्नुहोस्।", "Full name": "पूरा नाम", "Your full name": "तपाईंको पूरा नाम", "Create a secure password": "सुरक्षित पासवर्ड बनाउनुहोस्", "Create account": "खाता बनाउनुहोस्", "Already have an account?": "पहिले नै खाता छ?",
    "Your workspace": "तपाईंको कार्यक्षेत्र", "Welcome,": "स्वागत छ,", "Your account is ready. Keep your legal work organized and use the workspace whenever you need source-aware guidance.": "तपाईंको खाता तयार छ। कानुनी काम व्यवस्थित राख्नुहोस् र आवश्यक पर्दा स्रोतमा आधारित मार्गदर्शनका लागि कार्यक्षेत्र प्रयोग गर्नुहोस्।", "Open legal workspace": "कानुनी कार्यक्षेत्र खोल्नुहोस्", "Your profile": "तपाईंको प्रोफाइल", "Your email address": "तपाईंको इमेल ठेगाना", "Status": "स्थिति", "Active": "सक्रिय", "Plan": "योजना", "Starter": "सुरुआती", "Workspace": "कार्यक्षेत्र", "Personal": "व्यक्तिगत"
  };

  // Decode legacy text which was once saved through a Latin-1 code path.
  function decodeLegacyText(value) {
    if (typeof value !== "string" || !/[\u00c2\u00c3\u00e0\u00e2]/.test(value)) return value;
    try { return decodeURIComponent(escape(value)); } catch { return value; }
  }

  Object.keys(ne).forEach((key) => { ne[key] = decodeLegacyText(ne[key]); });

  function translateTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const decoded = decodeLegacyText(node.nodeValue);
      if (decoded !== node.nodeValue) node.nodeValue = decoded;
      const trimmed = node.nodeValue.trim();
      if (lang === "ne" && ne[trimmed]) node.nodeValue = node.nodeValue.replace(trimmed, ne[trimmed]);
    });
  }

  function addToggle() {
    const nav = document.querySelector(".nav-links");
    if (!nav || document.getElementById("sharedLangToggle")) return;
    const button = document.createElement("button");
    button.id = "sharedLangToggle";
    button.className = "lang-toggle";
    button.type = "button";
    button.textContent = lang === "ne" ? "English" : "नेपाली";
    button.addEventListener("click", () => { localStorage.setItem("lawyersathi_lang", lang === "ne" ? "en" : "ne"); location.reload(); });
    nav.appendChild(button);
  }

  function apply() {
    translateTextNodes(document.body);
    document.documentElement.lang = lang;
  }

  // auth.js has already created the complete navigation before this dynamic
  // content-page controller runs, so translate exactly one finished DOM.
  apply();
  addToggle();
  const legacyLanguageButton = document.getElementById("sharedLangToggle");
  if (legacyLanguageButton) {
    // Replace the legacy element to remove its old inline listener.
    const languageButton = legacyLanguageButton.cloneNode(true);
    legacyLanguageButton.replaceWith(languageButton);
    languageButton.textContent = lang === "ne" ? "English" : "\u0928\u0947\u092a\u093e\u0932\u0940";
    languageButton.addEventListener("click", (event) => {
      localStorage.setItem("lawyersathi_lang", lang === "ne" ? "en" : "ne");
      window.location.reload();
    });
  }
  window.LawyersathiLanguage = { apply, lang };
})();
