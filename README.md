# Video Remote Controller

Un contrôleur vidéo à distance utilisant Tauri, React et Tailwind CSS. Contrôlez vos films depuis votre téléphone sur le même réseau WiFi que votre Mac.

## Caractéristiques

- **App Mac minimaliste** - Interface épurée avec juste un icône settings
- **Serveur WebSocket** - Communication temps réel entre votre Mac et votre téléphone
- **Interface Web Responsive** - Accédez via un navigateur web sur n'importe quel téléphone
- **Contrôles complets** - Play/Pause, Volume, Avancer/Reculer, Fullscreen
- **Affichage du temps** - Voir la progression vidéo et la durée totale
- **Statut de connexion** - Voir si vous êtes connecté au serveur

## Architecture

### Composants

- **App Mac (Tauri)** - Serveur qui écoute les connexions WebSocket
- **Lecteur vidéo HTML5** - Page avec lecteur vidéo intégré
- **Interface Web (React)** - Contrôleur responsive pour téléphone

### Flux de données

1. Utilisateur accède à `http://<mac-ip>:8080` depuis son téléphone
2. Interface de contrôle se charge et se connecte au serveur WebSocket
3. Clic sur un bouton → commande envoyée au Mac via WebSocket
4. Le lecteur vidéo reçoit la commande et l'exécute

## Installation

### Prérequis

- Node.js 16+
- Rust (pour Tauri)
- macOS 10.13+

### Installation des dépendances

```bash
npm install
```

## Utilisation

### Développement Mac (Tauri)

```bash
npm run dev
```

Cela démarre l'app Mac en mode développement avec hot reload.

### Production (Build Mac)

```bash
npm run build
```

L'app compilée sera dans `src-tauri/target/release/`.

### Web (Développement)

Le serveur web est intégré dans l'app Mac. Accédez-y via:
```
http://<votre-ip-mac>:8080
```

## Configuration

### Port du serveur

Le port par défaut est **8080**. Pour le changer, éditez `src-tauri/src/lib.rs`:

```rust
let port = 8080u16;  // Changez ce nombre
```

### Détection IP

L'app détecte automatiquement votre adresse IP locale. Si cela ne fonctionne pas correctement, éditez la fonction `get_local_ip()` dans `src-tauri/src/lib.rs`.

## Commandes vidéo supportées

| Commande | Description |
|----------|-------------|
| `togglePlayPause` | Bascule entre lecture et pause |
| `play` | Lance la lecture |
| `pause` | Met en pause |
| `setVolume` | Règle le volume (0-100) |
| `increaseVolume` | Augmente le volume de 5% |
| `decreaseVolume` | Baisse le volume de 5% |
| `seek` | Avance/recule à un moment spécifique |
| `skipForward` | Avance de 10 secondes |
| `skipBackward` | Recule de 10 secondes |
| `fullscreen` | Bascule le mode plein écran |

## Structure du projet

```
.
├── src/                          # Frontend React/TypeScript
│   ├── App.tsx                   # Détecte Tauri vs Web
│   ├── main.tsx                  # Point d'entrée React
│   ├── index.css                 # Styles Tailwind
│   └── components/
│       ├── Settings.tsx          # Panneau settings Mac
│       ├── Home.tsx              # Page d'accueil web
│       └── VideoController.tsx   # Interface de contrôle
│
├── src-tauri/                    # Backend Rust Tauri
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   └── lib.rs               # Serveur WebSocket et logique
│   ├── Cargo.toml               # Dépendances Rust
│   └── tauri.conf.json          # Config Tauri
│
├── public/
│   └── video.html               # Lecteur vidéo HTML5
│
├── tailwind.config.js           # Config Tailwind
├── postcss.config.js            # Config PostCSS
├── tsconfig.json                # Config TypeScript
├── vite.config.ts               # Config Vite
└── package.json                 # Dépendances Node

```

## Dépannage

### La connexion ne fonctionne pas

1. Vérifiez que le Mac et le téléphone sont sur le **même réseau WiFi**
2. Vérifiez que le port 8080 n'est pas bloqué par un pare-feu
3. Assurez-vous que l'IP est correcte (trouvez-la dans Settings > Server IP)

### Le serveur ne démarre pas

1. Vérifiez que le port 8080 est disponible
2. Vérifiez les logs de l'app Mac pour les erreurs

### La vidéo ne respond pas

1. Vérifiez que le WebSocket est connecté (vert dans l'interface)
2. Vérifiez la console du navigateur pour les erreurs JavaScript
3. Assurez-vous que la URL du serveur est correcte

## Technologies utilisées

- **Tauri** - Framework desktop léger
- **React 18** - UI framework
- **TypeScript** - Langage typé
- **Tailwind CSS** - Styling utility-first
- **Tokio** - Runtime async Rust
- **Tokio-tungstenite** - Serveur WebSocket
- **Vite** - Build tool moderne

## Licence

MIT

## Auteur

Créé avec ❤️ pour contrôler des films à distance
