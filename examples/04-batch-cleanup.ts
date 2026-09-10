import {parseAddress, normalizeAddress} from '../dist/index.js';

const dirty = [
  'h#12 st4 blk c johar town lhr',
  'DHA Phase 5, Lahore',
  'near packages mall, walton road, lahore',
  'flat 3, 2nd floor, clifton, karachi',
  'g-9/4 islamabad',
  'saddar, rawalpindi',
  'hayatabad phase 6, peshawar',
  'model town, gujranwala',
];

console.table(
  dirty.map((raw) => {
    const p = parseAddress({address: raw});
    return {
      raw,
      normalized: normalizeAddress({address: raw}),
      city: p.city,
      province: p.province,
      confidence: p.confidence,
    };
  })
);
