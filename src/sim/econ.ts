import { content } from '../data';
import { Engine } from '../core/engine';
import { PROFILES, chooseIndex } from './bots';
import { Rng } from '../core/rng';
for (const name of ['lecteur', 'gourmand', 'prudent']) {
  const p = PROFILES.find((x) => x.name === name)!;
  const agg = [0, 1, 2, 3, 4].map(() => ({ n: 0, q: 0, V: 0, A: 0, S: 0, T: 0, gain: 0, loss: 0 }));
  for (let i = 0; i < 60; i++) {
    const e = new Engine(content);
    const rng = new Rng(i * 99991 + 7);
    const s = e.newGame(1 + i * 7919, { dessein: rng.pick(content.desseins).id });
    let lastEra = 0, g = 0;
    while (s.phase !== 'fin' && g++ < 400) {
      const before = s.quartiers;
      const ev = e.act(s, chooseIndex(e, s, p, rng));
      for (const x of ev) if (x.type === 'quartiers') { if (x.delta > 0) agg[s.era].gain += x.delta; else agg[s.era].loss -= x.delta; }
      if (s.era !== lastEra || (s.phase as string) === 'fin') {
        const a = agg[lastEra];
        a.n++; a.q += s.quartiers; a.V += s.res.vivres; a.A += s.res.armee; a.S += s.res.savoir; a.T += s.res.tresor;
        lastEra = s.era;
      }
      void before;
    }
  }
  console.log(name);
  agg.forEach((a, i) => a.n && console.log(`  fin ère ${i + 1}: quartiers ${(a.q / a.n).toFixed(1)}  V ${(a.V / a.n).toFixed(0)} A ${(a.A / a.n).toFixed(0)} S ${(a.S / a.n).toFixed(0)} T ${(a.T / a.n).toFixed(0)}   +${(a.gain / 60).toFixed(1)} / -${(a.loss / 60).toFixed(1)} quartiers`));
}
