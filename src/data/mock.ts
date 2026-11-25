// Mock data for the design-first version. Will be replaced by Supabase queries.

export const cityImages = {
  Paris: require('@/assets/destinations/paris.jpg'),
  Dakar: require('@/assets/destinations/dakar.jpg'),
  Abidjan: require('@/assets/destinations/abidjan.jpg'),
  Bamako: require('@/assets/destinations/bamako.jpg'),
  Casablanca: require('@/assets/destinations/casablanca.jpg'),
  Conakry: require('@/assets/destinations/conakry.jpg'),
  Lagos: require('@/assets/destinations/lagos.jpg'),
  Lomé: require('@/assets/destinations/lome.jpg'),
  Montréal: require('@/assets/destinations/montreal.jpg'),
  Toronto: require('@/assets/destinations/toronto.jpg'),
} as const;

export type City = keyof typeof cityImages;

export const cityCodes: Record<City, string> = {
  Paris: 'CDG',
  Dakar: 'DSS',
  Abidjan: 'ABJ',
  Bamako: 'BKO',
  Casablanca: 'CMN',
  Conakry: 'CKY',
  Lagos: 'LOS',
  Lomé: 'LFW',
  Montréal: 'YUL',
  Toronto: 'YYZ',
};

export const cityCountries: Record<City, string> = {
  Paris: 'France',
  Dakar: 'Sénégal',
  Abidjan: "Côte d'Ivoire",
  Bamako: 'Mali',
  Casablanca: 'Maroc',
  Conakry: 'Guinée',
  Lagos: 'Nigeria',
  Lomé: 'Togo',
  Montréal: 'Canada',
  Toronto: 'Canada',
};

export type Traveler = {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  trust: number;
  trips: number;
  rating: number;
  reviews: number;
  memberSince: string;
  photo?: number;
};

export type Listing = {
  id: string;
  traveler: Traveler;
  from: City;
  to: City;
  departDate: string;
  departTime: string;
  arriveDate: string;
  arriveTime: string;
  totalKg: number;
  availableKg: number;
  pricePerKg: number;
  currency: '€' | 'FCFA' | '$CA';
  allowed: string[];
  prohibited: string[];
  note: string;
  duration: string;
  direct: boolean;
};

const travelers: Traveler[] = [
  { id: 'u1', name: 'Aminata Diop', initials: 'AD', verified: true, trust: 92, trips: 18, rating: 4.9, reviews: 127, memberSince: 'fév. 2025', photo: require('@/assets/avatars/a1.png') },
  { id: 'u2', name: 'Moussa Traoré', initials: 'MT', verified: true, trust: 81, trips: 9, rating: 4.8, reviews: 89, memberSince: 'mars 2025', photo: require('@/assets/avatars/a2.png') },
  { id: 'u3', name: 'Fatou Camara', initials: 'FC', verified: false, trust: 58, trips: 3, rating: 5.0, reviews: 64, memberSince: 'janv. 2026', photo: require('@/assets/avatars/a3.png') },
  { id: 'u4', name: 'Kofi Mensah', initials: 'KM', verified: true, trust: 88, trips: 12, rating: 4.8, reviews: 21, memberSince: 'mai 2025', photo: require('@/assets/avatars/a4.png') },
];

export const shortName = (name: string) => {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
};

export const listings: Listing[] = [
  {
    id: 'l1', traveler: travelers[0], from: 'Paris', to: 'Dakar',
    departDate: 'Ven. 5 déc.', departTime: '10:35', arriveDate: 'Ven. 5 déc.', arriveTime: '15:10',
    totalKg: 23, availableKg: 14, pricePerKg: 9, currency: '€',
    allowed: ['Vêtements', 'Documents', 'Cosmétiques', 'Électronique scellée'],
    prohibited: ['Liquides > 100 ml', 'Nourriture fraîche', 'Batteries seules'],
    note: "Vol direct Air Sénégal. Remise à l'aéroport ou à Paris 18e la veille du départ.",
    duration: '≈ 5 h 35', direct: true,
  },
  {
    id: 'l2', traveler: travelers[1], from: 'Paris', to: 'Bamako',
    departDate: 'Sam. 6 déc.', departTime: '08:15', arriveDate: 'Sam. 6 déc.', arriveTime: '13:40',
    totalKg: 30, availableKg: 4, pricePerKg: 8, currency: '€',
    allowed: ['Vêtements', 'Chaussures', 'Livres'],
    prohibited: ['Liquides', 'Médicaments sans ordonnance'],
    note: 'Je peux récupérer les colis à Montreuil.',
    duration: '≈ 5 h 25', direct: true,
  },
  {
    id: 'l3', traveler: travelers[3], from: 'Montréal', to: 'Abidjan',
    departDate: 'Mar. 9 déc.', departTime: '18:50', arriveDate: 'Mer. 10 déc.', arriveTime: '11:25',
    totalKg: 20, availableKg: 20, pricePerKg: 14, currency: '$CA',
    allowed: ['Vêtements', 'Électronique', 'Documents'],
    prohibited: ['Nourriture', 'Liquides'],
    note: 'Escale à Bruxelles. Colis bien emballés uniquement.',
    duration: '≈ 12 h 35', direct: false,
  },
  {
    id: 'l4', traveler: travelers[2], from: 'Dakar', to: 'Paris',
    departDate: 'Jeu. 11 déc.', departTime: '23:55', arriveDate: 'Ven. 12 déc.', arriveTime: '06:20',
    totalKg: 15, availableKg: 15, pricePerKg: 6000, currency: 'FCFA',
    allowed: ['Tissus', 'Épices emballées', 'Artisanat'],
    prohibited: ['Poisson séché', 'Liquides'],
    note: 'Vol de nuit, remise à Dakar Plateau.',
    duration: '≈ 6 h 25', direct: true,
  },
];

