import { WORLD_CITIES, type CityData } from '@/data/world-cities';

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Main airport code per city (diaspora routes first). Unknown cities fall back to 3 letters. */
const IATA: Record<string, string> = {
  paris: 'CDG', lyon: 'LYS', marseille: 'MRS', nice: 'NCE', toulouse: 'TLS', bordeaux: 'BOD', lille: 'LIL', nantes: 'NTE',
  strasbourg: 'SXB', montpellier: 'MPL', bruxelles: 'BRU', brussels: 'BRU', geneve: 'GVA', zurich: 'ZRH', londres: 'LHR',
  london: 'LHR', madrid: 'MAD', barcelone: 'BCN', barcelona: 'BCN', rome: 'FCO', milan: 'MXP', lisbonne: 'LIS', lisbon: 'LIS',
  berlin: 'BER', francfort: 'FRA', frankfurt: 'FRA', amsterdam: 'AMS', istanbul: 'IST', dubai: 'DXB', doha: 'DOH',
  montreal: 'YUL', toronto: 'YYZ', ottawa: 'YOW', quebec: 'YQB', 'new york': 'JFK', washington: 'IAD', atlanta: 'ATL',
  houston: 'IAH', miami: 'MIA', chicago: 'ORD', 'los angeles': 'LAX',
  dakar: 'DSS', abidjan: 'ABJ', bamako: 'BKO', conakry: 'CKY', lome: 'LFW', cotonou: 'COO', ouagadougou: 'OUA',
  niamey: 'NIM', nouakchott: 'NKC', banjul: 'BJL', bissau: 'OXB', freetown: 'FNA', monrovia: 'ROB', accra: 'ACC',
  lagos: 'LOS', abuja: 'ABV', douala: 'DLA', yaounde: 'NSI', libreville: 'LBV', brazzaville: 'BZV', kinshasa: 'FIH',
  'pointe-noire': 'PNR', ndjamena: 'NDJ', "n'djamena": 'NDJ', bangui: 'BGF', malabo: 'SSG', casablanca: 'CMN',
  rabat: 'RBA', marrakech: 'RAK', tunis: 'TUN', alger: 'ALG', algiers: 'ALG', 'le caire': 'CAI', cairo: 'CAI',
  addis: 'ADD', 'addis-abeba': 'ADD', nairobi: 'NBO', kigali: 'KGL', johannesburg: 'JNB', 'le cap': 'CPT',
  antananarivo: 'TNR', 'port-louis': 'MRU', praia: 'RAI', 'saint-louis': 'XLS', ziguinchor: 'ZIG', 'bobo-dioulasso': 'BOY',
  kankan: 'KNN', bouake: 'BYK', 'san-pedro': 'SPY', kano: 'KAN', 'port harcourt': 'PHC', kumasi: 'KMS',
};

export function cityCode(city?: string | null): string {
  if (!city) return '—';
  const k = strip(city.split(',')[0]);
  return IATA[k] ?? k.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
}

export function findCity(city?: string | null): CityData | undefined {
  if (!city) return undefined;
  const k = strip(city.split(',')[0]);
  return WORLD_CITIES.find((c) => strip(c.city) === k);
}

export const countryOf = (city?: string | null) => findCity(city)?.country ?? '';

/** Accent-insensitive search; starts-with matches first. */
export function searchCities(query: string, limit = 8): CityData[] {
  const q = strip(query);
  if (!q) return [];
  const starts: CityData[] = [];
  const contains: CityData[] = [];
  for (const c of WORLD_CITIES) {
    const name = strip(c.city);
    if (name.startsWith(q)) starts.push(c);
    else if (name.includes(q) || strip(c.country).startsWith(q)) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

const IMAGES: Record<string, number> = {
  paris: require('@/assets/destinations/paris.jpg'),
  dakar: require('@/assets/destinations/dakar.jpg'),
  abidjan: require('@/assets/destinations/abidjan.jpg'),
  bamako: require('@/assets/destinations/bamako.jpg'),
  casablanca: require('@/assets/destinations/casablanca.jpg'),
  conakry: require('@/assets/destinations/conakry.jpg'),
  lagos: require('@/assets/destinations/lagos.jpg'),
  lome: require('@/assets/destinations/lome.jpg'),
  montreal: require('@/assets/destinations/montreal.jpg'),
  toronto: require('@/assets/destinations/toronto.jpg'),
};
const FALLBACK = require('@/assets/art/hero-window.png');

export const cityImage = (city?: string | null): number => (city && IMAGES[strip(city.split(',')[0])]) || FALLBACK;

export const POPULAR_ROUTES: [string, string][] = [
  ['Paris', 'Dakar'],
  ['Paris', 'Abidjan'],
  ['Montréal', 'Conakry'],
  ['Paris', 'Bamako'],
  ['Toronto', 'Lagos'],
];
