const { retrieveLegalSources, finalAnswerContent } = require("./ragService");

const INTAKE_FIELDS = [
  ["complainant", "निवेदक वा पीडितको नाम"],
  ["complainantAddress", "निवेदक वा पीडितको ठेगाना"],
  ["respondent", "विपक्षी वा सम्बन्धित व्यक्तिको विवरण"],
  ["victimAge", "पीडितको उमेर"],
  ["incidentDate", "घटनाको मिति तथा समय"],
  ["incidentPlace", "घटनास्थल"],
  ["incidentDetails", "घटनाको पूरा विवरण"],
  ["evidence", "उपलब्ध प्रमाण वा साक्षी"],
  ["requestedAction", "माग गरिएको कारबाही"]
];

const INTAKE_QUESTIONS = {
  complainant: "मस्यौदा सुरु गर्न निवेदक वा पीडितको पूरा नाम लेख्नुहोस्।",
  complainantAddress: "निवेदक वा पीडितको हालको ठेगाना लेख्नुहोस् (जिल्ला, पालिका/वडा)।",
  respondent: "विपक्षी वा सम्बन्धित व्यक्तिको पूरा नाम वा पहिचानयोग्य विवरण लेख्नुहोस्।",
  victimAge: "घटनाको समयको पीडितको उमेर लेख्नुहोस्।",
  incidentDate: "घटना भएको मिति तथा समय लेख्नुहोस्।",
  incidentPlace: "घटना भएको पूर्ण स्थान लेख्नुहोस् (जिल्ला, पालिका/वडा र स्थान)।",
  incidentDetails: "घटनाक्रम क्रमसँग स्पष्ट लेख्नुहोस्: कसले, के, कसरी र किन गर्‍यो?",
  evidence: "उपलब्ध प्रमाण वा साक्षीको विवरण लेख्नुहोस् (नाम, फोटो, भिडियो, सन्देश, कागजात वा मेडिकल रिपोर्ट)।",
  requestedAction: "तपाईंले माग गर्न चाहेको कारबाही स्पष्ट लेख्नुहोस्।"
};

// A labelled follow-up is explicit user input even when Qwen normalizes or
// shortens the value while extracting it.  Keep these aliases intentionally
// narrow so an unlabelled message cannot populate unrelated draft fields.
const FIELD_LABELS = {
  complainant: ["निवेदक", "पीडितको नाम", "पीडित व्यक्ति", "complainant", "victim name"],
  complainantAddress: ["पीडितको ठेगाना", "निवेदकको ठेगाना", "ठेगाना", "address"],
  respondent: ["विपक्षी वा सम्बन्धित व्यक्तिको विवरण", "विपक्षी", "सम्बन्धित व्यक्ति", "प्रतिवादी", "respondent", "accused"],
  victimAge: ["पीडितको उमेर", "उमेर", "victim age", "age"],
  incidentDate: ["घटनाको मिति", "मिति तथा समय", "घटनाको समय", "incident date", "date and time"],
  incidentPlace: ["घटनास्थल", "घटनाको स्थान", "स्थान:", "incident place", "location:"],
  incidentDetails: ["घटनाको विवरण", "घटनाक्रम", "incident details", "what happened"],
  evidence: ["उपलब्ध प्रमाण", "प्रमाण वा साक्षी", "साक्षी", "evidence", "witness"],
  requestedAction: ["माग गरिएको कारबाही", "माग:", "कारबाही:", "requested action", "relief sought"]
};

function text(value, limit = 4000) {
  return String(value || "").trim().slice(0, limit);
}

