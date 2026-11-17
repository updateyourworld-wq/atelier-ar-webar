'use strict';

const FRAME_COUNT = 48;
const FPS = 24;
const TARGET = './assets/target/card.mind';
const $ = id => document.getElementById(id);
const preview = $('preview');
const ctx = preview.getContext('2d');
const textureCanvas = document.createElement('canvas');
textureCanvas.width = preview.width;
textureCanvas.height = preview.height;
const textureCtx = textureCanvas.getContext('2d');
let session = null;
let frames = null;
let frameJob = null;
let currentFrame = -1;

function loadFrames() {
  if (frameJob) return frameJob;
  $('previewStatus').textContent = 'Chargement de l’animation…';
  frameJob = Promise.all(Array.from({length: FRAME_COUNT}, (_, i) => new Promise((resolve, reject) => {
    const img = new Image();
    const path = `./assets/frames/frame_${String(i).padStart(3, '0')}.png`;
    img.onload = () => img.naturalWidth === preview.width && img.naturalHeight === preview.height
      ? resolve(img) : reject(new Error(`Dimensions incorrectes : ${path}.`));
    img.onerror = () => reject(new Error(`PNG introuvable ou illisible : ${path}.`));
    img.src = path;
  }))).then(images => {
    frames = images;
    $('previewStatus').textContent = '';
  }).catch(error => {
    frameJob = null;
    $('previewStatus').textContent = error.message;
    throw error;
  });
  return frameJob;
}

function render(now) {
  requestAnimationFrame(render);
  if (!frames || document.hidden) return;
  const i = Math.floor(now * FPS / 1000) % FRAME_COUNT;
  if (i === currentFrame) return;
  currentFrame = i;
  for (const canvasCtx of [ctx, textureCtx]) {
    canvasCtx.clearRect(0, 0, preview.width, preview.height);
    canvasCtx.drawImage(frames[i], 0, 0);
  }
  if (session?.texture) session.texture.needsUpdate = true;
}
requestAnimationFrame(render);
loadFrames().catch(() => {});

const hasEngine = window.AFRAME?.components['mindar-image'] && window.AFRAME?.systems['mindar-image-system'];
if (hasEngine) AFRAME.registerComponent('transparent-art', {
  init() {
    const THREE = AFRAME.THREE;
    this.texture = new THREE.CanvasTexture(textureCanvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.PlaneGeometry(0.75, 0.75);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture, transparent: true, side: THREE.DoubleSide, depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.02;
    this.el.setObject3D('mesh', mesh);
    if (session) session.texture = this.texture;
  },
  remove() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.geometry.dispose();
    mesh.material.dispose();
    this.texture.dispose();
    this.el.removeObject3D('mesh');
  }
});

function waitFor(s, job, ms, message) {
  const signal = s.abort.signal;
  return new Promise((resolve, reject) => {
    const aborted = () => finish(reject, new DOMException('Annulé', 'AbortError'));
    const timer = setTimeout(() => finish(reject, new Error(message)), ms);
    function finish(callback, value) {
      clearTimeout(timer);
      signal.removeEventListener('abort', aborted);
      callback(value);
    }
    job.then(value => finish(resolve, value), error => finish(reject, error));
    if (signal.aborted) aborted();
    else signal.addEventListener('abort', aborted, {once: true});
  });
}

function eventOnce(el, name, signal) {
  return new Promise(resolve => el.addEventListener(name, resolve, {once: true, signal}));
}

function phase(title) {
  $('loadTitle').textContent = title;
  $('error').textContent = '';
  $('standalone').hidden = true;
  $('loading').classList.add('show');
  $('home').inert = true;
}

function scan(s, message) {
  $('status').textContent = message;
  $('reticle').hidden = false;
  clearTimeout(s.scanTimer);
  s.scanTimer = setTimeout(() => {
    if (session === s) $('status').textContent =
      'Cible non reconnue. Affiche la carte de test en entier, rapproche-toi et évite les reflets.';
  }, 9000);
}

function sceneFor(s) {
  const a = document.createElement('a-scene');
  a.setAttribute('mindar-image', `imageTargetSrc: ${TARGET}; autoStart: false; uiLoading: no; uiScanning: no; uiError: no`);
  a.setAttribute('renderer', 'colorManagement: true; antialias: true; alpha: true');
  a.setAttribute('vr-mode-ui', 'enabled: false');
  a.setAttribute('device-orientation-permission-ui', 'enabled: false');
  a.setAttribute('embedded', '');
  const camera = document.createElement('a-camera');
  camera.setAttribute('position', '0 0 0');
  camera.setAttribute('look-controls', 'enabled: false');
  camera.setAttribute('wasd-controls', 'enabled: false');
  const target = document.createElement('a-entity');
  target.setAttribute('mindar-image-target', 'targetIndex: 0');
  const art = document.createElement('a-entity');
  art.setAttribute('transparent-art', '');
  target.append(art);
  a.append(camera, target);
  const options = {signal: s.abort.signal};
  target.addEventListener('targetFound', () => {
    clearTimeout(s.scanTimer);
    $('status').textContent = 'IMAGE RECONNUE · ANIMATION ACTIVE';
    $('reticle').hidden = true;
  }, options);
  target.addEventListener('targetLost', () => scan(s, 'Image perdue · vise de nouveau la carte.'), options);
  return a;
}

