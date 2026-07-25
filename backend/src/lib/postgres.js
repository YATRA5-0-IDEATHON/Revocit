const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function initSchema() {
  const sql = `
    CREATE TABLE IF NOT EXISTS legal_documents (
      id SERIAL PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_np TEXT NOT NULL,
      category TEXT NOT NULL,
      source_url TEXT,
      content_en TEXT NOT NULL,
      content_np TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  if (!connectionString) {
    return false;
  }

  const db = getPool();
  await db.query(sql);
  return true;
}

async function insertDocument(doc) {
  const db = getPool();
  const result = await db.query(
    `
      INSERT INTO legal_documents
      (title_en, title_np, category, source_url, content_en, content_np, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
    [doc.titleEn, doc.titleNp, doc.category, doc.sourceUrl, doc.contentEn, doc.contentNp, doc.tags || []]
  );
  return result.rows[0];
}

async function fetchDocuments() {
  if (!connectionString) {
    return [];
  }
  const db = getPool();
  const result = await db.query("SELECT * FROM legal_documents ORDER BY id ASC;");
  return result.rows;
}

module.exports = {
  initSchema,
  insertDocument,
  fetchDocuments
};