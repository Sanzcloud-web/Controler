# Video Remote Controller

Contrôleur vidéo à distance utilisant Python, React et WebSocket. Contrôlez votre Mac depuis votre téléphone sur le même réseau WiFi.

## Caractéristiques

- **Interface Web Responsive** - Accédez via navigateur web sur n'importe quel appareil
- **Serveur Python WebSocket** - Communication temps réel entre votre Mac et vos appareils
- **Contrôles complets** - Play/Pause, Volume, Avancer/Reculer, Fullscreen
- **Volume synchronisé** - Affiche le volume actuel de votre Mac au démarrage
- **QR Code** - Connexion rapide via scan QR code
- **Statut de connexion** - Indicateur visuel de connexion au serveur

## Architecture

### Composants

- **Serveur Python (aiohttp)** - Backend WebSocket qui contrôle macOS
- **Interface Web (React + Vite)** - Contrôleur responsive pour mobile/desktop
- **Communication WebSocket** - Temps réel bidirectionnel

### Flux de données

1. Serveur Python démarre sur le Mac (port 8080)
2. Utilisateur accède à `http://<mac-ip>:8080` depuis son téléphone
3. Interface React se charge et se connecte via WebSocket
4. Serveur envoie le volume actuel du Mac au client
5. Commandes envoyées → Serveur Python → macOS via AppleScript

## Installation

### Prérequis

- **macOS 10.13+**
- **Python 3.7+**
- **Node.js 16+**

### Installation des dépendances

#### Backend Python

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install aiohttp
```

#### Frontend React

```bash
npm install
```

## Utilisation

### Démarrer le serveur

```bash
npm run server
```

Ou directement :

```bash
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
```

### Accéder depuis votre téléphone

1. Assurez-vous d'être sur le **même WiFi** que votre Mac
2. Ouvrez votre navigateur mobile
3. Entrez l'URL affichée par le serveur
4. OU scannez le QR code affiché sur la page d'accueil

### Développement du Frontend

```bash
npm run dev      # Démarre Vite dev server
npm run build    # Build production
npm run preview  # Preview production build
```

## Configuration

### Changer le port

Éditez `server/server.py` :

```python
PORT = 8080  # Changez ce nombre
```

### Commandes vidéo supportées

| Commande | Description | Raccourci macOS |
|----------|-------------|-----------------|
| `togglePlayPause` | Lecture/Pause | Espace |
| `setVolume` | Règle le volume (0-100) | - |
| `skipForward` | Avance de 10s | Shift+→ |
| `skipBackward` | Recule de 10s | Shift+← |
| `fullscreen` | Plein écran | F |

### Contrôle du volume

Le serveur Python :
- ✅ Récupère le volume actuel au démarrage (`get_current_volume()`)
- ✅ Envoie le volume au client WebSocket lors de la connexion
- ✅ Permet de modifier le volume via `setVolume`

## Structure du projet

```
.
├── src/                          # Frontend React/TypeScript
│   ├── App.tsx                   # Point d'entrée
│   ├── main.tsx                  # Montage React
│   ├── index.css                 # Styles Tailwind
│   └── components/
│       ├── Home.tsx              # Page d'accueil
│       └── VideoController.tsx   # Interface de contrôle
│
├── server/                       # Backend Python
│   ├── server.py                 # Serveur WebSocket aiohttp
│   └── venv/                     # Environnement virtuel Python
│
├── public/
│   └── video.html               # Lecteur vidéo (optionnel)
│
├── dist/                        # Build frontend (généré)
│
├── tailwind.config.js           # Config Tailwind
├── vite.config.ts               # Config Vite
└── package.json                 # Dépendances Node

```

## Dépannage

### La connexion ne fonctionne pas

1. ✅ Vérifiez que le Mac et le téléphone sont sur le **même réseau WiFi**
2. ✅ Vérifiez que le port 8080 n'est pas bloqué par le pare-feu macOS
3. ✅ Assurez-vous que l'IP affichée est correcte
4. ✅ Testez l'accès depuis le navigateur de votre Mac : `http://localhost:8080`

### Le serveur ne démarre pas

1. Port déjà utilisé : `lsof -i :8080` pour voir quel processus utilise le port
2. Python non installé : `python3 --version`
3. Dépendances manquantes : `pip install aiohttp`

### Le volume ne s'affiche pas correctement

Le serveur récupère automatiquement le volume macOS au démarrage. Si le volume affiché est incorrect :

1. Vérifiez les logs du serveur Python
2. Testez manuellement : `osascript -e "output volume of (get volume settings)"`
3. Rechargez la page web

### WebSocket déconnecté

- Icône rouge dans l'interface = déconnecté
- Vérifiez que le serveur Python est toujours en cours d'exécution
- Rechargez la page pour reconnecter

## Technologies utilisées

- **Python 3** - Backend
- **aiohttp** - Serveur HTTP/WebSocket asynchrone
- **React 18** - UI framework
- **TypeScript** - Langage typé
- **Tailwind CSS** - Styling utility-first
- **Vite** - Build tool moderne et rapide
- **lucide-react** - Icônes
- **qrcode.react** - Génération QR codes

## Sécurité

⚠️ **Ce projet est conçu pour un usage local sur votre réseau privé.**

- Pas d'authentification implémentée
- Pas de chiffrement (HTTP/WS non sécurisé)
- Ne pas exposer sur Internet

## Licence

MIT

## Auteur

Créé avec ❤️ pour contrôler votre Mac à distance

