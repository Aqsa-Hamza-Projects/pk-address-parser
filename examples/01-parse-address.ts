import {parseAddress} from '../dist/index.js';

const inputs = [
  'House 23, Street 4, Block B, Johar Town, Lahore',
  'DHA Phase 6 Lahore',
  'Near Emporium Mall, Johar Town, Lahore',
  // Rural Punjab: the chak number is the locality.
  'House 12, Chak 45/JB, Faisalabad',
  // Hyderabad: Unit N is a formal sub-division of Latifabad.
  'Latifabad Unit 7, Hyderabad',
];

for (const address of inputs) {
  console.log('IN :', address);
  console.log('OUT:', parseAddress({address}));
  console.log();
}
