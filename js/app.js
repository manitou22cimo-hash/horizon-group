const STORAGE_KEY = "horizon_group_dossiers_v1";
const ADMIN_PIN = "2026";

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function initNav() {
  const btn = qs("[data-menu-toggle]");
  const panel = qs("[data-mobile-nav]");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  const path = location.pathname.split("/").pop() || "index.html";
  qsa("a[data-nav]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
}

function loadDossiers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveDossiers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function validateForm(data) {
  const errors = {};
  if (!data.businessName || data.businessName.trim().length < 2) errors.businessName = "Indiquez le nom de l'entreprise.";
  if (!data.location || data.location.trim().length < 2) errors.location = "Indiquez le lieu.";
  if (!data.phone || data.phone.trim().length < 7) errors.phone = "Indiquez un téléphone valide.";
  if (!data.bestReachTime || data.bestReachTime.trim().length < 2) errors.bestReachTime = "Indiquez la meilleure heure.";
  if (!data.callAvailability || data.callAvailability.trim().length < 2) errors.callAvailability = "Indiquez vos disponibilités.";
  if (!data.placeType) errors.placeType = "Choisissez le type de lieu.";
  if (!data.sizeLabel) errors.sizeLabel = "Indiquez la taille.";
  if (!data.serviceTypes || data.serviceTypes.length === 0) errors.serviceTypes = "Choisissez au moins un service.";
  if (!data.desiredDate) errors.desiredDate = "Indiquez une date.";
  if (!data.urgency) errors.urgency = "Choisissez l'urgence.";
  return errors;
}

function showFieldErrors(errors) {
  qsa("[data-error-for]").forEach((el) => {
    el.textContent = errors[el.getAttribute("data-error-for")] || "";
  });
}

function initDossierForm() {
  const form = qs("#dossier-form");
  if (!form) return;
  const success = qs("#form-success");
  const serverError = qs("#form-server-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (serverError) serverError.hidden = true;
    const fd = new FormData(form);
    const serviceTypes = fd.getAll("serviceTypes");
    const data = {
      id: Date.now(),
      businessName: String(fd.get("businessName") || "").trim(),
      location: String(fd.get("location") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      bestReachTime: String(fd.get("bestReachTime") || "").trim(),
      callAvailability: String(fd.get("callAvailability") || "").trim(),
      placeType: String(fd.get("placeType") || "").trim(),
      sizeLabel: String(fd.get("sizeLabel") || "").trim(),
      serviceTypes,
      desiredDate: String(fd.get("desiredDate") || "").trim(),
      urgency: String(fd.get("urgency") || "").trim(),
      accessNotes: String(fd.get("accessNotes") || "").trim(),
      status: "nouveau",
      createdAt: new Date().toISOString(),
    };
    const errors = validateForm(data);
    showFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Enregistrement\u2026";

    try {
      try {
        if (!(window.HorizonAgents && HorizonAgents.AgentSuivi)) {
          const list = loadDossiers();
          list.unshift(data);
          saveDossiers(list);
        }
      } catch (_) {}

      if (window.HorizonAgents && HorizonAgents.AgentSuivi) {
        HorizonAgents.AgentSuivi.save(data);
      }
      const email = (form.dataset.submitEmail || "contact@horizongroup.ca").trim();
      if (window.HorizonAgents && HorizonAgents.AgentFormulaire) {
        HorizonAgents.AgentFormulaire.sendCorsSafe(form, data, email);
        return;
      }
      form.hidden = true;
      if (success) {
        success.hidden = false;
        const sn = qs("#success-name", success); if (sn) sn.textContent = data.businessName;
        const sp = qs("#success-phone", success); if (sp) sp.textContent = data.phone;
        const st = qs("#success-time", success); if (st) st.textContent = data.bestReachTime;
      }
    } catch (err) {
      if (serverError) {
        serverError.hidden = false;
        serverError.textContent = "L'enregistrement a \u00e9chou\u00e9. R\u00e9essayez.";
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Enregistrer mon dossier";
    }
  });

  qs("[data-reset-form]")?.addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    if (success) success.hidden = true;
    showFieldErrors({});
  });
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initAdminDossiers() {
  const gate = qs("#admin-gate");
  const listEl = qs("#dossier-list");
  if (!gate || !listEl) return;
  const unlock = () => { gate.hidden = true; listEl.hidden = false; renderList(); };
  if (sessionStorage.getItem("hg_admin") === "1") unlock();
  qs("#admin-login")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = String(new FormData(e.target).get("pin") || "");
    const err = qs("#pin-error");
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("hg_admin", "1");
      if (err) err.hidden = true;
      unlock();
    } else if (err) {
      err.hidden = false;
      err.textContent = "Code incorrect.";
    }
  });
  qs("#export-json")?.addEventListener("click", () => {
    if (window.HorizonAgents && HorizonAgents.AgentSuivi) {
      HorizonAgents.AgentSuivi.exportJson();
      return;
    }
    const blob = new Blob([JSON.stringify(loadDossiers(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "horizon-group-dossiers.json";
    a.click();
  });
  qs("#clear-local")?.addEventListener("click", () => {
    if (confirm("Effacer les dossiers locaux ?")) {
      if (window.HorizonAgents && HorizonAgents.AgentSuivi) HorizonAgents.AgentSuivi.clear();
      else saveDossiers([]);
      renderList();
    }
  });
  function renderList() {
    const items = (window.HorizonAgents && HorizonAgents.AgentSuivi)
      ? HorizonAgents.AgentSuivi.list()
      : loadDossiers();
    if (!items.length) {
      listEl.innerHTML = '<div class="panel"><p class="muted">Aucun dossier pour l\'instant.</p><p><a class="btn" href="dossier.html">Ouvrir le formulaire</a></p></div>';
      return;
    }
    listEl.innerHTML = items.map((c) => `
      <article class="dossier-card">
        <span class="badge">Fiche #${c.id}</span>
        <h3>${escapeHtml(c.businessName)}</h3>
        <p class="subtle">${formatDate(c.createdAt)}</p>
        <dl class="meta-grid">
          <div class="meta-item"><dt>Lieu</dt><dd>${escapeHtml(c.location)}</dd></div>
          <div class="meta-item"><dt>T\u00e9l\u00e9phone</dt><dd><a href="tel:${escapeHtml(String(c.phone).replace(/[^\d+]/g,""))}">${escapeHtml(c.phone)}</a></dd></div>
          <div class="meta-item"><dt>Meilleure heure</dt><dd>${escapeHtml(c.bestReachTime)}</dd></div>
          <div class="meta-item"><dt>Disponibilit\u00e9s</dt><dd>${escapeHtml(c.callAvailability)}</dd></div>
        </dl>
      </article>`).join("");
  }
}

function initVideo() {
  const v = qs("#ad-video");
  if (!v) return;
  v.muted = true;
  v.playsInline = true;
  const tryPlay = () => v.play().catch(() => {});
  tryPlay();
  document.addEventListener("touchstart", tryPlay, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initDossierForm();
  initAdminDossiers();
  initVideo();
});