function stopTracks(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

function cleanup(s) {
  if (!s || session !== s) return;
  session = null;
  s.abort.abort();
  clearTimeout(s.scanTimer);
  stopTracks(s.stream);
  if (s.video) {
    s.video.pause();
    s.video.srcObject = null;
    s.video.remove();
  }
  if (s.system) s.system.stop();
  // The component's removal also calls stop(); use the idempotent adapter above.
  s.scene?.pause();
  s.scene?.remove();
  s.scene?.renderer?.dispose();
  $('arScreen').classList.remove('active');
  $('home').style.display = '';
  $('appFooter').style.display = '';
}

function dismiss() {
  cleanup(session);
  $('loading').classList.remove('show');
  $('home').inert = false;
  $('start').focus();
}

function fail(s, error) {
  if (session !== s) return;
  const messages = {
    NotAllowedError: 'Accès à la caméra refusé. Dans Safari, vérifie les réglages du site → Caméra, puis réessaie. Si la page est intégrée, ouvre-la dans un onglet.',
    NotFoundError: 'Aucune caméra vidéo détectée.',
    NotReadableError: 'Impossible de lire la caméra. Ferme les autres applications qui l’utilisent puis réessaie.',
    OverconstrainedError: 'La caméra ne répond pas aux réglages demandés.',
    SecurityError: 'La caméra est bloquée par les réglages de sécurité du navigateur.'
  };
  cleanup(s);
  phase('Impossible de lancer la WebAR');
  $('error').textContent = messages[error.name] || error.message || String(error);
  $('standalone').hidden = window.self === window.top;
  $('cancel').focus();
}

async function start() {
  if (session) return;
  const s = session = {abort: new AbortController()};
  const signal = s.abort.signal;
  phase('Autorisation de la caméra…');
  $('cancel').focus();
  try {
    if (!isSecureContext) throw new Error('La caméra nécessite HTTPS. Sur le Mac, localhost fonctionne aussi.');
    if (!hasEngine) throw new Error(!window.AFRAME ? 'A-Frame n’a pas chargé.' : 'MindAR n’a pas chargé.');
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (policy && !policy.allowsFeature('camera')) throw new Error('Cette page intégrée bloque la caméra. Ouvre le prototype dans un onglet Safari.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra indisponible dans ce navigateur. Ouvre le prototype directement dans Safari.');

    // Request the camera in the button's click handler, before any await.
    const media = navigator.mediaDevices.getUserMedia({audio: false, video: {facingMode: {ideal: 'environment'}}})
      .then(stream => {
        if (signal.aborted) stopTracks(stream);
        else s.stream = stream;
        return stream;
      });
    await waitFor(s, media, 45000, 'Aucune réponse à la demande de caméra. Vérifie les permissions et réessaie.');
    s.stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
      fail(s, new Error('Le flux caméra a été interrompu. Relance la caméra.'));
    }, {once: true, signal}));

    phase('Chargement de la cible et des PNG…');
    const targetJob = fetch(TARGET, {signal}).then(async response => {
      if (!response.ok) throw new Error(`Cible .mind introuvable (HTTP ${response.status}).`);
      if (response.headers.get('content-type')?.startsWith('text/')) throw new Error('La cible .mind est invalide.');
      s.targetBuffer = await response.arrayBuffer();
      if (!s.targetBuffer.byteLength) throw new Error('La cible .mind est vide.');
    }).catch(error => {
      throw new Error(`Chargement de la cible : ${error.message}`);
    });
    await waitFor(s, Promise.all([loadFrames(), targetJob]), 18000, 'Délai dépassé pendant le chargement des PNG ou de la cible.');

    phase('Initialisation de la vidéo et de MindAR…');
    $('home').style.display = 'none';
    $('appFooter').style.display = 'none';
    $('arScreen').classList.add('active');
    const stage = $('arStage');
    const scene = s.scene = sceneFor(s);
    const rendered = eventOnce(scene, 'renderstart', signal);
    stage.append(scene);
    // Upstream stop() assumes video and controller already exist. Install safe
    // cleanup immediately so A-Frame removal can also handle partial startup.
    const system = s.system = scene.systems['mindar-image-system'];
    if (!system) throw new Error('Impossible d’initialiser le système MindAR.');
    system.stop = () => {
      if (system.atelierStopped) return;
      system.atelierStopped = true;
      window.removeEventListener('resize', system.atelierResize);
      system.controller?.dispose();
    };
    if (!scene.renderStarted) await waitFor(s, rendered, 15000, 'Le rendu WebGL n’a pas démarré.');
    if (signal.aborted) return;

    const video = s.video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.style.cssText = 'position:absolute;top:0;left:0;z-index:-1';
    stage.prepend(video);
    video.srcObject = s.stream;
    await waitFor(s, video.play(), 12000, 'La caméra a été autorisée, mais Safari ne lit pas le flux vidéo.');
    if (signal.aborted) return;
    if (!video.videoWidth || !video.videoHeight) throw new Error('La caméra ne fournit aucune image.');
    // MindAR 1.2.5 reads the element dimensions when copying frames.
    video.width = video.videoWidth;
    video.height = video.videoHeight;
    system.atelierTargetBuffer = s.targetBuffer;
    system.video = video;
    system.container = stage;

    // Pinned MindAR's start() acquires its own unabortable stream and returns
    // immediately. We own the stream; _startAR() compiles it into a tracker.
    try {
      await waitFor(s, system._startAR(), 20000, 'MindAR ne parvient pas à initialiser la reconnaissance.');
    } catch (error) {
      if (signal.aborted) return;
      throw new Error(`Initialisation MindAR : ${error.message}`);
    }
    if (signal.aborted) return;
    $('loading').classList.remove('show');
    $('exit').focus();
    scan(s, 'Vise la cible affichée sur un autre écran.');
  } catch (error) {
    fail(s, error);
  }
}

$('start').addEventListener('click', start);
$('exit').addEventListener('click', dismiss);
$('cancel').addEventListener('click', dismiss);
window.addEventListener('pagehide', () => { if (session) dismiss(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && session) dismiss(); });
