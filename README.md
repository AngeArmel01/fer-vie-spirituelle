# Hub Vie Spirituelle & Implication — Diaconie FER

Un mini-site à deux pages :
- **Aujourd'hui** — chaque membre se connecte avec son compte Google et coche les activités qu'il a faites, uniquement celles prévues ce jour précis (les règles de planning sont automatiques). Le formulaire regroupe deux catégories : **Vie spirituelle** (prières personnelles) et **Implication diaconie** (Alta, IDP, Foyer de prière, Gethsémani).
- **Rapport** — tableau de bord en direct + version texte prête à coller sur WhatsApp, calculé automatiquement. Trois vues : **un mois précis**, **Taux AG** (1er octobre → 31 mars, mi-parcours avant l'Assemblée Générale), et **Taux annuel** (1er octobre → 31 août, saison complète).

Aucune saisie manuelle dans Excel n'est plus nécessaire une fois que c'est déployé : les membres remplissent eux-mêmes, le rapport se construit tout seul.

**Techniquement** : le site (HTML/CSS/JS) est hébergé gratuitement sur GitHub Pages ; les données sont stockées dans un Google Sheet, lu et écrit par un petit programme (Google Apps Script) qui vérifie que la personne connectée est bien un membre autorisé avant d'accepter quoi que ce soit.

---

## Avant de commencer

Compte à utiliser : ton compte Google personnel (celui que tu utilises déjà pour le suivi actuel). Compte 20 à 30 minutes pour tout mettre en place la première fois — ensuite, plus rien à faire, ça tourne tout seul.

Coche chaque étape au fur et à mesure. Si une étape bloque, dis-moi exactement où et je corrige.

---

## Étape 1 — Créer le Google Sheet (la base de données)

1. Va sur [sheets.google.com](https://sheets.google.com), crée un classeur vide.
2. Renomme-le **`FER — Base Vie Spirituelle`**.
3. Renomme le premier onglet (en bas) en **`Membres`**.
4. Dans la cellule A1 de cet onglet, colle ce tableau (sélectionne A1 puis Ctrl+V — Google Sheets répartit automatiquement les colonnes) :

   Le contenu exact est dans le fichier **`membres-a-importer.csv`** fourni à côté de ce README. Ouvre-le, copie tout, colle dans `Membres!A1`.

   ⚠️ **Complète les adresses manquantes** (marquées `COMPLETER_EMAIL_...`) avant de continuer : Berger Cédric, Marie Élodie, Marie Dominique, Marie Ange, Judicaël, Paul, **et Paul-Élie** (nouveau membre ajouté pour l'année en cours). Sans leur vraie adresse Gmail, ces personnes ne pourront pas se connecter.

   La colonne **Ordre** fixe la position dans le rapport (1 à 9) — laisse-la vide pour les bergers, qui ne sont pas comptés dans le rapport mensuel.

5. Ajoute un second onglet, renomme-le **`Reponses`**.
6. Dans `Reponses!A1`, colle cette ligne d'en-tête (une seule ligne, ne rien mettre en dessous — le site remplira le reste automatiquement) :

   ```
   Date	Email	Nom	UDP06H	UDP12H	UDP15H	UDP18H	AVEMARIA	CHAPELETGA	PRIERESQUOT	ADORATION	JEUNECOMM	JEUNEESTHER	ALTA	IDP	FOYERPRIERE	GETHSEMANI	DerniereMAJ
   ```

✅ **Checkpoint 1** : tu dois avoir un classeur avec deux onglets, `Membres` rempli (emails complétés) et `Reponses` avec juste la ligne d'en-tête.

---

## Étape 2 — Créer les identifiants Google (Client ID OAuth)

C'est ce qui permet le bouton "Se connecter avec Google".

1. Va sur [console.cloud.google.com](https://console.cloud.google.com).
2. En haut, crée un nouveau projet — nomme-le **`FER Vie Spirituelle`** — puis sélectionne-le.
3. Dans le menu ☰ à gauche : **API et services > Écran de consentement OAuth**.
   - Type d'utilisateur : **Externe** → Créer.
   - Nom de l'application : `Hub Vie Spirituelle FER`. E-mail d'assistance : le tien. Enregistrer et continuer sur les écrans suivants (rien à changer) jusqu'à la fin.
   - Une fois créé, va dans l'onglet **Utilisateurs test** (ou "Test users") de cet écran de consentement, et **ajoute l'adresse Gmail de chaque membre** (celles du fichier CSV). C'est obligatoire tant que l'appli n'est pas "publiée" — sans ça, Google refusera la connexion à qui n'est pas dans cette liste. Une appli à 11 utilisateurs comme celle-ci n'a jamais besoin d'être publiée/vérifiée.
4. Toujours dans ☰ : **API et services > Identifiants** → **Créer des identifiants > ID client OAuth**.
   - Type d'application : **Application Web**.
   - Nom : `Hub Vie Spirituelle - Web`.
   - **Origines JavaScript autorisées** : laisse vide pour l'instant, tu reviendras ici à l'étape 6 une fois que tu connaîtras l'adresse de ton site GitHub Pages.
   - Crée. Une fenêtre affiche ton **Client ID** (une longue chaîne finissant par `.apps.googleusercontent.com`) — **copie-la**, tu en as besoin deux fois plus loin.

✅ **Checkpoint 2** : tu as un Client ID du type `123456-abc.apps.googleusercontent.com`, et tous les emails des membres sont dans la liste "Utilisateurs test".

---

## Étape 3 — Brancher le backend (Google Apps Script)

1. Retourne sur ton Google Sheet (`FER — Base Vie Spirituelle`).
2. Menu **Extensions > Apps Script**. Un éditeur de code s'ouvre dans un nouvel onglet.
3. Supprime tout le code par défaut (`function myFunction() {}`), et colle **tout le contenu** du fichier **`apps-script/Code.gs`** fourni.
4. Dans ce code, trouve la fonction `initialiserProprietes()` tout en haut, et remplace `COLLE_ICI_TON_CLIENT_ID...` par le Client ID copié à l'étape 2.
5. En haut de l'éditeur, dans le menu déroulant des fonctions (à côté du bouton ▶ Exécuter), choisis **`initialiserProprietes`**, puis clique **Exécuter**.
   - Google va demander une autorisation la première fois (« Cette application n'est pas vérifiée ») → **Paramètres avancés > Accéder à FER Vie Spirituelle (non sécurisé)** → Autoriser. C'est normal, c'est ton propre script sur ton propre compte.
6. Menu **Déployer > Nouveau déploiement**.
   - Type : **Application Web**.
   - Exécuter en tant que : **Moi**.
   - Qui a accès : **Tout le monde**.
   - Déployer. Autorise à nouveau si demandé.
   - Copie l'**URL** affichée (elle se termine par `/exec`).

✅ **Checkpoint 3** : tu as une URL du type `https://script.google.com/macros/s/AKfycb.../exec`.

---

## Étape 4 — Configurer le site

1. Ouvre le fichier **`assets/config.js`** fourni.
2. Remplace les deux valeurs :
   ```js
   GOOGLE_CLIENT_ID: "TON_CLIENT_ID_DE_L'ÉTAPE_2",
   APPS_SCRIPT_URL: "TON_URL_DE_L'ÉTAPE_3"
   ```
3. Enregistre.

---

## Étape 5 — Publier sur GitHub Pages

1. Crée un nouveau dépôt GitHub, par exemple `fer-vie-spirituelle` (public — GitHub Pages gratuit exige un dépôt public, sauf si tu as GitHub Pro).
2. Mets-y tout le contenu de ce dossier **sauf** `apps-script/` et `membres-a-importer.csv` (ces deux-là sont des documents de travail, pas des fichiers du site — inutile mais pas grave si tu les mets quand même, ce n'est pas sensible).
3. Dans le dépôt : **Settings > Pages**. Source : **Deploy from a branch**, branche `main`, dossier `/root`. Enregistrer.
4. Après 1-2 minutes, ton site est en ligne à une adresse du type :
   `https://TON-PSEUDO.github.io/fer-vie-spirituelle/`

---

## Étape 6 — Autoriser l'adresse du site auprès de Google

1. Retourne dans **Google Cloud Console > API et services > Identifiants**, ouvre ton ID client OAuth de l'étape 2.
2. Dans **Origines JavaScript autorisées**, clique **Ajouter un URI**, colle l'adresse de ton site **sans slash final** :
   `https://TON-PSEUDO.github.io`
3. Enregistrer. (Le changement peut prendre quelques minutes à s'appliquer.)

✅ **Checkpoint final** : ouvre `https://TON-PSEUDO.github.io/fer-vie-spirituelle/`, clique "Se connecter avec Google", connecte-toi avec un compte listé dans `Membres`. Le formulaire du jour doit apparaître avec les bonnes activités.

---

## Gérer les membres ensuite

Tout se passe dans l'onglet **Membres** du Google Sheet — pas besoin de retoucher au code :
- Nouveau membre → ajoute une ligne (Email, Nom, Ordre, `TRUE`), **et** ajoute son email dans la liste "Utilisateurs test" de l'écran de consentement OAuth (étape 2.3).
- Membre qui part / berger à exclure du rapport → mets `FALSE` en colonne Actif, ou vide la colonne Ordre.
- Réordonner le rapport → change les numéros dans la colonne Ordre.

## Règles de planning (rappel, modifiable dans `assets/rules.js` ET `apps-script/Code.gs`)

**Vie spirituelle**

| Activité | Règle |
|---|---|
| Udp 06h / 12h / 15h / 18h | Lundi → Vendredi |
| Ave Maria | Lundi → Vendredi |
| Chapelet GA | Tous les jours |
| Prières quotidiennes | Tous les jours |
| Adoration Eucharistique | Jeudi |
| Jeûne communautaire | Vendredi |
| Jeûne Esther | Dernier mercredi + dernier jeudi + dernier vendredi du mois |

**Implication diaconie**

| Activité | Règle |
|---|---|
| Alta | Chaque dimanche, sauf jour férié (liste dans `JOURS_FERIES_CI`) |
| IDP (Île de Patmos) | Chaque mercredi |
| Foyer de prière | Chaque mardi |
| Gethsémani | Dernier vendredi du mois |

Si une règle change, modifie-la **aux deux endroits** (`assets/rules.js` pour l'affichage du formulaire, `apps-script/Code.gs` pour le calcul du rapport et la sécurité côté serveur) — ce sont volontairement deux copies séparées, l'une ne peut pas appeler l'autre.

⚠️ **`JOURS_FERIES_CI` est à revoir chaque année** (dans les deux fichiers) : les fêtes musulmanes (Aïd el-Fitr, Tabaski, Maouloud, Laylat al-Qadr) suivent le calendrier lunaire et ne sont confirmées officiellement que peu avant la date. Seuls les jours fériés tombant un **dimanche** ont un effet réel sur la règle Alta.

## Taux AG et Taux annuel

- **Taux AG** = taux de participation du **1er octobre au 31 mars** (mi-parcours, avant l'Assemblée Générale). La date de fin (31 mars) est un réglage dans `periodeAnnee()` / `periodeAnnee_()` — à ajuster si la date réelle de l'AG change d'une année sur l'autre.
- **Taux annuel** = taux de participation du **1er octobre au 31 août** (saison complète — le mois d'août est bien inclus).
- Ces deux taux sont calculés **automatiquement** à partir des règles de planning ci-dessus (nombre réel de dimanches, mercredis, etc. sur la période) — plus besoin de mettre à jour un diviseur à la main chaque année, contrairement à l'ancien fichier Excel.
- Chaque carte du rapport affiche aussi une **moyenne par catégorie** (vie spirituelle / implication diaconie) en plus du détail par activité.

### À propos de l'ancien fichier Excel

En reprenant `IMPLICATION_ACTIVITE_PPE2025-2026_Actualisé.xlsx` pour caler ces règles, j'ai repéré que l'onglet `RECAP GLOBAL` affiche des taux ALTA/IDP/Gethsémani à 3 ou 4 chiffres (ex. « 9417% ») : c'est un bug de format Excel (les cellules sources contiennent déjà un pourcentage 0-100, et `RECAP GLOBAL` leur applique un second format `%` qui multiplie par 100 pour l'affichage). Les chiffres sous-jacents sont corrects, seul l'affichage est faux — ça n'affecte pas le nouveau hub, qui recalcule tout proprement.

## En cas de souci

- **"Accès bloqué : cette application n'a pas terminé la procédure de vérification"** → l'email utilisé n'est pas dans la liste "Utilisateurs test" de l'écran de consentement (étape 2.3).
- **Le bouton Google ne s'affiche pas / erreur "origin not allowed"** → l'étape 6 n'est pas faite, ou pas encore propagée (attends 5-10 min).
- **"Cette adresse n'est pas enregistrée comme membre actif"** → l'email n'est pas (ou mal orthographié) dans l'onglet `Membres`, ou `Actif` n'est pas `TRUE`.
- **Rien ne se passe en cliquant Enregistrer** → vérifie `assets/config.js` (Client ID / URL Apps Script bien collés, sans espace).
