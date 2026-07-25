const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const usersFile = path.resolve(__dirname, "../data/users.json");
const secret = process.env.AUTH_SECRET || "lawyersathi-development-secret-change-in-production";
const sessionAgeMs = 1000 * 60 * 60 * 24 * 7;

function readUsers() {
  try { return JSON.parse(fs.readFileSync(usersFile, "utf8")); } catch { return []; }
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(usersFile), { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function publicUser(user) {
  const questionsUsed = Number(user.questionsUsed || 0);
  const plan = user.plan || "trial";
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, plan, questionsUsed, questionsRemaining: plan === "trial" ? Math.max(0, 5 - questionsUsed) : null };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function matchesPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function signSession(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + sessionAgeMs })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getSessionUser(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.exp < Date.now()) return null;
    return readUsers().find((user) => user.id === session.id) || null;
  } catch { return null; }
}

function createUser({ name, email, password }) {
  const users = readUsers();
  if (users.some((user) => user.email === email.toLowerCase())) throw new Error("An account already exists for this email.");
  const user = { id: crypto.randomUUID(), name, email: email.toLowerCase(), passwordHash: hashPassword(password), plan: "trial", questionsUsed: 0, createdAt: new Date().toISOString() };
  users.push(user); saveUsers(users); return user;
}

function authenticate({ email, password }) {
  const user = readUsers().find((item) => item.email === email.toLowerCase());
  return user && matchesPassword(password, user.passwordHash) ? user : null;
}

function activatePlan(userId, plan) {
  const users = readUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return null;
  user.plan = plan;
  user.subscriptionStartedAt = new Date().toISOString();
  saveUsers(users);
  return user;
}

function recordQuestion(userId) {
  const users = readUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return { allowed: false, reason: "not_found" };
  if ((user.plan || "trial") === "trial" && Number(user.questionsUsed || 0) >= 5) return { allowed: false, reason: "subscription_required", user };
  user.questionsUsed = Number(user.questionsUsed || 0) + 1;
  saveUsers(users);
  return { allowed: true, user };
}

module.exports = { createUser, authenticate, getSessionUser, signSession, publicUser, activatePlan, recordQuestion, sessionAgeMs };
