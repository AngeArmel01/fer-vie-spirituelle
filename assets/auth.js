/**
 * auth.js — module d'authentification et d'appel API partagé par les deux pages.
 * Expose l'objet global FER = { api: {get, post}, initAuth }.
 */
const FER = (function () {
  "use strict";

  function apiUrl(params) {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
    return url.toString();
  }

  const api = {
    get(params) {
      return fetch(apiUrl(params)).then(r => r.json());
    },
    post(corps) {
      return fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // évite le préflight CORS
        body: JSON.stringify(corps)
      }).then(r => r.json());
    }
  };

  function initiales(nom) {
    return (nom || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  }

  /**
   * @param {Object} opts
   * @param {(nom:string, credential:string, role:string)=>void} opts.onAuth - appelé après connexion réussie
   * @param {()=>void} [opts.onSignOut] - appelé après déconnexion
   */
  function initAuth(opts) {
    const elCarteConnexion = document.getElementById("carte-connexion");
    const elSession = document.getElementById("session");
    const elAvatar = document.getElementById("avatarInitiales");
    const elNomSession = document.getElementById("nomSession");
    const elBtnDeconnexion = document.getElementById("btnDeconnexion");
    const elMsgAuth = document.getElementById("msgAuth");
    const elGsiButton = document.getElementById("gsi-button");

    let credential = sessionStorage.getItem("fer_credential") || null;

    function afficherAuthentifie(nom) {
      elGsiButton.style.display = "none";
      elSession.style.display = "flex";
      elNomSession.textContent = nom;
      elAvatar.textContent = initiales(nom);
      elMsgAuth.classList.remove("show");
    }

    function afficherNonAuthentifie(messageErreur) {
      sessionStorage.removeItem("fer_credential");
      credential = null;
      elGsiButton.style.display = "block";
      elSession.style.display = "none";
      if (messageErreur) {
        elMsgAuth.textContent = messageErreur;
        elMsgAuth.classList.add("show");
      }
      if (opts.onSignOut) opts.onSignOut();
    }

    function verifierSession() {
      if (!credential) { afficherNonAuthentifie(); return; }
      api.get({ action: "whoami", credential }).then(res => {
        if (!res.ok) { afficherNonAuthentifie(res.erreur || "Connexion refusée."); return; }
        afficherAuthentifie(res.nom);
        opts.onAuth(res.nom, credential, res.role);
      }).catch(() => afficherNonAuthentifie("Impossible de contacter le serveur. Réessaie plus tard."));
    }

    function handleCredentialResponse(response) {
      credential = response.credential;
      sessionStorage.setItem("fer_credential", credential);
      verifierSession();
    }

    elBtnDeconnexion.addEventListener("click", function () {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
      }
      afficherNonAuthentifie();
    });

    window.addEventListener("load", function () {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(elGsiButton, { theme: "outline", size: "large", text: "signin_with" });
      }
      verifierSession();
    });
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  return { api, initAuth, toast };
})();
