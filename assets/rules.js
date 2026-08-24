/**
 * rules.js — Règles de planification des activités de la diaconie FER.
 *
 * C'est la SOURCE UNIQUE DE VÉRITÉ pour "quelle activité est prévue quel jour".
 * Le même raisonnement est reproduit côté serveur (Apps Script, fichier Code.gs)
 * pour que le calcul du rapport soit fiable même si quelqu'un bidouille le
 * formulaire côté navigateur. Si tu changes une règle ici, reporte le même
 * changement dans Code.gs (fonction estActivitePrevue).
 */

const ACTIVITES = [
  // ---- Vie spirituelle personnelle ----
  { code: "UDP06H",      label: "Udp 06h",                 regle: "LUN_VEN",      categorie: "spirituel" },
  { code: "UDP12H",      label: "Udp 12h",                 regle: "LUN_VEN",      categorie: "spirituel" },
  { code: "UDP15H",      label: "Udp 15h",                 regle: "LUN_VEN",      categorie: "spirituel" },
  { code: "UDP18H",      label: "Udp 18h",                 regle: "LUN_VEN",      categorie: "spirituel" },
  { code: "AVEMARIA",    label: "Ave Maria",               regle: "LUN_VEN",      categorie: "spirituel" },
  { code: "CHAPELETGA",  label: "Chapelet GA",             regle: "TOUS_JOURS",   categorie: "spirituel" },
  { code: "PRIERESQUOT", label: "Prières quotidiennes",    regle: "TOUS_JOURS",   categorie: "spirituel" },
  { code: "ADORATION",   label: "Adoration Eucharistique", regle: "JEUDI",        categorie: "spirituel" },
  { code: "JEUNECOMM",   label: "Jeûne communautaire",     regle: "VENDREDI",     categorie: "spirituel" },
  { code: "JEUNEESTHER", label: "Jeûne Esther",            regle: "ESTHER",       categorie: "spirituel" },

  // ---- Implication dans les activités de la diaconie ----
  { code: "ALTA",         label: "Alta",                     regle: "DIMANCHE_FERIE",   categorie: "implication" },
  { code: "IDP",          label: "IDP (Île de Patmos)",       regle: "MERCREDI",         categorie: "implication" },
  { code: "FOYERPRIERE",  label: "Foyer de prière",          regle: "MARDI",            categorie: "implication" },
  { code: "GETHSEMANI",   label: "Gethsémani",               regle: "DERNIER_VENDREDI", categorie: "implication" }
];

/**
 * Jours fériés officiels de Côte d'Ivoire pertinents pour la règle ALTA
 * (Alta = chaque dimanche SAUF si ce dimanche est un jour férié).
 * ⚠️ À METTRE À JOUR chaque année : les fêtes musulmanes (Aïd el-Fitr, Tabaski,
 * Maouloud, Laylat al-Qadr) dépendent du calendrier lunaire et ne sont
 * confirmées officiellement que peu de temps avant. Seules les dates tombant
 * un dimanche ont un impact réel sur la règle Alta — les autres sont listées
 * ici à titre de référence complète.
 */
const JOURS_FERIES_CI = [
  "2025-11-01", // Toussaint 2025 (samedi — sans impact, gardé pour référence)
  "2025-11-15", // Journée de la Paix 2025 (samedi)
  "2025-12-25", // Noël 2025 (jeudi)
  "2026-01-01", // Jour de l'an 2026 (jeudi)
  "2026-03-16", // Lendemain Laylat al-Qadr 2026 (lundi)
  "2026-03-19", // Aïd el-Fitr 2026 (jeudi)
  "2026-03-20", // Aïd el-Fitr 2026 (vendredi)
  "2026-04-06", // Lundi de Pâques 2026
  "2026-05-01", // Fête du Travail 2026 (vendredi)
  "2026-05-14", // Ascension 2026 (jeudi)
  "2026-05-25", // Lundi de Pentecôte 2026
  "2026-05-26", // Tabaski / Aïd El Kebir 2026 (mardi)
  "2026-08-07", // Fête Nationale 2026 (vendredi)
  "2026-08-15"  // Assomption 2026 (samedi)
];

function estJourFerie(date) {
  return JOURS_FERIES_CI.indexOf(chaineDepuisDate(date)) !== -1;
}