function buildFacts(data) {
  return [
    `निवेदक/पीडित: ${text(data.complainant, 240) || "[उल्लेख नभएको]"}`,
    `निवेदक/पीडितको ठेगाना: ${text(data.complainantAddress, 500) || "[उल्लेख नभएको]"}`,
    `विपक्षी/सम्बन्धित व्यक्ति: ${text(data.respondent, 240) || "[थाहा नभएको वा उल्लेख नभएको]"}`,
    `पीडितको उमेर: ${text(data.victimAge, 80) || "[उल्लेख नभएको]"}`,
    `घटनाको मिति तथा समय: ${text(data.incidentDate, 180) || "[उल्लेख नभएको]"}`,
    `घटनास्थल: ${text(data.incidentPlace, 300) || "[उल्लेख नभएको]"}`,
    `घटनाको विवरण: ${text(data.incidentDetails) || "[उल्लेख नभएको]"}`,
    `प्रमाण/साक्षी: ${text(data.evidence) || "[उल्लेख नभएको]"}`,
    `माग गरिएको कारबाही: ${text(data.requestedAction, 1200) || "[उल्लेख नभएको]"}`
  ].join("\n");
}

function intakeFields(value) {
  return Object.fromEntries(INTAKE_FIELDS.map(([key]) => [key, intakeValue(value?.[key], key === "incidentDetails" ? 4000 : 1200)]));
}

function intakeValue(value, limit) {
  const normalized = text(value, limit).replace(/[।.]+$/u, "").trim();
  return /^(?:\[?\s*)?(?:उल्लेख नभएको|भर्न बाँकी|थाहा नभएको)(?:\s*\]?)?$/u.test(normalized) ? "" : normalized;
}

