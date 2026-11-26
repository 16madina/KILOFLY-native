export type InfoSlug = 'faq' | 'prohibited' | 'airports' | 'terms' | 'privacy';

export type InfoSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  qa?: { q: string; a: string }[];
};

export type InfoPage = { title: string; intro?: string; sections: InfoSection[] };

// Shared IATA/TSA regulations content (the old ProhibitedItems and AirportRegulations pages were identical).
const REGULATION_SECTIONS: InfoSection[] = [
  {
    heading: 'Explosifs et munitions — Interdit absolu',
    bullets: ['Munitions et cartouches', 'Détonateurs et mèches', 'Grenades et mines', "Feux d'artifice et pétards", "Répliques d'explosifs", 'Dynamite et TNT', 'Poudre à canon'],
  },
  {
    heading: 'Matières inflammables — Interdit absolu',
    bullets: ['Essence et carburants', 'Gaz comprimés (butane, propane)', 'Allumettes de sûreté (max 1 boîte sur soi)', 'Briquets tempête', 'Peintures et diluants', 'Alcool >70% volume', 'Sprays inflammables'],
  },
  {
    heading: 'Substances toxiques et corrosives — Interdit absolu',
    bullets: ['Acides et bases concentrés', 'Eau de javel concentrée', 'Mercure et composés mercuriels', 'Pesticides et insecticides', 'Poisons et venins', 'Agents pathogènes', 'Amiante'],
  },
  {
    heading: 'Drogues et substances contrôlées — Interdit absolu',
    bullets: ['Stupéfiants (cannabis, cocaïne, héroïne, etc.)', 'Substances psychotropes non prescrites', 'Stéroïdes anabolisants', 'GHB et substances apparentées', 'Champignons hallucinogènes', 'Précurseurs chimiques'],
  },
  {
    heading: 'Matières radioactives — Interdit absolu',
    bullets: ['Sources radioactives', 'Isotopes radioactifs', 'Déchets nucléaires', 'Matériel irradié'],
  },
  {
    heading: 'Armes et objets dangereux',
    bullets: ['Armes à feu (toutes catégories)', 'Armes blanches (couteaux >6cm, épées, machettes)', 'Tasers et pistolets électriques', 'Matraques et tonfa', 'Sprays au poivre / lacrymogènes', 'Arts martiaux (nunchaku, shurikens, etc.)', 'Battes et clubs', 'Rasoirs et cutters'],
  },
  {
    heading: 'Restrictions en cabine (Règle 3-1-1) — Règle des 100ml',
    paragraphs: ['Tous les liquides, gels, crèmes et aérosols doivent être dans des contenants de 100ml maximum, placés dans un sac plastique transparent refermable de 1L.'],
    bullets: ['Boissons et eaux', 'Parfums et eaux de toilette', 'Crèmes et lotions', 'Gels (douche, cheveux)', 'Déodorants et sprays', 'Mascara et maquillage liquide', 'Dentifrices', 'Soupes et sauces'],
  },
  {
    heading: 'Articles à déclarer en douane',
    bullets: ["Sommes d'argent >10 000€", 'Bijoux et objets de valeur', 'Appareils électroniques professionnels', 'Marchandises commerciales', 'Tabac au-delà des franchises (200 cigarettes UE)', 'Alcool au-delà des franchises (1L spiritueux)', "Produits alimentaires d'origine animale", 'Médicaments avec ordonnance'],
  },
  { heading: 'Restrictions par pays — 🇫🇷 France / UE', bullets: ['Viandes et produits laitiers hors UE', 'Contrefaçons', 'CBD avec THC >0.3%'] },
  { heading: 'Restrictions par pays — 🇺🇸 USA', bullets: ['Fromages au lait cru', 'Kinder Surprise', 'Absinthe traditionnelle', 'Viandes non certifiées USDA'] },
  { heading: "Restrictions par pays — 🇨🇮 Côte d'Ivoire", bullets: ["Certains médicaments sans visa d'importation", 'Devises non déclarées'] },
  { heading: 'Restrictions par pays — 🇸🇳 Sénégal', bullets: ['Alcool (restrictions)', 'Produits à base de porc', 'Contrefaçons'] },
  { heading: 'Restrictions par pays — 🇨🇦 Canada', bullets: ['Produits laitiers et viandes', 'Fruits et légumes frais', 'Armes prohibées'] },
  {
    heading: 'Ressources officielles',
    bullets: [
      'IATA - Marchandises dangereuses : https://www.iata.org/en/programs/cargo/dgr/',
      'TSA - What Can I Bring? : https://www.tsa.gov/travel/security-screening/whatcanibring/all',
      'Douanes françaises - Franchises voyageurs : https://www.douane.gouv.fr/fiche/voyageurs-vos-franchises',
    ],
  },
  {
    heading: 'Responsabilité légale',
    paragraphs: [
      'En utilisant KiloFly, vous vous engagez à ne transporter aucun des articles interdits mentionnés ci-dessus.',
      "Le transport d'articles interdits peut entraîner :",
    ],
    bullets: [
      "Des poursuites pénales dans le pays de départ et/ou d'arrivée",
      'La confiscation des marchandises',
      "Des amendes pouvant atteindre plusieurs milliers d'euros",
      "Des peines d'emprisonnement selon la législation en vigueur",
      'La suspension définitive de votre compte KiloFly',
      "L'interdiction de voyager dans certains pays",
    ],
  },
  {
    heading: 'Avertissement',
    paragraphs: ["Cette liste n'est pas exhaustive. Il est de votre responsabilité de vérifier les réglementations spécifiques à votre compagnie aérienne et pays de destination."],
  },
];

