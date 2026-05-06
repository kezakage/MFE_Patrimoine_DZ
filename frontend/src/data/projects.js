// Mock data — patrimoine architectural algérien
export const PERIODS = [
  'Préhistorique', 'Antique', 'Médiéval', 'Ottoman', 'Colonial', 'Contemporain'
]

export const TYPES = [
  'Mosquée', 'Médersa', 'Casbah', 'Palais', 'Fortification',
  'Église', 'Synagogue', 'Mausolée', 'Habitat traditionnel', 'Site archéologique'
]

export const REGIONS = [
  'Alger', 'Oran', 'Constantine', 'Tlemcen', 'Ghardaïa', 'Annaba',
  'Béjaïa', 'Tipaza', 'Tlemcen', 'Adrar', 'Béchar', 'Sétif'
]

export const PROJECTS = [
  {
    id: 'p1',
    name: "Casbah d'Alger",
    summary: "Cité historique inscrite au patrimoine mondial de l'UNESCO, témoignage du tissu urbain ottoman.",
    period: 'Ottoman',
    region: 'Alger',
    type: 'Casbah',
    status: 'valide',
    contributors: ['Dr. Amina Belhadj', 'Karim Saadi', 'Pr. Hocine Mansouri'],
    coverColor: '#8f2e1c',
    images: 12,
    annotations: 34,
    versions: 8,
    lat: 36.7838, lng: 3.0589,
    description: "La Casbah d'Alger, médina ottomane perchée sur les hauteurs de la baie, conserve un tissu urbain dense et un riche patrimoine bâti (palais, mosquées, fontaines, demeures). Inscrite au patrimoine mondial en 1992."
  },
  {
    id: 'p2',
    name: 'Mosquée Ketchaoua',
    summary: "Édifice majeur d'Alger, symbole d'une histoire mêlant architecture ottomane et néo-mauresque.",
    period: 'Ottoman',
    region: 'Alger',
    type: 'Mosquée',
    status: 'en_cours',
    contributors: ['Dr. Amina Belhadj'],
    coverColor: '#a56432',
    images: 8,
    annotations: 11,
    versions: 3,
    lat: 36.7847, lng: 3.0603,
    description: "Construite à la fin du XVIIe siècle, transformée en cathédrale durant la période coloniale, la mosquée Ketchaoua a retrouvé sa fonction religieuse à l'indépendance."
  },
  {
    id: 'p3',
    name: 'Mansourah (Tlemcen)',
    summary: "Cité mérinide en ruine, célèbre pour son minaret monumental.",
    period: 'Médiéval',
    region: 'Tlemcen',
    type: 'Site archéologique',
    status: 'en_conflit',
    contributors: ['Karim Saadi', 'Pr. Hocine Mansouri'],
    coverColor: '#cd5028',
    images: 19,
    annotations: 27,
    versions: 5,
    lat: 34.8713, lng: -1.3404,
    description: "Mansourah fut bâtie au début du XIVe siècle par les Mérinides lors du siège de Tlemcen. Il subsiste un minaret monumental et un plan de mosquée exceptionnel."
  },
  {
    id: 'p4',
    name: 'Ksar de Ghardaïa',
    summary: "Pentapole du M'Zab — habitat ibadite remarquable et exemple d'urbanisme saharien.",
    period: 'Médiéval',
    region: 'Ghardaïa',
    type: 'Habitat traditionnel',
    status: 'valide',
    contributors: ['Pr. Hocine Mansouri', 'Dr. Amina Belhadj'],
    coverColor: '#bd7d3d',
    images: 22,
    annotations: 41,
    versions: 12,
    lat: 32.4910, lng: 3.6730,
    description: "La vallée du M'Zab regroupe cinq ksour ibadites organisés autour de mosquées sobres et de cimetières. Inscrite à l'UNESCO en 1982."
  },
  {
    id: 'p5',
    name: 'Timgad',
    summary: "Cité romaine du IIe siècle, plan en damier exceptionnellement conservé.",
    period: 'Antique',
    region: 'Sétif',
    type: 'Site archéologique',
    status: 'valide',
    contributors: ['Karim Saadi'],
    coverColor: '#824c2b',
    images: 28,
    annotations: 52,
    versions: 9,
    lat: 35.4844, lng: 6.4683,
    description: "Fondée par Trajan en 100 ap. J.-C., Timgad est l'un des meilleurs exemples d'urbanisme romain. Inscrite au patrimoine mondial en 1982."
  },
  {
    id: 'p6',
    name: "Médersa d'El-Eubbad (Tlemcen)",
    summary: "Médersa attenante au mausolée de Sidi Boumediene, joyau de l'art mérinide.",
    period: 'Médiéval',
    region: 'Tlemcen',
    type: 'Médersa',
    status: 'en_cours',
    contributors: ['Dr. Amina Belhadj'],
    coverColor: '#67241a',
    images: 6,
    annotations: 14,
    versions: 2,
    lat: 34.8580, lng: -1.2997,
    description: "La médersa d'El-Eubbad, fondée en 1347, témoigne du raffinement décoratif mérinide : stucs ciselés, zelliges et bois sculptés."
  },
]

export const STATUS_LABEL = {
  en_cours: 'En cours',
  valide: 'Validé',
  en_conflit: 'En conflit',
}

export const STATUS_CLASS = {
  en_cours: 'bg-amber-100 text-amber-800',
  valide: 'bg-emerald-100 text-emerald-800',
  en_conflit: 'bg-red-100 text-red-800',
}

export const findProject = (id) => PROJECTS.find(p => p.id === id)