/** Renvoie une date locale (sans heure) à partir d'une chaîne "YYYY-MM-DD". */
function dateDepuisChaine(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function chaineDepuisDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

/** Dernier jour du mois (date) dont le jour de semaine JS (0=dim..6=sam) === weekday, pour le mois de refDate. */
function dernierJourSemaineDuMois(refDate, weekdayJs) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const dernierJourDuMois = new Date(y, m + 1, 0); // dernier jour calendaire du mois
  const decalage = (dernierJourDuMois.getDay() - weekdayJs + 7) % 7;
  const jour = new Date(y, m, dernierJourDuMois.getDate() - decalage);
  return jour;
}

/**
 * Détermine si une activité est prévue à une date donnée.
 * @param {string} code - code de l'activité (voir ACTIVITES)
 * @param {Date} date - date locale (sans heure)
 */
function estActivitePrevue(code, date) {
  const jsDay = date.getDay(); // 0=dimanche .. 6=samedi
  const activite = ACTIVITES.find(a => a.code === code);
  if (!activite) return false;

  switch (activite.regle) {
    case "LUN_VEN":
      return jsDay >= 1 && jsDay <= 5;
    case "TOUS_JOURS":
      return true;
    case "MARDI":
      return jsDay === 2;
    case "MERCREDI":
      return jsDay === 3;
    case "JEUDI":
      return jsDay === 4;
    case "VENDREDI":
      return jsDay === 5;
    case "DIMANCHE_FERIE":
      return jsDay === 0 && !estJourFerie(date);
    case "DERNIER_VENDREDI": {
      const dVen = dernierJourSemaineDuMois(date, 5);
      return chaineDepuisDate(dVen) === chaineDepuisDate(date);
    }
    case "ESTHER": {
      const dMer = dernierJourSemaineDuMois(date, 3); // mercredi
      const dJeu = dernierJourSemaineDuMois(date, 4); // jeudi
      const dVen = dernierJourSemaineDuMois(date, 5); // vendredi
      const cible = chaineDepuisDate(date);
      return [dMer, dJeu, dVen].some(d => chaineDepuisDate(d) === cible);
    }
    default:
      return false;
  }
}

/** Renvoie la liste des activités (objets ACTIVITES) prévues à une date donnée. */
function activitesPrevuesA(date) {
  return ACTIVITES.filter(a => estActivitePrevue(a.code, date));
}

/** Renvoie tous les jours (Date) prévus pour une activité donnée, dans un mois calendaire (year, monthIndex0). */
function joursPrevusDansLeMois(code, year, monthIndex0) {
  const jours = [];
  const nbJours = new Date(year, monthIndex0 + 1, 0).getDate();
  for (let j = 1; j <= nbJours; j++) {
    const d = new Date(year, monthIndex0, j);
    if (estActivitePrevue(code, d)) jours.push(d);
  }
  return jours;
}

/** Renvoie tous les jours (Date) prévus pour une activité entre deux dates incluses. */
function joursPrevusEntre(code, dateDebut, dateFin) {
  const jours = [];
  const cur = new Date(dateDebut.getFullYear(), dateDebut.getMonth(), dateDebut.getDate());
  const fin = new Date(dateFin.getFullYear(), dateFin.getMonth(), dateFin.getDate());
  while (cur.getTime() <= fin.getTime()) {
    if (estActivitePrevue(code, cur)) jours.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return jours;
}

/**
 * L'"année" de la diaconie va d'octobre à août (voir README). "anneeDebut" est
 * l'année civile du mois d'octobre de départ (ex: 2025 pour la saison 2025-2026).
 *   - période "AG"     : 1er octobre → 31 mars   (à ajuster si la date réelle de l'AG change)
 *   - période "ANNUEL" : 1er octobre → 31 août
 */
function periodeAnnee(anneeDebut, type) {
  const debut = new Date(anneeDebut, 9, 1); // 1er octobre
  const fin = type === "ag" ? new Date(anneeDebut + 1, 2, 31) : new Date(anneeDebut + 1, 7, 31);
  return { debut, fin };
}

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

if (typeof module !== "undefined") {
  module.exports = {
    ACTIVITES, MOIS_FR, JOURS_FERIES_CI,
    dateDepuisChaine, chaineDepuisDate, dernierJourSemaineDuMois, estJourFerie,
    estActivitePrevue, activitesPrevuesA, joursPrevusDansLeMois, joursPrevusEntre,
    periodeAnnee
  };
}