export const INFO_PAGES: Record<InfoSlug, InfoPage> = {
  faq: {
    title: 'Questions Fréquentes (FAQ)',
    intro: 'Tout ce que vous devez savoir sur KiloFly',
    sections: [
      {
        heading: 'Politique de Modération',
        qa: [
          {
            q: 'Quelle est la politique de tolérance zéro de KiloFly ?',
            a: "KiloFly applique une politique de tolérance zéro concernant :\n• Le contenu inapproprié, offensant ou illégal\n• Les comportements abusifs envers d'autres utilisateurs\n• Toute violation des règles de la communauté\n\nTout contenu signalé sera examiné et supprimé dans un délai de 24 heures maximum. L'utilisateur responsable du contenu inapproprié sera immédiatement banni de la plateforme.",
          },
          {
            q: 'Comment signaler un contenu inapproprié ?',
            a: "Vous pouvez signaler du contenu inapproprié de plusieurs façons :\n• Signaler un utilisateur : cliquez sur le bouton \"Signaler\" sur le profil de l'utilisateur ou dans une conversation\n• Signaler une annonce : utilisez le bouton de signalement sur la page de l'annonce\n• Signaler un message : dans une conversation, utilisez les options de signalement disponibles\n\nChaque signalement est examiné par notre équipe de modération dans les 24 heures.",
          },
          {
            q: "Que se passe-t-il après un signalement ?",
            a: "Après réception de votre signalement :\n• Notre équipe examine le contenu signalé sous 24 heures\n• Si le contenu viole nos règles, il est immédiatement supprimé\n• L'utilisateur responsable reçoit un avertissement ou est banni selon la gravité\n• Vous recevez une notification vous informant de la décision\n\nNous prenons tous les signalements au sérieux et agissons rapidement pour maintenir une communauté sûre et respectueuse.",
          },
          {
            q: 'Puis-je bloquer un utilisateur ?',
            a: "Oui ! Vous pouvez bloquer n'importe quel utilisateur en utilisant le bouton \"Bloquer\" disponible sur leur profil ou dans les conversations.\n\nLorsque vous bloquez un utilisateur :\n• Il ne pourra plus vous contacter\n• Il ne verra plus vos annonces\n• Vous ne verrez plus ses annonces\n• Toutes les conversations existantes seront masquées\n\nVous pouvez débloquer un utilisateur à tout moment depuis vos paramètres de confidentialité.",
          },
          {
            q: 'Quels types de contenu sont interdits ?',
            a: "Les contenus suivants sont strictement interdits sur KiloFly :\n• Contenu violent, haineux ou discriminatoire\n• Harcèlement ou intimidation\n• Spam ou contenu trompeur\n• Contenu sexuellement explicite\n• Promotion d'activités illégales\n• Usurpation d'identité\n• Violation de la vie privée d'autrui\n• Contenu protégé par des droits d'auteur sans autorisation\n\nLa publication de tel contenu entraîne un bannissement immédiat et peut faire l'objet de poursuites légales.",
          },
        ],
      },
      {
        heading: 'Questions Générales',
        qa: [
          {
            q: 'Comment fonctionne KiloFly ?',
            a: "KiloFly met en relation des voyageurs ayant de l'espace disponible dans leurs bagages avec des personnes souhaitant envoyer des colis. Les voyageurs publient leurs trajets et les expéditeurs peuvent réserver de l'espace pour leurs envois.",
          },
          {
            q: "La vérification d'identité est-elle obligatoire ?",
            a: "Oui, absolument. Tous les utilisateurs doivent soumettre une pièce d'identité valide qui sera vérifiée par notre équipe. Seuls les utilisateurs vérifiés peuvent publier des annonces et effectuer des transactions. Cette mesure garantit la sécurité et la confiance au sein de notre communauté.",
          },
          {
            q: 'Quels sont les frais de service ?',
            a: 'KiloFly prélève une commission de 5% sur toutes les transactions. Les tarifs de transport sont librement fixés entre voyageurs et expéditeurs.',
          },
          {
            q: 'Comment puis-je contacter le support ?',
            a: 'Vous pouvez nous contacter à kiloflyapp@hotmail.com pour toute question ou problème. Notre équipe répond généralement sous 24-48 heures.',
          },
        ],
      },
      {
        heading: "Besoin d'aide supplémentaire ?",
        paragraphs: [
          'Si vous ne trouvez pas la réponse à votre question, notre équipe de support est là pour vous aider : kiloflyapp@hotmail.com',
        ],
      },
    ],
  },
  prohibited: {
    title: 'Objets interdits',
    intro: 'Guide complet des articles interdits selon les normes IATA et TSA',
    sections: REGULATION_SECTIONS,
  },
  airports: {
    title: 'Réglementations Aéroportuaires',
    intro: 'Guide complet des articles interdits selon les normes IATA et TSA',
    sections: REGULATION_SECTIONS,
  },
  terms: {
    title: "Conditions d'Utilisation",
    intro: 'Portée mondiale — Document juridique final',
    sections: [
      {
        heading: 'Nature du Service (Clause clé)',
        paragraphs: [
          "KiloFly est une plateforme numérique de mise en relation entre utilisateurs. KiloFly n'est pas un transporteur, n'est pas un intermédiaire de transport, ne prend jamais possession des colis, ne les emballe pas, ne les stocke pas, ne les inspecte pas physiquement et n'intervient pas dans leur acheminement.",
          'Tous les transports, échanges et remises de colis sont effectués exclusivement sous la responsabilité des utilisateurs (expéditeur et voyageur). KiloFly fournit uniquement un outil technologique facilitant la mise en relation.',
        ],
      },
      {
        heading: '1. Responsabilité Exclusive des Utilisateurs',
        bullets: [
          "L'expéditeur est seul responsable du contenu, de la légalité et de la conformité du colis.",
          "Le voyageur est seul responsable de ce qu'il accepte de transporter.",
          "Chaque utilisateur est responsable du respect des lois douanières, pénales et administratives des pays de départ, de transit et d'arrivée.",
        ],
      },
      {
        heading: '2. Objets Strictement Interdits',
        paragraphs: ["Responsabilité pénale de l'utilisateur :"],
        bullets: [
          'Drogues, stupéfiants, substances illégales',
          'Armes, munitions, explosifs, objets dangereux',
          'Médicaments non autorisés ou soumis à prescription',
          "Documents officiels (passeport, carte d'identité, titres de séjour)",
          'Argent liquide, métaux précieux, bijoux de grande valeur',
          'Produits contrefaits ou illégaux',
          'Tout objet interdit par la loi ou les autorités douanières',
        ],
      },
      {
        heading: 'Sanctions',
        paragraphs: [
          '⚠️ Toute violation entraîne la suspension immédiate du compte, le blocage des fonds et peut faire l\'objet d\'un signalement aux autorités compétentes.',
        ],
      },
      {
        heading: '3. Limitation Maximale de Responsabilité',
        paragraphs: [
          'KiloFly ne saurait être tenue responsable, directement ou indirectement, de tout dommage, perte, vol, saisie, retard, sanction, poursuite ou conséquence liée :',
        ],
        bullets: ["Au contenu d'un colis", 'Au transport lui-même', 'Aux décisions des autorités douanières ou aéroportuaires', 'Aux transactions entre utilisateurs', 'Aux conflits entre utilisateurs'],
      },
      {
        heading: "4. Conditions d'Inscription",
        paragraphs: ['Pour utiliser KiloFly, vous devez :'],
        bullets: [
          'Avoir au moins 18 ans',
          'Fournir des informations exactes et à jour',
          'Soumettre une photo de profil récente',
          "Vérifier votre identité avec une pièce d'identité valide",
          'Accepter la politique de confidentialité',
          'Maintenir la confidentialité de votre compte',
        ],
      },
      {
        heading: '5. Suspension, Blocage et Suppression',
        paragraphs: ['KiloFly se réserve le droit de :'],
        bullets: ['Suspendre ou supprimer un compte sans préavis', 'Bloquer ou geler un paiement', "Refuser l'accès à la plateforme"],
      },
      {
        heading: 'Application des mesures',
        paragraphs: ['Ces mesures peuvent être appliquées en cas de fraude, risque, non-respect des règles ou menace pour la sécurité de la plateforme.'],
      },
      {
        heading: '6. Politique de Tolérance Zéro',
        paragraphs: ['KiloFly applique une politique de tolérance zéro concernant :'],
        bullets: ['Le contenu inapproprié, offensant ou illégal', "Les comportements abusifs envers d'autres utilisateurs", 'Toute violation des règles de la communauté'],
      },
      {
        heading: 'Traitement des signalements',
        paragraphs: ["Tout contenu signalé sera examiné et supprimé dans un délai de 24 heures maximum. L'utilisateur responsable sera immédiatement banni de la plateforme."],
      },
      {
        heading: '7. Paiements et Commission',
        paragraphs: [
          'Les tarifs sont librement fixés entre voyageurs et expéditeurs. KiloFly prélève une commission de 5% sur toutes les transactions. Les paiements sont traités par des prestataires sécurisés (Stripe pour les cartes bancaires, FeexPay pour le mobile money).',
        ],
      },
      {
        heading: '8. Clause App Store / Google Play',
        paragraphs: [
          "KiloFly est une application indépendante. Apple Inc. et Google LLC ne sont ni éditeurs, ni sponsors, ni responsables du service. Toute réclamation relative à KiloFly doit être adressée exclusivement à l'éditeur de l'application.",
        ],
      },
      {
        heading: '9. Droit Applicable et Juridiction',
        paragraphs: [
          "Les présentes conditions sont régies par les principes généraux du droit international privé. En cas de litige, l'éditeur se réserve le droit de déterminer la juridiction compétente.",
        ],
      },
      {
        heading: '10. Contact Légal',
        paragraphs: ["Pour toute question concernant ces conditions d'utilisation, contactez-nous à : kiloflyapp@hotmail.com"],
      },
      {
        heading: '📋 Rappel Important',
        paragraphs: [
          "En utilisant KiloFly, vous reconnaissez avoir lu, compris et accepté l'intégralité de ces conditions d'utilisation. Vous êtes responsable de vous assurer que votre utilisation de la plateforme est conforme aux lois de votre pays, des pays de transit et du pays de destination.",
        ],
      },
    ],
  },
  privacy: {
    title: 'Politique de Confidentialité',
    intro: 'Conformité internationale — RGPD, LPRPDE et lois locales applicables',
    sections: [
      {
        heading: '1. Données Collectées',
        paragraphs: ['KiloFly collecte les données suivantes dans le cadre de la fourniture du service :'],
        bullets: [
          "Données d'identification : nom, email, numéro de téléphone",
          "Données de compte et d'utilisation : informations de profil, historique d'activité",
          'Données de paiement : traitées par des prestataires sécurisés (Stripe pour les cartes, FeexPay pour le mobile money)',
          "Données de vérification : document d'identité, selfie (si vérification activée)",
          'Données techniques et de sécurité : adresse IP, données de connexion',
        ],
      },
      {
        heading: '2. Finalités du Traitement',
        paragraphs: ['Vos données sont utilisées pour :'],
        bullets: ['Fourniture du service de mise en relation', 'Sécurité et prévention de la fraude', 'Gestion des transactions et paiements', 'Amélioration continue de la plateforme', 'Respect des obligations légales'],
      },
      {
        heading: '3. Conformité Internationale',
        paragraphs: [
          "KiloFly applique des standards élevés de protection des données inspirés des principes du RGPD européen, de la LPRPDE canadienne et des lois locales applicables, quel que soit le pays de résidence de l'utilisateur.",
        ],
      },
      {
        heading: '4. Vos Droits (Monde Entier)',
        paragraphs: ['Vous disposez des droits suivants concernant vos données personnelles :'],
        bullets: [
          "Droit d'accès : consulter vos données personnelles",
          'Droit de rectification : corriger vos informations',
          "Droit à l'effacement : supprimer votre compte et vos données",
          "Droit d'opposition : vous opposer au traitement de vos données",
          'Droit à la portabilité : récupérer vos données dans un format structuré',
        ],
      },
      {
        heading: '5. Sécurité et Conservation',
        bullets: [
          'Mesures techniques et organisationnelles raisonnables',
          'Accès restreint aux données (personnel autorisé uniquement)',
          'Conservation limitée au strict nécessaire',
          'Chiffrement des données sensibles',
          "Stockage sécurisé des documents d'identité",
        ],
      },
      {
        heading: '6. Coopération avec les Autorités',
        paragraphs: ['KiloFly peut divulguer certaines données si la loi l\'exige ou pour protéger la plateforme, les utilisateurs ou le public.'],
      },
      {
        heading: '7. Cookies',
        paragraphs: [
          "Notre application utilise des cookies essentiels pour le fonctionnement de la plateforme (authentification, préférences). Aucun cookie de suivi publicitaire n'est utilisé sans votre consentement explicite.",
        ],
      },
      {
        heading: '8. Contact',
        paragraphs: ['Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à : kiloflyapp@hotmail.com'],
      },
    ],
  },
};
