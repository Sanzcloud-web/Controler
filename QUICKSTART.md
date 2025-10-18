# Démarrage Rapide

## Installation

```bash
npm install
```

## Développement

### 1. Compiler le frontend

```bash
npm run build:web
```

Ou simplement laisser Vite faire du hot reload:

```bash
npx vite
```

### 2. Démarrer l'app Mac (Tauri)

```bash
npm run dev
```

Cela démarre le serveur de développement Tauri avec le frontend React.

## Production

```bash
npm run build
```

L'app macOS compilée sera dans `src-tauri/target/release/`.

## Utilisation

1. **Lancez l'app Mac** (`npm run dev` ou exécutez le .app généré)
2. **Cliquez l'icône settings** en haut à droite de la fenêtre Mac
3. **Notez l'adresse IP et le port** (ex: `192.168.1.100:8080`)
4. **Sur votre téléphone**, ouvrez un navigateur et allez à `http://192.168.1.100:8080`
5. **Connectez-vous** en entrant l'IP du Mac
6. **Commencez à contrôler votre vidéo!**

## Architecture

- **Frontend (React/TypeScript)**: Interface responsive pour le téléphone + interface Mac minimale
- **Backend (Tauri/Rust)**: Serveur WebSocket qui reçoit les commandes
- **Lecteur vidéo (HTML5)**: Page web simple avec contrôles vidéo

## Scripts disponibles

- `npm run dev` - Démarrage développement avec Tauri
- `npm run build:web` - Compiler le frontend React
- `npm run build` - Build complet pour production
- `npm run tauri` - Commandes Tauri directes

## Dépannage

**"Unable to find your web assets"**
- Exécutez `npm run build:web` avant de démarrer Tauri

**"WebSocket connection refused"**
- Assurez-vous que vous utilisez la bonne IP et le port
- Vérifiez que le Mac et le téléphone sont sur le même WiFi
- Vérifiez que le port 8080 n'est pas bloqué par le firewall

**Le serveur Tauri ne démarre pas**
- Vérifiez les logs pour les erreurs Rust
- Assurez-vous que Rust est installé (`rustc --version`)

## Notes

- L'app Mac a une fenêtre minimaliste avec juste l'icône settings
- Le lecteur vidéo utilise une vidéo de démonstration (remplacez l'URL dans `public/video.html`)
- Tous les contrôles sont transmis via WebSocket en temps réel
