import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function writeData(
  dir: string,
  data: {provinces: object; cities: object; areas: object}
): void {
  writeFileSync(join(dir, 'provinces.json'), JSON.stringify(data.provinces));
  writeFileSync(join(dir, 'cities.json'), JSON.stringify(data.cities));
  writeFileSync(join(dir, 'areas.json'), JSON.stringify(data.areas));
}
