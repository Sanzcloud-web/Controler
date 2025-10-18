# 🎬 START HERE - Video Remote Controller

Bienvenue! Voici comment démarrer avec votre app de contrôle vidéo.

## 🚀 Démarrage rapide (2 minutes)

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'app
npm run dev

# 3. Un navigateur devrait s'ouvrir avec l'app Mac
# Cliquez le bouton ⚙️ (settings) en haut à droite

# 4. Notez l'IP affichée (ex: 192.168.1.100:8080)

# 5. Sur votre téléphone sur le même WiFi:
# Ouvrez: http://192.168.1.100:8080
```

---

## 📚 Documentation

Lire dans cet ordre:

1. **[README.md](README.md)** - Vue d'ensemble complète
2. **[QUICKSTART.md](QUICKSTART.md)** - Guide détaillé de démarrage
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Comment ça marche techniquement
4. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Status et métriques
5. **[NEXT_STEPS.md](NEXT_STEPS.md)** - Comment améliorer

---

## 🎯 Votre cas d'usage

Vous voulez contrôler un film depuis votre téléphone en WiFi local:

```
┌─ Votre PC (macOS) ─┐           WiFi            ┌─ Votre téléphone ─┐
│                    │◄──────────────────────────►│                  │
│ App avec lecteur   │  Envoie commandes play... │ Interface web    │
│ vidéo HTML5        │ reçoit play/pause/volume  │ avec boutons     │
│                    │                           │                  │
└────────────────────┘                           └──────────────────┘
```

---

## ⚙️ Configuration

### Port
- Par défaut: **8080**
- À changer dans: `src-tauri/src/lib.rs` ligne 20

### IP automatique
- L'app détecte votre IP locale automatiquement
- Si ça ne marche pas, tapez `ifconfig en0 | grep "inet "` dans Terminal

### Vidéo
- Actuellement: vidéo de démonstration externe
- À changer dans: `public/video.html` ligne 45

---

## 🎮 Contrôles disponibles

Sur le téléphone, vous avez:

- ▶️ **Play/Pause** - Bouton grand au centre
- ⏭️ **Skip** - +10s / -10s
- 🔊 **Volume** - Slider + boutons
- ⛶ **Fullscreen** - Bascule plein écran

---

## 🔧 Commandes npm

```bash
npm run dev           # Mode développement (Tauri + React hot reload)
npm run build:web     # Compiler juste le frontend React
npm run build         # Build complet pour production
npm run tauri         # Commandes Tauri directes
```

---

## 📱 Tester sur le téléphone

### Prérequis
- ✅ Même réseau WiFi que le PC
- ✅ Un navigateur web

### Connexion
1. Lancez l'app sur le PC (`npm run dev`)
2. Cliquez settings pour voir l'IP
3. Sur téléphone: `http://[IP]:8080`
4. Connectez-vous
5. C'est bon!

---

## ⚠️ Problèmes courants

### "Cannot connect"
→ Vérifiez que vous êtes sur le **même WiFi** et utilisez la bonne **IP**

### "Blank page on phone"
→ Le serveur HTTP n'est pas complètement implémenté
→ Consultez [NEXT_STEPS.md](NEXT_STEPS.md#1-serveur-http-complet-)

### "Buttons don't work"
→ Vérifiez la connexion WebSocket dans les dev tools (F12)

### "App won't start"
→ Assurez-vous que Rust est installé: `rustc --version`

---

## 💡 Prochaines étapes

Pour vraiment utiliser l'app, vous devez:

1. **Implémenter un serveur HTTP** (important!)
   - Servir les fichiers statiques de `dist/`
   - Actuellement seul WebSocket fonctionne
   
2. **Intégrer une vraie vidéo**
   - Permettre upload de vidéos locales
   - Ou charger depuis un chemin

3. **Ajouter authentification** (optionnel)
   - PIN de 4 chiffres
   - Token

Voir [NEXT_STEPS.md](NEXT_STEPS.md) pour tous les détails.

---

## 🏗️ Structure du projet

```
Controler/
├── src/                    # Frontend React (téléphone + Mac app)
│   └── components/         # Composants React
├── src-tauri/              # Backend Rust (serveur WebSocket)
├── public/                 # Fichiers statiques (vidéo HTML)
├── dist/                   # Build final (généré)
└── docs/                   # Documentation
    ├── README.md           # Vue d'ensemble
    ├── QUICKSTART.md       # Guide de démarrage
    ├── ARCHITECTURE.md     # Technique
    └── NEXT_STEPS.md       # Améliorations
```

---

## 🎓 Stack technique

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Tauri 2 + Rust + Tokio + WebSocket
- **Communication**: WebSocket temps réel

---

## 💬 Questions?

- Consulter les fichiers README/QUICKSTART/ARCHITECTURE
- Vérifier les logs (F12 sur téléphone, console sur Mac)
- Lire [NEXT_STEPS.md](NEXT_STEPS.md) pour les limitations actuelles

---

## ✨ Bon développement!

Vous avez maintenant une base solide pour:
- ✅ Contrôler une vidéo à distance
- ✅ Apprendre Tauri + Rust + React
- ✅ Étendre avec vos propres features

**N'hésitez pas à améliorer l'app!** 🚀
