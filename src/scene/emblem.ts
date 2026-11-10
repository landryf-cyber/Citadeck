/** Emblème d'une merveille : sa silhouette telle qu'elle apparaîtra dans le paysage. */
import { drawElem, type DrawEnv, type Elem } from './city';

const BOX: Record<string, [number, number]> = {
  w_pierres: [8.4, 3.8],
  w_pyramide: [13.5, 6.6],
  w_phare: [4.2, 10.8],
  w_bibliotheque: [9.8, 6.4],
  w_muraille: [16.4, 4.5],
  w_jardins: [9.8, 6.8],
  w_colisee: [10.6, 5.8],
  w_cathedrale: [11.6, 12],
  w_universite: [10.8, 8],
  w_horloge: [4, 14],
  w_barrage: [12.4, 5.6],
  w_ascenseur: [6, 13],
};

export function wonderEmblem(id: string, hue: number, size = 420): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const bg = ctx.createRadialGradient(size / 2, size * 0.6, 0, size / 2, size * 0.55, size * 0.62);
  bg.addColorStop(0, `hsl(${hue} 85% 62%)`);
  bg.addColorStop(0.35, `hsl(${hue} 70% 30%)`);
  bg.addColorStop(1, '#08070c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  // rayons discrets
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    ctx.fillStyle = `hsla(${hue}, 90%, 80%, 0.05)`;
    ctx.beginPath();
    ctx.moveTo(size / 2, size * 0.62);
    ctx.lineTo(size / 2 + Math.cos(a - 0.07) * size, size * 0.62 + Math.sin(a - 0.07) * size);
    ctx.lineTo(size / 2 + Math.cos(a + 0.07) * size, size * 0.62 + Math.sin(a + 0.07) * size);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  const [bw, bh] = BOX[id] ?? [10, 8];
  const k = Math.min((size * 0.74) / bw, (size * 0.58) / bh);
  const baseY = size * 0.8;
  // sol
  ctx.fillStyle = '#07060b';
  ctx.fillRect(0, baseY, size, size - baseY);
  const env: DrawEnv = {
    ctx,
    era: 2,
    t: 1.3,
    body: '#07060b',
    window: `hsl(${hue} 100% 82%)`,
    accent: `hsl(${(hue + 300) % 360} 90% 72%)`,
    gold: 'hsl(44 100% 78%)',
    crop: '#999',
    lit: 1,
    gilded: 1,
    flicker: 0,
    emit: () => undefined,
  };
  const e: Elem = { key: id, kind: 'wonder', sub: id, x: 0.5, layer: 0, size: 1, r: 0.5, r2: 0.5, age: 0, state: 0 };
  ctx.save();
  ctx.translate(size / 2, baseY);
  ctx.scale(k, -k);
  drawElem(env, e, 0, 1);
  ctx.restore();
  return c;
}
