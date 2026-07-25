async function refreshNavigation() {
  const userLinks = document.querySelectorAll("[data-user]");
  const guestLinks = document.querySelectorAll("[data-guest]");
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    const { user } = await response.json();
    userLinks.forEach((node) => { node.hidden = !user; });
    guestLinks.forEach((node) => { node.hidden = Boolean(user); });
    if (document.body.dataset.requireAuth === "true" && !user) window.location.replace("/login.html");
    if ((document.body.dataset.guestPage === "true" || ["/login.html", "/signup.html"].includes(window.location.pathname)) && user) window.location.replace("/profile.html");
    if (document.body.dataset.profilePage === "true" && user) {
      document.querySelectorAll("[data-profile-name]").forEach((node) => { node.textContent = user.name; });
      document.querySelectorAll("[data-profile-email]").forEach((node) => { node.textContent = user.email; });
      document.querySelectorAll("[data-profile-initials]").forEach((node) => { node.textContent = user.name.split(/\s+/).map((item) => item[0]).slice(0, 2).join("").toUpperCase(); });
    }
  } catch { userLinks.forEach((node) => { node.hidden = true; }); }
}

function ensureNavigation() {
  const nepali = localStorage.getItem("lawyersathi_lang") === "ne";
  const labels = nepali
    ? { services: "हाम्रा सेवाहरू", about: "हाम्रो बारेमा", subscription: "सदस्यता", chat: "च्याट खोल्नुहोस्", profile: "प्रोफाइल", signup: "सुरु गर्नुहोस्", logout: "लग आउट" }
    : { services: "Our services", about: "About us", subscription: "Subscription", chat: "Open Chat", profile: "Profile", signup: "Get started", logout: "Log out" };
  document.querySelectorAll(".nav-links").forEach((links) => {
    const addLink = (href, label, className = "") => {
      let link = Array.from(links.querySelectorAll("a[href]")).find((item) => {
        try { return new URL(item.href, window.location.origin).pathname === href; }
        catch { return false; }
      });
      if (!link) { link = document.createElement("a"); link.href = href; links.appendChild(link); }
      if (className) link.className = className;
      link.textContent = label;
      return link;
    };
    const services = addLink("/services.html", labels.services);
    const about = addLink("/about.html", labels.about);
    const subscription = addLink("/subscription.html", labels.subscription);
    const chat = addLink("/chat.html", labels.chat, "btn btn-chat");
    const profile = addLink("/profile.html", labels.profile); profile.dataset.user = "";
    const signup = addLink("/signup.html", labels.signup, "btn btn-nav"); signup.dataset.guest = "";
    let logout = links.querySelector("[data-logout]");
    if (!logout) {
      logout = document.createElement("button"); logout.type = "button"; logout.className = "login-link nav-button"; logout.dataset.user = ""; logout.dataset.logout = ""; links.appendChild(logout);
      logout.addEventListener("click", async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); window.location.assign("/"); });
    }
    logout.textContent = labels.logout;
    // Re-append in one fixed order on every page. The language button is added
    // afterward by localize.js, so it remains the final item consistently.
    [services, about, subscription, profile, chat, signup, logout].forEach((node) => links.appendChild(node));
    const languageToggle = links.querySelector("#langToggle, #sharedLangToggle");
    if (languageToggle) links.appendChild(languageToggle);
  });
}

async function submitAuthForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const message = form.querySelector("[data-form-message]");
  button.disabled = true; message.textContent = "";
  try {
    const response = await fetch(form.dataset.endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to continue.");
    window.location.assign(form.dataset.endpoint === "/api/auth/signup" ? "/subscription.html" : "/profile.html");
  } catch (error) { message.textContent = error.message; button.disabled = false; }
}

document.querySelectorAll("[data-auth-form]").forEach((form) => form.addEventListener("submit", submitAuthForm));
document.querySelectorAll(".pricing-grid .price-card").forEach((card, index) => {
  const plan = index === 1 ? "standard" : index === 2 ? "professional" : null;
  const button = card.querySelector("a.btn");
  if (!plan || !button) return;
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const me = await fetch("/api/auth/me", { credentials: "same-origin" }).then((response) => response.json());
    if (!me.user) { window.location.assign("/signup.html"); return; }
    button.textContent = "Activating...";
    const response = await fetch("/api/subscription/select", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    if (response.ok) window.location.assign("/chat.html");
    else { button.textContent = "Try again"; }
  });
});
document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); window.location.assign("/"); }));
if (document.body.dataset.profilePage === "true") {
  const profileCard = document.querySelector(".subpage-card");
  if (profileCard) {
    const logout = document.createElement("button");
    logout.type = "button"; logout.className = "btn btn-ghost"; logout.textContent = "Log out";
    logout.style.marginTop = "22px";
    logout.addEventListener("click", async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); window.location.assign("/"); });
    profileCard.appendChild(logout);
  }
}

document.querySelectorAll(".navbar-inner").forEach((navbar) => {
  const links = navbar.querySelector(".nav-links");
  if (!links || navbar.querySelector(".nav-toggle")) return;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";
  toggle.addEventListener("click", () => {
    const isOpen = navbar.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
  navbar.appendChild(toggle);
});
ensureNavigation();
refreshNavigation();

// A browser may restore a prior page from its back/forward cache instead of
// running its scripts again. If that cached DOM was rendered in the other
// language, reload it once using the single persisted language value.
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  const expectedLanguage = localStorage.getItem("lawyersathi_lang") === "ne" ? "ne" : "en";
  if (document.documentElement.lang !== expectedLanguage) window.location.reload();
});

// Content pages share this file; load the persisted site-language controller
// whenever the page does not already use the homepage language controller.
if (!document.getElementById("langToggle")) {
  const languageScript = document.createElement("script");
  // Preserve a deterministic execution order for pages that build navigation
  // dynamically. localize.js re-applies once it is loaded.
  languageScript.async = false;
  languageScript.src = "/localize.js?v=2";
  document.head.appendChild(languageScript);
}
