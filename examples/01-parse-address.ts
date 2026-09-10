import {parseAddress} from '../dist/index.js';

const inputs = [
  'House 23, Street 4, Block B, Johar Town, Lahore',
  'DHA Phase 6 Lahore',
  'Near Emporium Mall, Johar Town, Lahore',
];

for (const address of inputs) {
  console.log('IN :', address);
  console.log('OUT:', parseAddress({address}));
  console.log();
}
