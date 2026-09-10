import type {ParsedAddress} from '../../src/interfaces/index.js';

export interface Fixture {
  input: string;
  expect: Partial<ParsedAddress>;
}

/**
 * Real-world Pakistani addresses. Every `expect` field below is asserted
 * verbatim against the shipped gazetteer (204 cities / 3230 areas). Where the
 * gazetteer's canonical form differs from the colloquial input (e.g. "Iqbal
 * Town" -> "Allama Iqbal Town", "Defence" -> "DHA", "Malir" -> "Malir City")
 * the expectation uses the canonical form the parser actually returns.
 */
export const fixtures: Fixture[] = [
  // --- 3 spec examples (exact) -------------------------------------------------
  {
    input: 'House 23, Street 4, Block B, Johar Town, Lahore',
    expect: {
      house: '23',
      street: '4',
      block: 'B',
      area: 'Johar Town',
      city: 'Lahore',
      province: 'Punjab',
      country: 'Pakistan',
    },
  },
  {
    input: 'DHA Phase 6 Lahore',
    expect: {phase: '6', area: 'DHA', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Near Emporium Mall, Johar Town, Lahore',
    expect: {
      landmark: 'Near Emporium Mall',
      area: 'Johar Town',
      city: 'Lahore',
      province: 'Punjab',
    },
  },

  // --- other spec-brief fixtures ---------------------------------------------
  {
    input: 'Flat 12-C, Clifton, Karachi',
    expect: {
      unit: 'Flat 12-C',
      area: 'Clifton',
      city: 'Karachi',
      province: 'Sindh',
    },
  },
  {
    input: 'House 7, Street 12, F-8/3, Islamabad',
    expect: {
      house: '7',
      street: '12',
      sector: 'F-8/3',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
    },
  },
  {
    input: 'Hayatabad Phase 2, Peshawar',
    expect: {
      phase: '2',
      area: 'Hayatabad',
      city: 'Peshawar',
      province: 'Khyber Pakhtunkhwa',
    },
  },
  {
    input: 'Satellite Town, Rawalpindi',
    expect: {area: 'Satellite Town', city: 'Rawalpindi', province: 'Punjab'},
  },
  {
    input: 'quetta cantt',
    expect: {area: 'Cantt', city: 'Quetta', province: 'Balochistan'},
  },
  {
    input: 'opp. Chase Up, Model Town, Lahore',
    expect: {
      landmark: 'Opposite Chase Up',
      area: 'Model Town',
      city: 'Lahore',
    },
  },
  {input: '  ', expect: {city: null, province: null, confidence: 0}},

  // --- Lahore ---------------------------------------------------------------
  {
    input: 'House 12, Block C, Gulberg, Lahore',
    expect: {
      house: '12',
      block: 'C',
      area: 'Gulberg',
      city: 'Lahore',
      province: 'Punjab',
    },
  },
  {
    input: 'House No. 45, Street 8, Wapda Town, Lahore',
    expect: {
      house: '45',
      street: '8',
      area: 'Wapda Town',
      city: 'Lahore',
      province: 'Punjab',
    },
  },
  {
    input: 'Garden Town, Lahore',
    expect: {area: 'Garden Town', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Township, Lahore',
    expect: {area: 'Township', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Samanabad, Lahore',
    expect: {area: 'Samanabad', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Shadman, Lahore',
    expect: {area: 'Shadman', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Cantt, Lahore',
    expect: {area: 'Cantt', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'Iqbal Town, Lahore',
    expect: {area: 'Allama Iqbal Town', city: 'Lahore', province: 'Punjab'},
  },
  {
    input: 'House 3, Askari 10, Lahore',
    expect: {
      house: '3',
      area: 'Askari 10',
      city: 'Lahore',
      province: 'Punjab',
    },
  },
  {
    input: 'behind Expo Center, Johar Town, Lahore',
    expect: {
      landmark: 'Behind Expo Center',
      area: 'Johar Town',
      city: 'Lahore',
      province: 'Punjab',
    },
  },

  // --- Karachi ------------------------------------------------------------
  {
    input: 'House 12, Block C, Gulshan-e-Iqbal, Karachi',
    expect: {
      house: '12',
      block: 'C',
      area: 'Gulshan-e-Iqbal',
      city: 'Karachi',
      province: 'Sindh',
    },
  },
  {
    input: 'North Nazimabad, Karachi',
    expect: {area: 'North Nazimabad', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'Defence, Karachi',
    expect: {area: 'DHA', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'Bahadurabad, Karachi',
    expect: {area: 'Bahadurabad', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'PECHS, Karachi',
    expect: {area: 'PECHS', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'Malir, Karachi',
    expect: {area: 'Malir City', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'Korangi, Karachi',
    expect: {area: 'Korangi', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'Saddar, Karachi',
    expect: {area: 'Saddar', city: 'Karachi', province: 'Sindh'},
  },
  {
    input: 'H #10, Phase 4 DHA, Karachi',
    expect: {
      house: '10',
      phase: '4',
      area: 'DHA',
      city: 'Karachi',
      province: 'Sindh',
    },
  },

  // --- Islamabad / Rawalpindi -------------------------------------------------
  {
    input: 'F-10 Markaz, Islamabad',
    expect: {
      sector: 'F-10',
      area: 'Markaz',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
    },
  },
  {
    input: 'Blue Area, Islamabad',
    expect: {
      area: 'Blue Area',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
    },
  },
  {
    input: 'Bara Kahu, Islamabad',
    expect: {
      area: 'Bara Kahu',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
    },
  },
  {
    input: 'Plot 21, I-9, Islamabad',
    expect: {
      house: '21',
      sector: 'I-9',
      city: 'Islamabad',
      province: 'Islamabad Capital Territory',
    },
  },
  {
    input: 'House 7, Street 5, Bahria Town Phase 7, Rawalpindi',
    expect: {
      house: '7',
      street: '5',
      phase: '7',
      area: 'Bahria Town',
      city: 'Rawalpindi',
      province: 'Punjab',
    },
  },
  {
    input: 'House 22, Satellite Town Block B, Rawalpindi',
    expect: {
      house: '22',
      block: 'B',
      area: 'Satellite Town',
      city: 'Rawalpindi',
      province: 'Punjab',
    },
  },
  {
    input: 'Chaklala Scheme 3, Rawalpindi',
    expect: {area: 'Chak Lala', city: 'Rawalpindi', province: 'Punjab'},
  },
  {
    input: 'Westridge, Rawalpindi',
    expect: {area: 'Westridge', city: 'Rawalpindi', province: 'Punjab'},
  },
  {
    input: 'Cantt, Rawalpindi',
    expect: {area: 'Cantt', city: 'Rawalpindi', province: 'Punjab'},
  },

  // --- Faisalabad / Gujranwala / Sialkot / Multan / Bahawalpur / Sargodha ---
  {
    input: 'House 9, Peoples Colony, Faisalabad',
    expect: {
      house: '9',
      area: 'Peoples Colony',
      city: 'Faisalabad',
      province: 'Punjab',
    },
  },
  {
    input: 'Madina Town, Faisalabad',
    expect: {area: 'Madina Town', city: 'Faisalabad', province: 'Punjab'},
  },
  {
    input: 'Cantt, Faisalabad',
    expect: {area: 'Cantt', city: 'Faisalabad', province: 'Punjab'},
  },
  {
    input: 'Model Town, Gujranwala',
    expect: {area: 'Model Town', city: 'Gujranwala', province: 'Punjab'},
  },
  {
    input: 'Satellite Town, Gujranwala',
    expect: {area: 'Satellite Town', city: 'Gujranwala', province: 'Punjab'},
  },
  {
    input: 'Cantonment, Sialkot',
    expect: {area: 'Cantonment', city: 'Sialkot', province: 'Punjab'},
  },
  {
    input: 'Paris Road, Sialkot',
    expect: {area: 'Paris Road', city: 'Sialkot', province: 'Punjab'},
  },
  {
    input: 'Kothi 88, Model Town, Multan',
    expect: {
      house: '88',
      area: 'Model Town',
      city: 'Multan',
      province: 'Punjab',
    },
  },
  {
    input: 'Gulgasht Colony, Multan',
    expect: {area: 'Gulgasht Colony', city: 'Multan', province: 'Punjab'},
  },
  {
    input: 'Bosan Road, Multan',
    expect: {area: 'Bosan Road', city: 'Multan', province: 'Punjab'},
  },
  {
    input: 'Model Town A, Bahawalpur',
    expect: {area: 'Model Town A', city: 'Bahawalpur', province: 'Punjab'},
  },
  {
    input: 'Cantt, Bahawalpur',
    expect: {area: 'Cantt', city: 'Bahawalpur', province: 'Punjab'},
  },
  {
    input: 'Satellite Town, Sargodha',
    expect: {area: 'Satellite Town', city: 'Sargodha', province: 'Punjab'},
  },
  {
    input: 'University Road, Sargodha',
    expect: {area: 'University Road', city: 'Sargodha', province: 'Punjab'},
  },

  // --- Khyber Pakhtunkhwa ---------------------------------------------------
  {
    input: 'University Town, Peshawar',
    expect: {
      area: 'University Town',
      city: 'Peshawar',
      province: 'Khyber Pakhtunkhwa',
    },
  },
  {
    input: 'Shop 4, Cantt, Peshawar',
    expect: {
      unit: 'Shop 4',
      area: 'Cantt',
      city: 'Peshawar',
      province: 'Khyber Pakhtunkhwa',
    },
  },
  {
    input: 'Supply, Abbottabad',
    expect: {
      area: 'Supply',
      city: 'Abbottabad',
      province: 'Khyber Pakhtunkhwa',
    },
  },
  {
    input: 'Cantt, Mardan',
    expect: {area: 'Cantt', city: 'Mardan', province: 'Khyber Pakhtunkhwa'},
  },
  {
    input: 'Kohat',
    expect: {
      city: 'Kohat',
      province: 'Khyber Pakhtunkhwa',
      area: null,
    },
  },

  // --- Sindh (ex-Karachi) -------------------------------------------------
  {
    input: 'Qasimabad, Hyderabad',
    expect: {area: 'Qasimabad', city: 'Hyderabad', province: 'Sindh'},
  },
  {
    input: 'Auto Bhan Road, Hyderabad',
    expect: {area: 'Auto Bhan Road', city: 'Hyderabad', province: 'Sindh'},
  },
  {
    input: 'Near PSO Pump, Saddar, Hyderabad',
    expect: {
      landmark: 'Near PSO Pump',
      area: 'Saddar',
      city: 'Hyderabad',
      province: 'Sindh',
    },
  },
  {
    input: 'Military Road, Sukkur',
    expect: {area: 'Military Road', city: 'Sukkur', province: 'Sindh'},
  },
  {
    input: 'Station Road, Larkana',
    expect: {area: 'Station Road', city: 'Larkana', province: 'Sindh'},
  },
  {
    input: 'Nawabshah',
    expect: {city: 'Nawabshah', province: 'Sindh', area: null},
  },

  // --- Balochistan --------------------------------------------------------
  {
    input: 'Jinnah Town, Quetta',
    expect: {area: 'Jinnah Town', city: 'Quetta', province: 'Balochistan'},
  },
  {
    input: 'Satellite Town, Quetta',
    expect: {
      area: 'Satellite Town',
      city: 'Quetta',
      province: 'Balochistan',
    },
  },

  // --- bare cities -------------------------------------------------------
  {input: 'Sahiwal', expect: {city: 'Sahiwal', province: 'Punjab', area: null}},
  {
    input: 'Dera Ghazi Khan',
    expect: {city: 'Dera Ghazi Khan', province: 'Punjab', area: null},
  },
  {
    input: 'Rahim Yar Khan',
    expect: {city: 'Rahim Yar Khan', province: 'Punjab', area: null},
  },

  // --- edge cases -------------------------------------------------------
  {
    input: 'Zzz Colony, Lahore',
    expect: {
      area: 'Zzz Colony',
      city: 'Lahore',
      province: 'Punjab',
      unmatched: [],
    },
  },
  {
    input: 'House 5, Some Colony',
    expect: {
      house: '5',
      city: null,
      province: null,
      area: null,
      unmatched: ['Some', 'Colony'],
      confidence: 0,
    },
  },
];
