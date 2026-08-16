/* Horizon Group — navigation + dossiers clients (public) */

const STORAGE_KEY = "horizon_group_dossiers_v1";
const ADMIN_PIN = "2026"; // PIN simple pour consulter les fiches sur cet appareil / navigateur

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

/* Mobile menu */
function initNav() {
  const btn = qs("[data-menu-toggle]");
  const panel = qs("[data-mobile-nav]");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  // Mark current page
  const path = location.pathname.split("/").pop() || "index.html";
  qsa("a[data-nav]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
}

/* Storage helpers — dossiers visibles pour l'équipe via page admin */
function loadDossiers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveDossiers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function validateForm(data) {
  const errors = {};
  if (!data.businessName || data.businessName.trim().length < 2)
    errors.businessName = "Indiquez le nom de l’entreprise.";
  if (!data.location || data.location.trim().length < 2)
    errors.location = "Indiquez le lieu.";
  if (!data.phone || data.phone.trim().length < 7)
    errors.phone = "Indiquez un numéro de téléphone valide.";
  if (!data.bestReachTime || data.bestReachTime.trim().length < 2)
    errors.bestReachTime = "Indiquez la meilleure heure pour vous joindre.";
  if (!data.callAvailability || data.callAvailability.trim().length < 2)
    errors.callAvailability = "Indiquez vos disponibilités pour les appels.";
  if (!data.placeType) errors.placeType = "Choisissez le type de lieu.";
  if (!data.sizeLabel) errors.sizeLabel = "Indiquez la taille approximative.";
  if (!data.serviceTypes || data.serviceTypes.length === 0)
    errors.serviceTypes = "Choisissez au moins un type de service.";
  if (!data.desiredDate) errors.desiredDate = "Indiquez une date souhaitée.";
  if (!data.urgency) errors.urgency = "Choisissez le niveau d’urgence.";
  if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "Courriel invalide.";
  return errors;
}

function showFieldErrors(errors) {
  qsa("[data-error-for]").forEach((el) => {
    const key = el.getAttribute("data-error-for");
    el.textContent = errors[key] || "";
  });
}

function initDossierForm() {
  const form = qs("#dossier-form");
  if (!form) return;

  const success = qs("#form-success");
  const serverError = qs("#form-server-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    serverError.hidden = true;

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
    btn.textContent = "Enregistrement…";

    try {
      // 1) Sauvegarde locale via Agent Suivi (ou fallback)
      try {
        if (!(window.HorizonAgents && HorizonAgents.AgentSuivi)) {
          const list = loadDossiers();
          list.unshift(data);
          saveDossiers(list);
        }
      } catch (_) {}

      // 2) Envoi public — SANS CORS (formulaire natif FormSubmit)
      //    Évite fetch cross-origin; _next ramène sur ?envoye=1
      if (window.HorizonAgents && HorizonAgents.AgentSuivi) {
        HorizonAgents.AgentSuivi.save(data);
      }
      const email =
        (form.dataset.submitEmail || "elbeaudry@outlook.com").trim();
      if (window.HorizonAgents && HorizonAgents.AgentFormulaire) {
        HorizonAgents.AgentFormulaire.sendCorsSafe(form, data, email);
        return; // navigation vers FormSubmit puis retour
      }
      // Repli si agents absents : succès local seulement
      form.hidden = true;
      success.hidden = false;
      const sn = qs("#success-name", success);
      const sp = qs("#success-phone", success);
      const st = qs("#success-time", success);
      if (sn) sn.textContent = data.businessName;
      if (sp) sp.textContent = data.phone;
      if (st) st.textContent = data.bestReachTime;
    } catch (err) {
      serverError.hidden = false;
      serverError.textContent =
        "L’enregistrement a échoué. Vérifiez vos infos et réessayez.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Enregistrer mon dossier";
    }
  });

  qs("[data-reset-form]")?.addEventListener("click", () => {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    showFieldErrors({});
  });
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const LABELS = {
  placeType: { chalet: "Chalet locatif", commerce: "Commerce", bureau: "Bureau", autre: "Autre" },
  urgency: { standard: "Standard", prioritaire: "Prioritaire (48 h)", urgent: "Urgent" },
  sizeLabel: { petit: "Petit", moyen: "Moyen", grand: "Grand" },
};

function initAdminDossiers() {
  const gate = qs("#admin-gate");
  const listEl = qs("#dossier-list");
  if (!gate || !listEl) return;

  const unlock = () => {
    gate.hidden = true;
    listEl.hidden = false;
    renderList();
  };

  // Auto-unlock if already authenticated this session
  if (sessionStorage.getItem("hg_admin") === "1") unlock();

  qs("#admin-login")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = String(new FormData(e.target).get("pin") || "");
    const err = qs("#pin-error");
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("hg_admin", "1");
      err.hidden = true;
      unlock();
    } else {
      err.hidden = false;
      err.textContent = "Code incorrect.";
    }
  });

  qs("#export-json")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(loadDossiers(), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `horizon-group-dossiers-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  qs("#clear-local")?.addEventListener("click", () => {
    if (confirm("Effacer les dossiers stockés sur cet appareil ?")) {
      saveDossiers([]);
      renderList();
    }
  });

  function renderList() {
    const items = loadDossiers();
    if (!items.length) {
      listEl.innerHTML =
        '<div class="panel"><p class="muted">Aucun dossier pour l’instant. Les soumissions du formulaire public apparaîtront ici (sur cet appareil) et par courriel.</p><p><a class="btn" href="dossier.html">Ouvrir le formulaire</a></p></div>';
      return;
    }
    listEl.innerHTML = items
      .map((c) => {
        const place = LABELS.placeType[c.placeType] || c.placeType || "—";
        const urg = LABELS.urgency[c.urgency] || c.urgency || "—";
        const size = LABELS.sizeLabel[c.sizeLabel] || c.sizeLabel || "—";
        const services = Array.isArray(c.serviceTypes)
          ? c.serviceTypes.join(", ")
          : c.serviceTypes || "—";
        return `
        <article class="dossier-card">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.5rem">
            <div>
              <span class="badge">Fiche #${c.id}</span>
              <h3>${escapeHtml(c.businessName)}</h3>
            </div>
            <time class="subtle" datetime="${c.createdAt}">${formatDate(c.createdAt)}</time>
          </div>
          <dl class="meta-grid">
            <div class="meta-item"><dt>Lieu</dt><dd>${escapeHtml(c.location)}</dd></div>
            <div class="meta-item"><dt>Téléphone</dt><dd><a href="tel:${escapeHtml(String(c.phone).replace(/[^\d+]/g, ""))}">${escapeHtml(c.phone)}</a></dd></div>
            <div class="meta-item"><dt>Courriel</dt><dd>${escapeHtml(c.email || "—")}</dd></div>
            <div class="meta-item"><dt>Meilleure heure</dt><dd>${escapeHtml(c.bestReachTime)}</dd></div>
            <div class="meta-item"><dt>Disponibilités</dt><dd>${escapeHtml(c.callAvailability)}</dd></div>
            <div class="meta-item"><dt>Type de lieu</dt><dd>${escapeHtml(place)}</dd></div>
            <div class="meta-item"><dt>Taille</dt><dd>${escapeHtml(size)}</dd></div>
            <div class="meta-item"><dt>Services</dt><dd>${escapeHtml(services)}</dd></div>
            <div class="meta-item"><dt>Date souhaitée</dt><dd>${escapeHtml(c.desiredDate || "—")}</dd></div>
            <div class="meta-item"><dt>Urgence</dt><dd>${escapeHtml(urg)}</dd></div>
            <div class="meta-item" style="grid-column:1/-1"><dt>Notes / accès</dt><dd>${escapeHtml(c.accessNotes || "—")}</dd></div>
          </dl>
        </article>`;
      })
      .join("");
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Force video autoplay (muted) on mobile */
function initVideo() {
  const v = qs("#ad-video");
  if (!v) return;
  v.muted = true;
  v.playsInline = true;
  const tryPlay = () => v.play().catch(() => {});
  tryPlay();
  document.addEventListener("touchstart", tryPlay, { once: true });
  document.addEventListener("click", tryPlay, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initDossierForm();
  initAdminDossiers();
  initVideo();
});
