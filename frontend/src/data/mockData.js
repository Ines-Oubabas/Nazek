export const services = [
  {
    id: 1,
    name: 'Ménage à domicile',
    description: 'Service de nettoyage professionnel à domicile',
    detailed_description: 'Notre service de ménage à domicile offre un nettoyage complet et professionnel de votre intérieur. Nos prestataires expérimentés utilisent des produits écologiques et des techniques efficaces pour garantir un résultat impeccable.',
    price: 25,
    rating: 4.8,
    total_reviews: 156,
    location: 'Alger',
    image: null, // sera rempli par le prestataire
    category: 'Ménage',
    tags: ['Nettoyage', 'Professionnel', 'Écologique'],
    providers: [1, 2, 3],
  },
  {
    id: 2,
    name: 'Cours particuliers',
    description: 'Cours particuliers pour tous niveaux',
    detailed_description: 'Des cours particuliers adaptés à vos besoins, dispensés par des enseignants qualifiés. Nous couvrons toutes les matières et tous les niveaux, du primaire au supérieur.',
    price: 30,
    rating: 4.9,
    total_reviews: 89,
    location: 'Alger',
    image: null,
    category: 'Éducation',
    tags: ['Éducation', 'Personnalisé', 'Qualifié'],
    providers: [4, 5],
  },
  {
    id: 3,
    name: 'Bricolage',
    description: 'Services de bricolage et réparation',
    detailed_description: 'Des bricoleurs professionnels pour tous vos travaux de réparation et d\'aménagement. Installation, réparation, montage de meubles, et plus encore.',
    price: 35,
    rating: 4.7,
    total_reviews: 234,
    location: 'Alger',
    image: null,
    category: 'Bricolage',
    tags: ['Réparation', 'Installation', 'Professionnel'],
    providers: [6, 7],
  },
];

export const providers = [
  {
    id: 1,
    name: 'Sarah Benali',
    avatar: null,
    experience: 5,
    description: 'Professionnelle du ménage avec plus de 5 ans d\'expérience. Spécialisée dans le nettoyage écologique.',
    services: [1],
    rating: 4.9,
    total_reviews: 45,
    availability: {
      monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      saturday: ['09:00', '10:00', '11:00'],
      sunday: [],
    },
  },
  {
    id: 2,
    name: 'Karim Boudiaf',
    avatar: null,
    experience: 3,
    description: 'Prestataire de services de ménage professionnel. Méthodique et efficace.',
    services: [1],
    rating: 4.7,
    total_reviews: 32,
    availability: {
      monday: ['10:00', '11:00', '12:00', '15:00', '16:00'],
      tuesday: ['10:00', '11:00', '12:00', '15:00', '16:00'],
      wednesday: ['10:00', '11:00', '12:00', '15:00', '16:00'],
      thursday: ['10:00', '11:00', '12:00', '15:00', '16:00'],
      friday: ['10:00', '11:00', '12:00', '15:00', '16:00'],
      saturday: ['10:00', '11:00', '12:00'],
      sunday: [],
    },
  },
  {
    id: 4,
    name: 'Leila Hamidi',
    avatar: null,
    experience: 8,
    description: 'Professeur expérimentée en mathématiques et physique. Spécialisée dans la préparation aux examens.',
    services: [2],
    rating: 4.9,
    total_reviews: 67,
    availability: {
      monday: ['14:00', '15:00', '16:00', '17:00', '18:00'],
      tuesday: ['14:00', '15:00', '16:00', '17:00', '18:00'],
      wednesday: ['14:00', '15:00', '16:00', '17:00', '18:00'],
      thursday: ['14:00', '15:00', '16:00', '17:00', '18:00'],
      friday: ['14:00', '15:00', '16:00', '17:00', '18:00'],
      saturday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      sunday: [],
    },
  },
  {
    id: 6,
    name: 'Yacine Khelifi',
    avatar: null,
    experience: 6,
    description: 'Bricoleur professionnel polyvalent. Spécialisé dans la réparation et l\'installation.',
    services: [3],
    rating: 4.8,
    total_reviews: 89,
    availability: {
      monday: ['08:00', '09:00', '10:00', '14:00', '15:00'],
      tuesday: ['08:00', '09:00', '10:00', '14:00', '15:00'],
      wednesday: ['08:00', '09:00', '10:00', '14:00', '15:00'],
      thursday: ['08:00', '09:00', '10:00', '14:00', '15:00'],
      friday: ['08:00', '09:00', '10:00', '14:00', '15:00'],
      saturday: ['08:00', '09:00', '10:00'],
      sunday: [],
    },
  },
];

export const appointments = [
  {
    id: 1,
    service: 1,
    provider: 1,
    client: 1,
    date: '2024-03-20',
    time: '10:00',
    duration: 120,
    status: 'confirmed',
    notes: 'Nettoyage complet de l\'appartement',
    address: '123 Rue des Lilas, Alger',
    email: 'client@example.com',
    phone: '0123456789',
    serviceFor: 'self',
    paymentMethod: 'card',
    paymentStatus: 'pending',
  },
  {
    id: 2,
    service: 2,
    provider: 4,
    client: 1,
    date: '2024-03-22',
    time: '15:00',
    duration: 60,
    status: 'pending',
    notes: 'Cours de mathématiques niveau terminale',
    address: '456 Avenue des Roses, Alger',
    email: 'client@example.com',
    phone: '0123456789',
    serviceFor: 'other',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
  },
];

export const categories = [
  { id: 1, name: 'Ménage', icon: 'cleaning' },
  { id: 2, name: 'Éducation', icon: 'school' },
  { id: 3, name: 'Bricolage', icon: 'build' },
  { id: 4, name: 'Cuisine', icon: 'restaurant' },
  { id: 5, name: 'Transport', icon: 'directions_car' },
];
