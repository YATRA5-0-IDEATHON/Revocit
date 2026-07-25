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
refreshNavigation();