export const transportRequests = [
  { id: 'r1', name: 'Ibrahima S.', initials: 'IS', from: 'Paris' as City, to: 'Conakry' as City, kg: 5, item: 'Ordinateur portable', budget: '60 €', when: 'Avant le 15 déc.' },
  { id: 'r2', name: 'Awa K.', initials: 'AK', from: 'Toronto' as City, to: 'Lagos' as City, kg: 3, item: 'Médicaments (ordonnance)', budget: '45 $CA', when: 'Avant le 20 déc.' },
  { id: 'r3', name: 'Yao A.', initials: 'YA', from: 'Casablanca' as City, to: 'Lomé' as City, kg: 8, item: 'Vêtements enfants', budget: '50 €', when: 'Flexible' },
];

export const popularRoutes: { from: City; to: City; count: number }[] = [
  { from: 'Paris', to: 'Dakar', count: 24 },
  { from: 'Paris', to: 'Abidjan', count: 17 },
  { from: 'Montréal', to: 'Conakry', count: 9 },
  { from: 'Paris', to: 'Bamako', count: 12 },
  { from: 'Toronto', to: 'Lagos', count: 6 },
];

export const trackedPackage = {
  id: 'KF-2847',
  listingId: 'l1',
  item: 'Vêtements + 2 parfums',
  kg: 5,
  from: 'Paris' as City,
  to: 'Dakar' as City,
  traveler: travelers[0],
  currentStep: 2,
  steps: [
    { label: 'Réservation confirmée', detail: 'Paiement sécurisé reçu', time: '28 nov. · 14:02' },
    { label: 'Colis remis au voyageur', detail: 'Paris 18e · photo validée', time: '4 déc. · 19:30' },
    { label: 'En vol', detail: 'Air Sénégal HC 404', time: '5 déc. · 10:35' },
    { label: 'Arrivé à destination', detail: 'Aéroport Blaise Diagne', time: 'Prévu 15:10' },
    { label: 'Livré', detail: 'Remise au destinataire', time: '—' },
  ],
};

export const conversations = [
  { id: 'c1', travelerId: 'u1', name: 'Aminata Diop', initials: 'AD', last: 'Je vous envoie la proposition officielle 🙌', time: '10:42', unread: 2, route: 'Paris → Dakar', verified: true },
  { id: 'c2', travelerId: 'u4', name: 'Kofi Mensah', initials: 'KM', last: 'Il me reste encore 20 kg si besoin', time: 'Hier', unread: 0, route: 'Montréal → Abidjan', verified: true },
  { id: 'c3', travelerId: 'u2', name: 'Moussa Traoré', initials: 'MT', last: 'Vous avez reçu la photo du colis ?', time: 'Lun.', unread: 0, route: 'Paris → Bamako', verified: true },
  { id: 'c4', travelerId: 'u3', name: 'Fatou Camara', initials: 'FC', last: 'Merci pour votre réservation !', time: '28 nov.', unread: 0, route: 'Dakar → Paris', verified: false },
];

export const messages = [
  { id: 'm1', mine: true, text: 'Bonjour Aminata, je souhaiterais vous confier un colis pour votre voyage à Dakar le 5 décembre. Avez-vous encore de la place ?', time: '10:24' },
  { id: 'm2', mine: false, text: 'Bonjour ! Oui, j’ai de la place. Quel est le poids et le contenu du colis ?', time: '10:30' },
  { id: 'm3', mine: true, text: 'Un petit colis de 3 kg : vêtements et accessoires (sans batterie). Serait-il possible de faire 8 €/kg ?', time: '10:35' },
  { id: 'm4', mine: false, text: 'Je peux vous proposer 9 €/kg. Cela fait 27 € au total pour 3 kg. Qu’en pensez-vous ?', time: '10:38' },
  { id: 'm5', mine: true, text: 'Parfait, 9 €/kg me convient ! Comment procède-t-on pour la suite ?', time: '10:40' },
  { id: 'm6', mine: false, text: 'Super ! Je vous envoie la proposition officielle sur KiloFly pour verrouiller l’envoi. 🙌', time: '10:42' },
];

export const me = {
  name: 'Madina Diallo',
  initials: 'MD',
  city: 'Paris, France',
  verified: true,
  trust: 86,
  trips: 7,
  shipments: 12,
  rating: 4.9,
  reviews: 42,
  successRate: 98,
  co2: '1,2 t',
  memberSince: 'janv. 2025',
  premium: true,
  wallet: { balance: 248.5, pending: 72, currency: '€' },
};

export const walletTx = [
  { id: 't1', label: 'Réservation · Ibrahima S.', detail: 'Paris → Conakry · 5 kg', amount: 45, date: '24 nov.', status: 'Crédité' },
  { id: 't2', label: 'Retrait vers Wave', detail: '+221 •• •• 42', amount: -120, date: '20 nov.', status: 'Traité' },
  { id: 't3', label: 'Réservation · Awa K.', detail: 'Paris → Dakar · 8 kg', amount: 72, date: '18 nov.', status: 'En attente' },
  { id: 't4', label: 'Réservation · Yao A.', detail: 'Paris → Lomé · 3 kg', amount: 27, date: '9 nov.', status: 'Crédité' },
];

export const formatPrice = (amount: number, currency: string) => {
  if (currency === 'FCFA') return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ',');
  return `${n} ${currency}`;
};
