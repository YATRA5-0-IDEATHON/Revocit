const { fetchDocuments } = require("../lib/postgres");
const { createVectorStore } = require("../lib/vectorStore");
const { toVector, cosineSimilarity } = require("../lib/embedding");
const { defaultDocs } = require("../data/defaultDocs");

let vectorStore;
let vectorStoreInfo = { provider: "none", ready: false };

async function bootstrapVectorStore() {
  vectorStore = await createVectorStore();
  vectorStoreInfo = {
    provider: vectorStore.provider,
    ready: vectorStore.ready,
    reason: vectorStore.reason || null
  };
  return vectorStoreInfo;
}

async function indexDocuments() {
  const docs = await fetchDocuments();
  if (!vectorStore?.ready || !docs.length) {
    return { indexed: 0, provider: vectorStoreInfo.provider, ready: vectorStoreInfo.ready };
  }

  const vectors = docs.map((doc) => {
    const merged = `${doc.title_en} ${doc.title_np} ${doc.content_en} ${doc.content_np}`;
    return {
      id: String(doc.id),
      values: toVector(merged),
      metadata: {
        title: doc.title_en,
        category: doc.category,
        sourceUrl: doc.source_url || "",
        text: doc.content_en
      }
    };
  });

  await vectorStore.upsert(vectors);
  return { indexed: vectors.length, provider: vectorStoreInfo.provider, ready: true };
}

function rankLocal(query, docs, topK) {
  const queryVector = toVector(query);
  const scored = docs.map((doc) => {
    const text = `${doc.title_en} ${doc.title_np} ${doc.content_en} ${doc.content_np}`;
    const score = cosineSimilarity(queryVector, toVector(text));
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => ({
      id: String(item.doc.id),
      score: item.score,
      metadata: {
        title: item.doc.title_en,
        category: item.doc.category,
        sourceUrl: item.doc.source_url,
        text: item.doc.content_en,
        textNp: item.doc.content_np
      }
    }));
}

function fallbackDocs() {
  return defaultDocs.map((doc, idx) => ({
    id: idx + 1,
    title_en: doc.titleEn,
    title_np: doc.titleNp,
    category: doc.category,
    source_url: doc.sourceUrl,
    content_en: doc.contentEn,
    content_np: doc.contentNp
  }));
}

function buildAnswer({ query, lang, audience, matches }) {
  const contexts = matches.map((m) => (lang === "ne" ? m.metadata?.textNp || m.metadata?.text : m.metadata?.text));
  const condensed = contexts.slice(0, 3).join(" ");
  if (lang === "ne") {
    return {
      answer: `तपाईंको प्रश्न "${query}" का आधारमा ${audience} मोडमा मुख्य कानुनी दिशा: ${condensed || "सम्बन्धित कानुनी स्रोत फेला परेन।"}`,
      nextSteps: [
        "प्रमाण, समयरेखा र सम्बन्धित विवरण व्यवस्थित गर्नुहोस्।",
        "सम्बन्धित कानुनी धारा/प्रावधान जाँच गर्नुहोस्।",
        "उच्च जोखिमको अवस्थामा वकिल वा सम्बन्धित निकायसँग तुरुन्त सम्पर्क गर्नुहोस्।"
      ]
    };
  }

  return {
    answer: `For your query "${query}" in ${audience} mode, the strongest legal direction is: ${condensed || "No strong legal source match was found."}`,
    nextSteps: [
      "Organize timeline, evidence, and witness details.",
      "Validate the relevant legal provision before filing.",
      "Escalate high-risk matters to a licensed lawyer or authority immediately."
    ]
  };
}

async function queryRag({ query, lang = "en", audience = "citizen", topK = 4 }) {
  let docs = await fetchDocuments();
  if (!docs.length) {
    docs = fallbackDocs();
  }
  if (!docs.length) {
    return {
      answer: lang === "ne" ? "अहिले कानुनी डकुमेन्ट उपलब्ध छैन।" : "No legal documents are available right now.",
      nextSteps: [],
      citations: [],
      meta: { provider: vectorStoreInfo.provider, retrieval: "none", vectorReady: vectorStoreInfo.ready }
    };
  }

  let matches;
  if (vectorStore?.ready) {
    try {
      const vector = toVector(query);
      matches = await vectorStore.query(vector, topK);
      if (!matches.length) {
        matches = rankLocal(query, docs, topK);
      }
    } catch (error) {
      matches = rankLocal(query, docs, topK);
    }
  } else {
    matches = rankLocal(query, docs, topK);
  }

  const response = buildAnswer({ query, lang, audience, matches });
  return {
    ...response,
    citations: matches.map((m) => ({
      title: m.metadata?.title || "Legal source",
      category: m.metadata?.category || "general",
      sourceUrl: m.metadata?.sourceUrl || ""
    })),
    meta: {
      provider: vectorStoreInfo.provider,
      vectorReady: vectorStoreInfo.ready,
      retrieval: vectorStore?.ready ? "vector" : "local-semantic"
    }
  };
}

module.exports = {
  bootstrapVectorStore,
  indexDocuments,
  queryRag
};