function supportedByMessage(value, message) {
  const candidate = String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const source = String(message || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  if (candidate.length >= 2 && source.includes(candidate)) return true;
  const candidateTokens = String(value || "").toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
  const sourceTokens = new Set(String(message || "").toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []);
  return candidateTokens.length >= 2 && candidateTokens.filter((token) => sourceTokens.has(token)).length / candidateTokens.length >= 0.75;
}

function hasExplicitFieldLabel(key, message) {
  const source = String(message || "").toLowerCase();
  return (FIELD_LABELS[key] || []).some((label) => source.includes(label.toLowerCase()));
}

function extractExplicitFields(message) {
  const source = String(message || "");
  const labelled = [];
  for (const [key, labels] of Object.entries(FIELD_LABELS)) {
    for (const label of labels) {
      const position = source.toLowerCase().indexOf(label.toLowerCase());
      if (position >= 0) labelled.push({ key, end: position + label.length, position });
    }
  }
  labelled.sort((left, right) => left.position - right.position || right.end - left.end);

  const values = {};
  for (let index = 0; index < labelled.length; index += 1) {
    const current = labelled[index];
    // Ignore a shorter alias inside the same field label (for example माग:
    // inside माग गरिएको कारबाही:).
    if (values[current.key] !== undefined) continue;
    const next = labelled.slice(index + 1).find((candidate) => candidate.key !== current.key);
    values[current.key] = source.slice(current.end, next ? next.position : source.length)
      .replace(/^[\s:：-]+/u, "")
      .trim();
  }
  return values;
}

function detectCaseType(value) {
  const source = String(value || "").toLowerCase();
  return /बलात्कार|यौन दुर्व्यवहार|यौन हिंसा|sexual assault|rape/.test(source) ? "sexual_assault" : "general";
}

function requiredFieldKeys(caseType) {
  const base = ["complainant", "complainantAddress", "respondent", "incidentDate", "incidentPlace", "incidentDetails", "evidence", "requestedAction"];
  return caseType === "sexual_assault" ? [...base.slice(0, 3), "victimAge", ...base.slice(3)] : base;
}

function isCompleteField(key, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (key === "incidentDetails") return normalized.length >= 35;
  if (key === "victimAge") return /[0-9०-९]/u.test(normalized);
  return true;
}

function missingIntakeFields(fields, caseType) {
  return requiredFieldKeys(caseType)
    .filter((key) => !isCompleteField(key, fields[key]))
    .map((key) => ({ key, label: INTAKE_FIELDS.find(([field]) => field === key)?.[1] || key }));
}

function caseLabel(caseType) {
  return caseType === "sexual_assault" ? "यौन हिंसा/बलात्कारसम्बन्धी जाहेरी" : "जाहेरी दरखास्त";
}

async function collectDraftIntake({ message, draft }) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";
  const current = { ...intakeFields(draft), caseType: String(draft?.caseType || "") };
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, think: false, format: "json", options: { temperature: 0 }, messages: [
      { role: "system", content: "तपाईं कानुनी मस्यौदा intake सहायक हुनुहुन्छ। प्रयोगकर्ताको पछिल्लो सन्देशबाट स्पष्ट रूपमा दिइएका विवरण मात्र निकाल्नुहोस्। पुराना विवरण नहटाउनुहोस्, अनुमान नगर्नुहोस्, र [उल्लेख नभएको] आफैं नलेख्नुहोस्। प्रयोगकर्ताले केवल ‘बलात्कारको केस हाल्न छ’ जस्तो केस गर्ने इच्छा मात्र लेखेमा त्यसलाई घटनाको विवरण नमान्नुहोस्। JSON मात्र दिनुहोस्। JSON मा यी string keys अनिवार्य छन्: caseType (sexual_assault वा general), complainant, complainantAddress, respondent, victimAge, incidentDate, incidentPlace, incidentDetails, evidence, requestedAction. नयाँ सन्देशले कुनै विवरण नदिएमा त्यस key को value खाली string राख्नुहोस्।" },
      { role: "user", content: `अहिलेसम्मका विवरण:\n${JSON.stringify(current)}\n\nप्रयोगकर्ताको नयाँ सन्देश:\n${text(message, 4000)}` }
    ] })
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  let extracted;
  try { extracted = JSON.parse(finalAnswerContent((await response.json()).message?.content)); }
  catch { throw new Error("Ollama could not read the draft details."); }
  const next = { ...current };
  const extractedCaseType = String(extracted?.caseType || "");
  next.caseType = current.caseType || (extractedCaseType === "sexual_assault" ? "sexual_assault" : "") || detectCaseType(message);
  // Qwen is always called above to classify each turn. This exact-label pass
  // is a guard against an occasional empty JSON value from the model, not a
  // substitute for the model: it preserves facts the user explicitly typed.
  const explicitlyProvided = extractExplicitFields(message);
  for (const [key] of INTAKE_FIELDS) {
    const limit = key === "incidentDetails" ? 4000 : 1200;
    const labelledValue = intakeValue(explicitlyProvided[key], limit);
    const value = labelledValue || intakeValue(extracted?.[key], limit);
    const specificDate = key !== "incidentDate" || /[0-9०-९]/u.test(value);
    if (value && specificDate && (current[key] || labelledValue || hasExplicitFieldLabel(key, message) || supportedByMessage(value, message))) next[key] = value;
  }
  const missing = missingIntakeFields(next, next.caseType);
  return {
    draft: next,
    ready: missing.length === 0,
    missing: missing.map((item) => item.key),
    caseType: next.caseType,
    question: missing.length
      ? `${caseLabel(next.caseType)} तयार गर्न यी अनिवार्य विवरण अझै चाहिन्छ:\n${missing.map((item) => `• ${item.label}: ${INTAKE_QUESTIONS[item.key]}`).join("\n")}\n\nकृपया बाँकी विवरण एउटै सन्देशमा पठाउनुहोस्।`
      : "सबै अनिवार्य विवरण प्राप्त भयो। अब Pinecone बाट सम्बन्धित कानुनी स्रोत खोजेर अन्तिम जाहेरी दरखास्त तयार गर्दैछु।"
  };
}

