"""
Seed 30 Algerian heritage resources covering the 7 UNESCO sites plus 23 other
classified monuments across the major wilayas.

Usage:
    python manage.py seed_heritage
"""
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from apps.heritage.models import HeritageResource


P = HeritageResource.Period
A = HeritageResource.ArchitecturalType
C = HeritageResource.ClassificationLevel


# Canonical cover photos resolved from Wikimedia Commons (CC-licensed, CDN-stable
# upload.wikimedia.org URLs). Keyed on name_fr. Monuments without a suitable
# Commons photo are omitted and fall back to a generated gradient in the UI.
COVERS = {
    "Bibliothèque Nationale d'Algérie": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Alger_-_Bibliotheque_Nationale%2C_front_2.jpg/1920px-Alger_-_Bibliotheque_Nationale%2C_front_2.jpg",
    "Casbah d'Alger": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Architectural_and_Cultural_Heritage_of_the_Casbah_of_Algiers_6.jpg/1920px-Architectural_and_Cultural_Heritage_of_the_Casbah_of_Algiers_6.jpg",
    "Djémila (Cuicul)": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Roman_Ruins_of_Djemila_in_S%C3%A9tif%2C_Algeria.jpg/1920px-Roman_Ruins_of_Djemila_in_S%C3%A9tif%2C_Algeria.jpg",
    "Timgad (Thamugadi)": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Arch_of_Trajan_%28Timgad%29.jpg/1920px-Arch_of_Trajan_%28Timgad%29.jpg",
    "Tipaza (site archéologique)": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/View_of_Tipasa_01.jpg/1920px-View_of_Tipasa_01.jpg",
    "Vallée du M'Zab — Ghardaïa": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ghardaia_depuis_Melika.jpg/1920px-Ghardaia_depuis_Melika.jpg",
    "Qalâa des Béni Hammad": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Great_Mosque_of_El_Qal%27a_Beni_Hammad_minaret.png",
    "Tassili n'Ajjer": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Esprit_nomade.JPG/1920px-Esprit_nomade.JPG",
    "Mosquée Sidi Boumediene": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Tomb_of_Sidi_Boumediene_01.jpg/1920px-Tomb_of_Sidi_Boumediene_01.jpg",
    "Mansourah": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/D%C3%A9coration_de_la_fa%C3%A7ade_sup%C3%A9rieure_du_minaret_de_la_Mosqu%C3%A9e_de_Mansourah%2C_Tlemcen.jpg/1920px-D%C3%A9coration_de_la_fa%C3%A7ade_sup%C3%A9rieure_du_minaret_de_la_Mosqu%C3%A9e_de_Mansourah%2C_Tlemcen.jpg",
    "Grande Mosquée de Tlemcen": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mihrab_de_la_Grande_Mosqu%C3%A9e_de_Tlemcen%2C_2026.jpg/1920px-Mihrab_de_la_Grande_Mosqu%C3%A9e_de_Tlemcen%2C_2026.jpg",
    "Mosquée Ketchaoua": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Ketchaoua_Mosque_Algiers_Ke%C3%A7iova_Camisi_Cezayir-02.jpg/1920px-Ketchaoua_Mosque_Algiers_Ke%C3%A7iova_Camisi_Cezayir-02.jpg",
    "Médersa Sidi El Kettani": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Fonds_Andr%C3%A9_Raymond_%281925-2011%29_-_Alg%C3%A9rie_-_Constantine_-_Cour_de_la_mosqu%C3%A9e_et_medersa_El-Kettani_%28M%C3%A9diHAL_4427038%29.jpg/1280px-Fonds_Andr%C3%A9_Raymond_%281925-2011%29_-_Alg%C3%A9rie_-_Constantine_-_Cour_de_la_mosqu%C3%A9e_et_medersa_El-Kettani_%28M%C3%A9diHAL_4427038%29.jpg",
    "Mosquée El Djedid": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Djamaa_el_Djedid_-_1890.tif/lossy-page1-1920px-Djamaa_el_Djedid_-_1890.tif.jpg",
    "Palais des Raïs (Bastion 23)": "https://upload.wikimedia.org/wikipedia/commons/8/82/Kasr_rais_algiers_bastion_23.png",
    "Notre-Dame d'Afrique": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Notre_Dame_d%27Afrique2.jpg/1920px-Notre_Dame_d%27Afrique2.jpg",
    "Hôtel des Postes (La Grande Poste)": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Metro_alger_grande_poste_11072015.jpg",
    "Palais Ahmed Bey": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Ahmed_Bey_Palace_06.jpg/1920px-Ahmed_Bey_Palace_06.jpg",
    "Mosquée Emir Abdelkader": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Emir_Abdelkader_Mosque_05.jpg/1920px-Emir_Abdelkader_Mosque_05.jpg",
    "Pont Sidi M'Cid": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Pont_de_Sidi_M%27Cid_06.jpg/1920px-Pont_de_Sidi_M%27Cid_06.jpg",
    "Fort de Santa Cruz": "https://upload.wikimedia.org/wikipedia/commons/4/40/Oran_Santa_Cruz.JPG",
    "Palais du Bey Mohamed El Kebir": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/The_Bey%E2%80%99s_Palace_of_Oran_17.jpg/1920px-The_Bey%E2%80%99s_Palace_of_Oran_17.jpg",
    "Cathédrale du Sacré-Cœur d'Oran": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Oran_%28Alg%C3%A9rie%29_Ancienne_cath%C3%A9drale_du_Sacr%C3%A9-C%C5%93ur_-_Abside_et_coupole.jpg/1920px-Oran_%28Alg%C3%A9rie%29_Ancienne_cath%C3%A9drale_du_Sacr%C3%A9-C%C5%93ur_-_Abside_et_coupole.jpg",
    "Mausolée Royal de Maurétanie (Tombeau de la Chrétienne)": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Royal_Mausoleum_of_Mauretania_02.jpg/1920px-Royal_Mausoleum_of_Mauretania_02.jpg",
    "Théâtre Romain de Cherchell": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ancient_Roman_theater_%28Cherchell%29_01.jpg/1920px-Ancient_Roman_theater_%28Cherchell%29_01.jpg",
    "Médracen": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Royal_Mausoleum_of_Madghacen%2C_the_oldest_mausoleum_in_the_Maghreb_made_for_an_unknown_Numidian_Amazigh_king_who_lived_in_the_4th_or_3rd_century_BC%2C_Algeria_-_54274008897.jpg/1920px-thumbnail.jpg",
}


