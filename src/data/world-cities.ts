// Comprehensive world cities database with countries
// Organized by continent for easy maintenance

export interface CityData {
  city: string;
  country: string;
  countryCode: string;
  flag: string;
}

// Africa
const AFRICA_CITIES: CityData[] = [
  // Côte d'Ivoire
  { city: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Bouaké", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Daloa", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Yamoussoukro", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "San-Pédro", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Korhogo", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Man", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Divo", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Gagnoa", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  { city: "Abengourou", country: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮" },
  
  // Sénégal
  { city: "Dakar", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Thiès", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Saint-Louis", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Kaolack", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Ziguinchor", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Touba", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Mbour", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Rufisque", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Louga", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  { city: "Tambacounda", country: "Sénégal", countryCode: "SN", flag: "🇸🇳" },
  
  // Togo
  { city: "Lomé", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Sokodé", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Kara", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Atakpamé", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Kpalimé", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Dapaong", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Tsévié", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  { city: "Aného", country: "Togo", countryCode: "TG", flag: "🇹🇬" },
  
  // Bénin
  { city: "Cotonou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Porto-Novo", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Parakou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Djougou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Bohicon", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Kandi", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Lokossa", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Ouidah", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Abomey", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  { city: "Natitingou", country: "Bénin", countryCode: "BJ", flag: "🇧🇯" },
  
  // Cameroun
  { city: "Douala", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Yaoundé", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Garoua", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Bamenda", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Bafoussam", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Maroua", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Ngaoundéré", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Bertoua", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Limbe", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Ebolowa", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  { city: "Kribi", country: "Cameroun", countryCode: "CM", flag: "🇨🇲" },
  
  // Maroc
  { city: "Casablanca", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Rabat", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Marrakech", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Fès", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Tanger", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Agadir", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Meknès", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Oujda", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Kénitra", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  { city: "Tétouan", country: "Maroc", countryCode: "MA", flag: "🇲🇦" },
  
  // RD Congo
  { city: "Kinshasa", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Lubumbashi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Mbuji-Mayi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Kisangani", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Kananga", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Likasi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Kolwezi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Goma", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Bukavu", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  { city: "Matadi", country: "RD Congo", countryCode: "CD", flag: "🇨🇩" },
  
  // Algérie
  { city: "Alger", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Oran", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Constantine", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Annaba", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Blida", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Batna", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Sétif", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Djelfa", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Biskra", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  { city: "Tlemcen", country: "Algérie", countryCode: "DZ", flag: "🇩🇿" },
  
  // Tunisie
  { city: "Tunis", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Sfax", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Sousse", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Kairouan", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Bizerte", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Gabès", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  { city: "Monastir", country: "Tunisie", countryCode: "TN", flag: "🇹🇳" },
  
  // Ghana
  { city: "Accra", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  { city: "Kumasi", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  { city: "Tamale", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  { city: "Tema", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  { city: "Cape Coast", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  { city: "Sekondi-Takoradi", country: "Ghana", countryCode: "GH", flag: "🇬🇭" },
  
  // Nigeria
  { city: "Lagos", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Kano", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Ibadan", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Abuja", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Port Harcourt", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Benin City", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Kaduna", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Enugu", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Calabar", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  { city: "Warri", country: "Nigeria", countryCode: "NG", flag: "🇳🇬" },
  
  // Égypte
  { city: "Le Caire", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Alexandrie", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Gizeh", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Louxor", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Assouan", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Hurghada", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  { city: "Charm el-Cheikh", country: "Égypte", countryCode: "EG", flag: "🇪🇬" },
  
  // Afrique du Sud
  { city: "Johannesburg", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  { city: "Le Cap", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  { city: "Durban", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  { city: "Pretoria", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  { city: "Port Elizabeth", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  { city: "Bloemfontein", country: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦" },
  
  // Kenya
  { city: "Nairobi", country: "Kenya", countryCode: "KE", flag: "🇰🇪" },
  { city: "Mombasa", country: "Kenya", countryCode: "KE", flag: "🇰🇪" },
  { city: "Kisumu", country: "Kenya", countryCode: "KE", flag: "🇰🇪" },
  { city: "Nakuru", country: "Kenya", countryCode: "KE", flag: "🇰🇪" },
  { city: "Eldoret", country: "Kenya", countryCode: "KE", flag: "🇰🇪" },
  
  // Éthiopie
  { city: "Addis-Abeba", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹" },
  { city: "Dire Dawa", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹" },
  { city: "Mekele", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹" },
  { city: "Gondar", country: "Éthiopie", countryCode: "ET", flag: "🇪🇹" },
  
  // Tanzanie
  { city: "Dar es Salaam", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿" },
  { city: "Dodoma", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿" },
  { city: "Mwanza", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿" },
  { city: "Zanzibar", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿" },
  { city: "Arusha", country: "Tanzanie", countryCode: "TZ", flag: "🇹🇿" },
  
  // Gabon
  { city: "Libreville", country: "Gabon", countryCode: "GA", flag: "🇬🇦" },
  { city: "Port-Gentil", country: "Gabon", countryCode: "GA", flag: "🇬🇦" },
  { city: "Franceville", country: "Gabon", countryCode: "GA", flag: "🇬🇦" },
  
  // Congo
  { city: "Brazzaville", country: "Congo", countryCode: "CG", flag: "🇨🇬" },
  { city: "Pointe-Noire", country: "Congo", countryCode: "CG", flag: "🇨🇬" },
  
  // Mali
  { city: "Bamako", country: "Mali", countryCode: "ML", flag: "🇲🇱" },
  { city: "Sikasso", country: "Mali", countryCode: "ML", flag: "🇲🇱" },
  { city: "Mopti", country: "Mali", countryCode: "ML", flag: "🇲🇱" },
  { city: "Ségou", country: "Mali", countryCode: "ML", flag: "🇲🇱" },
  { city: "Koutiala", country: "Mali", countryCode: "ML", flag: "🇲🇱" },
  
  // Burkina Faso
  { city: "Ouagadougou", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫" },
  { city: "Bobo-Dioulasso", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫" },
  { city: "Koudougou", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫" },
  { city: "Banfora", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫" },
  
  // Niger
  { city: "Niamey", country: "Niger", countryCode: "NE", flag: "🇳🇪" },
  { city: "Zinder", country: "Niger", countryCode: "NE", flag: "🇳🇪" },
  { city: "Maradi", country: "Niger", countryCode: "NE", flag: "🇳🇪" },
  { city: "Agadez", country: "Niger", countryCode: "NE", flag: "🇳🇪" },
  
  // Guinée
  { city: "Conakry", country: "Guinée", countryCode: "GN", flag: "🇬🇳" },
  { city: "Nzérékoré", country: "Guinée", countryCode: "GN", flag: "🇬🇳" },
  { city: "Kankan", country: "Guinée", countryCode: "GN", flag: "🇬🇳" },
  { city: "Kindia", country: "Guinée", countryCode: "GN", flag: "🇬🇳" },
  
  // Rwanda
  { city: "Kigali", country: "Rwanda", countryCode: "RW", flag: "🇷🇼" },
  { city: "Butare", country: "Rwanda", countryCode: "RW", flag: "🇷🇼" },
  { city: "Gisenyi", country: "Rwanda", countryCode: "RW", flag: "🇷🇼" },
  
  // Mauritanie
  { city: "Nouakchott", country: "Mauritanie", countryCode: "MR", flag: "🇲🇷" },
  { city: "Nouadhibou", country: "Mauritanie", countryCode: "MR", flag: "🇲🇷" },
  
  // Madagascar
  { city: "Antananarivo", country: "Madagascar", countryCode: "MG", flag: "🇲🇬" },
  { city: "Toamasina", country: "Madagascar", countryCode: "MG", flag: "🇲🇬" },
  { city: "Antsirabe", country: "Madagascar", countryCode: "MG", flag: "🇲🇬" },
  { city: "Mahajanga", country: "Madagascar", countryCode: "MG", flag: "🇲🇬" },
  
  // Maurice
  { city: "Port-Louis", country: "Maurice", countryCode: "MU", flag: "🇲🇺" },
  { city: "Curepipe", country: "Maurice", countryCode: "MU", flag: "🇲🇺" },
  
  // Réunion
  { city: "Saint-Denis", country: "Réunion", countryCode: "RE", flag: "🇷🇪" },
  { city: "Saint-Pierre", country: "Réunion", countryCode: "RE", flag: "🇷🇪" },
  { city: "Saint-Paul", country: "Réunion", countryCode: "RE", flag: "🇷🇪" },
];

// Europe
const EUROPE_CITIES: CityData[] = [
  // France
  { city: "Paris", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Lyon", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Marseille", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Toulouse", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Nice", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Nantes", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Strasbourg", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Montpellier", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Bordeaux", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Lille", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Rennes", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Reims", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Le Havre", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Grenoble", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Dijon", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Toulon", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Angers", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Nîmes", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Clermont-Ferrand", country: "France", countryCode: "FR", flag: "🇫🇷" },
  { city: "Metz", country: "France", countryCode: "FR", flag: "🇫🇷" },
  
  // Belgique
  { city: "Bruxelles", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Anvers", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Gand", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Charleroi", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Liège", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Bruges", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Namur", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Louvain", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  { city: "Mons", country: "Belgique", countryCode: "BE", flag: "🇧🇪" },
  
  // Suisse
  { city: "Genève", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  { city: "Zurich", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  { city: "Berne", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  { city: "Lausanne", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  { city: "Bâle", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  { city: "Lucerne", country: "Suisse", countryCode: "CH", flag: "🇨🇭" },
  
  // Allemagne
  { city: "Berlin", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Munich", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Hambourg", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Francfort", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Cologne", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Düsseldorf", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Stuttgart", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Dortmund", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Essen", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Leipzig", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Brême", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Dresde", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Hanovre", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  { city: "Nuremberg", country: "Allemagne", countryCode: "DE", flag: "🇩🇪" },
  
  // Royaume-Uni
  { city: "Londres", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Birmingham", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Manchester", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Glasgow", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Liverpool", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Leeds", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Sheffield", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Edinburgh", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Bristol", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Cardiff", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Belfast", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  { city: "Newcastle", country: "Royaume-Uni", countryCode: "GB", flag: "🇬🇧" },
  
  // Espagne
  { city: "Madrid", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Barcelone", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Valence", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Séville", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Saragosse", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Malaga", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Bilbao", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Alicante", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Cordoue", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  { city: "Grenade", country: "Espagne", countryCode: "ES", flag: "🇪🇸" },
  
  // Portugal
  { city: "Lisbonne", country: "Portugal", countryCode: "PT", flag: "🇵🇹" },
  { city: "Porto", country: "Portugal", countryCode: "PT", flag: "🇵🇹" },
  { city: "Braga", country: "Portugal", countryCode: "PT", flag: "🇵🇹" },
  { city: "Coimbra", country: "Portugal", countryCode: "PT", flag: "🇵🇹" },
  { city: "Faro", country: "Portugal", countryCode: "PT", flag: "🇵🇹" },
  
  // Italie
  { city: "Rome", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Milan", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Naples", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Turin", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Palerme", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Gênes", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Bologne", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Florence", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Venise", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  { city: "Vérone", country: "Italie", countryCode: "IT", flag: "🇮🇹" },
  
  // Pays-Bas
  { city: "Amsterdam", country: "Pays-Bas", countryCode: "NL", flag: "🇳🇱" },
  { city: "Rotterdam", country: "Pays-Bas", countryCode: "NL", flag: "🇳🇱" },
  { city: "La Haye", country: "Pays-Bas", countryCode: "NL", flag: "🇳🇱" },
  { city: "Utrecht", country: "Pays-Bas", countryCode: "NL", flag: "🇳🇱" },
  { city: "Eindhoven", country: "Pays-Bas", countryCode: "NL", flag: "🇳🇱" },
  
  // Pologne
  { city: "Varsovie", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  { city: "Cracovie", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  { city: "Łódź", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  { city: "Wrocław", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  { city: "Poznań", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  { city: "Gdańsk", country: "Pologne", countryCode: "PL", flag: "🇵🇱" },
  
  // Autriche
  { city: "Vienne", country: "Autriche", countryCode: "AT", flag: "🇦🇹" },
  { city: "Graz", country: "Autriche", countryCode: "AT", flag: "🇦🇹" },
  { city: "Linz", country: "Autriche", countryCode: "AT", flag: "🇦🇹" },
  { city: "Salzbourg", country: "Autriche", countryCode: "AT", flag: "🇦🇹" },
  { city: "Innsbruck", country: "Autriche", countryCode: "AT", flag: "🇦🇹" },
  
  // Suède
  { city: "Stockholm", country: "Suède", countryCode: "SE", flag: "🇸🇪" },
  { city: "Göteborg", country: "Suède", countryCode: "SE", flag: "🇸🇪" },
  { city: "Malmö", country: "Suède", countryCode: "SE", flag: "🇸🇪" },
  { city: "Uppsala", country: "Suède", countryCode: "SE", flag: "🇸🇪" },
  
  // Norvège
  { city: "Oslo", country: "Norvège", countryCode: "NO", flag: "🇳🇴" },
  { city: "Bergen", country: "Norvège", countryCode: "NO", flag: "🇳🇴" },
  { city: "Trondheim", country: "Norvège", countryCode: "NO", flag: "🇳🇴" },
  { city: "Stavanger", country: "Norvège", countryCode: "NO", flag: "🇳🇴" },
  
  // Danemark
  { city: "Copenhague", country: "Danemark", countryCode: "DK", flag: "🇩🇰" },
  { city: "Aarhus", country: "Danemark", countryCode: "DK", flag: "🇩🇰" },
  { city: "Odense", country: "Danemark", countryCode: "DK", flag: "🇩🇰" },
  
  // Finlande
  { city: "Helsinki", country: "Finlande", countryCode: "FI", flag: "🇫🇮" },
  { city: "Espoo", country: "Finlande", countryCode: "FI", flag: "🇫🇮" },
  { city: "Tampere", country: "Finlande", countryCode: "FI", flag: "🇫🇮" },
  { city: "Turku", country: "Finlande", countryCode: "FI", flag: "🇫🇮" },
  
  // Grèce
  { city: "Athènes", country: "Grèce", countryCode: "GR", flag: "🇬🇷" },
  { city: "Thessalonique", country: "Grèce", countryCode: "GR", flag: "🇬🇷" },
  { city: "Le Pirée", country: "Grèce", countryCode: "GR", flag: "🇬🇷" },
  { city: "Patras", country: "Grèce", countryCode: "GR", flag: "🇬🇷" },
  { city: "Héraklion", country: "Grèce", countryCode: "GR", flag: "🇬🇷" },
  
  // République tchèque
  { city: "Prague", country: "République tchèque", countryCode: "CZ", flag: "🇨🇿" },
  { city: "Brno", country: "République tchèque", countryCode: "CZ", flag: "🇨🇿" },
  { city: "Ostrava", country: "République tchèque", countryCode: "CZ", flag: "🇨🇿" },
  
  // Hongrie
  { city: "Budapest", country: "Hongrie", countryCode: "HU", flag: "🇭🇺" },
  { city: "Debrecen", country: "Hongrie", countryCode: "HU", flag: "🇭🇺" },
  { city: "Szeged", country: "Hongrie", countryCode: "HU", flag: "🇭🇺" },
  
  // Irlande
  { city: "Dublin", country: "Irlande", countryCode: "IE", flag: "🇮🇪" },
  { city: "Cork", country: "Irlande", countryCode: "IE", flag: "🇮🇪" },
  { city: "Galway", country: "Irlande", countryCode: "IE", flag: "🇮🇪" },
  { city: "Limerick", country: "Irlande", countryCode: "IE", flag: "🇮🇪" },
  
  // Roumanie
  { city: "Bucarest", country: "Roumanie", countryCode: "RO", flag: "🇷🇴" },
  { city: "Cluj-Napoca", country: "Roumanie", countryCode: "RO", flag: "🇷🇴" },
  { city: "Timișoara", country: "Roumanie", countryCode: "RO", flag: "🇷🇴" },
  { city: "Iași", country: "Roumanie", countryCode: "RO", flag: "🇷🇴" },
  
  // Bulgarie
  { city: "Sofia", country: "Bulgarie", countryCode: "BG", flag: "🇧🇬" },
  { city: "Plovdiv", country: "Bulgarie", countryCode: "BG", flag: "🇧🇬" },
  { city: "Varna", country: "Bulgarie", countryCode: "BG", flag: "🇧🇬" },
  
  // Croatie
  { city: "Zagreb", country: "Croatie", countryCode: "HR", flag: "🇭🇷" },
  { city: "Split", country: "Croatie", countryCode: "HR", flag: "🇭🇷" },
  { city: "Rijeka", country: "Croatie", countryCode: "HR", flag: "🇭🇷" },
  { city: "Dubrovnik", country: "Croatie", countryCode: "HR", flag: "🇭🇷" },
  
  // Serbie
  { city: "Belgrade", country: "Serbie", countryCode: "RS", flag: "🇷🇸" },
  { city: "Novi Sad", country: "Serbie", countryCode: "RS", flag: "🇷🇸" },
  
  // Ukraine
  { city: "Kiev", country: "Ukraine", countryCode: "UA", flag: "🇺🇦" },
  { city: "Kharkiv", country: "Ukraine", countryCode: "UA", flag: "🇺🇦" },
  { city: "Odessa", country: "Ukraine", countryCode: "UA", flag: "🇺🇦" },
  { city: "Dnipro", country: "Ukraine", countryCode: "UA", flag: "🇺🇦" },
  { city: "Lviv", country: "Ukraine", countryCode: "UA", flag: "🇺🇦" },
  
  // Russie
  { city: "Moscou", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
  { city: "Saint-Pétersbourg", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
  { city: "Novossibirsk", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
  { city: "Ekaterinbourg", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
  { city: "Kazan", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
  { city: "Sotchi", country: "Russie", countryCode: "RU", flag: "🇷🇺" },
];

// North America
const NORTH_AMERICA_CITIES: CityData[] = [
  // Canada
  { city: "Montréal", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Longueuil", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Sherbrooke", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Trois-Rivières", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Lévis", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Saguenay", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Brossard", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Terrebonne", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Repentigny", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Saint-Jérôme", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Drummondville", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Granby", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Mississauga", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Brampton", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Kitchener", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "London", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Windsor", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Saskatoon", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Regina", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Victoria", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Moncton", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Toronto", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Vancouver", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Ottawa", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Calgary", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Edmonton", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Québec", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Winnipeg", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Hamilton", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Gatineau", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Halifax", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Laval", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Longueuil", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Sherbrooke", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Saskatoon", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Regina", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  { city: "Victoria", country: "Canada", countryCode: "CA", flag: "🇨🇦" },
  
  // États-Unis
  { city: "New York", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Los Angeles", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Chicago", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Houston", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Phoenix", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Philadelphie", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "San Antonio", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "San Diego", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Dallas", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "San José", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Austin", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Jacksonville", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "San Francisco", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Columbus", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Charlotte", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Indianapolis", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Seattle", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Denver", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Washington", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Boston", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Miami", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Atlanta", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Las Vegas", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Portland", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Detroit", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Memphis", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Baltimore", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Milwaukee", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Albuquerque", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Nashville", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "La Nouvelle-Orléans", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  { city: "Honolulu", country: "États-Unis", countryCode: "US", flag: "🇺🇸" },
  
  // Mexique
  { city: "Mexico", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Guadalajara", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Monterrey", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Cancún", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Puebla", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Tijuana", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "León", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Mérida", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  { city: "Acapulco", country: "Mexique", countryCode: "MX", flag: "🇲🇽" },
  
  // Haïti
  { city: "Port-au-Prince", country: "Haïti", countryCode: "HT", flag: "🇭🇹" },
  { city: "Cap-Haïtien", country: "Haïti", countryCode: "HT", flag: "🇭🇹" },
  { city: "Gonaïves", country: "Haïti", countryCode: "HT", flag: "🇭🇹" },
  { city: "Les Cayes", country: "Haïti", countryCode: "HT", flag: "🇭🇹" },
  
  // République Dominicaine
  { city: "Saint-Domingue", country: "République Dominicaine", countryCode: "DO", flag: "🇩🇴" },
  { city: "Santiago", country: "République Dominicaine", countryCode: "DO", flag: "🇩🇴" },
  { city: "Punta Cana", country: "République Dominicaine", countryCode: "DO", flag: "🇩🇴" },
  
  // Cuba
  { city: "La Havane", country: "Cuba", countryCode: "CU", flag: "🇨🇺" },
  { city: "Santiago de Cuba", country: "Cuba", countryCode: "CU", flag: "🇨🇺" },
  { city: "Varadero", country: "Cuba", countryCode: "CU", flag: "🇨🇺" },
  
  // Jamaïque
  { city: "Kingston", country: "Jamaïque", countryCode: "JM", flag: "🇯🇲" },
  { city: "Montego Bay", country: "Jamaïque", countryCode: "JM", flag: "🇯🇲" },
  
  // Panama
  { city: "Panama City", country: "Panama", countryCode: "PA", flag: "🇵🇦" },
  { city: "Colón", country: "Panama", countryCode: "PA", flag: "🇵🇦" },
  
  // Costa Rica
  { city: "San José", country: "Costa Rica", countryCode: "CR", flag: "🇨🇷" },
  { city: "Limón", country: "Costa Rica", countryCode: "CR", flag: "🇨🇷" },
  
  // Martinique
  { city: "Fort-de-France", country: "Martinique", countryCode: "MQ", flag: "🇲🇶" },
  { city: "Le Lamentin", country: "Martinique", countryCode: "MQ", flag: "🇲🇶" },
  
  // Guadeloupe
  { city: "Pointe-à-Pitre", country: "Guadeloupe", countryCode: "GP", flag: "🇬🇵" },
  { city: "Les Abymes", country: "Guadeloupe", countryCode: "GP", flag: "🇬🇵" },
  { city: "Basse-Terre", country: "Guadeloupe", countryCode: "GP", flag: "🇬🇵" },
  
  // Guyane
  { city: "Cayenne", country: "Guyane", countryCode: "GF", flag: "🇬🇫" },
  { city: "Kourou", country: "Guyane", countryCode: "GF", flag: "🇬🇫" },
];

// South America
const SOUTH_AMERICA_CITIES: CityData[] = [
  // Brésil
  { city: "São Paulo", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Rio de Janeiro", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Brasília", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Salvador", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Fortaleza", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Belo Horizonte", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Manaus", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Curitiba", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Recife", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  { city: "Porto Alegre", country: "Brésil", countryCode: "BR", flag: "🇧🇷" },
  
  // Argentine
  { city: "Buenos Aires", country: "Argentine", countryCode: "AR", flag: "🇦🇷" },
  { city: "Córdoba", country: "Argentine", countryCode: "AR", flag: "🇦🇷" },
  { city: "Rosario", country: "Argentine", countryCode: "AR", flag: "🇦🇷" },
  { city: "Mendoza", country: "Argentine", countryCode: "AR", flag: "🇦🇷" },
  { city: "Mar del Plata", country: "Argentine", countryCode: "AR", flag: "🇦🇷" },
  
  // Colombie
  { city: "Bogota", country: "Colombie", countryCode: "CO", flag: "🇨🇴" },
  { city: "Medellín", country: "Colombie", countryCode: "CO", flag: "🇨🇴" },
  { city: "Cali", country: "Colombie", countryCode: "CO", flag: "🇨🇴" },
  { city: "Barranquilla", country: "Colombie", countryCode: "CO", flag: "🇨🇴" },
  { city: "Carthagène", country: "Colombie", countryCode: "CO", flag: "🇨🇴" },
  
  // Pérou
  { city: "Lima", country: "Pérou", countryCode: "PE", flag: "🇵🇪" },
  { city: "Arequipa", country: "Pérou", countryCode: "PE", flag: "🇵🇪" },
  { city: "Cusco", country: "Pérou", countryCode: "PE", flag: "🇵🇪" },
  { city: "Trujillo", country: "Pérou", countryCode: "PE", flag: "🇵🇪" },
  
  // Chili
  { city: "Santiago", country: "Chili", countryCode: "CL", flag: "🇨🇱" },
  { city: "Valparaíso", country: "Chili", countryCode: "CL", flag: "🇨🇱" },
  { city: "Concepción", country: "Chili", countryCode: "CL", flag: "🇨🇱" },
  
  // Venezuela
  { city: "Caracas", country: "Venezuela", countryCode: "VE", flag: "🇻🇪" },
  { city: "Maracaibo", country: "Venezuela", countryCode: "VE", flag: "🇻🇪" },
  { city: "Valencia", country: "Venezuela", countryCode: "VE", flag: "🇻🇪" },
  
  // Équateur
  { city: "Quito", country: "Équateur", countryCode: "EC", flag: "🇪🇨" },
  { city: "Guayaquil", country: "Équateur", countryCode: "EC", flag: "🇪🇨" },
  { city: "Cuenca", country: "Équateur", countryCode: "EC", flag: "🇪🇨" },
  
  // Bolivie
  { city: "La Paz", country: "Bolivie", countryCode: "BO", flag: "🇧🇴" },
  { city: "Santa Cruz", country: "Bolivie", countryCode: "BO", flag: "🇧🇴" },
  { city: "Cochabamba", country: "Bolivie", countryCode: "BO", flag: "🇧🇴" },
  
  // Uruguay
  { city: "Montevideo", country: "Uruguay", countryCode: "UY", flag: "🇺🇾" },
  { city: "Punta del Este", country: "Uruguay", countryCode: "UY", flag: "🇺🇾" },
  
  // Paraguay
  { city: "Asunción", country: "Paraguay", countryCode: "PY", flag: "🇵🇾" },
  { city: "Ciudad del Este", country: "Paraguay", countryCode: "PY", flag: "🇵🇾" },
];

// Asia
const ASIA_CITIES: CityData[] = [
  // Chine
  { city: "Pékin", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Shanghai", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Canton", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Shenzhen", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Hong Kong", country: "Chine", countryCode: "HK", flag: "🇭🇰" },
  { city: "Chengdu", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Hangzhou", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Wuhan", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Xi'an", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  { city: "Nankin", country: "Chine", countryCode: "CN", flag: "🇨🇳" },
  
  // Japon
  { city: "Tokyo", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Osaka", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Kyoto", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Yokohama", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Nagoya", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Sapporo", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Kobe", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  { city: "Fukuoka", country: "Japon", countryCode: "JP", flag: "🇯🇵" },
  
  // Corée du Sud
  { city: "Séoul", country: "Corée du Sud", countryCode: "KR", flag: "🇰🇷" },
  { city: "Busan", country: "Corée du Sud", countryCode: "KR", flag: "🇰🇷" },
  { city: "Incheon", country: "Corée du Sud", countryCode: "KR", flag: "🇰🇷" },
  { city: "Daegu", country: "Corée du Sud", countryCode: "KR", flag: "🇰🇷" },
  
  // Inde
  { city: "Mumbai", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Delhi", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Bangalore", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Calcutta", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Chennai", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Hyderabad", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Ahmedabad", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Pune", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Jaipur", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  { city: "Goa", country: "Inde", countryCode: "IN", flag: "🇮🇳" },
  
  // Thaïlande
  { city: "Bangkok", country: "Thaïlande", countryCode: "TH", flag: "🇹🇭" },
  { city: "Chiang Mai", country: "Thaïlande", countryCode: "TH", flag: "🇹🇭" },
  { city: "Phuket", country: "Thaïlande", countryCode: "TH", flag: "🇹🇭" },
  { city: "Pattaya", country: "Thaïlande", countryCode: "TH", flag: "🇹🇭" },
  
  // Vietnam
  { city: "Hô Chi Minh-Ville", country: "Vietnam", countryCode: "VN", flag: "🇻🇳" },
  { city: "Hanoï", country: "Vietnam", countryCode: "VN", flag: "🇻🇳" },
  { city: "Da Nang", country: "Vietnam", countryCode: "VN", flag: "🇻🇳" },
  { city: "Haiphong", country: "Vietnam", countryCode: "VN", flag: "🇻🇳" },
  
  // Singapour
  { city: "Singapour", country: "Singapour", countryCode: "SG", flag: "🇸🇬" },
  
  // Malaisie
  { city: "Kuala Lumpur", country: "Malaisie", countryCode: "MY", flag: "🇲🇾" },
  { city: "George Town", country: "Malaisie", countryCode: "MY", flag: "🇲🇾" },
  { city: "Johor Bahru", country: "Malaisie", countryCode: "MY", flag: "🇲🇾" },
  
  // Indonésie
  { city: "Jakarta", country: "Indonésie", countryCode: "ID", flag: "🇮🇩" },
  { city: "Surabaya", country: "Indonésie", countryCode: "ID", flag: "🇮🇩" },
  { city: "Bali", country: "Indonésie", countryCode: "ID", flag: "🇮🇩" },
  { city: "Medan", country: "Indonésie", countryCode: "ID", flag: "🇮🇩" },
  { city: "Bandung", country: "Indonésie", countryCode: "ID", flag: "🇮🇩" },
  
  // Philippines
  { city: "Manille", country: "Philippines", countryCode: "PH", flag: "🇵🇭" },
  { city: "Cebu", country: "Philippines", countryCode: "PH", flag: "🇵🇭" },
  { city: "Davao", country: "Philippines", countryCode: "PH", flag: "🇵🇭" },
  
  // Émirats arabes unis
  { city: "Dubaï", country: "Émirats arabes unis", countryCode: "AE", flag: "🇦🇪" },
  { city: "Abu Dhabi", country: "Émirats arabes unis", countryCode: "AE", flag: "🇦🇪" },
  { city: "Charjah", country: "Émirats arabes unis", countryCode: "AE", flag: "🇦🇪" },
  
  // Arabie Saoudite
  { city: "Riyad", country: "Arabie Saoudite", countryCode: "SA", flag: "🇸🇦" },
  { city: "Djeddah", country: "Arabie Saoudite", countryCode: "SA", flag: "🇸🇦" },
  { city: "La Mecque", country: "Arabie Saoudite", countryCode: "SA", flag: "🇸🇦" },
  { city: "Médine", country: "Arabie Saoudite", countryCode: "SA", flag: "🇸🇦" },
  
  // Qatar
  { city: "Doha", country: "Qatar", countryCode: "QA", flag: "🇶🇦" },
  
  // Koweït
  { city: "Koweït City", country: "Koweït", countryCode: "KW", flag: "🇰🇼" },
  
  // Bahreïn
  { city: "Manama", country: "Bahreïn", countryCode: "BH", flag: "🇧🇭" },
  
  // Oman
  { city: "Mascate", country: "Oman", countryCode: "OM", flag: "🇴🇲" },
  
  // Liban
  { city: "Beyrouth", country: "Liban", countryCode: "LB", flag: "🇱🇧" },
  { city: "Tripoli", country: "Liban", countryCode: "LB", flag: "🇱🇧" },
  
  // Jordanie
  { city: "Amman", country: "Jordanie", countryCode: "JO", flag: "🇯🇴" },
  { city: "Aqaba", country: "Jordanie", countryCode: "JO", flag: "🇯🇴" },
  
  // Israël
  { city: "Tel Aviv", country: "Israël", countryCode: "IL", flag: "🇮🇱" },
  { city: "Jérusalem", country: "Israël", countryCode: "IL", flag: "🇮🇱" },
  { city: "Haïfa", country: "Israël", countryCode: "IL", flag: "🇮🇱" },
  
  // Turquie
  { city: "Istanbul", country: "Turquie", countryCode: "TR", flag: "🇹🇷" },
  { city: "Ankara", country: "Turquie", countryCode: "TR", flag: "🇹🇷" },
  { city: "Izmir", country: "Turquie", countryCode: "TR", flag: "🇹🇷" },
  { city: "Antalya", country: "Turquie", countryCode: "TR", flag: "🇹🇷" },
  { city: "Bursa", country: "Turquie", countryCode: "TR", flag: "🇹🇷" },
  
  // Pakistan
  { city: "Karachi", country: "Pakistan", countryCode: "PK", flag: "🇵🇰" },
  { city: "Lahore", country: "Pakistan", countryCode: "PK", flag: "🇵🇰" },
  { city: "Islamabad", country: "Pakistan", countryCode: "PK", flag: "🇵🇰" },
  
  // Bangladesh
  { city: "Dacca", country: "Bangladesh", countryCode: "BD", flag: "🇧🇩" },
  { city: "Chittagong", country: "Bangladesh", countryCode: "BD", flag: "🇧🇩" },
  
  // Sri Lanka
  { city: "Colombo", country: "Sri Lanka", countryCode: "LK", flag: "🇱🇰" },
  { city: "Kandy", country: "Sri Lanka", countryCode: "LK", flag: "🇱🇰" },
  
  // Népal
  { city: "Katmandou", country: "Népal", countryCode: "NP", flag: "🇳🇵" },
  { city: "Pokhara", country: "Népal", countryCode: "NP", flag: "🇳🇵" },
  
  // Cambodge
  { city: "Phnom Penh", country: "Cambodge", countryCode: "KH", flag: "🇰🇭" },
  { city: "Siem Reap", country: "Cambodge", countryCode: "KH", flag: "🇰🇭" },
  
  // Myanmar
  { city: "Rangoun", country: "Myanmar", countryCode: "MM", flag: "🇲🇲" },
  { city: "Mandalay", country: "Myanmar", countryCode: "MM", flag: "🇲🇲" },
];

// Oceania
const OCEANIA_CITIES: CityData[] = [
  // Australie
  { city: "Sydney", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Melbourne", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Brisbane", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Perth", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Adelaide", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Gold Coast", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  { city: "Canberra", country: "Australie", countryCode: "AU", flag: "🇦🇺" },
  
  // Nouvelle-Zélande
  { city: "Auckland", country: "Nouvelle-Zélande", countryCode: "NZ", flag: "🇳🇿" },
  { city: "Wellington", country: "Nouvelle-Zélande", countryCode: "NZ", flag: "🇳🇿" },
  { city: "Christchurch", country: "Nouvelle-Zélande", countryCode: "NZ", flag: "🇳🇿" },
  { city: "Queenstown", country: "Nouvelle-Zélande", countryCode: "NZ", flag: "🇳🇿" },
  
  // Nouvelle-Calédonie
  { city: "Nouméa", country: "Nouvelle-Calédonie", countryCode: "NC", flag: "🇳🇨" },
  
  // Polynésie française
  { city: "Papeete", country: "Polynésie française", countryCode: "PF", flag: "🇵🇫" },
  { city: "Bora Bora", country: "Polynésie française", countryCode: "PF", flag: "🇵🇫" },
  
  // Fidji
  { city: "Suva", country: "Fidji", countryCode: "FJ", flag: "🇫🇯" },
];

// Combined export of all cities
export const WORLD_CITIES: CityData[] = [
  ...AFRICA_CITIES,
  ...EUROPE_CITIES,
  ...NORTH_AMERICA_CITIES,
  ...SOUTH_AMERICA_CITIES,
  ...ASIA_CITIES,
  ...OCEANIA_CITIES,
].sort((a, b) => a.city.localeCompare(b.city, 'fr'));

// Get unique countries for country selector
export const WORLD_COUNTRIES = Array.from(
  new Map(WORLD_CITIES.map(c => [c.countryCode, { 
    code: c.countryCode, 
    name: c.country, 
    flag: c.flag 
  }])).values()
).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// Helper function to search cities
export const searchCities = (query: string, limit = 20): CityData[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return WORLD_CITIES
    .filter(item => {
      const normalizedCity = item.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedCountry = item.country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedCity.includes(normalizedQuery) || normalizedCountry.includes(normalizedQuery);
    })
    .slice(0, limit);
};

// Get cities by country
export const getCitiesByCountry = (countryCode: string): CityData[] => {
  return WORLD_CITIES.filter(c => c.countryCode === countryCode);
};
