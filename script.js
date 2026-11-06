const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const nav = document.querySelector("[data-nav]");
const form = document.querySelector("[data-inquiry]");
const status = document.querySelector("[data-form-status]");
let formStartedAt = Date.now();
let pendingInquiryKey = inquiryId();
let inquiryStarted = false;

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
  if (form.classList.contains("is-sending") || !form.reportValidity()) return;
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.idempotency_key = pendingInquiryKey;
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
    trackWebsiteEvent("inquiry_submit");
    form.reset();
    pendingInquiryKey = inquiryId();
    inquiryStarted = false;
    formStartedAt = Date.now();
    setStatus("You’re in. Your project details are now in the private ChicagoShots queue. We’ll review them and follow up.");
  } catch (error) {
    setStatus(`${error.message || "We could not send the form."} Email booking@chicagoshots.com and we’ll take it from there.`, true);
  } finally {
    form.classList.remove("is-sending");
  }
});

// First-party, allowlisted counters. Never transmit form fields, full referrers, or query strings.
function analyticsSource() {
  const allowed=["instagram","facebook","tiktok","youtube","linkedin","google","email","direct","referral","other"];
  const explicit=(new URLSearchParams(location.search).get("utm_source")||"").toLowerCase();
  if(explicit)return allowed.includes(explicit)?explicit:"other";
  if(!document.referrer)return "direct";
  try{const host=new URL(document.referrer).hostname;return allowed.find(source=>source!=="other"&&source!=="direct"&&source!=="referral"&&host.split('.').includes(source))||"referral";}catch{return "other";}
}
function trackWebsiteEvent(event) {
  if(navigator.doNotTrack==="1"||window.doNotTrack==="1"||navigator.globalPrivacyControl===true)return;
  let visit;
  try{visit=sessionStorage.getItem("chicagoshots-visit");if(!visit){visit=inquiryId();sessionStorage.setItem("chicagoshots-visit",visit);}}catch{return;}
  const rawCampaign=new URLSearchParams(location.search).get("pf_campaign")||new URLSearchParams(location.search).get("utm_campaign")||"";
  const campaign=/^[a-zA-Z0-9_-]{0,80}$/.test(rawCampaign)?rawCampaign:"";
  const pages=["/","/sports","/events","/podcasts","/weddings"];
  const payload={id:inquiryId(),session:visit,event,page:pages.includes(location.pathname)?location.pathname:"/",source:analyticsSource(),campaign};
  void fetch("https://app.phantomforce.online/api/public/chicagoshots/website-events",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
}
trackWebsiteEvent("page_view");
document.addEventListener("click",event=>{
  const link=event.target.closest?.("a");if(!link)return;
  const href=link.getAttribute("href")||"";
  if(href==="#contact"||href.startsWith("mailto:booking@chicagoshots.com")||href.startsWith("https://calendar.app.google/"))trackWebsiteEvent("cta_click");
});
form?.addEventListener("input",()=>{if(!inquiryStarted){inquiryStarted=true;trackWebsiteEvent("inquiry_start");}});
