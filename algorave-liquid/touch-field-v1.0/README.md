# TOUCH / FIELD — Version 1.0

**Baseline figée : 20 novembre 2026.**

Cette version est une copie préservée de `algorave-liquid/touch-field-mono-startup/index.html`, renommée comme version officielle **1.0**. Le code source des étapes précédentes reste dans ses chemins GitHub respectifs. Pour la suite, créer de nouvelles versions dans de nouveaux dossiers plutôt que modifier ce fichier de référence.

## Concept artistique

**L'ASCII est l'instrument, pas une simple visualisation musicale.** Les caractères forment une matière sonore et visuelle interactive. Les gestes tactiles, la main et le visage modulent la composition.

## Capacités conservées

- Interface unique au style terminal, **menus noir et blanc** et caractères monospace; animation ASCII conserve les palettes colorées.
- Écran d'animation ASCII dense, profondeur sur trois plans, alphabets par univers et par moteur, scintillement sensible au son et mémoire des gestes.
- Univers : DRIFT, FLOW, DESIRE, VELVET, ABYSS.
- Moteurs Web Audio : PAD, NEBULA, PRISM, RESONANCE, DRONE, CS-80 STYLE, GONG BATH (synthèses web, non émulations matérielles).
- Jeu tactile : organismes sonores persistants, interactions et physique ASCII élastique.
- Webcam frontale facultative, suivi local des points visage/main via MediaPipe chargé depuis des serveurs tiers ; classification approximative des gestes et manuel ASCII.
- Musique gestuelle : pincement pour jouer, hauteur de la main pour la note, vitesse pour la vélocité, position et taille apparente pour la spatialisation virtuelle HRTF.
- Visage : modulation du son par la bouche et vagues ASCII par les mouvements.
- MASTER : LEVEL, WIDTH, SPACE. Effets gestuels : DELAY et REVERB.
- Réactivité main/visage et envois vers les effets augmentés de **10 %**, avec limites sur certains paramètres.
- Performance : AUDIO, FREEZE, REPLAY, CLEAR, SOUND, enregistrement jusqu'à 30 secondes sous réserve du support du navigateur.

## Ordre du menu

01. START / AUDIO
02. CAMERA / ENABLE (inclut les bascules HAND MUSIC, FACE MUSIC, FACE WAVES)
03. CHARACTER / WORLD
04. AUDIO / ENGINE
05. MASTER / STEREO AMBIENCE
06. GESTURE / MANUAL
07. MOVEMENT / FX

Les commandes de performance figurent dans la section START / AUDIO.

## Limitations connues et précautions

- La reconnaissance main/visage nécessite la permission caméra, un contexte HTTPS et un chargement réseau initial des modules et modèles MediaPipe. La vidéo est traitée localement par le code du prototype.
- Les écouteurs stéréo permettent de mieux distinguer l'effet HRTF. La profondeur est estimée par la taille de la main apparente, **pas** mesurée en 3D.
- Le fonctionnement final de Safari iPhone, les performances CPU/batterie, les cas de perte de suivi, les niveaux audio et la capture vidéo demandent une validation sur appareil.
- Le code a fait l'objet d'une vérification syntaxique JavaScript et de présence des identifiants d'interface lors de la copie, non d'une campagne de tests d'intégration.
- La bibliothèque MediaPipe et les ressources distantes sont des dépendances de réseau.

## Provenance

Source de la copie : `algorave-liquid/touch-field-mono-startup/index.html`.

Entrée officielle 1.0 : `algorave-liquid/touch-field-v1.0/index.html`.

La version 1.0 est une **base de développement**, et non une promesse que tous ses modules ont passé des tests de production sur iPhone.
