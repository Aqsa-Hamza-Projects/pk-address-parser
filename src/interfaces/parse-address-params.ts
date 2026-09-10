export interface ParseAddressParams {
  /** The raw, free-text address to parse. Required. */
  address: string;
  /** Used as `city` when the input has no recognizable city. */
  defaultCity?: string;
  /** Used as `province` when neither the input nor the city implies one. */
  defaultProvince?: string;
  /**
   * When true, an unrecognized leftover segment is NOT guessed as `area`;
   * it goes to `unmatched` instead. Default false.
   */
  strict?: boolean;
}
