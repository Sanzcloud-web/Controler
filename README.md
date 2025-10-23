# 📺 Video Remote Controller

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://typescriptlang.org)
[![macOS](https://img.shields.io/badge/macOS-10.13+-lightgrey.svg)](https://apple.com/macos)

Contrôleur multimédia à distance pour macOS utilisant Python, React et WebSocket. Contrôlez vos vidéos, votre souris et naviguez dans vos épisodes depuis votre téléphone sur le même réseau WiFi.

## ✨ Fonctionnalités

### 🎬 Contrôle Multimédia
- **Lecture/Pause** - Contrôle instantané de la lecture
- **Volume** - Réglage précis avec indicateur temps réel
- **Navigation** - Avance/Recule de 10 secondes
- **Plein écran** - Basculement rapide
- **Navigation d'épisodes** - Passage au suivant/précédent

### 🖱️ Contrôle de la Souris
- **Mouvement** - Joystick virtuel pour déplacer le curseur
- **Clics** - Clic gauche/droit à distance
- **Précision** - Contrôle fluide et réactif

### 📱 Interface Utilisateur
- **Design Responsive** - Adapté mobile et desktop
- **QR Code** - Connexion instantanée par scan
- **Statut en temps réel** - Indicateur de connexion WebSocket
- **Interface moderne** - Design épuré avec Tailwind CSS

## 🏗️ Architecture

### Stack Technique

**Frontend**
- ⚛️ **React 18** - Interface utilisateur moderne
- 🔷 **TypeScript** - Développement typé et robuste
- ⚡ **Vite** - Build tool ultra-rapide
- 🎨 **Tailwind CSS** - Styling utility-first
- 📱 **React Joystick** - Contrôle souris tactile

**Backend**
- 🐍 **Python 3.7+** - Serveur backend asynchrone
- 🌐 **aiohttp** - Framework HTTP/WebSocket performant
- 🤖 **PyAutoGUI** - Contrôle système automatisé
- 🍎 **AppleScript** - Intégration macOS native

### Flux de Communication

```
┌─────────────┐    WebSocket     ┌─────────────┐
│   Frontend  │◄──────────────►│   Backend   │
│   (React)   │   (port 8080)   │   (Python)  │
└─────────────┘                 └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │   macOS     │
                               │ AppleScript │
                               └─────────────┘
```

1. **Serveur Python** démarre sur le Mac (port 8080)
2. **Interface React** se charge et établit la connexion WebSocket
3. **Volume actuel** récupéré et synchronisé automatiquement
4. **Commandes utilisateur** → **Serveur Python** → **macOS** via AppleScript
5. **Retour temps réel** des actions effectuées

## 🚀 Installation

### Prérequis Système

- **macOS 10.13+**
- **Python 3.7+**
- **Node.js 16+**

### Installation Rapide

#### 1. Backend Python
```bash
cd server
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# ou : venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

#### 2. Frontend React
```bash
npm install
```

#### 3. Build du frontend (optionnel)
```bash
npm run build
```

## 🎯 Utilisation

### Démarrage du Serveur

```bash
# Depuis la racine du projet
npm run server

# Ou directement
cd server
python3 server.py
```

Le serveur affichera :
```
╔════════════════════════════════════════════════════════════╗
║      📺 Video Remote Controller Server (aiohttp)          ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://192.168.1.x:8080
🔌 WebSocket on: ws://192.168.1.x:8080/ws

📱 On your phone:
   1. Open browser
   2. Go to: http://192.168.1.x:8080
   3. Make sure you're on the same WiFi!

Press Ctrl+C to stop the server
```

### 📱 Connexion depuis votre Téléphone

1. Assurez-vous d'être sur le **même WiFi** que votre Mac
2. Ouvrez votre navigateur mobile
3. Entrez l'URL affichée par le serveur
4. OU scannez le QR code affiché sur la page d'accueil

#### 💻 Développement Frontend
```bash
npm run dev      # Démarre Vite dev server (http://localhost:5173)
npm run build    # Build pour production
npm run preview  # Aperçu du build production
```

#### 🔧 Développement Backend
```bash
cd server
python3 server.py  # Démarrage direct
# ou avec environnement virtuel
source venv/bin/activate
python3 server.py
```

## ⚙️ Configuration

### Modification du Port

Éditez `server/server.py` :

```python
PORT = 8080  # Changez ce nombre
```

### Commandes Supportées

#### 🎬 Contrôles Multimédia
| Commande | Description | Raccourci macOS |
|----------|-------------|-----------------|
| `togglePlayPause` | Lecture/Pause | `Espace` |
| `setVolume` | Règle le volume (0-100) | - |
| `skipForward` | Avance de 10s | `Shift+→` |
| `skipBackward` | Recule de 10s | `Shift+←` |
| `fullscreen` | Plein écran | `F` |
| `nextEpisode` | Épisode suivant | Script personnalisé |
| `prevEpisode` | Épisode précédent | Script personnalisé |

#### 🖱️ Contrôles Souris
| Commande | Description | Action |
|----------|-------------|---------|
| `moveMouse` | Déplacement | `dx, dy` (coordonnées relatives) |
| `mouseLeftClick` | Clic gauche | Simulation clic |
| `mouseRightClick` | Clic droit | Simulation clic droit |
| `resetMouse` | Reset position | Remet au centre |

### 🔊 Gestion du Volume

Le serveur Python assure :
- ✅ **Récupération** du volume actuel au démarrage
- ✅ **Synchronisation** temps réel via WebSocket
- ✅ **Contrôle** précis via `setVolume` (0-100)
- ✅ **Persistance** des modifications système

## 📁 Structure du Projet

```
video-remote-controller/
│
├── 📂 src/                          # Frontend React/TypeScript
│   ├── App.tsx                      # Point d'entrée principal
│   ├── main.tsx                     # Montage React
│   ├── index.css                    # Styles globaux Tailwind
│   └── 📂 components/
│       ├── Home.tsx                 # Page d'accueil
│       ├── VideoController.tsx      # Interface de contrôle multimédia
│       ├── MouseController.tsx      # Contrôleur souris tactile
│       └── Settings.tsx             # Paramètres (futur)
│
├── 📂 server/                       # Backend Python
│   ├── server.py                    # Serveur WebSocket aiohttp
│   ├── requirements.txt              # Dépendances Python
│   └── 📂 venv/                     # Environnement virtuel Python
│
├── 📂 public/
│   └── video.html                   # Lecteur vidéo intégré (optionnel)
│
├── 📂 dist/                         # Build frontend (généré)
│   ├── index.html                   # Version production
│   └── 📂 assets/                   # CSS/JS minifiés
│
├── ⚙️ Configuration
│   ├── tailwind.config.js           # Configuration Tailwind CSS
│   ├── vite.config.ts               # Configuration Vite
│   ├── tsconfig.json                # Configuration TypeScript
│   └── package.json                 # Dépendances Node.js
│
└── 📚 Documentation
    ├── README.md                    # Ce fichier
    ├── ARCHITECTURE.md              # Documentation architecture
    └── docs/                        # Documentation détaillée
```

## 🔧 Dépannage

### ❌ Problèmes de Connexion

1. **Vérification réseau**
   - ✅ Mac et téléphone sur le **même WiFi**
   - ✅ Test d'accès : `http://localhost:8080` depuis le Mac
   - ✅ Vérification IP : doit être `192.168.x.x` ou `10.x.x.x`

2. **Pare-feu macOS**
   ```bash
   # Vérifier le port 8080
   sudo lsof -i :8080
   # Autoriser Python dans le pare-feu si nécessaire
   ```

3. **Redémarrage du serveur**
   ```bash
   # Arrêter avec Ctrl+C et redémarrer
   cd server && python3 server.py
   ```

### ❌ Serveur Python ne Démarre Pas

1. **Port occupé**
   ```bash
   lsof -i :8080  # Voir quel processus utilise le port
   kill -9 <PID>   # Tuer le processus si nécessaire
   ```

2. **Dépendances manquantes**
   ```bash
   cd server
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Version Python**
   ```bash
   python3 --version  # Doit être 3.7+
   ```

### ❌ Volume Incorrect

1. **Test manuel**
   ```bash
   osascript -e "output volume of (get volume settings)"
   ```

2. **Logs serveur**
   ```bash
   cd server && python3 server.py  # Vérifier les logs
   ```

3. **Rechargez l'interface**
   - Actualisez la page web
   - Vérifiez l'indicateur WebSocket (doit être vert)

### ❌ WebSocket Déconnecté

- 🔴 **Icône rouge** = connexion perdue
- 🔄 **Rechargez** la page pour reconnecter
- 🔍 **Vérifiez** que le serveur Python est actif

## 🛠️ Stack Technologique

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0.7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?logo=tailwind-css)

**Dépendances principales :**
- ⚛️ **React 18** - Interface utilisateur moderne et réactive
- 🔷 **TypeScript** - Développement typé et maintenable
- ⚡ **Vite** - Build tool ultra-rapide (50x plus rapide que Create React App)
- 🎨 **Tailwind CSS** - Framework CSS utility-first
- 📱 **React Joystick Component** - Contrôle souris tactile
- 📊 **Lucide React** - Icônes SVG modernes
- 🔲 **QRCode.react** - Génération de QR codes

### Backend
![Python](https://img.shields.io/badge/Python-3.7+-3776AB?logo=python)
![aiohttp](https://img.shields.io/badge/aiohttp-3.9.1-FF6B6B)
![WebSocket](https://img.shields.io/badge/WebSocket-Live-FF6B6B)
![PyAutoGUI](https://img.shields.io/badge/PyAutoGUI-0.9.53-3776AB)

**Technologies serveur :**
- 🐍 **Python 3.7+** - Langage backend robuste
- 🌐 **aiohttp** - Framework HTTP/WebSocket asynchrone haute performance
- 🔌 **WebSocket** - Communication temps réel bidirectionnelle
- 🤖 **PyAutoGUI** - Automatisation des interactions système
- 🍎 **AppleScript** - Intégration native macOS

### Outils de Développement
![Node.js](https://img.shields.io/badge/Node.js-16+-339933?logo=node.js)
![npm](https://img.shields.io/badge/npm-9.0.0-CB3837?logo=npm)
![macOS](https://img.shields.io/badge/macOS-10.13+-000000?logo=apple)

## 🔒 Sécurité

⚠️ **⚠️ IMPORTANT : Usage local uniquement ⚠️**

Ce projet est **uniquement destiné à un usage personnel sur votre réseau privé** :

### ❌ À éviter
- 🚫 **Exposition sur Internet** - Ne configurez pas le port forwarding
- 🚫 **Réseaux publics** - WiFi d'hôtels, cafés, etc.
- 🚫 **DMZ** - Ne placez pas le serveur en zone démilitarisée

### ✅ Recommandations de sécurité
- 🔐 **Pare-feu** - Autorisez uniquement le port 8080 en local
- 🏠 **Réseau domestique** - Utilisez uniquement sur votre WiFi personnel
- 🔄 **Mises à jour** - Maintenez Python et Node.js à jour

### 🔮 Améliorations de sécurité futures
- 🔑 Authentification par token
- 🔒 HTTPS/WSS avec certificats auto-signés
- 👥 Contrôle d'accès multi-utilisateurs
- 🔐 Chiffrement des communications

## 🚀 Améliorations Possibles

- [ ] **Application mobile native** (iOS/Android)
- [ ] **Support Windows/Linux** (extension PyAutoGUI)
- [ ] **Interface multi-écrans** (contrôle plusieurs Macs)
- [ ] **Macros personnalisables** (séquences de commandes)
- [ ] **Thèmes sombres/clairs** automatiques
- [ ] **Historique des commandes** et undo/redo
- [ ] **API REST** en complément de WebSocket

## 📄 Licence

**MIT License** - Libre utilisation pour projets personnels et éducatifs.

## 👨‍💻 Auteur

Créé avec ❤️ par **un développeur passionné** pour simplifier le contrôle multimédia à distance.

---

**⭐ Si ce projet vous est utile, n'hésitez pas à le partager !**

---

## 📞 Support

- 📖 Consultez la [documentation détaillée](./docs/)
- 🐛 Signalez un bug dans les [Issues](https://github.com/votre-username/video-remote-controller/issues)
- 💡 Proposez des améliorations via [Pull Requests](https://github.com/votre-username/video-remote-controller/pulls)

---

<div align="center">

**Contrôlez votre Mac comme jamais auparavant !** 🎮

</div>

