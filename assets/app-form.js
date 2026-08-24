(function () {
  "use strict";

  const JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const elCarteFormulaire = document.getElementById("carte-formulaire");
  const elDate = document.getElementById("selecteurDate");
  const elBadgeJour = document.getElementById("badgeJour");
  const elListe = document.getElementById("listeActivites");
  const elEtatVide = document.getElementById("etatVide");
  const elBtnEnregistrer = document.getElementById("btnEnregistrer");
  const elMsgSucces = document.getElementById("msgSucces");
  const elMsgErreur = document.getElementById("msgErreur");

  let credentialCourant = null;
  let activitesCourantes = []; // [{code,label,fait}]

  function formatDateAffiche(dateStr) {
    return JOURS_FR[dateDepuisChaine(dateStr).getDay()];
  }

  function chargerJour() {
    const dateStr = elDate.value;
    elBadgeJour.textContent = formatDateAffiche(dateStr);
    elListe.innerHTML = "";
    elEtatVide.style.display = "none";
    elBtnEnregistrer.disabled = true;
    elMsgSucces.classList.remove("show");
    elMsgErreur.classList.remove("show");

    FER.api.get({ action: "jour", credential: credentialCourant, date: dateStr }).then(res => {
      if (!res.ok) { elMsgErreur.textContent = res.erreur || "Erreur de chargement."; elMsgErreur.classList.add("show"); return; }
      activitesCourantes = res.activitesPrevues.map(a => ({
        code: a.code,
        label: a.label,
        categorie: a.categorie,
        fait: !!res.valeursExistantes[a.code]
      }));
      rendreListe();
      elBtnEnregistrer.disabled = activitesCourantes.length === 0;
    }).catch(() => {
      elMsgErreur.textContent = "Impossible de contacter le serveur.";
      elMsgErreur.classList.add("show");
    });
  }

  const LIBELLES_CATEGORIE = { spirituel: "Vie spirituelle", implication: "Implication diaconie" };

  function rendreListe() {
    elListe.innerHTML = "";
    if (activitesCourantes.length === 0) {
      elEtatVide.style.display = "block";
      return;
    }
    elEtatVide.style.display = "none";

    ["spirituel", "implication"].forEach(cat => {
      const items = activitesCourantes
        .map((act, i) => ({ act, i }))
        .filter(x => x.act.categorie === cat);
      if (items.length === 0) return;

      const titre = document.createElement("div");
      titre.className = "groupe-titre";
      titre.textContent = LIBELLES_CATEGORIE[cat] || cat;
      elListe.appendChild(titre);

      items.forEach(({ act, i }) => {
        const row = document.createElement("div");
        row.className = "activite-item" + (act.fait ? " checked" : "");
        row.innerHTML = '<span class="label">' + act.label + '</span><span class="toggle">✓</span>';
        row.addEventListener("click", function () {
          activitesCourantes[i].fait = !activitesCourantes[i].fait;
          row.classList.toggle("checked", activitesCourantes[i].fait);
        });
        elListe.appendChild(row);
      });
    });
  }

  elDate.addEventListener("change", chargerJour);

  elBtnEnregistrer.addEventListener("click", function () {
    elBtnEnregistrer.disabled = true;
    elMsgSucces.classList.remove("show");
    elMsgErreur.classList.remove("show");

    const activites = {};
    activitesCourantes.forEach(a => { activites[a.code] = a.fait; });

    FER.api.post({ credential: credentialCourant, date: elDate.value, activites }).then(res => {
      elBtnEnregistrer.disabled = false;
      if (!res.ok) { elMsgErreur.textContent = res.erreur || "Échec de l'enregistrement."; elMsgErreur.classList.add("show"); return; }
      elMsgSucces.classList.add("show");
    }).catch(() => {
      elBtnEnregistrer.disabled = false;
      elMsgErreur.textContent = "Impossible de contacter le serveur.";
      elMsgErreur.classList.add("show");
    });
  });

  const aujourdHui = chaineDepuisDate(new Date());
  elDate.value = aujourdHui;
  elDate.max = aujourdHui;

  FER.initAuth({
    onAuth: function (nom, credential) {
      credentialCourant = credential;
      elCarteFormulaire.style.display = "block";
      chargerJour();
    },
    onSignOut: function () {
      elCarteFormulaire.style.display = "none";
    }
  });
})();
