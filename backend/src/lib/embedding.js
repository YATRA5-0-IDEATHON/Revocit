const EMBEDDING_DIM = 256;

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toVector(text) {
  const vector = new Array(EMBEDDING_DIM).fill(0);
  const tokens = tokenize(text);
  if (!tokens.length) {
    return vector;
  }

  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vector[idx] += 1;
  }

  const norm = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function cosineSimilarity(a, b) {
  let score = 0;
  for (let i = 0; i < a.length; i += 1) {
    score += (a[i] || 0) * (b[i] || 0);
  }
  return score;
}

module.exports = {
  EMBEDDING_DIM,
  toVector,
  cosineSimilarity
};