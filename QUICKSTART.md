# 🚀 Démarrage Rapide - SIMPLE

## Avant de commencer

✅ Assurez-vous d'avoir:
- Node.js installé (`node --version`)
- Rust installé (`rustc --version`)
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

## Étape 3: Lancer l'app

```bash
npm run dev
```

**Attendez** que vous voyiez ceci dans le terminal:
```
✓ Listening on 0.0.0.0:8080
```

---

## Étape 4: Ouvrir les Settings

Une fenêtre devrait s'ouvrir avec l'app Mac.

Cliquez le ⚙️ (settings) en haut à droite.

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
- Relancez le terminal: `npm run dev`

### "Les boutons ne font rien"
- Ouvrez F12 (dev tools) et regardez les erreurs
- Vérifiez la couleur du statut (vert = connecté)

### "L'app Mac ne démarre pas"
- Vérifiez que Rust est installé: `rustc --version`
- Relancez: `npm run dev`

---

## La prochaine fois

Vous n'avez besoin que de:

```bash
npm run dev
```

Puis scannez le QR code! 📱🔲
