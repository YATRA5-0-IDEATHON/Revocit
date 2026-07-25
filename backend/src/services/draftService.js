const { retrieveLegalSources } = require("./ragService");

function text(value, limit = 4000) {
  return String(value || "").trim().slice(0, limit);
}

function buildFacts(data) {
  return [
    `निवेदक/पीडित: ${text(data.complainant, 240) || "[उल्लेख नभएको]"}`,
    `विपक्षी/सम्बन्धित व्यक्ति: ${text(data.respondent, 240) || "[थाहा नभएको वा उल्लेख नभएको]"}`,
    `घटनाको मिति तथा समय: ${text(data.incidentDate, 180) || "[उल्लेख नभएको]"}`,
    `घटनास्थल: ${text(data.incidentPlace, 300) || "[उल्लेख नभएको]"}`,
    `घटनाको विवरण: ${text(data.incidentDetails) || "[उल्लेख नभएको]"}`,
    `प्रमाण/साक्षी: ${text(data.evidence) || "[उल्लेख नभएको]"}`,
    `माग गरिएको कारबाही: ${text(data.requestedAction, 1200) || "[उल्लेख नभएको]"}`
  ].join("\n");
}

async function callOllama({ facts, context }) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";
  const system = "तपाईं नेपालका लागि कानुनी मस्यौदा सहायक हुनुहुन्छ। नेपाली (देवनागरी) मा मात्र उत्तर दिनुहोस्। दिइएका तथ्य र कानुनी अंशबाहेक कुनै तथ्य, नाम, मिति, प्रमाण वा कानुनी दफा नबनाउनुहोस्। अज्ञात विवरणलाई [उल्लेख नभएको] वा [भर्न बाँकी] भनेर राख्नुहोस्। परिणामलाई ‘जाहेरी दरखास्तको मस्यौदा’ शीर्षकसहित औपचारिक तर सरल नेपालीमा तयार गर्नुहोस्। यी भाग अनिवार्य राख्नुहोस्: सम्बोधन, निवेदक, विपक्षी/सम्बन्धित व्यक्ति, विषय, तथ्य तथा घटनाक्रम, उपलब्ध प्रमाण/साक्षी, कानुनी आधार, माग, मिति/हस्ताक्षरका स्थान। यो पेश गर्नुअघि प्रयोगकर्ता वा कानुन व्यवसायीले जाँच गर्नुपर्ने मस्यौदा हो भन्ने अन्तिम नोट राख्नुहोस्।";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.05 }, messages: [
      { role: "system", content: system },
      { role: "user", content: `प्रयोगकर्ताले दिएको तथ्य:\n${facts}\n\nसम्बन्धित नेपाली कानुनी अंश:\n${context}` }
    ] })
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  const result = await response.json();
  const draft = String(result.message?.content || "").trim();
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

module.exports = { prepareComplaintDraft };
