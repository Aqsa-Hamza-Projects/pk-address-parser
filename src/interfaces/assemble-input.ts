import type {ComponentMatch} from './component-match.js';
import type {GeoResolution} from './geo-resolution.js';

export interface AssembleInput {
  raw: string;
  components: ComponentMatch[];
  landmark: string | null;
  phone: string | null;
  geo: GeoResolution;
  strict: boolean;
}
