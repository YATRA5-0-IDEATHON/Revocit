const { Pinecone } = require("@pinecone-database/pinecone");
const weaviate = require("weaviate-client");

async function createVectorStore() {
  const provider = (process.env.VECTOR_PROVIDER || "pinecone").toLowerCase();

  if (provider === "pinecone") {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX;
    if (!apiKey || !indexName) {
      return { provider: "none", ready: false, reason: "Pinecone credentials missing" };
    }

    const client = new Pinecone({ apiKey });
    const index = client.index(indexName).namespace(process.env.PINECONE_NAMESPACE || "lawyersathi");

    return {
      provider: "pinecone",
      ready: true,
      client,
      async upsert(vectors) {
        await index.upsert(vectors);
      },
      async query(vector, topK) {
        const response = await index.query({ vector, topK, includeMetadata: true });
        return response.matches || [];
      }
    };
  }

  if (provider === "weaviate") {
    const url = process.env.WEAVIATE_URL;
    if (!url) {
      return { provider: "none", ready: false, reason: "Weaviate URL missing" };
    }

    const client = await weaviate.connectToCustom({
      httpHost: url.replace(/^https?:\/\//, ""),
      httpSecure: url.startsWith("https://"),
      grpcHost: url.replace(/^https?:\/\//, ""),
      grpcSecure: url.startsWith("https://"),
      headers: process.env.WEAVIATE_API_KEY
        ? { Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}` }
        : {}
    });

    return {
      provider: "weaviate",
      ready: true,
      async upsert(vectors) {
        const collection = client.collections.get(process.env.WEAVIATE_CLASS || "LegalChunk");
        for (const vector of vectors) {
          await collection.data.insert({
            properties: {
              docId: vector.id,
              title: vector.metadata?.title || "",
              category: vector.metadata?.category || "",
              sourceUrl: vector.metadata?.sourceUrl || "",
              text: vector.metadata?.text || ""
            },
            vector: vector.values
          });
        }
      },
      async query(vector, topK) {
        const collection = client.collections.get(process.env.WEAVIATE_CLASS || "LegalChunk");
        const response = await collection.query.nearVector(vector, {
          limit: topK,
          returnMetadata: ["distance"]
        });

        return (response.objects || []).map((item) => ({
          id: String(item.properties?.docId || ""),
          score: 1 - Number(item.metadata?.distance || 1),
          metadata: {
            title: item.properties?.title,
            category: item.properties?.category,
            sourceUrl: item.properties?.sourceUrl,
            text: item.properties?.text
          }
        }));
      }
    };
  }

  return { provider: "none", ready: false, reason: "Unsupported VECTOR_PROVIDER" };
}

module.exports = { createVectorStore };
