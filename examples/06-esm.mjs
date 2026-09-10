import {parseAddress, getProvince} from '../dist/index.js';

console.log(parseAddress({address: 'DHA Phase 6 Lahore'}));
console.log(getProvince({city: 'Karachi'}));