async function callOllama({ facts, context }) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";
  const system = "तपाईं नेपालका लागि कानुनी मस्यौदा सहायक हुनुहुन्छ। नेपाली (देवनागरी) मा मात्र उत्तर दिनुहोस्। दिइएका तथ्य र कानुनी अंशबाहेक कुनै तथ्य, नाम, मिति, प्रमाण, कार्यालय, घटना वा कानुनी दफा नबनाउनुहोस्। परिणामलाई वास्तविक जाहेरी दरखास्तको औपचारिक ढाँचामा ‘जाहेरी दरखास्त’ शीर्षकसहित तयार गर्नुहोस्। प्रत्येक मुख्य भागपछि एउटा खाली लाइन राख्नुहोस् ताकि PDF र च्याट दुवैमा पढ्न सजिलो होस्। यी भाग अनिवार्य र यही क्रममा राख्नुहोस्: सम्बोधन (उपयुक्त निकायको नाम तथ्यमा नभए ‘सम्बन्धित निकाय’ मात्र), निवेदक, विपक्षी/सम्बन्धित व्यक्ति, विषय, घटना भएको मिति र स्थान, तथ्य तथा घटनाक्रम, उपलब्ध प्रमाण/साक्षी, कानुनी आधार (दिइएका कानुनी अंशमा स्पष्ट रूपमा भएका दफा वा नियम मात्र), माग, मिति, निवेदकको हस्ताक्षर/नाम। कानुनी आधारमा स्रोतबाट समर्थित नियम र दफा मात्र प्रयोग गर्नुहोस्; स्रोतमा नभएको कानुन नलेख्नुहोस्। अन्त्यमा यो पेश गर्नुअघि तथ्य, प्रमाण र कानुनी आधार जाँच गर्नुपर्ने छोटो नोट राख्नुहोस्。";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.05 }, messages: [
      { role: "system", content: system },
      { role: "user", content: `प्रयोगकर्ताले दिएको तथ्य:\n${facts}\n\nसम्बन्धित नेपाली कानुनी अंश:\n${context}` }
    ] })
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  const result = await response.json();
  let draft = finalAnswerContent(result.message?.content).replace(/\*+/g, "").trim();
  if (draft && /[A-Za-z]/.test(draft)) {
    const rewrite = await fetch(`${baseUrl}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.05 }, messages: [
        { role: "system", content: "तलको कानुनी मस्यौदालाई कुनै तथ्य, नाम, मिति, प्रमाण, कानुनी आधार, खण्ड वा माग नछोडी देवनागरी नेपालीमा मात्र पूर्ण रूपमा पुनर्लेखन गर्नुहोस्। अङ्ग्रेजी अक्षर, विश्लेषण वा उत्तरबाहेकको पाठ नलेख्नुहोस्।" },
        { role: "user", content: draft }
      ] })
    });
    if (!rewrite.ok) throw new Error(`Ollama returned ${rewrite.status}`);
    const rewritten = finalAnswerContent((await rewrite.json()).message?.content).replace(/\*+/g, "").trim();
    if (rewritten) draft = rewritten;
  }
  if (!draft) throw new Error("Ollama returned an empty draft");
  return draft;
}

async function prepareComplaintDraft(data) {
  const facts = buildFacts(data);
  const retrievalQuery = `${text(data.incidentDetails)} ${text(data.requestedAction)} ${text(data.incidentPlace, 200)}`;
  if (retrievalQuery.trim().length < 12) throw new Error("घटनाको पर्याप्त विवरण आवश्यक छ।");
  const { matches } = await retrieveLegalSources({ query: retrievalQuery, language: "ne", topK: 5 });
  if (!matches.length) throw new Error("सम्बन्धित नेपाली कानुनी स्रोत भेटिएन।");
  const context = matches.map((match) => match.metadata?.text).filter(Boolean).join("\n\n---\n\n");
  const draft = await callOllama({ facts, context });
  return {
    draft,
    disclaimer: "यो प्रारम्भिक मस्यौदा मात्र हो। पेश वा हस्ताक्षर गर्नुअघि तथ्य, प्रमाण र कानुनी आधार जाँच गर्नुहोस्।",
    citations: matches.map((match) => ({ title: match.metadata?.title || "कानुनी स्रोत", sourceFile: match.metadata?.sourceFile || "", page: match.metadata?.page || null }))
  };
}

module.exports = { collectDraftIntake, prepareComplaintDraft };
