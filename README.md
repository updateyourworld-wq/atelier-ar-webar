# ATELIER.AR

Prototype WebAR de suivi d’image. MindAR détecte la carte et calcule sa pose ; A-Frame affiche la séquence PNG transparente sur un plan attaché à la carte. L’aperçu fonctionne sans caméra.

## Tester sur iPhone

1. Sur le Mac ou un autre écran, ouvrir la [carte de test](assets/target/card.png) en entier, ou l’imprimer. Éviter les reflets et les bords coupés.
2. Sur l’iPhone, ouvrir [ATELIER.AR en HTTPS](https://updateyourworld-wq.github.io/atelier-ar-webar/) directement dans Safari.
3. Toucher **Ouvrir la caméra**, autoriser l’accès, puis viser la carte à une distance où elle tient dans le cadre.
4. Vérifier que **Image reconnue** apparaît, que la caméra reste visible autour du dessin et à travers ses zones transparentes, et que le plan suit la perspective quand on incline la carte.
5. Sortir la carte du champ, puis la présenter à nouveau. Vérifier l’état **Image perdue**, la reprise du suivi et le retour à l’accueil via **Terminer**. Relancer la caméra, puis changer d’onglet : à la reprise, l’app doit attendre un nouveau clic.

Si Safari refuse la caméra, ouvrir le menu de la page → **Réglages du site web** → **Caméra**, autoriser l’accès, puis réessayer. Vérifier aussi que Safari a accès à la caméra dans les réglages iOS si l’option est disponible.

**État : la reconnaissance et les permissions sur un iPhone physique restent à valider.** Sur Chrome/macOS, un flux vidéo simulé avec la carte officielle a permis de vérifier la détection, la perte de la cible, le plan animé et la libération du flux. Le refus de permission et l’annulation pendant la demande ont aussi été testés. Cela ne remplace pas le test iOS.

## Tester en local sur le Mac

Depuis ce dossier :

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Ouvrir [http://localhost:8000/](http://localhost:8000/). Utiliser un deuxième écran ou une impression pour viser la carte avec la webcam. Pour un iPhone, utiliser la version HTTPS : l’adresse IP du Mac en HTTP n’offre pas le même contexte sécurisé que localhost.

## Remplacer la cible ou l’animation

- **Cible** : compiler l’illustration avec le [compilateur MindAR](https://hiukim.github.io/mind-ar-js-doc/tools/compile/). Pour une cible unique, remplacer ensemble `assets/target/card.mind` et `assets/target/card.png`. Si les noms changent, mettre à jour `TARGET` dans `app.js` et le lien vers l’image dans `index.html`. Le prototype suit la cible d’index 0.
- **Animation** : remplacer les fichiers de `assets/frames/` par des PNG RGBA de 512 × 512, numérotés à partir de `frame_000.png` et sans trous. Ajuster `FRAME_COUNT` et `FPS` dans `app.js` si nécessaire. Pour d’autres dimensions, mettre à jour le canvas d’aperçu dans `index.html` et adapter les proportions de `PlaneGeometry` dans `app.js`. L’animation d’origine boucle en 2 secondes (48 PNG à 24 fps).

## itch.io et limites

Téléverser le ZIP comme **HTML Game**, avec `index.html` à la racine. Activer l’option mobile si elle est proposée et tester l’aperçu sur iPhone. [itch.io lance le HTML dans une iframe](https://itch.io/docs/creators/html5) ; le plein écran ne garantit pas l’accès à la caméra. Si elle est bloquée, utiliser le lien vers l’onglet autonome, également proposé par le diagnostic.

Le suivi dépend du cadrage, de la netteté, du contraste et de l’éclairage. L’animation ne nécessite aucun décodage vidéo. Le WebM VP9 alpha est fourni comme export expérimental ; l’application ne le charge pas. L’app traite la vidéo dans le navigateur et ne l’envoie à aucun serveur.

## Dépendances

[A-Frame 1.6.0](https://github.com/aframevr/aframe/tree/v1.6.0) et [MindAR 1.2.5](https://github.com/hiukim/mind-ar-js/tree/v1.2.5) sont servis depuis `vendor/` avec leurs licences. La carte et le modèle viennent de l’exemple officiel MindAR. La métadonnée de rotation de la carte a été retirée pour que les navigateurs affichent l’orientation paysage utilisée par le modèle. L’adaptateur caméra dans `app.js` fournit le flux à MindAR. Le bundle local de MindAR accepte en plus le modèle déjà lu, expose la référence du gestionnaire de redimensionnement pour pouvoir l’enlever et vérifie l’annulation avant de démarrer le suivi.
