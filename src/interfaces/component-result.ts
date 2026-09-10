import type {ComponentMatch} from './component-match.js';

export interface ComponentResult {
  matches: ComponentMatch[];
  remainder: string;
}