SEED = [
    # ---------- 7 UNESCO World Heritage Sites ----------
    {
        "name_fr": "Casbah d'Alger", "name_ar": "قصبة الجزائر",
        "wilaya": "Alger", "commune": "Casbah",
        "period": P.OTTOMAN, "architectural_type": A.CASBAH,
        "classification_level": C.UNESCO,
        "geo_point": Point(3.0588, 36.7833, srid=4326),
        "description": "Médina ottomane de la baie d'Alger, classée patrimoine mondial UNESCO en 1992. Architecture vernaculaire en escalier dominée par la citadelle.",
    },
    {
        "name_fr": "Djémila (Cuicul)", "name_ar": "جميلة",
        "wilaya": "Sétif", "commune": "Djémila",
        "period": P.ROMAN, "architectural_type": A.ARCHAEOLOGICAL_SITE,
        "classification_level": C.UNESCO,
        "geo_point": Point(5.7367, 36.3208, srid=4326),
        "description": "Cité romano-byzantine de montagne fondée au Ier siècle. Forum, basilique chrétienne et thermes remarquablement conservés. UNESCO 1982.",
    },
    {
        "name_fr": "Timgad (Thamugadi)", "name_ar": "تيمقاد",
        "wilaya": "Batna", "commune": "Timgad",
        "period": P.ROMAN, "architectural_type": A.ARCHAEOLOGICAL_SITE,
        "classification_level": C.UNESCO,
        "geo_point": Point(6.4683, 35.4842, srid=4326),
        "description": "Colonie militaire romaine fondée par Trajan en 100 ap. J.-C. Plan en damier exemplaire de l'urbanisme romain. UNESCO 1982.",
    },
    {
        "name_fr": "Tipaza (site archéologique)", "name_ar": "تيبازة",
        "wilaya": "Tipaza", "commune": "Tipaza",
        "period": P.ROMAN, "architectural_type": A.ARCHAEOLOGICAL_SITE,
        "classification_level": C.UNESCO,
        "geo_point": Point(2.4486, 36.5944, srid=4326),
        "description": "Ensemble archéologique punico-romain en bord de Méditerranée, comprenant amphithéâtre, basiliques chrétiennes et villas. UNESCO 1982.",
    },
    {
        "name_fr": "Vallée du M'Zab — Ghardaïa", "name_ar": "وادي ميزاب",
        "wilaya": "Ghardaïa", "commune": "Ghardaïa",
        "period": P.MEDIEVAL, "architectural_type": A.CASBAH,
        "classification_level": C.UNESCO,
        "geo_point": Point(3.6730, 32.4906, srid=4326),
        "description": "Pentapole ibadite (Ghardaïa, Beni Isguen, Melika, Bounoura, El-Atteuf) fondée au XIe siècle. Architecture désertique pure inspirant Le Corbusier. UNESCO 1982.",
    },
    {
        "name_fr": "Qalâa des Béni Hammad", "name_ar": "قلعة بني حماد",
        "wilaya": "M'Sila", "commune": "Maâdid",
        "period": P.MEDIEVAL, "architectural_type": A.FORTIFICATION,
        "classification_level": C.UNESCO,
        "geo_point": Point(4.7903, 35.8181, srid=4326),
        "description": "Première capitale hammadide fondée en 1007. Vestiges de palais, mosquée et minaret monumental. Premier site algérien classé UNESCO en 1980.",
    },
    {
        "name_fr": "Tassili n'Ajjer", "name_ar": "طاسيلي ناجر",
        "wilaya": "Illizi", "commune": "Djanet",
        "period": P.PREHISTORIC, "architectural_type": A.ARCHAEOLOGICAL_SITE,
        "classification_level": C.UNESCO,
        "geo_point": Point(9.3000, 25.5000, srid=4326),
        "description": "Massif saharien aux 15 000 peintures et gravures rupestres datant du Néolithique. Témoignage majeur de l'art préhistorique africain. UNESCO 1982.",
    },

    # ---------- Tlemcen ----------
    {
        "name_fr": "Mosquée Sidi Boumediene", "name_ar": "ضريح سيدي بومدين",
        "wilaya": "Tlemcen", "commune": "El-Eubbad",
        "period": P.MEDIEVAL, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-1.2917, 34.8767, srid=4326),
        "description": "Complexe religieux mérinide érigé en 1339 autour du tombeau du saint soufi. Portail en stuc finement ciselé et minaret octogonal.",
    },
    {
        "name_fr": "Mansourah", "name_ar": "المنصورة",
        "wilaya": "Tlemcen", "commune": "Mansourah",
        "period": P.MEDIEVAL, "architectural_type": A.FORTIFICATION,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-1.3478, 34.8714, srid=4326),
        "description": "Cité mérinide édifiée en 1303 lors du siège de Tlemcen. Murailles de 4 km et célèbre minaret tronqué de 38 m témoignent de sa grandeur passée.",
    },
    {
        "name_fr": "Grande Mosquée de Tlemcen", "name_ar": "الجامع الكبير بتلمسان",
        "wilaya": "Tlemcen", "commune": "Tlemcen",
        "period": P.MEDIEVAL, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-1.3170, 34.8830, srid=4326),
        "description": "Édifiée en 1136 par les Almoravides, agrandie par les Almohades. Coupole à muqarnas devant le mihrab, chef-d'œuvre de l'art hispano-mauresque.",
    },
    {
        "name_fr": "Médersa Tachfiniya", "name_ar": "مدرسة التاشفينية",
        "wilaya": "Tlemcen", "commune": "Tlemcen",
        "period": P.MEDIEVAL, "architectural_type": A.MEDERSA,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-1.3160, 34.8860, srid=4326),
        "description": "Médersa zianide fondée par Abou Tachfin Ier au XIVe siècle. Patrimoine éducatif et religieux du Maghreb central.",
    },

    # ---------- Alger ----------
    {
        "name_fr": "Mosquée Ketchaoua", "name_ar": "جامع كتشاوة",
        "wilaya": "Alger", "commune": "Casbah",
        "period": P.OTTOMAN, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0612, 36.7858, srid=4326),
        "description": "Mosquée emblématique de la basse Casbah, fondée en 1612. Transformée en cathédrale Saint-Philippe en 1845, restituée au culte musulman en 1962. Restaurée par la Turquie en 2018.",
    },
    {
        "name_fr": "Mosquée El Djedid", "name_ar": "الجامع الجديد",
        "wilaya": "Alger", "commune": "Alger-Centre",
        "period": P.OTTOMAN, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0598, 36.7775, srid=4326),
        "description": "Dite « Mosquée de la Pêcherie », bâtie en 1660 sur plan en croix grecque inspiré de l'architecture ottomane. Coupole centrale et minaret carré caractéristiques.",
    },
    {
        "name_fr": "Mosquée Safir (El Kebir)", "name_ar": "الجامع الكبير",
        "wilaya": "Alger", "commune": "Casbah",
        "period": P.MEDIEVAL, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0610, 36.7820, srid=4326),
        "description": "Plus ancienne mosquée d'Alger, fondée par les Almoravides en 1097. Plan hypostyle à 11 nefs et minaret ajouté par les Hafsides en 1324.",
    },
    {
        "name_fr": "Palais des Raïs (Bastion 23)", "name_ar": "قصر الرياس",
        "wilaya": "Alger", "commune": "Bab El Oued",
        "period": P.OTTOMAN, "architectural_type": A.PALACE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0510, 36.7900, srid=4326),
        "description": "Dernier vestige du front de mer ottoman d'Alger (XVIe-XVIIe siècle). Trois palais et six maisons de pêcheurs restaurés en centre culturel.",
    },
    {
        "name_fr": "Mosquée Sidi Abderrahmane", "name_ar": "جامع سيدي عبد الرحمن",
        "wilaya": "Alger", "commune": "Casbah",
        "period": P.OTTOMAN, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0617, 36.7841, srid=4326),
        "description": "Mausolée du saint patron d'Alger, édifié en 1611. Cimetière historique et zaouïa attenants attirent toujours pèlerins et fidèles.",
    },
    {
        "name_fr": "Notre-Dame d'Afrique", "name_ar": "كاتدرائية سيدة إفريقيا",
        "wilaya": "Alger", "commune": "Bologhine",
        "period": P.COLONIAL, "architectural_type": A.CHURCH,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0356, 36.8044, srid=4326),
        "description": "Basilique néo-byzantine consacrée en 1872, dominant la baie d'Alger depuis la falaise de Z'ghara. Inscription « Priez pour nous et pour les Musulmans » au-dessus du chœur.",
    },
    {
        "name_fr": "Hôtel des Postes (La Grande Poste)", "name_ar": "البريد المركزي",
        "wilaya": "Alger", "commune": "Alger-Centre",
        "period": P.COLONIAL, "architectural_type": A.OTHER,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0581, 36.7700, srid=4326),
        "description": "Édifice néo-mauresque achevé en 1913 par les architectes Voinot et Toudoire. Symbole de l'éclectisme Arabisance et icône du centre-ville d'Alger.",
    },
    {
        "name_fr": "Bibliothèque Nationale d'Algérie", "name_ar": "المكتبة الوطنية الجزائرية",
        "wilaya": "Alger", "commune": "El Hamma",
        "period": P.CONTEMPORARY, "architectural_type": A.OTHER,
        "classification_level": C.NATIONAL,
        "geo_point": Point(3.0750, 36.7530, srid=4326),
        "description": "Édifice contemporain inauguré en 1998. Une des plus grandes bibliothèques d'Afrique avec plus d'un million d'ouvrages.",
    },

    # ---------- Constantine ----------
    {
        "name_fr": "Palais Ahmed Bey", "name_ar": "قصر أحمد باي",
        "wilaya": "Constantine", "commune": "Constantine",
        "period": P.OTTOMAN, "architectural_type": A.PALACE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(6.6147, 36.3650, srid=4326),
        "description": "Résidence du dernier bey ottoman de Constantine (1825-1835). Cours intérieures à arcades, fontaines en marbre et fresques murales orientalistes.",
    },
    {
        "name_fr": "Mosquée Emir Abdelkader", "name_ar": "جامع الأمير عبد القادر",
        "wilaya": "Constantine", "commune": "Constantine",
        "period": P.CONTEMPORARY, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(6.6150, 36.3500, srid=4326),
        "description": "Inaugurée en 1994, l'une des plus grandes mosquées d'Afrique. Deux minarets de 107 m et coupole monumentale de 64 m de diamètre.",
    },
    {
        "name_fr": "Pont Sidi M'Cid", "name_ar": "جسر سيدي مسيد",
        "wilaya": "Constantine", "commune": "Constantine",
        "period": P.COLONIAL, "architectural_type": A.OTHER,
        "classification_level": C.NATIONAL,
        "geo_point": Point(6.6175, 36.3683, srid=4326),
        "description": "Pont suspendu de 168 m de long inauguré en 1912, surplombant les gorges du Rhumel à 175 m. Prouesse d'ingénierie civile.",
    },
    {
        "name_fr": "Médersa Sidi El Kettani", "name_ar": "مدرسة سيدي الكتاني",
        "wilaya": "Constantine", "commune": "Constantine",
        "period": P.OTTOMAN, "architectural_type": A.MEDERSA,
        "classification_level": C.NATIONAL,
        "geo_point": Point(6.6130, 36.3640, srid=4326),
        "description": "Médersa du XVIIIe siècle adossée à la mosquée Sidi El Kettani. Décor de céramique tunisoise et boiseries sculptées.",
    },

    # ---------- Oran ----------
    {
        "name_fr": "Fort de Santa Cruz", "name_ar": "حصن سانتا كروز",
        "wilaya": "Oran", "commune": "Oran",
        "period": P.OTTOMAN, "architectural_type": A.FORTIFICATION,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-0.6766, 35.7225, srid=4326),
        "description": "Forteresse espagnole édifiée entre 1577 et 1604 au sommet du djebel Murdjadjo (375 m). Domine la baie d'Oran et la chapelle Notre-Dame.",
    },
    {
        "name_fr": "Palais du Bey Mohamed El Kebir", "name_ar": "قصر الباي محمد الكبير",
        "wilaya": "Oran", "commune": "Oran",
        "period": P.OTTOMAN, "architectural_type": A.PALACE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-0.6450, 35.7050, srid=4326),
        "description": "Résidence édifiée en 1792 après la reprise d'Oran sur les Espagnols. Patios à arcades, hammams et jardins suspendus.",
    },
    {
        "name_fr": "Cathédrale du Sacré-Cœur d'Oran", "name_ar": "كاتدرائية القلب المقدس",
        "wilaya": "Oran", "commune": "Oran",
        "period": P.COLONIAL, "architectural_type": A.CHURCH,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-0.6422, 35.6961, srid=4326),
        "description": "Édifice néo-byzantin achevé en 1913, transformé en bibliothèque municipale après l'indépendance. Mosaïques et coupoles d'inspiration orientale.",
    },

    # ---------- Tipaza / Cherchell ----------
    {
        "name_fr": "Mausolée Royal de Maurétanie (Tombeau de la Chrétienne)", "name_ar": "ضريح موريتانيا الملكي",
        "wilaya": "Tipaza", "commune": "Sidi Rached",
        "period": P.NUMIDIAN, "architectural_type": A.MAUSOLEUM,
        "classification_level": C.NATIONAL,
        "geo_point": Point(2.5547, 36.5719, srid=4326),
        "description": "Mausolée numide du Ier siècle av. J.-C. attribué à Juba II et Cléopâtre Séléné. Tumulus circulaire de 60 m de diamètre couvert de 60 colonnes engagées.",
    },
    {
        "name_fr": "Théâtre Romain de Cherchell", "name_ar": "المسرح الروماني بشرشال",
        "wilaya": "Tipaza", "commune": "Cherchell",
        "period": P.ROMAN, "architectural_type": A.ARCHAEOLOGICAL_SITE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(2.1922, 36.6064, srid=4326),
        "description": "Théâtre antique de Caesarea (capitale de la Maurétanie césarienne) édifié sous Juba II. Cavea de 90 m de diamètre.",
    },

    # ---------- Batna / Khenchela ----------
    {
        "name_fr": "Médracen", "name_ar": "المدغاسن",
        "wilaya": "Batna", "commune": "Boumia",
        "period": P.NUMIDIAN, "architectural_type": A.MAUSOLEUM,
        "classification_level": C.NATIONAL,
        "geo_point": Point(6.4570, 35.7330, srid=4326),
        "description": "Mausolée royal numide du IIIe siècle av. J.-C., l'un des plus anciens monuments d'Algérie. Tumulus circulaire à colonnes doriques de 59 m de diamètre.",
    },

    # ---------- Tlemcen extra ----------
    {
        "name_fr": "Mosquée de Sidi El Haloui", "name_ar": "جامع سيدي الحلوي",
        "wilaya": "Tlemcen", "commune": "Tlemcen",
        "period": P.MEDIEVAL, "architectural_type": A.MOSQUE,
        "classification_level": C.NATIONAL,
        "geo_point": Point(-1.3220, 34.8830, srid=4326),
        "description": "Mosquée mérinide du XIVe siècle, célèbre pour son minaret en brique et zelliges et sa cour à vasque centrale.",
    },
]


