# 📝 Changelog - Episode Navigation Feature

## Date
2024-10-19

## Résumé
Ajout d'une fonctionnalité complète de navigation entre épisodes avec injection JavaScript via console DevTools, activation du fullscreen et simulation de clic.

## Fichiers modifiés

### 1. 🖥️ Server Backend - `server/server.py`

**Nouvelles commandes WebSocket** :
- `nextEpisode` - Change à l'épisode suivant
- `prevEpisode` - Change à l'épisode précédent

**Nouvelles fonctions** :

```python
def execute_episode_script(direction: str):
    """Execute episode navigation script via JavaScript injection"""
    # Orchestre :
    # 1. Injection du script de changement d'épisode
    # 2. Activation du fullscreen
    # 3. Simulation du clic au centre
    
def inject_javascript(js_code: str):
    """Inject JavaScript code into the browser using DevTools console"""
    # Séquence :
    # 1. Ouvre la console DevTools (Cmd+Option+J)
    # 2. Colle le code JavaScript (Cmd+V)
    # 3. Exécute le code (Enter)
    # 4. Ferme la console (Cmd+Option+J)
    
def simulate_center_click():
    """Simulate a mouse click at the center of the screen"""
    # Clique à (960, 540)
```

**Fichier complet** : 247 lignes → ~350 lignes

---

### 2. 📱 Frontend UI - `src/components/VideoController.tsx`

**Nouveaux handlers** :
```typescript
const handleNextEpisode = () => {
  sendCommand('nextEpisode')
}

const handlePrevEpisode = () => {
  sendCommand('prevEpisode')
}
```

**Nouveaux boutons UI** :
- Deux boutons orange côte-à-côte
- Icônes : SkipBack (précédent) et SkipForward (suivant)
- Texte : "Épisode Précédent" et "Épisode Suivant"
- Position : Entre les boutons skip (10s) et le contrôle de volume

**Fichier complet** : 239 lignes → ~290 lignes

---

## Flux d'exécution

```
┌─────────────────────────────────────────────────────────────────┐
│ Utilisateur appuie sur "Épisode Suivant"                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ handleNextEpisode()                                             │
│ → sendCommand('nextEpisode')                                    │
│ → WebSocket sends JSON to server                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Server: execute_command({'command': 'nextEpisode'})             │
│ → execute_episode_script('next')                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │ Step 1: Inject Episode Change Script    │
        │ ✅ window.changeEpisode('next')         │
        │ ✅ Log: S01E05 → S01E06                 │
        │ ⏱️  wait 0.5s                           │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │ Step 2: Inject Fullscreen Script        │
        │ ✅ requestFullscreen()                  │
        │ ⏱️  wait 0.3s                           │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │ Step 3: Simulate Center Click           │
        │ 🖱️  click at {960, 540}                │
        │ ✅ Vidéo lancée en fullscreen           │
        └─────────────────────────────────────────┘
```

## Scripts injectés

### Script 1 : Changement d'épisode
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

### Script 2 : Activation Fullscreen
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

## Caractéristiques implémentées ✅

- [x] Commandes WebSocket `nextEpisode` et `prevEpisode`
- [x] Injection JavaScript via AppleScript
- [x] Activation du fullscreen
- [x] Simulation de clic au centre de l'écran
- [x] Gestion des erreurs (try/catch)
- [x] Logs de débogage détaillés
- [x] UI responsive (deux boutons côte-à-côte)
- [x] Support du fallback (si `changeEpisode()` n'existe pas)
- [x] Documentation complète

## Tests recommandés

1. **Test de base**
   - Appuyer sur "Épisode Suivant"
   - Vérifier console serveur : ✅ JavaScript injected successfully
   - Vérifier console navigateur : ➡️ Épisode actuel: S01E05

2. **Test fullscreen**
   - Activer fullscreen
   - Vérifier que le lecteur passe en plein écran

3. **Test de clic**
   - Vérifier que le clic lance la vidéo
   - Vérifier timing (0.5s + 0.3s = 0.8s total)

4. **Test précédent épisode**
   - Même procédure avec bouton "Épisode Précédent"
   - Vérifier que S01E05 → S01E04

5. **Test fallback**
   - Si `window.changeEpisode()` n'existe pas
   - Doit cliquer sur `#modalNextEpisodeBtn` / `#modalPrevEpisodeBtn`

## Configuration système requise

- ✅ macOS (pour AppleScript)
- ✅ Permissions d'accessibilité activées (System Preferences > Security & Privacy)
- ✅ Navigateur web avec support WebSocket
- ✅ Support Fullscreen API dans le lecteur vidéo

## Documentation

Voir : [EPISODE_NAVIGATION.md](./EPISODE_NAVIGATION.md)

## Prochaines étapes optionnelles

- [ ] Détecter automatiquement les résolutions d'écran pour le clic
- [ ] Support des écrans multi-moniteurs
- [ ] Optimiser les délais d'injection
- [ ] Ajouter des callbacks pour tracking
- [ ] Support des événements clavier personnalisés
