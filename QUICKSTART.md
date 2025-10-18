# 🚀 Démarrage Rapide - SIMPLE

## Avant de commencer

✅ Assurez-vous d'avoir:
- Node.js installé (`node --version`)
- Python 3 installé (`python3 --version`)
- Terminal ouvert dans le dossier du projet

---

## Étape 1: Installer tout (une seule fois)

Ouvrez un terminal et collez ceci:

```bash
npm install
```

Attendez que ça finisse (1-2 minutes).

---

## Étape 2: Compiler le code React

```bash
npm run build:web
```

Attendez que ça finisse (20-30 secondes).

---

## Étape 3: Lancer le serveur Python

```bash
python3 server/server.py
```

Vous devriez voir:

```
╔════════════════════════════════════════════════════════════╗
║         📺 Video Remote Controller Server                  ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://192.168.1.100:8080
```

---

## Étape 4: Dans un autre terminal - Lancer l'app Mac

Ouvrez un **NOUVEAU terminal** et lancez:

```bash
npm run dev
```

Une fenêtre Mac devrait s'ouvrir. Cliquez le ⚙️ (settings) en haut à droite.

---

## Étape 5: Sur votre téléphone - 2 FAÇONS

### 🔲 Façon 1: Scanner le QR Code (PLUS RAPIDE ✨)

Dans l'app Mac, vous verrez un **QR code**.

Sur votre téléphone:
1. Ouvrez l'appareil photo
2. Pointez vers le QR code
3. Cliquez la notification qui apparaît
4. **C'est bon!** 🎉

### 🔗 Façon 2: Taper l'URL (manuel)

Si le QR code ne marche pas:
1. Notez l'**Access URL** affichée (ex: `http://192.168.1.100:8080`)
2. Sur votre téléphone, ouvrez un navigateur
3. Tapez l'adresse

---

## Étape 6: Contrôler!

Vous devriez voir:

```
┌─────────────────────────┐
│   🟢 Connected          │
├─────────────────────────┤
│                         │
│      ▶️  PLAY/PAUSE     │
│                         │
│  ⏪ -10s    ⏩ +10s      │
│                         │
│  🔊 Volume: 100%        │
│  [===========================]
│  [-]                 [+]│
│                         │
│  ⛶ FULLSCREEN          │
│                         │
│  [ DISCONNECT ]        │
└─────────────────────────┘
```

Cliquez les boutons! 🎬

---

## C'est tout!

Le film devrait réagir quand vous cliquez les boutons.

---

## Si ça ne marche pas

### "Le QR code ne scanne pas"
- Vérifiez que votre téléphone a la caméra activée
- Essayez plutôt de taper l'URL manuellement

### "Page blanche sur le téléphone"
- Vérifiez que l'URL est correcte
- Vérifiez que vous êtes sur le même WiFi
- Relancez: `python3 server/server.py`

### "Les boutons ne font rien"
- Ouvrez F12 (dev tools) et regardez les erreurs
- Vérifiez la couleur du statut (vert = connecté)

### "Le serveur Python ne démarre pas"
- Vérifiez que Python 3 est installé: `python3 --version`
- Vérifiez que vous êtes dans le bon dossier: `ls dist/`
- Relancez: `python3 server/server.py`

### "Address already in use" (le port 8080 est pris)
```bash
# Tuer les anciens processus
pkill -f "python3"

# Puis relancer
python3 server/server.py
```

---

## La prochaine fois

Vous avez besoin de **2 terminaux**:

**Terminal 1** (serveur web):
```bash
python3 server/server.py
```

**Terminal 2** (app Mac):
```bash
npm run dev
```

Puis scannez le QR code! 📱🔲