# Heuristic mapping architectural type → contributing disciplines.
# Names must match accounts/fixtures/disciplines.json. Missing entries (or a
# missing Discipline row) silently no-op, so the seed stays robust if an admin
# has renamed a discipline.
DISCIPLINES_BY_TYPE = {
    A.MOSQUE: ["Architecture", "Histoire", "Arts décoratifs"],
    A.MEDERSA: ["Architecture", "Histoire", "Épigraphie"],
    A.CASBAH: ["Architecture", "Urbanisme", "Anthropologie"],
    A.PALACE: ["Architecture", "Histoire", "Arts décoratifs"],
    A.FORTIFICATION: ["Architecture", "Histoire", "Archéologie"],
    A.CHURCH: ["Architecture", "Histoire"],
    A.SYNAGOGUE: ["Architecture", "Histoire"],
    A.MAUSOLEUM: ["Archéologie", "Architecture", "Histoire"],
    A.TRADITIONAL_HOUSE: ["Architecture", "Anthropologie", "Conservation & Restauration"],
    A.ARCHAEOLOGICAL_SITE: ["Archéologie", "Histoire", "Épigraphie"],
    A.OTHER: ["Architecture", "Histoire"],
}


class Command(BaseCommand):
    help = "Seed 30 Algerian heritage resources (7 UNESCO + 23 classified)."

    def handle(self, *args, **options):
        # Local import keeps the seed file importable even before the accounts
        # migrations have run (e.g. fresh DB inspection in tests).
        from apps.accounts.models import Discipline
        disciplines_by_name = {d.name_fr: d for d in Discipline.objects.all()}

        created, updated = 0, 0
        for entry in SEED:
            entry = {**entry, "cover_image_url": COVERS.get(entry["name_fr"], "")}
            obj, was_created = HeritageResource.objects.update_or_create(
                name_fr=entry["name_fr"],
                wilaya=entry["wilaya"],
                defaults=entry,
            )
            if was_created:
                created += 1
            else:
                updated += 1

            # Tag contributing disciplines based on architectural type. We
            # only set when the M2M is empty so an admin's manual curation
            # isn't overwritten by a re-run of the seed.
            if disciplines_by_name and not obj.disciplines.exists():
                wanted = [
                    disciplines_by_name[name]
                    for name in DISCIPLINES_BY_TYPE.get(entry["architectural_type"], [])
                    if name in disciplines_by_name
                ]
                if wanted:
                    obj.disciplines.set(wanted)

        self.stdout.write(self.style.SUCCESS(
            f"Heritage seed done — {len(SEED)} entries: created={created}, updated={updated}"
        ))
