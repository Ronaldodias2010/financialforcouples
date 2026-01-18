export interface MileageProgramConfig {
  code: string;
  name: string;
  logo: string;
  primaryColor: string;
  country: 'BR' | 'US' | 'INTL';
  hasOAuth: boolean;
  oauthUrl?: string;
  estimatedValuePerMile: number; // Valor em centavos (BRL para BR, USD convertido para US)
}

export const MILEAGE_PROGRAMS: MileageProgramConfig[] = [
  {
    code: 'latam_pass',
    name: 'LATAM Pass',
    logo: '/mileage-logos/latam-pass.png',
    primaryColor: '#1B1464',
    country: 'BR',
    hasOAuth: true,
    oauthUrl: 'https://api.latam-pass.latam.com/oauth/authorize',
    estimatedValuePerMile: 2.87
  },
  {
    code: 'smiles',
    name: 'Smiles',
    logo: '/mileage-logos/smiles.png',
    primaryColor: '#FF6600',
    country: 'BR',
    hasOAuth: false,
    estimatedValuePerMile: 2.50
  },
  {
    code: 'livelo',
    name: 'Livelo',
    logo: '/mileage-logos/livelo.png',
    primaryColor: '#E5007D',
    country: 'BR',
    hasOAuth: false,
    estimatedValuePerMile: 1.80
  },
  {
    code: 'aa',
    name: 'AAdvantage',
    logo: '/mileage-logos/aa.svg',
    primaryColor: '#0074C4',
    country: 'US',
    hasOAuth: false,
    estimatedValuePerMile: 7.50
  },
  {
    code: 'united',
    name: 'MileagePlus',
    logo: '/mileage-logos/united.svg',
    primaryColor: '#002244',
    country: 'US',
    hasOAuth: false,
    estimatedValuePerMile: 6.50
  },
  {
    code: 'delta',
    name: 'SkyMiles',
    logo: '/mileage-logos/delta.svg',
    primaryColor: '#003366',
    country: 'US',
    hasOAuth: false,
    estimatedValuePerMile: 5.80
  }
];

export const getProgramByCode = (code: string): MileageProgramConfig | undefined => {
  return MILEAGE_PROGRAMS.find(p => p.code === code);
};

export const getAvailablePrograms = (): MileageProgramConfig[] => {
  return MILEAGE_PROGRAMS;
};

export const formatMilesValue = (miles: number, valuePerMile: number): string => {
  const value = (miles * valuePerMile) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
