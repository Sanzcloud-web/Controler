# Architecture - Video Remote Controller

## Vue d'ensemble

```
┌─────────────────────┐          WiFi          ┌──────────────────────┐
│                     │◄─────────────────────►│                      │
│  Navigateur Téléphone                       │   App Mac (Tauri)    │
│  - Interface        │  WebSocket (port 8080)│  - Serveur WebSocket │
│  - Contrôles        │◄─────────────────────►│  - Lecteur HTML5     │
│  - Connexion HTTP   │                       │  - Settings Panel    │
│                     │                       │                      │
└─────────────────────┘                       └──────────────────────┘
         Phone                                    Computer
```

## Structure des fichiers

```
/Users/sanz/Desktop/APP/Controler/
│
├── src/                          # Frontend React + Tauri App UI
│   ├── App.tsx                   # Détecte environnement (Tauri vs Web)
│   ├── main.tsx                  # Entry point React
│   ├── index.css                 # Styles Tailwind
│   │
│   └── components/
│       ├── Settings.tsx          # Panneau settings pour Mac
│       ├── Home.tsx              # Page d'accueil du contrôleur
│       └── VideoController.tsx   # Interface de contrôle vidéo
│
├── public/
│   └── video.html                # Lecteur vidéo HTML5
│
├── src-tauri/                    # Backend Tauri (Rust)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Serveur WebSocket + logique
│   ├── Cargo.toml                # Dépendances Rust
│   └── tauri.conf.json           # Configuration Tauri
│
├── dist/                         # Output build frontend
│
├── index.html                    # Page principale (React)
├── tailwind.config.js            # Config Tailwind
├── postcss.config.js             # Config PostCSS
├── tsconfig.json                 # Config TypeScript
├── vite.config.ts                # Config Vite
│
└── package.json                  # Dépendances Node
```

## Flux de données

### 1. Démarrage

```
1. Utilisateur lance l'app Mac
   ↓
2. App Tauri démarre
   ↓
3. Serveur WebSocket se lance sur 0.0.0.0:8080
   ↓
4. Détection IP locale (via ipconfig getifaddr en0)
   ↓
5. Interface Mac affiche IP et port dans Settings
```

### 2. Connexion du téléphone

```
1. Utilisateur tape IP:port dans navigateur
   ↓
2. Navigateur demande http://<ip>:8080
   ↓
3. Tauri/HTTP sert la page React compilée (dist/)
   ↓
4. React charge l'interface de contrôle
   ↓
5. JavaScript établit WebSocket ws://<ip>:8080/ws
   ↓
6. Statut change à "Connected"
```

### 3. Contrôle vidéo

```
Utilisateur clique Play/Pause
   ↓
JavaScript envoie: {"command": "togglePlayPause"}
   ↓
WebSocket transmet au serveur
   ↓
Serveur Rust reçoit (mais ne fait rien actuellement)
   ↓
JavaScript du lecteur vidéo exécute: video.play()
   ↓
Vidéo réagit
```

## Technologies utilisées

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool rapide
- **WebSocket API** - Communication temps réel

### Backend

- **Tauri 2** - Framework desktop léger
- **Rust** - Langage système performant
- **Tokio** - Runtime async
- **Tokio-tungstenite** - WebSocket server
- **Futures** - Async utilities

## Points clés d'implémentation

### Mode détection (Tauri vs Web)

```typescript
const isTauri = '__TAURI__' in window

if (isTauri) {
  // Affiche l'interface Mac minimale avec settings
} else {
  // Affiche l'interface du contrôleur
}
```

### Serveur WebSocket

```rust
async fn run_websocket_server(port: u16) {
  let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await;
  
  loop {
    let (stream, _) = listener.accept().await;
    tokio::spawn(handle_connection(stream));
  }
}
```

### Commandes vidéo supportées

Tous les messages WebSocket ont la structure:
```json
{
  "command": "play|pause|togglePlayPause|seek|...",
  "value": 0.0  // optional, pour les valeurs numériques
}
```

### Liaison vidéo HTML5

```javascript
ws.onmessage = (event) => {
  const cmd = JSON.parse(event.data);
  
  switch(cmd.command) {
    case 'play': video.play(); break;
    case 'pause': video.pause(); break;
    case 'setVolume': video.volume = cmd.value / 100; break;
    // ...
  }
}
```

## Performance et sécurité

### Performance

- WebSocket pour communication temps réel sans latence
- Dist/ pré-compilé avec Vite pour chargement rapide
- Tailwind CSS purgé en production (~13KB gzip)

### Sécurité

- **Réseau local uniquement** - Écoute sur 0.0.0.0:8080 (à adapter si besoin)
- **HTTPS/WSS** - À implémenter pour connexions à distance
- **Validation des commandes** - À ajouter pour valider les entrées

## Extension possibles

1. **Support HTTPS/WSS** - Pour connexions à distance sécurisées
2. **Authentification** - Ajouter un code PIN ou un token
3. **Historique** - Tracker les commandes exécutées
4. **Multi-utilisateurs** - Permettre plusieurs téléphones
5. **Persistance** - Sauvegarder les préférences
6. **Analytics** - Tracker l'utilisation

## Commandes de build

### Développement

```bash
# Frontend hot reload + Tauri dev
npm run dev

# Ou juste le frontend
npx vite

# Vérifier le build Rust
cd src-tauri && cargo check
```

### Production

```bash
# Compiler tout
npm run build

# Juste le frontend
npm run build:web

# App macOS final dans src-tauri/target/release/
```

## Debugging

### Logs Rust

```rust
eprintln!("Debug message: {}", value);
```

### Logs JavaScript

```javascript
console.log('Debug message:', value);
```

### Inspector Tauri

```bash
npm run dev  // Ouvre les dev tools
```
