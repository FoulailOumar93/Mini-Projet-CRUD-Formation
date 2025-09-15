# 🎓 Mini Projet CRUD – Centre de formation

Application fullstack (⚛️ React + 🟢 Node.js + 🟣 Supabase) permettant :

---

## 👤 Côté Candidat

- Postuler à une **formation** avec :
  - CV (obligatoire)
  - Lettre de motivation (obligatoire)
  - Message facultatif
  - Choix de la session de formation
- Suivre l’état de sa candidature :
  - En attente
  - Acceptée
  - Refusée
- Recevoir un message personnalisé si sa candidature est acceptée ou refusée

---

## ⚙️ Côté Admin

- Ajouter, modifier et supprimer des **formations**
- Voir toutes les **candidatures reçues**
- Télécharger le **CV** et la **lettre de motivation** envoyés par le candidat
- Accepter ou refuser les candidatures
- Quand une candidature est acceptée :
  - Le candidat est automatiquement ajouté à la section **Élèves**
- Chercher les élèves par :
  - Nom
  - Email
  - Téléphone
  - Âge
- Exporter la liste des élèves en **PDF**

---

## 🛠️ Technologies utilisées

- ⚛️ **React** — Interface utilisateur
- 🟢 **Node.js / Express** — API backend
- 🟣 **Supabase** — Base de données et stockage de fichiers (CV + lettres)
- 💅 **CSS** — Interface responsive en mode sombre / clair

---

## 📁 Structure du projet

Mini-Projet-CRUD-Formation/
│
├── Client/ # Frontend React
│ ├── src/
│ │ ├── pages/
│ │ │ ├── CandidatePage.jsx
│ │ │ ├── AdminPage.jsx
│ │ ├── App.jsx
│ │ ├── styles.css
│ │ └── ...
│ └── ...
│
├── Server/ # Backend Node.js + Express
│ ├── index.js
│ └── ...
│
├── .env # Variables d'environnement locales
├── README.md
└── ...


---

## ⚡ Installation locale

```bash
# Cloner le projet
git clone https://github.com/FoulailOumar93/Mini-Projet-CRUD-Formation.git

# Installer les dépendances
cd Client
npm install
cd ../Server
npm install

# Créer un fichier .env dans /Server
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
SUPABASE_RESUMES_BUCKET=resumes

# Lancer le serveur backend
npm run dev

# Dans un autre terminal, lancer le client React
cd ../Client
npm run dev

📅 Auteur

Foulail Oumar
Mini projet réalisé dans le cadre d’une demande de stage (du 22 septembre 2025 au 17 novembre 2025) à l’école O'Clock.
