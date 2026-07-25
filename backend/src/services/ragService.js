const { createVectorStore } = require("../lib/vectorStore");
const { embedPinecone } = require("../lib/embedding");
const { loadPdfChunks } = require("./pdfIngestionService");

let vectorStore;
let vectorStoreInfo = { provider: "none", ready: false };

async function bootstrapVectorStore() {
  vectorStore = await createVectorStore();
  vectorStoreInfo = { provider: vectorStore.provider, ready: vectorStore.ready, reason: vectorStore.reason || null };
  return vectorStoreInfo;
}

async function indexDocuments() {
  if (!vectorStore?.ready || vectorStore.provider !== "pinecone") {
    return { indexed: 0, provider: vectorStoreInfo.provider, ready: vectorStoreInfo.ready, reason: "Pinecone is not configured" };
  }
  const corpus = await loadPdfChunks();
  const batchSize = 96;
  for (let offset = 0; offset < corpus.chunks.length; offset += batchSize) {
    const batch = corpus.chunks.slice(offset, offset + batchSize);
    const embeddings = await embedPinecone(vectorStore.client, batch.map((item) => item.text), "passage");
    await vectorStore.upsert(batch.map((item, index) => ({
      id: item.id,
      values: embeddings[index],
      metadata: { ...item.metadata, text: item.text }
    })));
  }
  return { indexed: corpus.chunks.length, files: corpus.files, provider: vectorStoreInfo.provider, ready: true };
}

function fallbackAnswer(matches) {
  return matches.slice(0, 3).map((match) => match.metadata?.text).filter(Boolean).join("\n\n");
}

async function queryRag({ query, topK = 4 }) {
  if (!vectorStore?.ready || vectorStore.provider !== "pinecone") {
    return {
      answer: "The PDF knowledge base is not configured. Set PINECONE_API_KEY and PINECONE_INDEX, then reindex.",
      nextSteps: [], citations: [],
      meta: { provider: vectorStoreInfo.provider, retrieval: "none", vectorReady: vectorStoreInfo.ready }
    };
  }
  try {
    const [vector] = await embedPinecone(vectorStore.client, [query], "query");
    const matches = await vectorStore.query(vector, topK);
    if (!matches.length) {
      return { answer: "No relevant passage was found in the indexed PDFs.", nextSteps: [], citations: [], meta: { provider: "pinecone", retrieval: "vector", vectorReady: true } };
    }
    return {
      answer: fallbackAnswer(matches),
      nextSteps: ["Review the cited page in the source statute before relying on it."],
      citations: matches.map((match) => ({
        title: match.metadata?.title || "Legal source",
        category: match.metadata?.category || "general",
        sourceUrl: match.metadata?.sourceFile || "",
        page: match.metadata?.page || null
      })),
      meta: { provider: "pinecone", vectorReady: true, retrieval: "vector" }
    };
  } catch (error) {
    console.error("Pinecone query failed:", error.message);
    return { answer: "The PDF search is temporarily unavailable. Check that the Pinecone index dimension matches the embedding model.", nextSteps: [], citations: [], meta: { provider: "pinecone", vectorReady: true, retrieval: "error" } };
  }
}

module.exports = { bootstrapVectorStore, indexDocuments, queryRag };
