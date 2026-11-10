import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-400-italic.css';
import '@fontsource/source-sans-3/latin-600.css';
import '@fontsource/source-sans-3/latin-700.css';
import './style.css';
import { content } from './data';
import { Engine } from './core/engine';
import { Scene } from './scene/scene';
import { AudioEngine } from './audio/audio';
import { Game } from './game';
import { loadSettings } from './save';

function makeGrain(): void {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const grain = document.getElementById('grain');
  if (grain) grain.style.backgroundImage = `url(${c.toDataURL()})`;
}

function main(): void {
  makeGrain();
  const settings = loadSettings();
  const params = new URLSearchParams(location.search);
  const fx = params.get('fx');
  if (fx === 'low' || fx === 'high' || fx === 'auto') settings.quality = fx;
  const engine = new Engine(content);
  const scene = new Scene(document.getElementById('scene') as HTMLCanvasElement);
  const audio = new AudioEngine();
  const game = new Game(engine, scene, audio, settings);

  window.addEventListener('resize', () => scene.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => scene.resize(), 200));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) scene.stop();
    else scene.start();
  });
  // empêche le défilement élastique et le zoom pendant le jeu
  document.addEventListener('touchmove', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest('.screen')) e.preventDefault();
  }, { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  scene.start();
  const start = () => game.boot();
  if (document.fonts?.ready) void document.fonts.ready.then(start);
  else start();

  // accès pour les scripts de capture et de test
  (window as unknown as { __citadeck: unknown }).__citadeck = { game, scene, engine, audio };
}

main();
