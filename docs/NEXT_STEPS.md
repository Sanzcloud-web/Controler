# Prochaines étapes

## 1. Serveur HTTP complet 🔴 IMPORTANT

Actuellement, le serveur WebSocket écoute sur le port 8080, mais il n'y a pas de serveur HTTP pour servir les fichiers statiques. 

### À faire:
```rust
// Ajouter dans src-tauri/src/lib.rs
// Un serveur HTTP qui:
// 1. Sert dist/ sur GET /
// 2. Sert public/video.html sur GET /video
// 3. Sert les WebSocket sur GET /ws
```

Utiliser `hyper` ou une solution HTTP simple en Rust.

## 2. Intégration réelle du lecteur vidéo

Actuellement, `public/video.html` utilise une URL de vidéo de démonstration. 

### À faire:
- [ ] Permettre à l'utilisateur de charger une vidéo locale
- [ ] File upload ou chemin local sur le Mac
- [ ] Stocker le lecteur vidéo dans l'app Tauri
- [ ] Passer l'URL de la vidéo au frontend

## 3. Support de plusieurs formats vidéo

### À faire:
- [ ] VLC player integration
- [ ] Support de plus de formats (MKV, AVI, etc.)
- [ ] Streaming de fichiers volumineux

## 4. Authentification et sécurité

### À faire:
- [ ] Ajouter un code PIN ou token
- [ ] HTTPS/WSS pour connexions sécurisées
- [ ] Rate limiting
- [ ] Validation des commandes

## 5. Amélioration de l'interface

### Pour la page de contrôle:
- [ ] Affichage en temps réel du temps vidéo
- [ ] Barre de progression interactive
- [ ] Miniatures des captures d'écran
- [ ] Gestion des sous-titres

### Pour l'app Mac:
- [ ] Fenêtre toujours en haut
- [ ] Fenêtre transparente avec opacité ajustable
- [ ] Modes d'affichage (minimisé, normal, etc.)
- [ ] Tray icon pour accès rapide

## 6. Notifications et synchronisation

### À faire:
- [ ] Notifications quand un téléphone se connecte
- [ ] État synchronisé (lecture/pause, volume, position)
- [ ] Historique des commandes
- [ ] Statistiques d'utilisation

## 7. Build et distribution

### À faire:
- [ ] Créer une app macOS signée
- [ ] Script d'installation automatique
- [ ] Auto-update via Tauri updater
- [ ] Versions pour Windows/Linux

## 8. Performance

### À faire:
- [ ] Compression WebSocket
- [ ] Cache HTTP pour les assets statiques
- [ ] Optimisation des reconnexions
- [ ] Monitoring de la latence

## 9. Tests

### À faire:
- [ ] Tests unitaires Rust
- [ ] Tests d'intégration WebSocket
- [ ] Tests React/TypeScript
- [ ] Tests E2E avec Playwright

## 10. Documentation

### À faire:
- [ ] Vidéo tutoriel
- [ ] Guide d'installation détaillé
- [ ] Troubleshooting complet
- [ ] API documentation

## Priorisation

### Phase 1 (Essentiel):
1. ✅ Architecture WebSocket
2. ✅ Interface React responsive
3. 🔴 Serveur HTTP complet
4. Lecteur vidéo fonctionnel

### Phase 2 (Important):
1. Authentification
2. Support HTTPS/WSS
3. Amélioration UI/UX
4. Tests

### Phase 3 (Nice to have):
1. Multi-utilisateurs
2. Analytics
3. Auto-update
4. Support multi-plateforme

## Comment contribuer

1. Choisir une tâche
2. Créer une branche
3. Implémenter la feature
4. Tester localement
5. Soumettre une PR

## Questions/Discussions

Ouvrir une issue pour:
- Bugs
- Suggestions
- Questions d'architecture
- Demandes de features
