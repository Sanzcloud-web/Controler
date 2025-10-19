# 📺 Episode Navigation Feature

## Overview

Cette fonctionnalité permet de naviguer entre les épisodes directement depuis le contrôleur téléphone. Quand vous appuyez sur "Épisode Suivant" ou "Épisode Précédent", le système :

1. **Exécute le script de changement d'épisode** - Appelle `window.changeEpisode()` ou clique les boutons de navigation
2. **Passe en fullscreen** - Active le mode plein écran automatiquement
3. **Lance la vidéo** - Simule un clic au centre de l'écran pour lancer la lecture

## Architecture

### Frontend (React/TypeScript)
📁 `src/components/VideoController.tsx`

```typescript
const handleNextEpisode = () => {
  sendCommand('nextEpisode')
}

const handlePrevEpisode = () => {
  sendCommand('prevEpisode')
}
```

**Deux nouveaux boutons orange** :
- ⬅️ **Épisode Précédent** - Navigate to previous episode
- ➡️ **Épisode Suivant** - Navigate to next episode

Les boutons envoient une commande WebSocket au serveur.

### Backend (Python)
📁 `server/server.py`

**3 nouvelles fonctions** :

1. **`execute_episode_script(direction: str)`**
   - Orchestre l'exécution complète du changement d'épisode
   - Exécute le script de navigation
   - Passe en fullscreen
   - Simule un clic

2. **`inject_javascript(js_code: str)`**
   - Injecte du code JavaScript dans le navigateur
   - Utilise AppleScript pour interagir avec le navigateur
   - Simule : Cmd+L (adresse bar) → Paste code → Enter

3. **`simulate_center_click()`**
   - Simule un clic souris au centre de l'écran (960, 540)
   - Lance la lecture vidéo

## Flux d'exécution

```
Utilisateur clique "Épisode Suivant"
    ↓
Frontend envoie: {"command": "nextEpisode"}
    ↓
Server reçoit et appelle execute_episode_script('next')
    ↓
┌─ Script 1: Changement d'épisode
│  ├─ Appelle window.changeEpisode('next')
│  ├─ Ouvre la modale vidéo si nécessaire
│  └─ Log: ➡️ Épisode actuel: S01E05
├─ Attente 0.5s
├─ Script 2: Activation fullscreen
│  └─ Appelle requestFullscreen() sur l'élément vidéo
├─ Attente 0.3s
└─ Action 3: Clic au centre
   └─ Simule clic (960, 540)
```

## Scripts injectés

### Script Next Episode
```javascript
(() => {
  try {
    const modal = document.getElementById('videoModal');
    const wasOpen = modal && modal.classList.contains('active');

    if (typeof window.changeEpisode === 'function') {
      window.changeEpisode('next');
    } else {
      document.getElementById('modalNextEpisodeBtn')?.click();
    }

    if (!wasOpen && typeof window.openVideoModal === 'function') {
      window.openVideoModal();
    }

    const s = window.currentSeason, e = window.currentEpisode;
    if (s != null && e != null) {
      console.log(`➡️ Épisode actuel: S${String(s).padStart(2,'0')}E${String(e).padStart(2,'0')}`);
    }
  } catch (err) {
    console.error('NEXT snippet error:', err);
  }
})();
```

### Script Fullscreen
```javascript
(() => {
  const el =
    document.getElementById('videoFrame') ||
    document.getElementById('videoModal') ||
    document.documentElement;

  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;

  if (req) req.call(el);
  else console.warn('Fullscreen API indisponible sur cet élément.');
})();
```

## Configuration requise

### Frontend
- Boutons avec handlers WebSocket intégrés ✅
- Communication avec le serveur via `sendCommand()` ✅

### Backend
- **AppleScript** pour injecter JavaScript
- **Privilèges accessibility** (peut nécessiter une permission d'accès)
- Navigateur web en focus

## Requêtes possibles

### Changement d'épisode suivant
```json
{
  "command": "nextEpisode"
}
```

### Changement d'épisode précédent
```json
{
  "command": "prevEpisode"
}
```

## Logs

Quand vous exécutez la fonctionnalité, vous verrez dans la console du serveur :

```
📥 Command received: {'command': 'nextEpisode'}
✅ JavaScript injected successfully
🖱️ Center click simulated
➡️ Next episode triggered
📤 Sent response...
```

Et dans la console du navigateur :

```
➡️ Épisode actuel: S01E05
```

## Troubleshooting

### ❌ "JavaScript injection failed"
- Vérifiez que le navigateur est en focus
- Vérifiez les permissions d'accessibilité dans Préférences Système

### ❌ "Fullscreen API indisponible"
- Le lecteur vidéo doit avoir l'ID `videoFrame` ou `videoModal`
- Vérifiez que l'élément accepte `requestFullscreen()`

### ❌ "Le clic n'a pas lancé la vidéo"
- Assurez-vous que le clic arrive après que le fullscreen soit activé
- Les délais (0.5s + 0.3s) peuvent être ajustés si nécessaire

## Future Améliorations

- [ ] Support de commandes clavier personnalisées
- [ ] Injection JavaScript directement via WebSocket (sans AppleScript)
- [ ] Détection de l'épisode actuel en temps réel
- [ ] Queue d'épisodes
- [ ] Historique de lecture

## Ressources

- 📖 [ARCHITECTURE.md](./ARCHITECTURE.md) - Comprendre l'architecture générale
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Guide de démarrage rapide
- 📋 [PROJECT_STATUS.md](./PROJECT_STATUS.md) - État du projet
