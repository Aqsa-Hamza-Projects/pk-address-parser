const {parseAddress, normalizeAddress} = require('../dist/index.cjs');

console.log(
  parseAddress({address: 'House 23, Street 4, Block B, Johar Town, Lahore'})
);
console.log(normalizeAddress({address: 'lahore johar town'}));
