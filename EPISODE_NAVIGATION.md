### Backend (Python)
📁 `server/server.py`

**3 nouvelles fonctions** :

1. **`execute_episode_script(direction: str)`**
   - Orchestre l'exécution complète du changement d'épisode
   - Exécute le script de navigation
   - Passe en fullscreen
   - Simule un clic

2. **`inject_javascript(js_code: str)`**
   - Injecte du code JavaScript dans le navigateur via la console DevTools
   - Utilise AppleScript pour automatiser DevTools
   - Séquence :
     1. Ouvre la console (Cmd+Option+J)
     2. Colle le code (Cmd+V)
     3. Exécute (Enter)
     4. Ferme la console (Cmd+Option+J)

3. **`simulate_center_click()`**
   - Simule un clic souris au centre de l'écran (960, 540)
   - Lance la lecture vidéo
