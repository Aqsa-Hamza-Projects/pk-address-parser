import {
  getProvince,
  getCity,
  listProvinces,
  listCities,
  listAreas,
  isProvince,
  isCity,
} from '../dist/index.js';

console.log('provinces:', listProvinces());
console.log('getProvince(Lahore):', getProvince({city: 'Lahore'}));
console.log(
  'getCity(Punjab, lhr):',
  getCity({province: 'Punjab', city: 'lhr'})
);
console.log(
  'getCity(Sindh, Lahore):',
  getCity({province: 'Sindh', city: 'Lahore'})
);
console.log(
  'Sindh cities (first 10):',
  listCities({province: 'Sindh'}).slice(0, 10)
);
console.log(
  'Lahore areas (first 10):',
  listAreas({city: 'Lahore'}).slice(0, 10)
);
console.log('isProvince(KPK):', isProvince({name: 'KPK'}));
console.log('isCity(Karachi):', isCity({name: 'Karachi'}));
