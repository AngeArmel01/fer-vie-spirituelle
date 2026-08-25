(function () {
  "use strict";

  const elCarteNouvelEvt = document.getElementById("carte-nouvel-evenement");
  const elCarteEvenements = document.getElementById("carte-evenements");
  const elNouveauNom = document.getElementById("nouveauNom");
  const elNouvelleCategorie = document.getElementById("nouvelleCategorie");
  const elNouvelleDate = document.getElementById("nouvelleDate");
  const elBtnCreer = document.getElementById("btnCreerEvenement");
  const elMsgCreationSucces = document.getElementById("msgCreationSucces");
  const elMsgCreationErreur = document.getElementById("msgCreationErreur");
  const elListeEvenements = document.getElementById("listeEvenements");
  const elEtatVide = document.getElementById("etatVideEvenements");

  let credentialCourant = null;

  function peuplerCategories() {
    elNouvelleCategorie.innerHTML = "";
    CATEGORIES_EVENEMENTS.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.code;
      opt.textContent = c.label;
      elNouvelleCategorie.appendChild(opt);
    });
  }

  function formatDateAffiche(dateStr) {
    const d = dateDepuisChaine(dateStr);
    const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return jours[d.getDay()] + " " + d.getDate() + " " + MOIS_FR[d.getMonth()].toLowerCase() + " " + d.getFullYear();
  }

  function chargerEvenements() {
    elListeEvenements.innerHTML = '<p class="hint">Chargement…</p>';
    FER.api.get({ action: "evenements", credential: credentialCourant, limite: 80 }).then(res => {
      if (!res.ok) { elListeEvenements.innerHTML = ""; elEtatVide.style.display = "block"; return; }
      rendreEvenements(res.evenements);
    }).catch(() => {
      elListeEvenements.innerHTML = '<p class="hint">Impossible de contacter le serveur.</p>';
    });
  }

  function rendreEvenements(evenements) {
    elListeEvenements.innerHTML = "";
    if (!evenements.length) {
      elEtatVide.style.display = "block";
      return;
    }
    elEtatVide.style.display = "none";

    const aujourdHui = chaineDepuisDate(new Date());

    evenements.forEach(ev => {
      const estFutur = ev.date > aujourdHui;
      const row = document.createElement("div");
      row.className = "activite-item" + (ev.present ? " checked" : "") + (estFutur ? " disabled" : "");
      row.innerHTML =
        '<span class="label">' + ev.nom +
        '<span class="sub">' + ev.label + ' · ' + formatDateAffiche(ev.date) + (estFutur ? " · à venir" : "") + '</span>' +
        '</span><span class="toggle">✓</span>';

      if (!estFutur) {
        row.addEventListener("click", function () {
          const nouveauPresent = !row.classList.contains("checked");
          row.classList.toggle("checked", nouveauPresent);
          FER.api.post({ credential: credentialCourant, type: "evenement_presence", evenementId: ev.id, present: nouveauPresent })
            .then(res => {
              if (!res.ok) {
                row.classList.toggle("checked", !nouveauPresent); // annule visuellement
                FER.toast(res.erreur || "Échec de l'enregistrement.");
              } else {
                FER.toast(nouveauPresent ? "Présence enregistrée ✓" : "Présence retirée");
              }
            })
            .catch(() => {
              row.classList.toggle("checked", !nouveauPresent);
              FER.toast("Impossible de contacter le serveur.");
            });
        });
      }

      elListeEvenements.appendChild(row);
    });
  }

  elBtnCreer.addEventListener("click", function () {
    elMsgCreationSucces.classList.remove("show");
    elMsgCreationErreur.classList.remove("show");

    const nom = elNouveauNom.value.trim();
    const categorie = elNouvelleCategorie.value;
    const date = elNouvelleDate.value;
    if (!nom || !date) {
      elMsgCreationErreur.textContent = "Merci de renseigner un nom et une date.";
      elMsgCreationErreur.classList.add("show");
      return;
    }

    elBtnCreer.disabled = true;
    FER.api.post({ credential: credentialCourant, type: "evenement_creer", nom, categorie, date }).then(res => {
      elBtnCreer.disabled = false;
      if (!res.ok) { elMsgCreationErreur.textContent = res.erreur || "Échec de la création."; elMsgCreationErreur.classList.add("show"); return; }
      elMsgCreationSucces.classList.add("show");
      elNouveauNom.value = "";
      elNouvelleDate.value = "";
      chargerEvenements();
    }).catch(() => {
      elBtnCreer.disabled = false;
      elMsgCreationErreur.textContent = "Impossible de contacter le serveur.";
      elMsgCreationErreur.classList.add("show");
    });
  });

  peuplerCategories();

  FER.initAuth({
    onAuth: function (nom, credential, role) {
      credentialCourant = credential;
      elCarteEvenements.style.display = "block";
      if (role === "Berger") elCarteNouvelEvt.style.display = "block";
      chargerEvenements();
    },
    onSignOut: function () {
      elCarteEvenements.style.display = "none";
      elCarteNouvelEvt.style.display = "none";
    }
  });
})();
