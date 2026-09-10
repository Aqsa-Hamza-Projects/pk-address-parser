export interface ProvinceRecord {
  name: string;
  aliases: string[];
}

export interface CityRecord {
  name: string;
  province: string;
  aliases: string[];
  lat: number;
  lng: number;
}

export interface AreaRecord {
  name: string;
  city: string;
  province: string;
  aliases: string[];
}

export interface GeoStore {
  provinces: ProvinceRecord[];
  cities: CityRecord[];
  areas: AreaRecord[];
  provinceByKey: Map<string, ProvinceRecord>;
  cityByKey: Map<string, CityRecord[]>;
  areaByKey: Map<string, AreaRecord[]>;
}
