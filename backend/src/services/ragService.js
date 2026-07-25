const { createVectorStore } = require("../lib/vectorStore");
const { embedPinecone } = require("../lib/embedding");
const { listPdfFiles, loadPdfChunks } = require("./pdfIngestionService");

const LANGUAGES = ["en", "ne"];
const RATE_LIMIT_RETRY_MS = 61000;
let vectorStores = {};
let vectorStoreInfo = {};

function finalAnswerContent(value) {
  const text = String(value || "");
  const closingTag = text.lastIndexOf("</think>");
  if (closingTag >= 0) return text.slice(closingTag + "</think>".length).trim();
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function detectLanguage(text) {
  return /[\u0900-\u097F]/.test(String(text || "")) ? "ne" : "en";
}

async function bootstrapVectorStore() {
  const stores = await Promise.all(LANGUAGES.map(async (language) => [language, await createVectorStore({ language })]));
  vectorStores = Object.fromEntries(stores);
  vectorStoreInfo = Object.fromEntries(stores.map(([language, store]) => [language, {
    provider: store.provider, ready: store.ready, indexName: store.indexName || null, reason: store.reason || null
  }]));
  return vectorStoreInfo;
}

async function indexCorpus(language) {
  const store = vectorStores[language];
  if (!store?.ready || store.provider !== "pinecone") {
    return { language, indexed: 0, ready: false, reason: store?.reason || "Pinecone index is not configured" };
  }
  const batchSize = 96;
  const { files } = await listPdfFiles(language);
  const orderedFiles = language === "ne"
    ? [...files].sort((a, b) => Number(b.includes("अपराध")) - Number(a.includes("अपराध")))
    : files;
  let indexed = 0;
  for (const fileName of orderedFiles) {
    const corpus = await loadPdfChunks(language, [fileName]);
    for (let offset = 0; offset < corpus.chunks.length; offset += batchSize) {
      const batch = corpus.chunks.slice(offset, offset + batchSize);
      let embeddings;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          embeddings = await embedPinecone(store.client, batch.map((item) => item.text), "passage");
          break;
        } catch (error) {
          const rateLimited = error?.status === 429 || /RESOURCE_EXHAUSTED|tokens per minute/i.test(String(error?.message));
          if (!rateLimited || attempt === 3) throw error;
          console.log(`${language} embedding rate limit reached; resuming in ${RATE_LIMIT_RETRY_MS / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
        }
      }
      await store.upsert(batch.map((item, index) => ({ id: item.id, values: embeddings[index], metadata: { ...item.metadata, text: item.text } })));
      indexed += batch.length;
      console.log(`${language} indexed ${indexed} chunks; latest source: ${fileName}`);
    }
  }
  return { language, indexName: store.indexName, indexed, files: orderedFiles, ready: true };
}

async function indexDocuments({ language } = {}) {
  const languages = language ? [language] : LANGUAGES;
  const results = [];
  for (const corpusLanguage of languages) results.push(await indexCorpus(corpusLanguage));
  return { indexes: results, indexed: results.reduce((total, result) => total + result.indexed, 0) };
}

async function generateAnswer({ query, context, language, audience }) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen3:4b";
  const languageRule = language === "ne"
    ? "Respond only in clear Nepali (Devanagari). The supplied legal passages are Nepali; preserve their legal meaning and terminology."
    : "Respond only in clear English. The supplied legal passages are English; preserve their legal meaning and terminology.";
  const system = `You are a Nepal legal-information assistant for a ${audience} audience. ${languageRule} Use only the supplied source passages and preserve their legal meaning, legal terms, section numbers, facts, and procedures. If the passages do not answer the question, say that clearly. Give a complete, well-organized answer that includes every relevant condition, exception, definition, procedure, and penalty found in the passages. Do not summarize away legally relevant details. Output plain text only: do not use Markdown, asterisks, headings, source lists, or statements about being based on supplied passages, translations, external knowledge, or your answering process.`;
  let answer = "";
  for (let attempt = 0; attempt < 2 && !answer; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.1 }, messages: [
        { role: "system", content: system },
        { role: "user", content: `Source passages:\n${context}\n\nQuestion: ${query}` }
      ] })
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const result = await response.json();
    answer = finalAnswerContent(result.message?.content).replace(/\*+/g, "").trim();
  }
  if (answer && language === "ne" && /[A-Za-z]/.test(answer)) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, think: false, options: { temperature: 0.1 }, messages: [
        { role: "system", content: "तपाईं नेपालका कानुनी जानकारी सहायक हुनुहुन्छ। तलको उत्तरलाई तथ्य, कानुनी शब्द, दफा, सर्त, अपवाद, सजाय र अर्थ नबदलिकन देवनागरी नेपालीमा मात्र पूर्ण रूपमा पुनर्लेखन गर्नुहोस्। कुनै विवरण नछोड्नुहोस्, संक्षेप वा सारांश नबनाउनुहोस्। अङ्ग्रेजी अक्षर, अङ्ग्रेजी कोष्ठक, विश्लेषण, वा व्याख्या नलेख्नुहोस्। उत्तर मात्र लेख्नुहोस्।" },
        { role: "user", content: answer }
      ] })
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const rewritten = finalAnswerContent((await response.json()).message?.content).replace(/\*+/g, "").trim();
    if (rewritten) answer = rewritten;
  }
  if (!answer) throw new Error("Ollama returned an empty response");
  return answer;
}

function nativeMessage(language, english, nepali) {
  return language === "ne" ? nepali : english;
}

async function retrieveLegalSources({ query, language = detectLanguage(query), topK = 4 }) {
  const store = vectorStores[language];
  if (!store?.ready || store.provider !== "pinecone") throw new Error(`${language} Pinecone index is not configured`);
  const [vector] = await embedPinecone(store.client, [query], "query");
  const matches = await store.query(vector, topK);
  return { language, store, matches };
}

async function queryRag({ query, audience = "citizen", topK = 4 }) {
  const language = detectLanguage(query);
  const store = vectorStores[language];
  if (!store?.ready || store.provider !== "pinecone") {
    return { answer: nativeMessage(language, "The English PDF index is not configured.", "नेपाली PDF इन्डेक्स तयार छैन।"), nextSteps: [], citations: [], meta: { language, vectorReady: false, retrieval: "none", index: vectorStoreInfo[language] || null } };
  }
  try {
    const { matches } = await retrieveLegalSources({ query, language, topK });
    if (!matches.length) return { answer: nativeMessage(language, "No relevant passage was found in the English PDFs.", "नेपाली PDF मा यस प्रश्नसँग सम्बन्धित अंश भेटिएन।"), nextSteps: [], citations: [], meta: { language, vectorReady: true, retrieval: "vector", indexName: store.indexName } };
    const context = matches.map((match) => match.metadata?.text).filter(Boolean).join("\n\n---\n\n");
    const answer = await generateAnswer({ query, context, language, audience });
    return {
      answer,
      nextSteps: [],
      citations: matches.map((match) => ({ title: match.metadata?.title || "Legal source", category: match.metadata?.category || "general", sourceUrl: match.metadata?.sourceFile || "", page: match.metadata?.page || null })),
      meta: { provider: "pinecone", indexName: store.indexName, model: process.env.OLLAMA_MODEL || "qwen3:4b", language, vectorReady: true, retrieval: "vector" }
    };
  } catch (error) {
    console.error(`${language} RAG query failed:`, error.message);
    return { answer: nativeMessage(language, "Could not generate an answer. Please try again.", "उत्तर तयार हुन सकेन। कृपया फेरि प्रयास गर्नुहोस्।"), nextSteps: [], citations: [], meta: { language, vectorReady: true, retrieval: "error", indexName: store.indexName } };
  }
}

module.exports = { bootstrapVectorStore, indexDocuments, queryRag, detectLanguage, retrieveLegalSources };
