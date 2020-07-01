export interface PriceTable {
  'Insulation': {[key: number]: number};
  'Pipes': {
      'PEX': PipesBySize;
      'Copper': PipesBySize;
      'Stainless Steel': PipesBySize;
      'HDPE': PipesBySize;
      'GMS': PipesBySize;
      'Cast Iron': PipesBySize;
  };
  'Valves': {
      'Ball Valve': Valve;
      'Gate Valve': Valve;
      'Butterfly Valve': Valve;
      'Tee': Valve;
      'Elbow': Valve;
      'Water Meter': Valve;
      'Strainer': Valve;
      'Check Valve': Valve;
  };
  'Fixtures': {[key: string]: number};
  'Plants': {
      'Hot Water Plant': number;
      'Storage Tank': number;
      'Pump': number;
      'Custom': number;
  };
  'Components': {
      'PRV': {[key: number]: number};
      'TMV': number;
      'RPZD': {[key: number]: number};
      'Tempering Valve': number;
      'Balancing Valve': {[key: number]: number};
  };
}

export interface PipesBySize {[key: number]: number}

export interface Valve {
    'PEX': PipesBySize;
    'Copper': PipesBySize;
    'Stainless Steel': PipesBySize;
    'HDPE': PipesBySize;
    'GMS': PipesBySize;
    'Cast Iron': PipesBySize;
}