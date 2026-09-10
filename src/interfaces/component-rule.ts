import type {ComponentField} from '../types/index.js';

export interface ComponentRule {
  field: ComponentField;
  /** Must have exactly one capture group = the value. */
  re: RegExp;
  transform?: (raw: string) => string;
}
