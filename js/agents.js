/**
 * Horizon Group — 4 agents automatisés (expérience client)
 * 1. AgentAccueil 2. AgentFormulaire 3. AgentSuivi 4. AgentFiabilite
 */
(function (global) {
  "use strict";
  const HG = (global.HorizonAgents = global.HorizonAgents || {});
  function log(agent, msg, detail) {
    try { console.info(`[HG:${agent}]`, msg, detail || ""); } catch (_) {}
  }
  HG.AgentAccueil = {
    name: "Accueil",
    run() {
      this.ensureNavActive();
      this.recoverVideo();
      document.documentElement.dataset.hgReady = "1";
      log(this.name, "prêt");
    },
    ensureNavActive() {
      const path = location.pathname.split("/").pop() || "index.html";
      document.querySelectorAll("a[data-nav]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (href === path || (path === "" && href === "index.html")) {
          a.setAttribute("aria-current", "page");
        }
      });
    },
    recoverVideo() {
      const v = document.querySelector("#ad-video");
      if (!v) return;
      v.muted = true;
      v.setAttribute("playsinline", "");
      const play = () => v.play().catch(() => {});
      play();
      ["touchstart", "click"].forEach((ev) =>
        document.addEventListener(ev, play, { once: true, passive: true })
      );
      v.addEventListener("error", () => {
        const badge = document.querySelector(".ad-badge");
        if (badge) badge.textContent = "Vidéo à venir";
      });
    }
  };
  HG.AgentFormulaire = {
    name: "Formulaire",
    sendCorsSafe(form, data, email) {
      const to = (email || "elbeaudry@outlook.com").replace(/^ajax\//, "");
      const action = `https://formsubmit.co/${to}`;
      const bridge = document.createElement("form");
      bridge.method = "POST";
      bridge.action = action;
      bridge.style.display = "none";
      const fields = {
        ...data,
        serviceTypes: Array.isArray(data.serviceTypes) ? data.serviceTypes.join(", ") : data.serviceTypes,
        _subject: `Nouveau dossier client — ${data.businessName}`,
        _template: "table",
        _captcha: "false",
        _next: `${location.href.split("?")[0]}?envoye=1`
      };
      Object.entries(fields).forEach(([k, v]) => {
        if (v == null || k === "id" || k === "status" || k === "createdAt") return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        bridge.appendChild(input);
      });
      document.body.appendChild(bridge);
      log(this.name, "soumission native FormSubmit (sans CORS)");
      bridge.submit();
    },
    showSuccessFromQuery() {
      const params = new URLSearchParams(location.search);
      if (params.get("envoye") !== "1") return false;
      const form = document.querySelector("#dossier-form");
      const success = document.querySelector("#form-success");
      if (form) form.hidden = true;
      if (success) success.hidden = false;
      try { history.replaceState({}, "", location.pathname); } catch (_) {}
      return true;
    }
  };
  HG.AgentSuivi = {
    name: "Suivi",
    KEY: "horizon_group_dossiers_v1",
    list() {
      try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch { return []; }
    },
    save(item) {
      const list = this.list();
      list.unshift(item);
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return list;
    },
    exportJson() {
      const blob = new Blob([JSON.stringify(this.list(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "horizon-group-dossiers.json";
      a.click();
    },
    clear() { localStorage.removeItem(this.KEY); }
  };
  HG.AgentFiabilite = {
    name: "Fiabilite",
    issues: [],
    run() {
      ["css/styles.css", "js/app.js", "js/agents.js"].forEach((path) => {
        fetch(path, { method: "HEAD", cache: "no-cache" })
          .then((r) => { if (!r.ok) this.issues.push({ path, status: r.status }); })
          .catch(() => this.issues.push({ path, status: "network" }));
      });
    }
  };
  HG.boot = function () {
    HG.AgentAccueil.run();
    HG.AgentFormulaire.showSuccessFromQuery();
    HG.AgentFiabilite.run();
    log("boot", "4 agents actifs");
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => HG.boot());
  } else {
    HG.boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
