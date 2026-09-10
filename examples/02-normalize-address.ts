import {normalizeAddress} from '../dist/index.js';

for (const address of [
  'lahore johar town',
  'House 23, Street 4, Block B, Johar Town, Lahore',
  'h#7 st 12 f-8/3 islamabad',
  'totally unknown place',
]) {
  console.log(
    JSON.stringify(address),
    '=>',
    JSON.stringify(normalizeAddress({address}))
  );
}
