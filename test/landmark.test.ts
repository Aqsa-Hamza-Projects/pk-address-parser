import {describe, it, expect} from 'vitest';
import {extractLandmark} from '../src/parser/landmark.js';

describe('extractLandmark', () => {
  it("detects 'near' and title-cases the preposition", () => {
    expect(extractLandmark('near Emporium Mall').landmark).toBe(
      'Near Emporium Mall'
    );
  });
  it('keeps the original casing of the landmark name', () => {
    expect(extractLandmark('Near emporium mall').landmark).toBe(
      'Near emporium mall'
    );
  });
  it("expands 'opp' / 'opp.' to 'Opposite'", () => {
    expect(extractLandmark('opp. Chase Up').landmark).toBe('Opposite Chase Up');
    expect(extractLandmark('opp Chase Up').landmark).toBe('Opposite Chase Up');
  });
  it('handles multi-word prepositions', () => {
    expect(extractLandmark('in front of PSO pump').landmark).toBe(
      'In Front Of PSO pump'
    );
  });
  it('returns null when there is no landmark preposition', () => {
    expect(extractLandmark('Johar Town').landmark).toBeNull();
    expect(extractLandmark('nearby cafe').landmark).toBeNull(); // 'nearby' is not 'near'
  });
});
