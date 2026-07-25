require("dotenv").config();

const { initSchema, insertDocument, fetchDocuments } = require("../lib/postgres");
const { defaultDocs } = require("../data/defaultDocs");
const { bootstrapVectorStore, indexDocuments } = require("../services/ragService");

async function seed() {
  const schemaReady = await initSchema();
  if (!schemaReady) {
    console.log("DATABASE_URL missing. Skipping Postgres seed.");
    return;
  }

  const existing = await fetchDocuments();
  if (existing.length === 0) {
    for (const doc of defaultDocs) {
      await insertDocument(doc);
    }
    console.log(`Inserted ${defaultDocs.length} legal documents into PostgreSQL.`);
  } else {
    console.log(`PostgreSQL already has ${existing.length} documents.`);
  }

  await bootstrapVectorStore();
  const vectorResult = await indexDocuments();
  console.log("Vector index status:", vectorResult);
}

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});