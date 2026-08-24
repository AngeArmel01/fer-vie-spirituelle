(function () {
  "use strict";

  const elCarteMois = document.getElementById("carte-mois");
  const elCarteRapport = document.getElementById("carte-rapport");
  const elCarteTexte = document.getElementById("carte-texte");
  const elSelecteurPeriode = document.getElementById("selecteurPeriode");
  const elSelecteurMois = document.getElementById("selecteurMois");
  const elSelecteurSaison = document.getElementById("selecteurSaison");
  const elSelecteurMembre = document.getElementById("selecteurMembre");
  const elBtnActualiser = document.getElementById("btnActualiser");
  const elPeriodeHint = document.getElementById("periodeHint");
  const elListePersonnes = document.getElementById("listePersonnes");
  const elTexteRapport = document.getElementById("texteRapport");
  const elBtnCopier = document.getElementById("btnCopier");

  let credentialCourant = null;

  function peuplerMois() {
    elSelecteurMois.innerHTML = "";
    const maintenant = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const val = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = MOIS_FR[d.getMonth()] + " " + d.getFullYear();
      elSelecteurMois.appendChild(opt);
    }
  }

  /** Une "saison" 2025-2026 est représentée par son année de départ (2025 = octobre 2025). */
  function peuplerSaisons() {
    elSelecteurSaison.innerHTML = "";
    const maintenant = new Date();
    const anneeCouranteDebut = maintenant.getMonth() >= 8 ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
    for (let i = 0; i < 4; i++) {
      const anneeDebut = anneeCouranteDebut - i;
      const opt = document.createElement("option");
      opt.value = anneeDebut;
      opt.textContent = anneeDebut + "-" + (anneeDebut + 1);
      elSelecteurSaison.appendChild(opt);
    }
  }

  function majAffichageSelecteurs() {
    const periode = elSelecteurPeriode.value;
    if (periode === "mois") {
      elSelecteurMois.style.display = "inline-block";
      elSelecteurSaison.style.display = "none";
      elPeriodeHint.textContent = "";
    } else {
      elSelecteurMois.style.display = "none";
      elSelecteurSaison.style.display = "inline-block";
      elPeriodeHint.textContent = periode === "ag"
        ? "Taux calculé du 1er octobre au 31 mars (mi-parcours, avant l'Assemblée Générale)."
        : "Taux calculé du 1er octobre au 31 août (année complète de la diaconie).";
    }
  }

  const LIBELLES_CATEGORIE = { spirituel: "Vie spirituelle", implication: "Implication diaconie" };

  function mettreAJourFiltreMembres(personnes) {
    if (!elSelecteurMembre) return;
    elSelecteurMembre.innerHTML = '<option value="tous">-- Tous les membres (Vue globale) --</option>';
    personnes.forEach((p, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = p.nom;
      elSelecteurMembre.appendChild(opt);
    });
  }

 function filtrerAffichageMembre() {
    if (!elSelecteurMembre) return;
    const val = elSelecteurMembre.value;
    const cartes = elListePersonnes.querySelectorAll(".personne-card");
    cartes.forEach(card => {
      const idx = card.getAttribute("data-index");
      if (val === "tous" || idx === val) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

function rendreRapport(personnes) {
    elListePersonnes.innerHTML = "";

    // 1. Calcul des moyennes générales de la diaconie
    const moyennesGlobales = { spirituel: null, implication: null, activites: {} };
    
    if (personnes.length > 0) {
      let totalSpir = 0, countSpir = 0;
      let totalImp = 0, countImp = 0;

      // Calcul par activité
      ACTIVITES.forEach(a => {
        let somme = 0, nb = 0;
        personnes.forEach(p => {
          const pct = p.activites[a.code];
          if (pct !== null && pct !== undefined) {
            somme += pct;
            nb++;
          }
        });
        moyennesGlobales.activites[a.code] = nb > 0 ? Math.round(somme / nb) : null;
      });

      // Calcul des moyennes globale Spirituel et Implication
      personnes.forEach(p => {
        if (p.moyenneSpirituel !== null) { totalSpir += p.moyenneSpirituel; countSpir++; }
        if (p.moyenneImplication !== null) { totalImp += p.moyenneImplication; countImp++; }
      });
      moyennesGlobales.spirituel = countSpir > 0 ? Math.round(totalSpir / countSpir) : null;
      moyennesGlobales.implication = countImp > 0 ? Math.round(totalImp / countImp) : null;
    }

    // 2. Affichage de la carte "Moyenne Générale Diaconie"
    const carteGlobale = document.createElement("div");
    carteGlobale.className = "personne-card globale-card";
    carteGlobale.setAttribute("data-index", "globale");
    carteGlobale.style.border = "2px solid #8b0000"; // Accentuation visuelle

    let htmlGlobal = '<div class="entete"><span class="nom">📊 MOYENNE GÉNÉRALE DIACONIE</span>' +
      '<span class="moyenne">' +
      'spirituel ' + (moyennesGlobales.spirituel === null ? "—" : moyennesGlobales.spirituel + "%") +
      ' · implication ' + (moyennesGlobales.implication === null ? "—" : moyennesGlobales.implication + "%") +
      '</span></div>';

    ["spirituel", "implication"].forEach(cat => {
      const activitesCat = ACTIVITES.filter(a => a.categorie === cat);
      if (!activitesCat.length) return;
      htmlGlobal += '<div class="groupe-titre">' + (LIBELLES_CATEGORIE[cat] || cat) + '</div>';
      activitesCat.forEach(a => {
        const pct = moyennesGlobales.activites[a.code];
        const na = pct === null;
        htmlGlobal += '<div class="activite-row' + (na ? " na" : "") + '">' +
          '<div class="nom-act">' + a.label + '</div>' +
          '<div class="pct">' + (na ? "n/a" : pct + "%") + '</div>' +
          '<div class="barre"><div class="barre-inner" style="width:' + (na ? 0 : pct) + '%"></div></div>' +
          '</div>';
      });
    });

    carteGlobale.innerHTML = htmlGlobal;
    elListePersonnes.appendChild(carteGlobale);

    // 3. Affichage des cartes individuelles par membre
    personnes.forEach((p, index) => {
      const card = document.createElement("div");
      card.className = "personne-card";
      card.setAttribute("data-index", index);

      let html = '<div class="entete"><span class="nom">' + p.nom + '</span>' +
        '<span class="moyenne">' +
        'spirituel ' + (p.moyenneSpirituel === null ? "—" : p.moyenneSpirituel + "%") +
        ' · implication ' + (p.moyenneImplication === null ? "—" : p.moyenneImplication + "%") +
        '</span></div>';

      ["spirituel", "implication"].forEach(cat => {
        const activitesCat = ACTIVITES.filter(a => a.categorie === cat);
        if (!activitesCat.length) return;
        html += '<div class="groupe-titre">' + (LIBELLES_CATEGORIE[cat] || cat) + '</div>';
        activitesCat.forEach(a => {
          const pct = p.activites[a.code];
          const na = pct === null;
          html += '<div class="activite-row' + (na ? " na" : "") + '">' +
            '<div class="nom-act">' + a.label + '</div>' +
            '<div class="pct">' + (na ? "n/a" : pct + "%") + '</div>' +
            '<div class="barre"><div class="barre-inner" style="width:' + (na ? 0 : pct) + '%"></div></div>' +
            '</div>';
        });
      });

      card.innerHTML = html;
      elListePersonnes.appendChild(card);
    });

    mettreAJourFiltreMembres(personnes);
    filtrerAffichageMembre();

    elTexteRapport.textContent = genererTexte(personnes);
    elCarteRapport.style.display = "block";
    elCarteTexte.style.display = "block";
  }

  function genererTexte(personnes) {
    const lignes = [];
    personnes.forEach((p, i) => {
      lignes.push((i + 1) + "- " + p.nom);
      lignes.push("");
      ACTIVITES.forEach(a => {
        const pct = p.activites[a.code];
        const txt = pct === null ? "n/a" : String(Math.max(0, Math.min(100, pct))).padStart(2, "0") + "%";
        lignes.push(a.label + " : " + txt);
      });
      lignes.push("Moyenne vie spirituelle : " + (p.moyenneSpirituel === null ? "n/a" : p.moyenneSpirituel + "%"));
      lignes.push("Moyenne implication diaconie : " + (p.moyenneImplication === null ? "n/a" : p.moyenneImplication + "%"));
      lignes.push("");
      lignes.push("");
    });
    return lignes.join("\n").replace(/\n{3,}$/, "\n");
  }

  function chargerRapport() {
    const periode = elSelecteurPeriode.value;
    elListePersonnes.innerHTML = '<p class="hint">Chargement…</p>';

    const params = { action: "rapport", credential: credentialCourant, periode };
    if (periode === "mois") params.mois = elSelecteurMois.value;
    else params.annee = elSelecteurSaison.value;

    FER.api.get(params).then(res => {
      if (!res.ok) { elListePersonnes.innerHTML = '<p class="hint">' + (res.erreur || "Erreur de chargement.") + '</p>'; return; }
      rendreRapport(res.rapport);
    }).catch(() => {
      elListePersonnes.innerHTML = '<p class="hint">Impossible de contacter le serveur.</p>';
    });
  }

  if (elSelecteurMembre) {
    elSelecteurMembre.addEventListener("change", filtrerAffichageMembre);
  }

  elBtnActualiser.addEventListener("click", chargerRapport);
  elSelecteurMois.addEventListener("change", chargerRapport);
  elSelecteurSaison.addEventListener("change", chargerRapport);
  elSelecteurPeriode.addEventListener("change", function () {
    majAffichageSelecteurs();
    chargerRapport();
  });

  elBtnCopier.addEventListener("click", function () {
    const texte = elTexteRapport.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(() => FER.toast("Rapport copié ✓"));
    } else {
      const ta = document.createElement("textarea");
      ta.value = texte;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      FER.toast("Rapport copié ✓");
    }
  });

  peuplerMois();
  peuplerSaisons();
  majAffichageSelecteurs();

  FER.initAuth({
    onAuth: function (nom, credential) {
      credentialCourant = credential;
      elCarteMois.style.display = "block";
      chargerRapport();
    },
    onSignOut: function () {
      elCarteMois.style.display = "none";
      elCarteRapport.style.display = "none";
      elCarteTexte.style.display = "none";
    }
  });
})();
