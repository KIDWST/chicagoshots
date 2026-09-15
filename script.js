const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-inquiry]");
const status = document.querySelector("[data-form-status]");
let formStartedAt = Date.now();

function syncHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
}

function closeMenu() {
  menu?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav?.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});

nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("scroll", syncHeader, { passive: true });
window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); });
document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
syncHeader();

function inquiryId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function attributionFields() {
  const params = new URLSearchParams(window.location.search);
  return {
    campaign_tag: params.get("pf_campaign") || "",
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    landing_url: `${window.location.origin}${window.location.pathname}`,
    referrer_url: document.referrer ? (() => {
      try {
        const referrer = new URL(document.referrer);
        return `${referrer.origin}${referrer.pathname}`;
      } catch { return ""; }
    })() : "",
  };
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.idempotency_key = inquiryId();
  payload.started_at = formStartedAt;
  Object.assign(payload, attributionFields());
  form.classList.add("is-sending");
  setStatus("Sending your project into the ChicagoShots production queue…");
  try {
    const response = await fetch(form.dataset.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "The production queue did not respond.");
    form.reset();
    formStartedAt = Date.now();
    setStatus("You’re in. Your project details are now in the private ChicagoShots queue. We’ll review them and follow up.");
  } catch (error) {
    setStatus(`${error.message || "We could not send the form."} Email booking@chicagoshots.com and we’ll take it from there.`, true);
  } finally {
    form.classList.remove("is-sending");
  }
});
