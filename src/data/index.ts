import type { Content } from '../core/content';
import { toRecord } from './dsl';
import { starters } from './starters';
import { tutorial } from './tutorial';
import { era0 } from './era0';
import { era1 } from './era1';
import { era2 } from './era2';
import { era3 } from './era3';
import { era4 } from './era4';
import { rewards } from './rewards';
import { consequences } from './consequences';
import { rivalFriendly, rivalHostile, rivalNames, rivalNeutral } from './rival';
import { crises, crisisCards } from './crises';
import { wonders } from './wonders';
import { eras } from './eras';
import { tuneCard } from './tuning';

const allCards = [
  ...starters,
  ...tutorial,
  ...era0,
  ...era1,
  ...era2,
  ...era3,
  ...era4,
  ...rewards,
  ...consequences,
  ...rivalHostile,
  ...rivalNeutral,
  ...rivalFriendly,
  ...crisisCards,
].map(tuneCard);

export const content: Content = {
  cards: toRecord(allCards),
  eras,
  starters: starters.map((c) => c.id),
  tutorial: tutorial.map((c) => c.id),
  eraPools: [era0, era1, era2, era3, era4].map((p) => p.map((c) => c.id)),
  rewards: rewards.map((c) => c.id),
  crises,
  wonders,
  rival: {
    names: rivalNames,
    hostile: rivalHostile.map((c) => c.id),
    neutral: rivalNeutral.map((c) => c.id),
    friendly: rivalFriendly.map((c) => c.id),
  },
};

export const CARD_COUNT = allCards.length;
