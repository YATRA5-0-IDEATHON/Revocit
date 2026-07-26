const form = document.getElementById("draftForm");
const submit = document.getElementById("submit");
const result = document.getElementById("result");
const draftText = document.getElementById("draftText");

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDraft(payload) {
  draftText.innerHTML = escapeHtml(payload.draft || "").replace(/\n/g, "<br>");
  document.getElementById("disclaimer").textContent = payload.disclaimer || "";
  document.getElementById("citations").innerHTML = (payload.citations || []).map((item) => `<li>${escapeHtml(item.title)}${item.page ? ` — पृष्ठ ${escapeHtml(item.page)}` : ""}</li>`).join("");
  document.getElementById("pending").hidden = true;
  result.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  submit.disabled = true;
  submit.textContent = "नेपाली कानुनी स्रोत खोजी मस्यौदा तयार हुँदैछ...";
  try {
    const response = await fetch("/api/draft-case", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(data) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "मस्यौदा तयार हुन सकेन।");
    renderDraft(payload);
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    alert(error.message);
  } finally {
    submit.disabled = false;
    submit.textContent = "नेपाली मस्यौदा तयार गर्नुहोस्";
  }
});

document.getElementById("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(draftText.innerText);
  document.getElementById("copy").textContent = "प्रतिलिपि भयो";
});
document.getElementById("print").addEventListener("click", () => window.print());

if (new URLSearchParams(window.location.search).get("generated") === "1") {
  try {
    const payload = JSON.parse(sessionStorage.getItem("lawyersathi_pending_draft") || "null");
    if (payload?.draft) {
      sessionStorage.removeItem("lawyersathi_pending_draft");
      renderDraft(payload);
      setTimeout(() => window.print(), 350);
    }
  } catch { /* The normal form remains available if the stored draft is invalid. */ }
}
