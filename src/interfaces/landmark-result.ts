export interface LandmarkResult {
  landmark: string | null;
  /** Canonical, title-cased preposition (e.g. "Near", "Opposite"). */
  preposition: string | null;
  /** Text after the preposition, original casing. */
  rest: string | null;
}
