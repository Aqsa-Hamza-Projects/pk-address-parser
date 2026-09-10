export interface RawPlace {
  name: string;
  asciiname: string;
  alt: string[];
  lat: number;
  lng: number;
  population: number;
  featureClass: string;
  featureCode: string;
  admin1: string; // full code e.g. "PK.04"
  admin2: string; // full code e.g. "PK.04.123"
}

export interface Admin {
  code: string;
  name: string;
  asciiName: string;
}

export interface Dump {
  places: RawPlace[];
  admin1: Admin[];
  admin2: Admin[];
  dumpDate: string;
}

export interface Overrides {
  provinceAliases: Record<string, string[]>;
  cityAliases: Record<string, string[]>;
  areas: Array<{name: string; aliases: string[]; cities: string[]}>;
}
