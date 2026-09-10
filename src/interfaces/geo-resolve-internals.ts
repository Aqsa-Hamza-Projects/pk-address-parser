/** Internal token/window shapes used only by `src/parser/geo-resolve.ts`. */

export interface Tok {
  raw: string;
  used: boolean;
}

/** A contiguous run of tokens considered as one gazetteer-key candidate. */
export interface TokenWindow {
  start: number;
  len: number;
  slice: Tok[];
}
