/**
 * constants/characterData/names.ts - Comprehensive data for procedural name generation.
 */
import { CulturalZone } from '../../types/characterData';
import { random as seededRandom } from '../../utils/seededRandom';
import { generateDeepTimeAmericanName } from './deepTimeAmericanNames';

export interface NameList {
    male: string[];
    female: string[];
    surname: string[];
}

/** Family names that hardened out of chiefly, matai and hapū names after 1814. */
const SURNAME_POLYNESIAN = ['Tupou', 'Taufa', 'Vaea', 'Fifita', 'Latu', 'Havili', 'Mahe', 'Maʻafu', 'Tuilagi', 'Tuiasosopo', 'Faleolo', 'Solomona', 'Ioane', 'Aiono', 'Malietoa', 'Mataʻafa', 'Ngata', 'Te Heuheu', 'Rātana', 'Pomare', 'Heke', 'Kereopa', 'Waititi', 'Kaa', 'Teariki', 'Tangaroa', 'Marsters', 'Temaru', '(No Surname)', '(No Surname)'];

/** Fijian, Papuan, Solomon and ni-Vanuatu family names, post-1840. */
const SURNAME_MELANESIAN = ['Rabuka', 'Bainimarama', 'Naivalu', 'Tabua', 'Seruilagi', 'Vosa', 'Cakobau', 'Ganilau', 'Mara', 'Tuisawau', 'Somare', 'Namaliu', 'Wingti', 'Diro', 'Morauta', 'Kaputin', 'Sogavare', 'Kemakeza', 'Kabui', 'Maenuʻu', 'Lini', 'Kalpokas', 'Sope', 'Natapei', '(No Surname)', '(No Surname)'];

export const CHARACTER_NAMES: Record<string, NameList> = {
    // === PREHISTORIC UNIVERSAL ===
    // Proto-Indo-European and Early European (3500-500 BCE)
   // Proto-Indo-European (c. 4500-2500 BCE) - The ancestor of most European languages.
    PREHISTORIC_PROTO_INDO_EUROPEAN: {
        male: ['Hrewiklewos', 'Gostiregs', 'Wulkwowiros', 'Aryomon', 'Perkwugnatos', 'Supotis', 'Dewostos', 'Tritoneros', 'Monyemos', 'Ekwomedos', 'Wesugenos', 'Dorudekus'],
        female: ['Awsosdota', 'Diwosdugater', 'Wulkwiya', 'Swaduwena', 'Aryona', 'Gwenaregna', 'Wesutoka', 'Priyagentri', 'Tritogena', 'Sowlya'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // Proto-Celtic (c. 1000-500 BCE) - Ancestor of Gaulish, Irish, Welsh. Iron Age feel.
    PREHISTORIC_PROTO_CELTIC: {
        male: ['Wirorix', 'Catumaros', 'Dumnovalos', 'Brigantagnos', 'Cunobelinos', 'Epomanduos', 'Toutovaldos', 'Vindoviros', 'Ariovestos', 'Bodugnatos', 'Tigernomaglos', 'Segoviros'],
        female: ['Vindoriga', 'Catubodua', 'Brigantina', 'Eponina', 'Toutavalda', 'Adtreba', 'Rigana', 'Boudica', 'Segovella', 'Vindatreba'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // Proto-Germanic (c. 500 BCE - 200 CE) - Ancestor of Norse, English, German. Migration Period feel.
    PREHISTORIC_PROTO_GERMANIC: {
        male: ['Haþuwulf', 'Audariks', 'Hroþigaiz', 'Sigimer', 'Gudawer', 'Þeudariks', 'Agilhard', 'Wulþuhar', 'Ermanariks', 'Beranhard', 'Hailagamund', 'Harjawald'],
        female: ['Hildigunþ', 'Hroþirun', 'Swanhild', 'Audagard', 'Merahild', 'Gudalind', 'Brunjohild', 'Fasturun', 'Albigard', 'Sigilind'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_MENA: {
        // Predynastic and Naqada-horizon only. Arabic names (post-600 CE),
        // Ptolemaic Greek and New Kingdom names were removed: this set is the
        // fallback for the whole Palaeolithic and must not reach forward.
        male: ['Atum', 'Khenti', 'Menes', 'Narmer', 'Scorpion', 'Ka', 'Iry-Hor', 'Abydos', 'Hierakonpolis', 'Naqada', 'Badari', 'Merimde', 'Fayum', 'Omari', 'Maadi', 'Tasian'],
        female: ['Neithhotep', 'Merneith', 'Herneith', 'Nakhtneith', 'Khenthap', 'Betresh', 'Ahhotep', 'Tetisheri'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Ancient Chinese & Proto-Mongolic (3000 BCE - 200 CE)
    /**
     * South Asia before the Indo-Aryan traditions the later sets draw on.
     *
     * The Indus script is undeciphered, so no Harappan personal name is
     * recoverable and none is claimed here: these are reconstructed
     * Proto-Dravidian lexical forms used as name-shaped placeholders, marked
     * with the asterisk this file uses for reconstructions everywhere else.
     * Pointing South Asia at PREHISTORIC_ASIAN instead — which is Sinitic and
     * Mongolic, down to Huangdi and Nüwa — put legendary Chinese figures in the
     * Indus Valley.
     */
    PREHISTORIC_SOUTH_ASIAN: {
        male: ['*Kal', '*Vil', '*Cen', '*Muni', '*Val', '*Nel', '*Ur', '*Kotu', '*Tan', '*Arul', '*Pon', '*Malai', '*Katu', '*Vel', '*Cur'],
        female: ['*Ammai', '*Cempu', '*Nila', '*Kanni', '*Tay', '*Vala', '*Ilai', '*Punal', '*Muti', '*Aki', '*Ceyal', '*Naru'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * Deep prehistory in the farming zones of East Asia — the Yellow and
     * Yangtze basins and the southern coast.
     *
     * The steppe forms that used to sit at the head of this list (*Tengri,
     * *Bayar, *Temür) belong to a different world and are now in
     * PREHISTORIC_INNER_ASIAN: with both pooled together, a farmer on the
     * Fujian coast in 7162 BCE could be called *Tengri, after a sky-god of the
     * Turkic steppe two thousand miles north. The Sinitic entries are legendary
     * and dynastic figures used as name-shaped forms; no personal name from
     * this period is recoverable.
     */
    PREHISTORIC_ASIAN: {
        male: ['Yao', 'Shun', 'Yu', 'Tang', 'Wu', 'Zhou', 'Fuxi', 'Shennong', 'Huangdi', 'Zhuanxu', 'Ku', 'Gun', 'Qi', 'Gao', 'Jie', 'Li', 'Pan', 'Geng', 'Xin'],
        female: ['Nüwa', 'Leizu', 'Luozu', 'Fufei', 'Ehuang', 'Nüying', 'Changxi', 'Xihe', 'Jiandi', 'Jiangyuan', 'Tushan', 'Nvjiao', 'Moxi', 'Baosi', 'Bao', 'Gui', 'Jiang', 'Ji'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /** The steppe and forest belt: Mongolia, the Altai, Dzungaria, Siberia. */
    PREHISTORIC_INNER_ASIAN: {
        male: ['*Tengri', '*Bayar', '*Temür', '*Batu', '*Börte', '*Ulaan', '*Sartaq', '*Kül', '*Alan', '*Oroq'],
        female: ['*Gua', '*Eke', '*Aba', '*Sarnai', '*Naran', '*Altan', '*Oyun', '*Chechek'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PREHISTORIC_AFRICAN: {
        // No personal names survive from Palaeolithic Africa. These are short,
        // widely distributed forms chosen to avoid claiming a specific later
        // people: the ethnonyms ('Asante'), surnames ('Mensah', 'Nkrumah'),
        // Arabic-derived names and a textile ('Kente') have been removed.
        male: ['Aman', 'Zuberi', 'Jabari', 'Chike', 'Dume', 'Kato', 'Jengo', 'Imara', 'Sekou', 'Baraka'],
        female: ['Ama', 'Yaa', 'Nana', 'Makena', 'Asha', 'Amara', 'Nia', 'Imani', 'Kesia'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    /**
     * The deep-time Americas.
     *
     * The main generator does not read this list: it builds names as phrases,
     * by region, in `deepTimeAmericanNames.ts`, and this is only the backstop
     * for the few paths that still take a flat pool. It used to hold bare
     * English nature nouns — 'Raven', 'Dove', 'Star' — together with 'Chief',
     * 'Shaman' and 'Warrior', which are English words for offices and not names
     * anyone bore. The entries here are kept in the phrase shape the generator
     * produces so that both paths describe the same naming world.
     */
    PREHISTORIC_AMERICAN: {
        male: ['Sitting Bear', 'Grey Wolf of the Ridge', 'Standing Elk', 'Watching Hawk', 'Two Rivers', 'Walks the Ice', 'Broken Antler', 'Crossing at the Ford', 'Lone Heron', 'Born in Snow', 'Carries the Fire', 'Old Otter', 'Swims the Flood', 'Half Moon on Water', 'Turning Crane', 'Spotted Coyote', 'Came Back Late', 'Deep Wood Badger'],
        female: ['Quiet Water', 'Falling Leaf at the Bend', 'Many Cranes', 'Gathering Reeds', 'Small Otter', 'Born at Dawn', 'Watching Doe', 'Bright Marsh Light', 'Two Willows', 'Walks the Shallows', 'Rising Snow', 'Listening Wren', 'Old Turtle', 'Found at the Ford', 'Circling Swallow', 'Grey Rain', 'Held the Fire', 'White Shell of the Narrows'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    /**
     * Island Southeast Asia before any attested naming tradition.
     *
     * The zone's deep-time fallback used to be `PREHISTORIC_SOUTH_ASIAN`,
     * whose entries are reconstructed Proto-Dravidian forms — which is how a
     * Bronze Age islander on the Sulu Sea came to be called *Vil. These are
     * reconstructed Proto-Austronesian and Proto-Malayo-Polynesian lexical
     * forms used as name-shaped placeholders, marked with the asterisk this
     * file uses for reconstructions. No personal name survives from here.
     */
    PREHISTORIC_AUSTRONESIAN: {
        male: ['*Bahi', '*Lakay', '*Anak', '*Bulan', '*Layag', '*Batu', '*QaluR', '*Kahiw', '*Sakay', '*Bunuq', '*Panaw', '*Timu', '*Baqbaq', '*Suluh', '*Rusuk', '*Kilat'],
        female: ['*Bai', '*Ina', '*Dayang', '*Bunga', '*Wahay', '*Lumay', '*Tanaq', '*Sinag', '*Ambun', '*Rimba', '*Talun', '*Nipa', '*Uray', '*Bituqen'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * The Lapita horizon in Near and Western Oceania, before any Polynesian
     * tradition is recoverable.
     *
     * This list used to be Maui, Tane, Tangaroa, Rongo, Pele, Hina, Mahuika —
     * which is not a naming tradition but a pantheon, and mostly an East
     * Polynesian one recorded three thousand years after this set's window
     * closes. It made the deep Pacific past look like a room full of gods.
     * These are reconstructed Proto-Oceanic and Proto-Polynesian lexical forms
     * used as name-shaped placeholders, marked with the asterisk this file uses
     * for reconstructions. Not one personal name survives from Lapita.
     */
    PREHISTORIC_OCEANIC: {
        male: ['*Tangata', '*Ariki', '*Toa', '*Vaka', '*Manu', '*Ika', '*Fatu', '*Matangi', '*Laqaa', '*Afi', '*Rakau', '*Puaka', '*Tolu', '*Ao', '*Hau', '*Tupuna'],
        female: ['*Fafine', '*Maasina', '*Fetuqu', '*Vai', '*Moana', '*Ua', '*Lau', '*One', '*Niu', '*Fenua', '*Poo', '*Fua', '*Fue', '*Loto'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === ANCIENT & CLASSICAL ===
    ANCIENT_GREEK: {
        male: ['Lykos', 'Leon', 'Heron', 'Damon', 'Alexios', 'Nikandros', 'Philippos', 'Apollodoros', 'Dionysios', 'Herakleitos', 'Kleomenes', 'Lysander', 'Menandros', 'Nikias', 'Perikles', 'Sokrates', 'Theophrastos', 'Xenophanes', 'Zenodoros', 'Aristophanes'],
        female: ['Kassandra', 'Helene', 'Penelope', 'Chloe', 'Daphne', 'Phoebe', 'Arete', 'Kallisto', 'Myrrine', 'Aspasia', 'Xanthippe', 'Gorgo', 'Cynisca', 'Diotima', 'Theano', 'Aglaonike', 'Timycha', 'Lasthenia', 'Axiothea', 'Phaedra'],
        surname: ['of Athens', 'of Sparta', 'of Corinth', 'of Thebes', 'of Miletos', 'of Argos', 'the Macedonian', 'the Theban', 'the Athenian', 'the Spartan']
    },
    ANCIENT_ROMAN: {
        male: ['Gaius', 'Lucius', 'Marcus', 'Publius', 'Quintus', 'Tiberius', 'Aulus', 'Sextus', 'Decimus', 'Gnaeus', 'Spurius', 'Appius', 'Numerius', 'Manius', 'Kaeso', 'Titus', 'Servius', 'Caeso', 'Volusus', 'Hostus'],
        female: ['Livia', 'Julia', 'Cornelia', 'Octavia', 'Aemilia', 'Claudia', 'Valeria', 'Fabia', 'Horatia', 'Junia', 'Antonia', 'Caecilia', 'Domitia', 'Fulvia', 'Pompeia', 'Servilia', 'Tullia', 'Vipsania', 'Agrippina', 'Messalina'],
        surname: ['Antonius', 'Cornelius', 'Fabius', 'Julius', 'Valerius', 'Claudius', 'Aemilius', 'Domitius', 'Flavius', 'Cassius', 'Junius', 'Caecilius', 'Hortensius', 'Licinius', 'Marcius', 'Scribonius', 'Sulpicius', 'Terentius', 'Tullius', 'Vibius']
    },

    // === FRANKISH/EARLY MEDIEVAL FRENCH ===
    FRANKISH_MEROVINGIAN: {
        male: ['Chlodovech', 'Childebert', 'Clotaire', 'Dagobert', 'Sigebert', 'Chilperic', 'Theudebert', 'Guntram', 'Charibert', 'Theuderic', 'Brunulphe', 'Wandregisel', 'Audoin', 'Berchar', 'Grimoald', 'Waratto', 'Ghislemar', 'Ansbert', 'Droctulf', 'Godegisel'],
        female: ['Brunhild', 'Fredegund', 'Radegund', 'Clotilde', 'Bathilde', 'Nanthilde', 'Bilichilde', 'Vuldetrade', 'Arnegunde', 'Ingoberge', 'Audovera', 'Galswinthe', 'Theudechilde', 'Bertrude', 'Anstrude', 'Begga', 'Gertrude', 'Itta', 'Aldegunde', 'Wulfgunde'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    FRANKISH_CAROLINGIAN: {
        male: ['Karl', 'Pippin', 'Karlmann', 'Ludwig', 'Lothar', 'Adalbert', 'Eberhard', 'Gerold', 'Hildebrand', 'Nithard', 'Angilbert', 'Einhard', 'Alcuin', 'Rabanus', 'Wala', 'Adalhard', 'Drogo', 'Hugo', 'Odo', 'Rudolf'],
        female: ['Hildegard', 'Bertrada', 'Liutgard', 'Fastrada', 'Ermengarde', 'Judith', 'Engelberge', 'Richildis', 'Irmengard', 'Gisela', 'Bertha', 'Rotrude', 'Adalheid', 'Cunigunde', 'Hemma', 'Matilda', 'Edgitha', 'Gerberga', 'Adelheid', 'Emma'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Continental Saxon and neighboring North Sea Germanic names. People in
    // this period normally appear as mononyms here; modern hereditary German
    // and Ashkenazi surnames are deliberately excluded.
    SAXON_EARLY_MEDIEVAL: {
        male: ['Widukind', 'Bruno', 'Wichmann', 'Thankmar', 'Ekbert', 'Bernhard', 'Adalgar', 'Hessi', 'Cobbo', 'Immed', 'Hathugaut', 'Theoderic', 'Liudolf', 'Reginbert', 'Bernlef', 'Osdag', 'Walbert', 'Boso', 'Gerward', 'Wulfhard'],
        female: ['Oda', 'Ida', 'Gisla', 'Hathumod', 'Liutgard', 'Mathilda', 'Adela', 'Bertrada', 'Gerberga', 'Hildegard', 'Eila', 'Thiadsvind', 'Hrotsvit', 'Imma', 'Wulfhild', 'Adelheid', 'Alfrida', 'Theodrada', 'Brunhild', 'Reginlind'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    NORMAN_FRENCH: {
        male: ['Guillaume', 'Robert', 'Richard', 'Henri', 'Hugues', 'Gautier', 'Roger', 'Raoul', 'Godefroy', 'Baudouin', 'Foulques', 'Drogon', 'Gilbert', 'Eudes', 'Etienne', 'Alain', 'Geoffroy', 'Raoul', 'Etienne', 'Tancrede'],
        female: ['Mathilde', 'Judith', 'Emma', 'Adele', 'Agnes', 'Constance', 'Herleve', 'Sibille', 'Gundrade', 'Isabelle', 'Alix', 'Beatrice', 'Cecile', 'Alienor', 'Giselle', 'Havoise', 'Muriel', 'Orabile', 'Richilde', 'Sybille'],
        surname: ['de Montfort', 'de Beaumont', 'de Clare', 'de Warenne', 'Giffard', "d'Ivry", 'de Conteville', 'FitzRobert', 'FitzGilbert', 'de Montbray', 'de Lacy', 'de Mandeville', 'de Tosny', 'de Mortemer', 'de Courcy', 'de Braose', 'de Mowbray', 'de Vere', 'de Ferrers', 'de Redvers']
    },
    FRENCH_MEDIEVAL: {
        male: ['Guillaume', 'Jean', 'Pierre', 'Louis', 'Charles', 'Philippe', 'Henri', 'Antoine', 'Michel', 'Francois', 'Andre', 'Nicolas', 'Claude', 'Bernard', 'Etienne', 'Gilles', 'Thibaut', 'Arnaud', 'Bertrand', 'Remi'],
        female: ['Marie', 'Jeanne', 'Marguerite', 'Catherine', 'Isabelle', 'Louise', 'Anne', 'Francoise', 'Agnes', 'Blanche', 'Constance', 'Helene', 'Mathilde', 'Simone', 'Perronnelle', 'Ameline', 'Aveline', 'Denise', 'Jacqueline', 'Mahaut'],
        surname: ['le Roi', 'le Comte', 'le Duc', 'de Paris', 'de Lyon', 'de Rouen', 'le Clerc', 'le Boucher', 'le Boulanger', 'le Tisserand', 'le Forgeron', 'le Meunier', 'le Charpentier', 'le Marchand', 'le Chevalier', 'le Pretre', 'de la Fontaine', 'du Bois', 'de la Pierre', 'le Blanc']
    },

    // === HISTORICAL PERIODS FOR EXISTING CULTURES ===
    ENGLISH_ANGLO_SAXON: {
        male: ['Aelfric', 'Aethelred', 'Aethelstan', 'Beornwulf', 'Cenwulf', 'Cynric', 'Dunstan', 'Eadmund', 'Eadwig', 'Godwin', 'Leofric', 'Oswald', 'Sigered', 'Wulfric', 'Aelfgar', 'Beorhtric', 'Ceolwulf', 'Eadric', 'Godric', 'Wulfstan'],
        female: ['Aelfgifu', 'Aethelflaed', 'Eadgyth', 'Godgifu', 'Wulfhild', 'Aethelburh', 'Cwenthryth', 'Eadburh', 'Hild', 'Leofgyth', 'Aelfwyn', 'Cyneburh', 'Ealhswith', 'Gunnhild', 'Thyra', 'Aetheldreda', 'Cynewise', 'Eadgyth', 'Mildrith', 'Sexburh'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    ENGLISH_MEDIEVAL: {
        male: ['John', 'William', 'Thomas', 'Robert', 'Richard', 'Henry', 'Walter', 'Roger', 'Geoffrey', 'Ralph', 'Hugh', 'Gilbert', 'Alan', 'Stephen', 'Adam', 'Nicholas', 'Simon', 'Peter', 'Alexander', 'Edmund'],
        female: ['Alice', 'Emma', 'Matilda', 'Agnes', 'Joan', 'Margaret', 'Isabella', 'Juliana', 'Margery', 'Cecily', 'Avice', 'Beatrice', 'Christine', 'Ellen', 'Katherine', 'Lucy', 'Maud', 'Petronilla', 'Rose', 'Sibyl'],
        surname: ['atte Hill', 'atte Wood', 'atte Water', 'le Smith', 'le Baker', 'le Miller', 'le Cook', 'le Taylor', 'le Wright', 'le Mason', 'le Cooper', 'le Fletcher', 'le Turner', 'le Parker', 'de la Mare', 'de la Ford', 'de la Grove', 'de Clifford', 'de Montfort', 'de Beaumont']
    },
    ENGLISH: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Roger', 'Bartholomew', 'Geoffrey', 'Edmund', 'Stephen', 'Nicholas', 'Christopher', 'Alexander', 'Michael', 'Anthony', 'Peter', 'Charles', 'Francis', 'Arthur', 'Frederick', 'George', 'Harold', 'Ralph', 'Philip', 'Mark', 'Matthew'],
        female: ['Mary', 'Elizabeth', 'Anne', 'Eleanor', 'Margaret', 'Alice', 'Joan', 'Isabella', 'Matilda', 'Catherine', 'Beatrice', 'Agnes', 'Jane', 'Sarah', 'Emma', 'Grace', 'Rose', 'Helen', 'Victoria', 'Florence', 'Charlotte', 'Sophia', 'Diana', 'Rebecca', 'Rachel', 'Judith', 'Caroline', 'Frances', 'Arabella', 'Cordelia'],
        surname: ['Smith', 'Baker', 'Cook', 'Taylor', 'Miller', 'Hill', 'Green', 'Carter', 'Wright', 'Mason', 'Cooper', 'Fletcher', 'Turner', 'Parker', 'Brown', 'Davis', 'Wilson', 'Moore', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Scott', 'Adams', 'Campbell', 'Mitchell', 'Roberts', 'Phillips', 'Evans']
    },

    // === REGIONAL TEXAS NAMES ===
    TEXAS_SPANISH_COLONIAL: {
        male: ['Antonio', 'Miguel', 'José', 'Francisco', 'Juan', 'Pedro', 'Manuel', 'Carlos', 'Luis', 'Fernando', 'Diego', 'Alejandro', 'Domingo', 'Gonzalo', 'Hernando', 'Ignacio', 'Joaquín', 'Lorenzo', 'Nicolás', 'Rafael'],
        female: ['María', 'Ana', 'Isabel', 'Catalina', 'Juana', 'Teresa', 'Rosa', 'Carmen', 'Dolores', 'Esperanza', 'Francisca', 'Guadalupe', 'Inés', 'Josefa', 'Lucia', 'Margarita', 'Natalia', 'Patricia', 'Soledad', 'Victoria'],
        surname: ['de León', 'Hernández', 'García', 'Martínez', 'Rodríguez', 'González', 'López', 'Sánchez', 'Pérez', 'Ramírez', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Reyes', 'Morales', 'Gutiérrez', 'Jiménez', 'Ruiz']
    },
    TEXAS_ANGLO: {
        male: ['Stephen', 'Austin', 'Sam', 'Houston', 'James', 'William', 'Moses', 'Josiah', 'Jared', 'Green', 'DeWitt', 'Martin', 'Robert', 'John', 'Thomas', 'Edward', 'Benjamin', 'Joseph', 'David', 'Andrew'],
        female: ['Mary', 'Elizabeth', 'Sarah', 'Margaret', 'Jane', 'Nancy', 'Rebecca', 'Martha', 'Emily', 'Lucy', 'Susanna', 'Caroline', 'Harriet', 'Frances', 'Charlotte', 'Eleanor', 'Catherine', 'Anne', 'Rachel', 'Judith'],
        surname: ['Austin', 'Houston', 'Travis', 'Bowie', 'Crockett', 'Fannin', 'Lamar', 'Burnet', 'Rusk', 'Jones', 'Smith', 'Brown', 'Williams', 'Johnson', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson']
    },
    
    // === DIVERSE AMERICAN IMMIGRANT NAMES ===

    // Ancient/Biblical Hebrew (c. 1200 BCE - 70 CE) - For ancient Israel/Judea

    JEWISH_ASHKENAZI: {
        male: ['David', 'Isaac', 'Jacob', 'Abraham', 'Samuel', 'Benjamin', 'Solomon', 'Moses', 'Aaron', 'Joseph', 'Nathan', 'Eli', 'Daniel', 'Michael', 'Gabriel', 'Raphael', 'Simon', 'Reuben', 'Levi', 'Judah'],
        female: ['Sarah', 'Rebecca', 'Rachel', 'Leah', 'Miriam', 'Esther', 'Ruth', 'Naomi', 'Hannah', 'Deborah', 'Judith', 'Rose', 'Sophie', 'Anna', 'Clara', 'Bella', 'Ida', 'Fanny', 'Minnie', 'Molly'],
        surname: ['Cohen', 'Levy', 'Goldman', 'Friedman', 'Rosenberg', 'Goldstein', 'Silverman', 'Katz', 'Shapiro', 'Weinstein', 'Klein', 'Schwartz', 'Weiss', 'Hoffman', 'Green', 'Stone', 'Miller', 'Roth', 'Stein', 'Berg']
    },
    PUERTO_RICAN: {
        male: ['Juan', 'Luis', 'Carlos', 'José', 'Miguel', 'Angel', 'Francisco', 'Antonio', 'Manuel', 'Pedro', 'Rafael', 'Roberto', 'Jorge', 'Ricardo', 'Eduardo', 'Alberto', 'Hector', 'Ramón', 'Fernando', 'Diego'],
        female: ['Maria', 'Carmen', 'Rosa', 'Ana', 'Luz', 'Gloria', 'Isabel', 'Teresa', 'Sonia', 'Laura', 'Patricia', 'Sandra', 'Monica', 'Julia', 'Adriana', 'Beatriz', 'Elena', 'Cristina', 'Dolores', 'Esperanza'],
        surname: ['Rodriguez', 'Rivera', 'Gonzalez', 'Torres', 'Martinez', 'Diaz', 'Hernandez', 'Lopez', 'Perez', 'Sanchez', 'Ramirez', 'Cruz', 'Morales', 'Ortiz', 'Gomez', 'Reyes', 'Ruiz', 'Flores', 'Santiago', 'Castro']
    },
    AFRICAN_AMERICAN: {
        male: ['William', 'James', 'John', 'Robert', 'George', 'Charles', 'Joseph', 'Thomas', 'Henry', 'Walter', 'Arthur', 'Fred', 'Albert', 'Samuel', 'David', 'Louis', 'Charlie', 'Richard', 'Ernest', 'Roy'],
        female: ['Mary', 'Ruth', 'Helen', 'Margaret', 'Elizabeth', 'Dorothy', 'Betty', 'Patricia', 'Barbara', 'Shirley', 'Sarah', 'Annie', 'Clara', 'Emma', 'Minnie', 'Rosa', 'Grace', 'Ella', 'Florence', 'Louise'],
        surname: ['Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Smith', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Lewis', 'Walker', 'Allen', 'Young', 'King', 'Wright', 'Hill', 'Green']
    },
    AZTEC: {
        male: ['Itzel', 'Cuauhtemoc', 'Moctezuma', 'Tlacaelel', 'Nezahualcoyotl', 'Axayacatl', 'Tizoc', 'Ahuitzotl', 'Chimalpopoca', 'Itzcoatl', 'Huitzilihuitl', 'Acamapichtli', 'Tenoch', 'Xochitl', 'Cipac', 'Coatl', 'Ehecatl', 'Ixtli', 'Ocelotl', 'Tochtli'],
        female: ['Xochitl', 'Itzel', 'Citlali', 'Tlazohtzin', 'Ixchel', 'Malintzin', 'Quetzali', 'Yaretzi', 'Nenetl', 'Cihuaton', 'Izel', 'Metztli', 'Tonalnan', 'Xilonen', 'Chalchiuhtlicue', 'Coatlicue', 'Itzpapalotl', 'Mayahuel', 'Tlaltecuhtli', 'Tonantzin'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === MESOAMERICAN CULTURES ===
    MAYA: {
        male: ['Kinich', 'Itzamna', 'Hunab', 'Ahau', 'Balam', 'Kanek', 'Tepeu', 'Ahkin', 'Ah Mun', 'Bolon', 'Canul', 'Dzul', 'Hunac', 'Ixbalanque', 'Hunahpu', 'Kukulkan', 'Akbal', 'Cauac', 'Chicchan', 'Cimi', 'Eb', 'Etznab', 'Kan', 'Muluc', 'Oc', 'Uayeb', 'Yaxkin', 'Zotz', 'Pop', 'Ceh'],
        female: ['Ixchel', 'Itzel', 'Akna', 'Citlali', 'Nicte', 'Sak', 'Itzayani', 'Ixkawil', 'Ixnikte', 'Ixchup', 'Colel', 'Alitzel', 'Xunah', 'Yatzil', 'Zumanil', 'Ixtab', 'Ixcacao', 'Ixik', 'Naab', 'Sacnikte', 'Chimalmat', 'Xoc', 'Xquic', 'Blood Moon', 'Jade Sky', 'Shell Star', 'Flower Serpent', 'Moon Bird', 'Water Lily', 'Dawn Star'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    ZAPOTEC: {
        male: ['Cosijoeza', 'Cosijopii', 'Zaachila', 'Huijatoo', 'Ozomatli', 'Petela', 'Bixabeani', 'Quiabelagayo', 'Pitao', 'Cocijo', 'Cocijobi', 'Cosana', 'Huechaana', 'Lachi', 'Nadodo', 'Pecala', 'Quialana', 'Teitipac', 'Xadani', 'Yagul', 'Zachila', 'Zoque', 'Guigu', 'Niza', 'Bixidu'],
        female: ['Donaji', 'Xunaxhi', 'Guenda', 'Itandehui', 'Nayeli', 'Lupita', 'Benda', 'Dani', 'Guela', 'Laxsi', 'Naxieli', 'Stina', 'Xhopa', 'Yadira', 'Zianya', 'Belazi', 'Celia', 'Gabi', 'Ixel', 'Janu'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    MIXTEC: {
        male: ['Dzahuindanda', 'Ocoñaña', 'Atonal', 'Tilantongo', 'Tututepec', 'Yahui', 'Savi', 'Ndikandii', 'Tayuva', 'Tikuun', 'Tikaa', 'Tniumi', 'Ndaa', 'Yuku', 'Kava', 'Koo', 'Kuii', 'Ndiyo', 'Soko', 'Tachi'],
        female: ['Dzehe', 'Sitna', 'Yuku', 'Ndaa', 'Savi', 'Ita', 'Yodo', 'Dzita', 'Nuu', 'Yuta', 'Ndivi', 'Sii', 'Yaa', 'Xini', 'Tinduu', 'Kuñu', 'Nduchi', 'Yutsa', 'Ñuhu', 'Xiyo'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === CARIBBEAN ===
    TAINO: {
        male: ['Guacanagarix', 'Caonabo', 'Cacimar', 'Guarionex', 'Agueybana', 'Hatuey', 'Guacanagari', 'Behequio', 'Cayacoa', 'Mayobanex', 'Caguax', 'Guarocuya', 'Arasibo', 'Bairoa', 'Caguas', 'Daguao', 'Humacao', 'Jayuya', 'Loiza', 'Mabodamaca', 'Orocobix', 'Tabonuco', 'Urayoan', 'Yabucoa', 'Yuisa'],
        female: ['Anacaona', 'Yuisa', 'Casiguaya', 'Guasabara', 'Higuenamota', 'Nimita', 'Abey', 'Aji', 'Anani', 'Bagua', 'Bayoya', 'Cacica', 'Caona', 'Catalina', 'Ceiba', 'Cuaba', 'Guabina', 'Guama', 'Jagua', 'Maroya', 'Ocama', 'Siboney', 'Tonina', 'Yaima', 'Zunilda'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    CARIB: {
        male: ['Kalinago', 'Tegremond', 'Waikeri', 'Arouca', 'Chatoyer', 'Caribice', 'Kairouane', 'Mabouka', 'Ouacabo', 'Pakiri', 'Tourouya', 'Yarima', 'Kenaima', 'Makuri', 'Parima', 'Tamosi', 'Warapa', 'Wowora', 'Yarikuri', 'Yukuma'],
        female: ['Abari', 'Akuriyo', 'Amana', 'Apina', 'Bibi', 'Duna', 'Kariti', 'Kurina', 'Maima', 'Naira', 'Pakara', 'Pasiba', 'Peneri', 'Sibiri', 'Tarina', 'Tibiri', 'Wamari', 'Wanadi', 'Yarawa', 'Yukuna'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === SWAHILI COAST ===
    SWAHILI_COASTAL: {
        male: ['Musa', 'Ali', 'Hassan', 'Omar', 'Yusuf', 'Ibrahim', 'Hamza', 'Juma', 'Salim', 'Bakari', 'Hamisi', 'Sefu', 'Zuberi', 'Jabari', 'Rashidi', 'Faraji', 'Daudi', 'Amani', 'Baraka', 'Kipenda'],
        female: ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Halima', 'Khadija', 'Amina', 'Safia', 'Rukia', 'Salma', 'Jamila', 'Asha', 'Dalila', 'Hasina', 'Layla', 'Naima', 'Penda', 'Shani', 'Tatu', 'Zawadi'],
        surname: ['bin Said', 'al-Shirazi', 'al-Kilwa', 'bin Hassan', 'al-Mogadishu', 'bin Omar', 'al-Barawi', 'bin Yusuf', 'al-Pemba', 'bin Ali', 'al-Lamu', 'bin Rashid', 'al-Mombasa', 'bin Hamza', 'al-Zanzibar', 'bin Salim', 'al-Pate', 'bin Juma', 'al-Malindi', 'bin Bakari']
    },
    
    // === EXPANDED MIDDLE EASTERN & NORTH AFRICAN ===
    MESOPOTAMIAN_ANCIENT: {
        male: ['Sargon', 'Hammurabi', 'Nebuchadnezzar', 'Ashurbanipal', 'Tiglath', 'Shalmaneser', 'Esarhaddon', 'Sennacherib', 'Marduk', 'Enlil', 'Shamash', 'Nabu', 'Nergal', 'Ninurta', 'Adad', 'Gilgamesh', 'Enkidu', 'Utnapishtim', 'Ziusudra', 'Atrahasis'],
        female: ['Inanna', 'Ishtar', 'Ereshkigal', 'Ninlil', 'Ninhursag', 'Gula', 'Nisaba', 'Nammu', 'Nanshe', 'Bau', 'Nintud', 'Ninisina', 'Ninkarrak', 'Ninegal', 'Ningal', 'Aya', 'Antu', 'Damkina', 'Shala', 'Tashmetu'],
        surname: ['of Babylon', 'of Ur', 'of Uruk', 'of Nineveh', 'of Assur', 'of Akkad', 'of Sumer', 'of Eridu', 'of Nippur', 'of Lagash']
    },
    LEVANTINE: {
        male: ['Yusuf', 'Ibrahim', 'Khalil', 'Samir', 'Nabil', 'Faris', 'Tariq', 'Rami', 'Bassam', 'Elias', 'Boutros', 'Maroun', 'Charbel', 'Elie', 'Sami', 'Karim'],
        female: ['Layla', 'Amal', 'Hana', 'Rima', 'Nour', 'Dalia', 'Yasmine', 'Lina', 'Maya', 'Nadine', 'Rita'],
        surname: ['Haddad', 'Khoury', 'Saliba', 'Habib', 'Nassar', 'Bishara', 'Sabbagh', 'Mansour', 'Awad', 'Daoud', 'Issa', 'Hadid', 'Najjar', 'Kassis', 'Maalouf', 'Gemayel', 'Aoun', 'Hariri', 'Jumblatt', 'Frangieh']
    },
    MAGHREBI: {
        male: ['Yacine', 'Amine', 'Mehdi', 'Reda', 'Kamel', 'Farid', 'Sofiane', 'Hakim', 'Mourad', 'Djamel', 'Rachid', 'Mustapha', 'Abdel', 'Noureddine', 'Azzedine', 'Brahim', 'Slimane', 'Mansour', 'Tahar', 'Malik'],
        female: ['Amina', 'Houria', 'Djamila', 'Souad', 'Naima', 'Karima', 'Samira', 'Farida', 'Zohra', 'Hakima', 'Malika', 'Safia', 'Assia', 'Radia', 'Lynda', 'Soraya', 'Nesrine', 'Imane', 'Sabrina', 'Meriem'],
        surname: ['Benali', 'Boumediene', 'Belkacem', 'Bensaid', 'Ouahabi', 'Zerhouni', 'Bouteflika', 'Bendjelloul', 'Brahimi', 'Mekhloufi', 'Madani', 'Zidane', 'Benzema', 'Mahrez', 'Benatia', 'Slimani', 'Feghouli', 'Boudebouz', 'Belhadj', 'Ramdane']
    },
    EGYPTIAN_COPTIC: {
        male: ['Shenouda', 'Kyrillos', 'Antonios', 'Bishoy', 'Mina', 'Abraam', 'Pishoy', 'Tadros', 'Girgis', 'Mikhail', 'Boulos', 'Markos', 'Philopateer', 'Abanob', 'Karas', 'Roweis', 'Salib', 'Youssef', 'Daoud', 'Moussa'],
        female: ['Marina', 'Demiana', 'Mariam', 'Susanna', 'Verena', 'Barbara', 'Catherine', 'Rebecca', 'Sarah', 'Theodora', 'Helena', 'Monica', 'Mary', 'Martha', 'Juliana', 'Anastasia', 'Philomena', 'Agatha', 'Agnes', 'Cecilia'],
        surname: ['Tadros', 'Girgis', 'Mikhail', 'Habib', 'Salib', 'Boutros', 'Youssef', 'Daoud', 'Moussa', 'Elias', 'Hanna', 'Abdelmassih', 'Abdelmalak', 'Abdelshahid', 'Ghobrial', 'Shenouda', 'Basilios', 'Kyrillos', 'Athanasius', 'Gregorios']
    },
    // === ARABIAN PENINSULA ===
    ARABIAN_HEJAZ: {
        male: ['Muhammad', 'Ahmad', 'Abdullah', 'Ali', 'Umar', 'Uthman', 'Abu Bakr', 'Hassan', 'Hussein', 'Khalid', 'Saad', 'Amr', 'Bilal', 'Hamza', 'Abbas', 'Jafar', 'Talha', 'Zubair', 'Abdul Rahman', 'Abdul Aziz'],
        female: ['Khadija', 'Aisha', 'Fatima', 'Hafsa', 'Zainab', 'Umm Salama', 'Ruqayyah', 'Safiyya', 'Maryam', 'Asma', 'Hind', 'Lubna', 'Sumayyah', 'Nusaybah', 'Ramlah', 'Sawda', 'Maymunah', 'Juwayriyah', 'Safiyya', 'Rayhana'],
        surname: ['al-Qurashi', 'al-Hashimi', 'al-Makki', 'al-Madani', 'al-Taifi', 'al-Ansari', 'al-Muhajir', 'al-Adnani', 'al-Qahtani', 'al-Azdi', 'al-Tamimi', 'al-Asadi', 'al-Kinani', 'al-Ghatafani', 'al-Judhami', 'al-Khuza\'i', 'al-Thaqafi', 'al-Hawazini', 'al-Sulami', 'al-Muzani']
    },
    
    // === CENTRAL AFRICAN HIGHLANDS ===
    RWANDA_BURUNDI: {
        male: ['Mutara', 'Kigeli', 'Yuhi', 'Cyilima', 'Mibambwe', 'Gahindiro', 'Rwabugiri', 'Musinga', 'Rudahigwa', 'Ndahindurwa', 'Semugeshi', 'Gahiji', 'Nsoro', 'Samembe', 'Ruganzu', 'Cyamatare', 'Rwaka', 'Ruregeya', 'Kimenyi', 'Sekarama'],
        female: ['Nyiramavugo', 'Nyiramongi', 'Nyabunyana', 'Kanjogera', 'Murorunkwere', 'Nyiratunga', 'Nyirakigeri', 'Musabyimana', 'Mukamusoni', 'Mukamwezi', 'Mukabalisa', 'Nyiramacibiri', 'Rwogera', 'Mukandamage', 'Nyiranzeyimana', 'Mukagatare', 'Nyirakabwa', 'Mukabayire', 'Nyirahabimana', 'Mukarutesi'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === EXPANDED AFRICAN REGIONS ===
    ETHIOPIAN_HIGHLAND: {
        male: ['Tewodros', 'Yohannes', 'Menelik', 'Haile', 'Ras', 'Tekle', 'Zewde', 'Abebe', 'Bekele', 'Tadesse', 'Alemayehu', 'Getachew', 'Mulugeta', 'Kebede', 'Tesfaye', 'Hailu', 'Gebre', 'Wolde', 'Selassie', 'Mariam'],
        female: ['Taytu', 'Zewditu', 'Menen', 'Seble', 'Almaz', 'Tigist', 'Meseret', 'Aster', 'Bethlehem', 'Marta', 'Rahel', 'Sara', 'Liya', 'Hanna', 'Mariam', 'Kidist', 'Tsehay', 'Workitu', 'Yeshi', 'Zenebech'],
        surname: ['Wolde', 'Haile', 'Gebre', 'Tekle', 'Tsegaye', 'Alemu', 'Kebede', 'Tadesse', 'Getachew', 'Bekele']
    },
    WEST_AFRICAN_SAHEL: {
        male: ['Sundiata', 'Mansa', 'Kankan', 'Samori', 'Askia', 'Sonni', 'Bakary', 'Mamadou', 'Sekou', 'Modibo', 'Amadou', 'Moussa', 'Boubacar', 'Salif', 'Ousmane', 'Idrissa', 'Lansana', 'Foday', 'Sidi', 'Tierno'],
        female: ['Sogolon', 'Sassouma', 'Nana', 'Aminata', 'Fatoumata', 'Kadiatou', 'Mariam', 'Aissata', 'Rokia', 'Djenne', 'Oumou', 'Sira', 'Tenin', 'Fanta', 'Kankou', 'Djeneba', 'Ramata', 'Saran', 'Bintou', 'Maimouna'],
        surname: ['Keita', 'Toure', 'Traore', 'Kone', 'Diallo', 'Coulibaly', 'Cisse', 'Diarra', 'Camara', 'Sangare']
    },
    YORUBA_TRADITIONAL: {
        male: ['Ogun', 'Shango', 'Obatala', 'Orunmila', 'Eshu', 'Ade', 'Babatunde', 'Oluwaseun', 'Ayodeji', 'Olumide', 'Temitope', 'Oluwafemi', 'Adebayo', 'Oluwaseyi', 'Oluwatobi', 'Adewale', 'Oladipo', 'Olukayode', 'Oluwatosin', 'Adedayo'],
        female: ['Yemoja', 'Oshun', 'Oya', 'Ayomide', 'Folake', 'Olufunke', 'Adunni', 'Ayodele', 'Bolanle', 'Damilola', 'Ebunoluwa', 'Funmilayo', 'Iyabo', 'Jumoke', 'Kemi', 'Lola', 'Mojisola', 'Ngozi', 'Omolara', 'Titilayo'],
        surname: ['Adeyemi', 'Ogundimu', 'Babajide', 'Oladele', 'Akintola', 'Ogunsanwo', 'Adebisi', 'Ogunleye', 'Adesanya', 'Olowu']
    },
    // === NUBIAN ===
    NUBIAN: {
        male: ['Taharqa', 'Piye', 'Shabaka', 'Shebitku', 'Tantamani', 'Kashta', 'Alara', 'Anlamani', 'Aspelta', 'Arikamani', 'Arkamani', 'Amanislo', 'Amanineteyerike', 'Teqorideamani', 'Nastasen', 'Harsiotef', 'Amannote', 'Baskakeren', 'Malewiebamani', 'Talakhamani'],
        female: ['Amenirdis', 'Shepenupet', 'Karimala', 'Peksater', 'Khensa', 'Abar', 'Qalhata', 'Takahatenamun', 'Naparaye', 'Sakhmakh', 'Nasalsa', 'Madiqen', 'Amanishakheto', 'Amanitore', 'Amanirenas', 'Shanakdakhete', 'Nawidemak', 'Maleqorobar', 'Amanikhatashan', 'Amanikhabale'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === EXPANDED PERSIAN & CENTRAL ASIAN ===
    PERSIAN_ANCIENT: {
        male: ['Cyrus', 'Darius', 'Xerxes', 'Artaxerxes', 'Cambyses', 'Bardiya', 'Hystaspes', 'Gobryas', 'Otanes', 'Megabazus', 'Mardonius', 'Tissaphernes', 'Pharnabazus', 'Datames', 'Mithridates', 'Tiridates', 'Phraates', 'Orodes', 'Vologases', 'Pacorus'],
        female: ['Atossa', 'Amestris', 'Mandane', 'Cassandane', 'Roxana', 'Stateira', 'Parysatis', 'Amytis', 'Pantea', 'Artemisia', 'Rhodogune', 'Apama', 'Laodice', 'Berenice', 'Cleopatra', 'Eurydice', 'Olympias', 'Thessalonica', 'Arsinoe', 'Stratonice'],
        surname: ['Achaemenid', 'Arsacid', 'Sassanid', 'of Persepolis', 'of Ecbatana', 'of Susa', 'of Pasargadae', 'of Ctesiphon', 'of Isfahan', 'of Shiraz']
    },
    SOGDIAN: {
        male: ['Divashtich', 'Gurak', 'Tarkhun', 'Karzang', 'Nanai', 'Vakhshuvar', 'Dhuta', 'Nixumat', 'Afrasiab', 'Rustam', 'Bahram', 'Jamshid', 'Farhad', 'Koshvad', 'Mihran', 'Spandiyar', 'Goshtasp', 'Zarathushtra', 'Vishtaspa', 'Jamasp'],
        female: ['Azarmidokht', 'Purandokht', 'Shirin', 'Golnar', 'Parichehr', 'Shahrzad', 'Gordafarid', 'Rudabeh', 'Tahmineh', 'Manijeh', 'Sudabeh', 'Roudabeh', 'Katayoun', 'Farangis', 'Jarireh', 'Sindokht', 'Arnavaz', 'Shahrnaz', 'Spandaramet', 'Humay'],
        surname: ['of Samarkand', 'of Bukhara', 'of Khiva', 'of Merv', 'of Balkh', 'of Kashgar', 'of Khotan', 'of Turfan', 'of Ferghana', 'of Chach']
    },
    TURKIC_STEPPE: {
        male: ['Alp', 'Arslan', 'Tugrul', 'Chaghri', 'Sanjar', 'Mahmud', 'Masud', 'Ibrahim', 'Seljuk', 'Danishmend', 'Mengucek', 'Saltuk', 'Artuk', 'Zengi', 'Nur', 'Belek', 'Timur', 'Bayezid', 'Orhan', 'Osman'],
        female: ['Altun', 'Terken', 'Gevher', 'Melike', 'Hatun', 'Bibi', 'Sati', 'Padishah', 'Khatun', 'Begum', 'Guzel', 'Ayse', 'Fatma', 'Emine', 'Turkan', 'Zubeyde', 'Mihrimah', 'Hurrem', 'Safiye', 'Kosem'],
        surname: ['Beg', 'Khan', 'Tegin', 'Yabgu', 'Shad', 'Elteber', 'Tarkan', 'Baghatur', 'Boyla', 'Tudun']
    },
    // === PERSIAN KHORASAN ===
    PERSIAN_KHORASAN: {
        male: ['Ferdowsi', 'Omar', 'Rumi', 'Hafez', 'Saadi', 'Nizam', 'Attar', 'Sanai', 'Rudaki', 'Daqiqi', 'Asadi', 'Anvari', 'Khaqani', 'Nezami', 'Jami', 'Nasir', 'Biruni', 'Avicenna', 'Rhazes', 'Tusi'],
        female: ['Rabia', 'Mahsati', 'Jahan', 'Mehri', 'Parvin', 'Forough', 'Simin', 'Tahereh', 'Bibi', 'Khadijeh', 'Zahra', 'Maryam', 'Fatimah', 'Golnar', 'Shirin', 'Leyla', 'Pari', 'Soraya', 'Roxana', 'Goli'],
        surname: ['Tusi', 'Khorasani', 'Balkhi', 'Samarqandi', 'Bukhari', 'Mervi', 'Heravi', 'Nishapuri', 'Ghazni', 'Sistan', 'Kashani', 'Razi', 'Isfahani', 'Shirazi', 'Yazdi', 'Kermani', 'Tabrizi', 'Qazvin', 'Mashhadi', 'Sabzevari']
    },
    
    // === TRANSYLVANIA ===
    TRANSYLVANIAN: {
        male: ['István', 'László', 'János', 'Béla', 'András', 'Mihály', 'György', 'Ferenc', 'Péter', 'Mátyás', 'Gábor', 'Zsigmond', 'Bálint', 'Tamás', 'Vlad', 'Radu', 'Mircea', 'Constantin', 'Alexandru', 'Ștefan'],
        female: ['Erzsébet', 'Katalin', 'Anna', 'Mária', 'Ilona', 'Zsuzsanna', 'Klára', 'Borbála', 'Margit', 'Ágnes', 'Dorottya', 'Judit', 'Elena', 'Maria', 'Ana', 'Ioana', 'Elisabeta', 'Ecaterina', 'Sofia', 'Alexandra'],
        surname: ['Báthory', 'Hunyadi', 'Corvinus', 'Bethlen', 'Rákóczi', 'Bocskai', 'Thököly', 'Apafi', 'Kemény', 'Barcsay', 'Szapolyai', 'Drăculești', 'Basarab', 'Brâncoveanu', 'Cantacuzino', 'Ghica', 'Movilă', 'Rareș', 'Mușat', 'Bogdan']
    },
    
    // === GALICIAN ===
    GALICIAN: {
        male: ['Xosé', 'Manuel', 'Antonio', 'Francisco', 'Ramón', 'Pedro', 'Xulio', 'Carlos', 'Luis', 'Diego', 'Afonso', 'Sancho', 'García', 'Fernando', 'Rodrigo', 'Álvaro', 'Paio', 'Nuno', 'Mendo', 'Vasco'],
        female: ['María', 'Carmen', 'Ana', 'Isabel', 'Teresa', 'Dolores', 'Rosa', 'Lucía', 'Beatriz', 'Elvira', 'Urraca', 'Sancha', 'Mayor', 'Constanza', 'Inés', 'Leonor', 'Berenguela', 'Jimena', 'Aldonza', 'Guiomar'],
        surname: ['Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'García', 'Díaz', 'Vázquez', 'Castro', 'Ponte', 'Saavedra', 'Andrade', 'Ulloa', 'Lemos', 'Osorio', 'Quiroga', 'Ribera']
    },
    
    // === IMPROVED NATIVE AMERICAN NAMES WITH REGIONAL SPECIFICITY ===
    // Pacific Northwest Coast
    PACIFIC_NORTHWEST_COAST: {
        male: ['Ksan', 'Haida', 'Tlingit', 'Kwakwaka', 'Tsimshian', 'Nootka', 'Makah', 'Quinault', 'Quileute', 'Skokomish', 'Snoqualmie', 'Duwamish', 'Suquamish', 'Muckleshoot', 'Puyallup', 'Nisqually', 'Cowlitz', 'Chinook', 'Tillamook', 'Siletz'],
        female: ['Salish', 'Skagit', 'Lummi', 'Samish', 'Swinomish', 'Tulalip', 'Snohomish', 'Stillaguamish', 'Sauk', 'Skykomish', 'Klallam', 'Queets', 'Hoh', 'Ozette', 'Neah', 'Taholah', 'Moclips', 'Copalis', 'Humptulips', 'Wynoochee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Great Basin
    GREAT_BASIN_NATIVE: {
        male: ['Shoshone', 'Bannock', 'Paiute', 'Ute', 'Goshute', 'Washoe', 'Numaga', 'Winnemucca', 'Ouray', 'Walkara', 'Pocatello', 'Washakie', 'Tendoy', 'Tahgee', 'Nampa', 'Weiser', 'Bruneau', 'Owyhee', 'Humboldt', 'Reese'],
        female: ['Sacajawea', 'Porivo', 'Emma', 'Cameahwait', 'Bazil', 'Tourtotte', 'Wadze', 'Wadzewipe', 'Poivier', 'Bourdeau', 'Charbonneau', 'Tabeau', 'Dorion', 'Drouillard', 'Colter', 'Potts', 'Weiser', 'Stuart', 'McKenzie', 'Ogden'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    // Southwest (improved Pueblo)
    SOUTHWEST_NATIVE: {
        male: ['Kokopelli', 'Masauwu', 'Tawa', 'Sotuknang', 'Poqanghoya', 'Palongawhoya', 'Muingwa', 'Eototo', 'Aholi', 'Angwusnasomtaka', 'Chowilawu', 'Kwataka', 'Toho', 'Tuwaletstiwa', 'Lomahongyoma', 'Yukiuma', 'Lololoma', 'Tawaquaptewa', 'Sekaquaptewa', 'Honanie'],
        female: ['Kokyangwuti', 'Hahay', 'Wuhti', 'Tuwapongtumsi', 'Qoqlo', 'Angwushahai', 'Hahai', 'Wupamo', 'Palasowitti', 'Qoqole', 'Sakwap', 'Mana', 'Tihu', 'Poli', 'Senom', 'Tukwinong', 'Hano', 'Sikyatki', 'Awatovi', 'Kawaika'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    NORTH_AMERICAN_ALGONQUIAN: {
        male: ['Nanabozho', 'Wabigwan', 'Makoons', 'Migizi', 'Giizhig', 'Binesi', 'Makak', 'Waabigwanii', 'Ogichidaa', 'Gichi', 'Migwech', 'Anishinaabe', 'Boozhoo', 'Giwedin', 'Ishkode', 'Manidoo', 'Miigwech', 'Nooko', 'Ozhaawashko', 'Waaboos'],
        female: ['Nokomis', 'Waabigwanii', 'Ogichidaakwe', 'Migizi', 'Giizhigokwe', 'Binesi', 'Makoons', 'Waabigwan', 'Anishinaabekwe', 'Gichigami', 'Ishkodekwe', 'Manidookwe', 'Miigwech', 'Nookookwe', 'Ozhaawashko', 'Waaboos', 'Giiwedin', 'Migwech', 'Boozhoo', 'Wabana'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    IROQUOIAN: {
        male: ['Kanienke', 'Tekeni', 'Ase', 'Kaieri', 'Wisk', 'Iaiak', 'Sata', 'Sekso', 'Tiohton', 'Oiere', 'Ratirihwakete', 'Ronkwetakete', 'Kawennata', 'Karonhiake', 'Tekariwaien', 'Aiontat', 'Ohonte', 'Rawenniio', 'Sakoiatison', 'Tekanawita'],
        female: ['Ienokenra', 'Kahentanetha', 'Konwatawenhawe', 'Rawennio', 'Teharonhiawagon', 'Wahyonhientha', 'Yontocket', 'Kistahpinanihk', 'Ohwentsia', 'Kanienke', 'Tekeni', 'Ase', 'Kaieri', 'Wisk', 'Iaiak', 'Sata', 'Sekso', 'Tiohton', 'Oiere', 'Kahionhes'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    PLAINS_NATIVE: {
        male: ['Chayton', 'Ezhno', 'Hakan', 'Kuruk', 'Nantan', 'Pachu', 'Sani', 'Takoda', 'Wapi', 'Aiukli', 'Bidziil', 'Dibe', 'Gad', 'Hosteen', 'Naalnish', 'Ahiga', 'Chaytan', 'Elan', 'Honiahaka', 'Kangee', 'Napayshni', 'Otaktay', 'Sicheii', 'Tokala', 'Wambli', 'Mahpe', 'Tatanka', 'Wicahpi', 'Takala', 'Ohanzee'],
        female: ['Aiyana', 'Chenoa', 'Dyani', 'Halona', 'Imala', 'Kachina', 'Leotie', 'Nayeli', 'Orenda', 'Papina', 'Sacnite', 'Taini', 'Weeko', 'Aponi', 'Chickoa', 'Enola', 'Haloke', 'Istas', 'Kimama', 'Migina', 'Nita', 'Shada', 'Tala', 'Winona', 'Zitkala', 'Mahpe', 'Ptesanwi', 'Wicahpi', 'Takala', 'Ohanzee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === NORTH AMERICAN CULTURES ===
    MISSISSIPPIAN: {
        male: ['Tuscaloosa', 'Tuskaloosa', 'Cofitachequi', 'Pacaha', 'Casqui', 'Coosa', 'Ocute', 'Altamaha', 'Ocmulgee', 'Etowah', 'Nikwasi', 'Kituwah', 'Talomeco', 'Olamico', 'Quizquiz', 'Aquixo', 'Guachoya', 'Anilco', 'Tula', 'Tanico'],
        female: ['Coosa', 'Talisi', 'Selu', 'Ama', 'Atsila', 'Gola', 'Inola', 'Nanye', 'Salali', 'Tayanita', 'Tsula', 'Woya', 'Yona', 'Awenasa', 'Galilahi', 'Hiawassee', 'Kamama', 'Leotie', 'Nadie', 'Ocoee'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    PACIFIC_NORTHWEST: {
        male: ['Kwakwaka', 'Haida', 'Tlingit', 'Tsimshian', 'Nootka', 'Salish', 'Chinook', 'Tillamook', 'Kalapuya', 'Siletz', 'Klamath', 'Modoc', 'Wiyot', 'Yurok', 'Karuk', 'Hupa', 'Tolowa', 'Coos', 'Umpqua', 'Siuslaw'],
        female: ['Kaliska', 'Kiona', 'Leotie', 'Lomasi', 'Mahala', 'Minaku', 'Nahimana', 'Odina', 'Pelipa', 'Sahalie', 'Shasta', 'Tallulah', 'Wakanda', 'Winema', 'Yamka', 'Zaltana', 'Adsila', 'Bena', 'Chepi', 'Doli'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    CALIFORNIA_NATIVE: {
        male: ['Ishi', 'Sequoyah', 'Miwok', 'Pomo', 'Ohlone', 'Chumash', 'Yokuts', 'Maidu', 'Wintu', 'Modoc', 'Achomawi', 'Atsugewi', 'Shasta', 'Karuk', 'Yurok', 'Wiyot', 'Tolowa', 'Hupa', 'Cahuilla', 'Serrano'],
        female: ['Aiyana', 'Alameda', 'Huyana', 'Kimi', 'Litonya', 'Luyu', 'Migina', 'Nita', 'Olathe', 'Poloma', 'Sahale', 'Talasi', 'Tiva', 'Topanga', 'Uma', 'Wachiwi', 'Yoomee', 'Zaltana', 'Aponi', 'Bly'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    // === SOUTH AMERICAN CULTURES ===
    /**
     * Quechua-speaking Andes under and before Tawantinsuyu.
     *
     * Inti, Illapa and Killa are the sun, thunder and moon: gods, not people.
     * Mama, Coya, Ñusta and Palla are forms of address by rank — lady, queen,
     * princess, noblewoman — and not birth names either. Condor was the Spanish
     * spelling sitting next to its own Quechua original, Kuntur.
     *
     * The Andean record is the best in South America, so this leans on it: the
     * Sapa Inca succession from Manco Cápac, the generals and claimants of the
     * conquest years, and — unusually — a real run of named women, because the
     * coya and the aclla were recorded. Ocllo and Huaco recur across
     * generations the way Sinaitakala does in Tonga. The rest is ordinary
     * Quechua naming stock: stone, star, flower, falcon, gold.
     */
    INCA: {
        male: ['Manco', 'Sinchi Roca', 'Lloque Yupanqui', 'Mayta Cápac', 'Cápac Yupanqui', 'Inca Roca', 'Yahuar Huaca', 'Viracocha Inca', 'Pachacútec', 'Túpac Yupanqui', 'Huayna Cápac', 'Huáscar', 'Atahualpa', 'Rumiñahui', 'Quizquiz', 'Chalcuchímac', 'Titu Cusi', 'Sayri Túpac', 'Ayar', 'Quispe', 'Waman', 'Kuntur', 'Qori', 'Rumi', 'Amaru', 'Kusi'],
        female: ['Ocllo', 'Huaco', 'Anahuarque', 'Chimpu', 'Cusi Chimbo', 'Rahua Ocllo', 'Añas Colque', 'Quispe Sisa', 'Cura Ocllo', 'Asarpay', 'Chuqui Huipa', 'Mama Runtu', 'Ipa Huaco', 'Tocto', 'Sisa', 'Tika', 'Qoyllur', 'Chaska', 'Wara', 'Sumaq', 'Rimay', 'Pallay'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === INDIGENOUS AMERICA AFTER THE CONQUEST ===
    /**
     * The three sets below exist because the sets above them stop at the
     * conquest, and the region rules went on naming them anyway. `MAYA` ends in
     * 1600, `ZAPOTEC` and `MIXTEC` in 1600, `INCA` in 1580 — correctly, since
     * they are precontact registers and the `INCA` list is literally the Sapa
     * Inca succession — so the era gate dropped them from every rule covering
     * the years since independence, and the whole share went to the Spanish set
     * beside them. Yucatán, Oaxaca and the Andes generated no Indigenous person
     * at all in any year after 1821, in three of the most heavily Indigenous
     * regions on earth.
     *
     * The shape they take is the one the conquest actually produced, and it is
     * the same shape in all three: baptism gave a Spanish given name, and the
     * Indigenous name survived as the surname. A Yucatec farmer in 1950 is
     * Domingo Canul; an Aymara one on the altiplano is Justo Mamani. Neither is
     * "a Spanish name", and neither is a precontact one.
     */
    /** Yucatec and highland Maya. The surnames are the ordinary ones in Yucatán, Campeche and the Guatemalan highlands today. */
    MAYA_MODERN: {
        male: ['Domingo', 'Juan', 'José', 'Manuel', 'Santiago', 'Bernardo', 'Feliciano', 'Eusebio', 'Anastasio', 'Gaspar', 'Marcelino', 'Pedro', 'Diego', 'Sebastián', 'Nicolás', 'Andrés', 'Cornelio', 'Bonifacio', 'Fulgencio', 'Hilario'],
        female: ['María', 'Juana', 'Petrona', 'Candelaria', 'Dominga', 'Marcelina', 'Eulalia', 'Concepción', 'Rosalía', 'Felipa', 'Andrea', 'Manuela', 'Teodora', 'Bartola', 'Genoveva', 'Prudencia', 'Silveria', 'Angelina', 'Nicolasa', 'Simona'],
        surname: ['Pech', 'Canul', 'Chan', 'Dzul', 'Ek', 'Poot', 'Uc', 'Cauich', 'Kumul', 'Tzuc', 'May', 'Balam', 'Cocom', 'Xiu', 'Chi', 'Ku', 'Noh', 'Pat', 'Yam', 'Batz', 'Coj', 'Tzoc']
    },
    /**
     * Zapotec and Mixtec Oaxaca.
     *
     * Deliberately not a list of Zapotec surnames, because there is no such
     * list to draw on honestly: Oaxaca's Indigenous families carry Spanish
     * surnames, and the naming is distinguished from creole naming by *which*
     * Spanish names — saints' and feast-day names, and the toponymic and
     * baptismal surnames given wholesale in the missions — rather than by
     * being in another language. Writing invented Zapotec surnames here would
     * look more Indigenous and be less true.
     */
    ZAPOTEC_MODERN: {
        male: ['Isidro', 'Cirilo', 'Macario', 'Fidencio', 'Zenón', 'Aurelio', 'Melquiades', 'Bartolo', 'Crescencio', 'Timoteo', 'Baltazar', 'Wenceslao', 'Prócoro', 'Herminio', 'Gaudencio', 'Anselmo', 'Leoncio', 'Refugio', 'Casimiro', 'Nazario'],
        female: ['Soledad', 'Crescencia', 'Herlinda', 'Eufemia', 'Perfecta', 'Bartola', 'Filomena', 'Saturnina', 'Aurora', 'Epifania', 'Modesta', 'Rufina', 'Bernardina', 'Reyna', 'Anastasia', 'Cleotilde', 'Práxedis', 'Emiliana', 'Zeferina', 'Gregoria'],
        surname: ['Santiago', 'Bautista', 'De la Cruz', 'San Juan', 'Matus', 'Chagoya', 'Nolasco', 'Zárate', 'Toledo', 'Vásquez', 'Jiménez', 'Martínez', 'López', 'Luna', 'Mendoza', 'Ramírez', 'Hernández', 'Pacheco', 'Regalado', 'Sarabia']
    },
    /**
     * Quechua and Aymara, from the conquest to now. Quispe and Mamani are among
     * the commonest surnames in Peru and Bolivia; the given names are the older
     * saint-day register that the modern urban `SPANISH_LATIN_AMERICAN` list —
     * Camila, Valentina, Ximena — is wrong for outside the cities.
     */
    ANDEAN_MODERN: {
        male: ['Justo', 'Feliciano', 'Eusebio', 'Mariano', 'Gregorio', 'Pastor', 'Basilio', 'Fermín', 'Cirilo', 'Anacleto', 'Zenón', 'Hipólito', 'Nicanor', 'Fortunato', 'Serapio', 'Bonifacio', 'Teodoro', 'Julián', 'Máximo', 'Juan'],
        female: ['Julia', 'Santusa', 'Bernardina', 'Felipa', 'Gregoria', 'Marcelina', 'Toribia', 'Sabina', 'Paulina', 'Eusebia', 'Hilaria', 'Basilia', 'Prudencia', 'Celestina', 'Máxima', 'Fortunata', 'Asunta', 'Justina', 'Rosalía', 'Nieves'],
        surname: ['Quispe', 'Mamani', 'Condori', 'Huamán', 'Apaza', 'Ticona', 'Chambi', 'Choque', 'Yupanqui', 'Poma', 'Cusi', 'Layme', 'Ccama', 'Sucari', 'Callisaya', 'Colque', 'Tarqui', 'Vilca', 'Choquehuanca', 'Anccasi']
    },

    /**
     * Tupinambá and related Tupi-Guarani speakers of the Brazilian coast.
     *
     * Three separate things had to come out of this list. Vitória, Yasmin,
     * Nina, Samara, Murilo and Kaique are Portuguese, Arabic and modern
     * Brazilian given names, and belong to `PORTUGUESE_BRAZIL`. Tupã, Jaci,
     * Guaraci, Anhangá, Curupira, Boitatá, Saci and Caipora are deities and
     * folklore beings, not people — the same mistake the Oceanic set made with
     * Maui and Tangaroa. And Iracema, Moema, Peri, Ubirajara and Ubiratan are
     * inventions of José de Alencar's Indianist novels of the 1850s and 60s;
     * they are real Brazilian names today, three centuries too late for anyone
     * generated here.
     *
     * What replaces them: chiefs recorded by Hans Staden (1557), Jean de Léry
     * (1578) and Gabriel Soares de Sousa, including the warrior names in
     * -açu/-guaçu ("great") and -mirim/-miri ("lesser") that the sources show
     * being taken and re-taken for deeds in war; and animal, plant and quality
     * words of the kind those names were built from. Women are far worse
     * recorded than men — Paraguaçu and Bartira survive largely because both
     * were married to Portuguese settlers.
     */
    TUPI: {
        male: ['Cunhambebe', 'Aimberê', 'Tibiriçá', 'Araribóia', 'Piquerobi', 'Caiubi', 'Pindobuçu', 'Japiaçu', 'Guaixará', 'Nhaêpepô-açu', 'Vratinge-açu', 'Alkindar-miri', 'Jeppipó-açu', 'Taquaruçu', 'Abati-poçanga', 'Ipiru-guaçu', 'Tatamirim', 'Karuatá', 'Itaguaçu', 'Jaguaraçu', 'Pirajá', 'Abaeté', 'Karaí', 'Kunumiaçu'],
        female: ['Paraguaçu', 'Bartira', 'Mbicy', 'Potira', 'Jandira', 'Jurema', 'Pitanga', 'Sumaúma', 'Kunhã', 'Kunhataĩ', 'Muirá', 'Arasy', 'Ybytu'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    /**
     * Muisca of the Altiplano Cundiboyacense.
     *
     * Bochica, Chiminigagua, Chibchacum, Fomagata, Bachué and Huitaca are the
     * Muisca pantheon and had to go. Zipa and Zaque are the two paramount
     * titles, not names. Bacatá and Muyquytá are the same place — Bogotá — and
     * Suba, Fucha and Usa are its modern boroughs, which is how a Muisca woman
     * in 1300 came to be called after a Bogotá bus interchange. `Gaia` is
     * Greek and nobody can account for it.
     *
     * The men are the zipas of Bacatá, zaques of Hunza and iracas of Sugamuxi
     * named in the Spanish record. Several are cacicazgo names — a cacique was
     * ordinarily called by the seat he held, and that is exactly how the
     * conquistadors wrote them down.
     *
     * The women are the weak point and are marked as such: outside Zoratama,
     * kept in colonial legend, virtually no Muisca woman's name survives, so
     * the rest is Muisca-language material — chie moon, sua sun, sie water,
     * fiba wind, gata fire — used as name-shaped placeholders. It is the least
     * certain list in this file.
     */
    MUISCA: {
        male: ['Tisquesusa', 'Nemequene', 'Quemuenchatocha', 'Aquiminzaque', 'Hunzahúa', 'Saguamanchica', 'Meicuchuca', 'Michuá', 'Sagipa', 'Tundama', 'Sugamuxi', 'Nompanim', 'Popón', 'Tutazúa', 'Firavitoba', 'Idacansás', 'Susa', 'Guatavita', 'Ubaque', 'Turmequé'],
        female: ['Zoratama', 'Furatena', 'Faravita', 'Gualcalá', 'Chía', 'Chie', 'Sua', 'Sie', 'Fiba', 'Gata', 'Quyca', 'Guasgua'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    
    /**
     * Mapuche of the Araucanía and the Argentine cordillera.
     *
     * Paloma, Xaviera, Zulema and Inara are Spanish and Arabic; Inti and Amaru
     * are Quechua, from six hundred miles north. All are gone. Fresia and
     * Guacolda, the two Mapuche women everyone can name, are absent for a
     * different reason: Ercilla invented them for *La Araucana* in 1569.
     *
     * Unlike the Polynesian sets, this one is not split by contact. Mapudungun
     * naming survived the Spanish, survived the independent Araucanía, and was
     * still being used when Chile occupied it in 1883 — so one list covers the
     * whole span. The men are the toquis and lonkos of the chronicles; the
     * women are compounds in the ordinary Mapudungun pattern, colour or
     * material plus a noun (kallfü blue, millа gold, likan quartz, rayen
     * flower, wangülen star), because the chroniclers recorded warriors.
     */
    MAPUCHE: {
        male: ['Leftraru', 'Kallfülikan', 'Kolo Kolo', 'Galvarino', 'Lincoyán', 'Tucapel', 'Rengo', 'Pelantaro', 'Anganamón', 'Lientur', 'Millalelmu', 'Curiñancu', 'Painenancu', 'Cadeguala', 'Guanoalca', 'Paillamachu', 'Antüpaingi', 'Nawelkura', 'Kurüwilu', 'Wenchulaf', 'Millapangi', 'Mankelef'],
        female: ['Wangülen', 'Kuyen', 'Millaray', 'Kallfüray', 'Likanray', 'Rayen', 'Malen', 'Pewma', 'Foye', 'Aliwen', 'Kolüray', 'Ligray', 'Ñamku', 'Kinturay', 'Ayün', 'Antüray'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === CONTINUE WITH EXISTING CULTURES (keeping the good ones as-is) ===
    SPANISH_CASTILIAN: {
        male: ['Diego', 'Javier', 'Carlos', 'Miguel', 'Alejandro', 'Francisco', 'Hernán', 'Mateo', 'Santiago', 'Pablo', 'Eduardo', 'Fernando', 'Rafael', 'Andrés', 'Manuel', 'Sebastián', 'Gonzalo', 'Emilio', 'Ramón', 'Vicente', 'Joaquín', 'Ignacio', 'Lorenzo', 'Salvador', 'Esteban', 'Agustín', 'Nicolás', 'Patricio', 'Teodoro', 'Cristóbal'],
        female: ['Isabella', 'Sofia', 'Camila', 'Valentina', 'Lucia', 'Maria', 'Elena', 'Ximena', 'Carmen', 'Esperanza', 'Dolores', 'Mercedes', 'Pilar', 'Rosario', 'Consuelo', 'Amparo', 'Remedios', 'Concepción', 'Asunción', 'Inmaculada', 'Soledad', 'Milagros', 'Angeles', 'Encarnación', 'Fernanda', 'Gabriela', 'Beatriz', 'Cristina', 'Margarita', 'Catalina'],
        surname: ['García', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Cruz', 'Flores', 'Gomez', 'Morales', 'Vargas', 'Castillo', 'Jimenez', 'Ruiz', 'Diaz', 'Moreno', 'Herrera', 'Medina', 'Aguilar', 'Gutierrez', 'Contreras', 'Mendoza', 'Ortega', 'Silva', 'Romero', 'Guerrero', 'Vega']
    },
    SPANISH_LATIN_AMERICAN: {
        male: ['Mateo', 'Santiago', 'Alejandro', 'Sebastián', 'Diego', 'Nicolás', 'Emiliano', 'Joaquín', 'Gabriel', 'Daniel', 'Javier', 'Carlos', 'Fernando', 'Ricardo', 'Arturo', 'Hector', 'Oscar', 'Raul', 'Sergio', 'Ivan'],
        female: ['Camila', 'Sofía', 'Valentina', 'Isabella', 'Mariana', 'Gabriela', 'Daniela', 'Valeria', 'Ximena', 'Renata', 'Alejandra', 'Carolina', 'Paulina', 'Adriana', 'Victoria', 'Natalia', 'Andrea', 'Liliana', 'Patricia', 'Veronica'],
        surname: ['Hernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Flores', 'Gomez', 'Diaz', 'Vasquez', 'Rojas', 'Reyes', 'Mendoza', 'Castillo', 'Cruz', 'Morales', 'Vargas', 'Silva']
    },
    PORTUGUESE: {
        male: ['João', 'Pedro', 'Afonso', 'Diogo', 'Vasco', 'Gonçalo', 'Nuno', 'Rui', 'António', 'Manuel', 'Francisco', 'José', 'Carlos', 'Miguel', 'Luís', 'Paulo', 'Ricardo', 'André', 'Bruno', 'Tiago', 'Rafael', 'Hugo', 'Marco', 'Sérgio', 'Vítor', 'Jorge', 'Mário', 'Henrique', 'Rodrigo', 'Fernando'],
        female: ['Maria', 'Leonor', 'Beatriz', 'Catarina', 'Inês', 'Isabel', 'Teresa', 'Joana', 'Ana', 'Sofia', 'Carolina', 'Patrícia', 'Cláudia', 'Cristina', 'Sandra', 'Paula', 'Carla', 'Sónia', 'Helena', 'Marta', 'Susana', 'Fernanda', 'Manuela', 'Conceição', 'Graça', 'Fátima', 'Rosa', 'Alice', 'Margarida', 'Esperança'],
        surname: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha']
    },
    /**
     * The enslaved and free Black population of Brazil, who were baptised on
     * arrival and so bore Portuguese given names — often saints' names, and
     * often a devotional surname (dos Santos, da Conceição, de Jesus) rather
     * than a master's family name. West and West-Central African day-names and
     * ethnonym-bynames survived alongside them, which is why Quitéria, Benguela
     * and Mina are here. This exists because the generator was reaching for the
     * United States `AFRICAN_AMERICAN` list instead.
     */
    AFRO_BRAZILIAN: {
        male: ['João', 'Antônio', 'Francisco', 'Manuel', 'José', 'Domingos', 'Miguel', 'Pedro', 'Salvador', 'Benedito', 'Bento', 'Gaspar', 'Baltazar', 'Sebastião', 'Inácio', 'Feliciano', 'Ventura', 'Custódio', 'Anastácio', 'Cosme', 'Damião', 'Quirino', 'Zumbi', 'Ganga'],
        female: ['Maria', 'Ana', 'Francisca', 'Antônia', 'Josefa', 'Quitéria', 'Rosa', 'Luzia', 'Esperança', 'Vitória', 'Damiana', 'Feliciana', 'Inácia', 'Custódia', 'Benedita', 'Aparecida', 'Joana', 'Teresa', 'Escolástica', 'Úrsula', 'Dandara', 'Tereza'],
        surname: ['dos Santos', 'da Conceição', 'de Jesus', 'do Espírito Santo', 'da Silva', 'do Rosário', 'de Nazaré', 'da Cruz', 'Angola', 'Benguela', 'Mina', 'Congo', 'Nagô', 'Crioulo', 'Cabinda', '(No Surname)', '(No Surname)']
    },

    /**
     * The Caribbean, where `AFRICAN_AMERICAN` was standing in for everybody.
     *
     * The same error a previous pass fixed for Brazil, and for the same
     * reason: `AFRICAN_AMERICAN` is a United States list, and it was naming
     * the enslaved and free Black populations of Cuba, Saint-Domingue,
     * Jamaica and Barbados — so an Afro-Cuban woman in 1780 Havana came out
     * as "Shirley Jackson". Caribbean naming follows the colonial power that
     * did the baptising, which is why this set is trilingual: Spanish in the
     * Greater Antilles, French in Saint-Domingue, Guadeloupe and Martinique,
     * English in Jamaica and the eastern islands.
     *
     * The surnames carry the same history the given names do. Saints' and
     * devotional names predominate under Catholic baptism; the English islands
     * left plainer English surnames, very often the estate's. Day-names —
     * Cudjoe, Quashie, Phibbah, Abba — are Akan retentions that survived in
     * the English Caribbean well into the nineteenth century and are among the
     * most strongly attested African survivals anywhere in the Americas.
     */
    AFRO_CARIBBEAN: {
        male: ['José', 'Juan', 'Francisco', 'Manuel', 'Pedro', 'Domingo', 'Santiago', 'Tomás',
               'Jean', 'Pierre', 'Louis', 'Joseph', 'Baptiste', 'Toussaint', 'Dessalines', 'Henri',
               'John', 'Thomas', 'William', 'Samuel', 'Moses', 'Isaac',
               'Cudjoe', 'Quashie', 'Quaco', 'Cuffee', 'Mingo', 'Juba'],
        female: ['María', 'Juana', 'Josefa', 'Dolores', 'Caridad', 'Mercedes', 'Altagracia',
                 'Marie', 'Rose', 'Louise', 'Céline', 'Toussainte', 'Adélaïde',
                 'Mary', 'Sarah', 'Nancy', 'Betsy', 'Grace', 'Hagar',
                 'Phibbah', 'Abba', 'Quasheba', 'Cubah', 'Yaba'],
        surname: ['de la Caridad', 'de los Santos', 'Valdés', 'Congo', 'Carabalí', 'Lucumí', 'Mandinga',
                  'Baptiste', 'Toussaint', 'Pierre-Louis', 'Jean-Baptiste', 'Désir', 'Sylvain',
                  'Brown', 'Campbell', 'Clarke', 'Grant', 'Reid', 'Bailey',
                  '(No Surname)', '(No Surname)', '(No Surname)']
    },

    PORTUGUESE_BRAZIL: {
        male: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Gabriel', 'Pedro', 'Lucas', 'Matheus', 'Enzo', 'Guilherme', 'Samuel', 'Felipe', 'Gustavo', 'Rafael', 'João', 'Daniel', 'Vitor', 'Leonardo', 'Henrique'],
        female: ['Alice', 'Sophia', 'Helena', 'Valentina', 'Laura', 'Isabella', 'Manuela', 'Júlia', 'Heloísa', 'Luiza', 'Maria', 'Lívia', 'Giovanna', 'Beatriz', 'Mariana', 'Yasmin', 'Gabriela', 'Rafaela', 'Larissa', 'Beatriz'],
        surname: ['da Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa']
    },
    ITALIAN: {
        male: ['Giovanni', 'Marco', 'Lorenzo', 'Antonio', 'Leonardo', 'Francesco', 'Matteo', 'Alessandro', 'Andrea', 'Giuseppe', 'Stefano', 'Roberto', 'Massimo', 'Federico', 'Simone', 'Davide', 'Luca', 'Paolo', 'Fabio', 'Claudio', 'Sergio', 'Carlo', 'Enrico', 'Riccardo', 'Tommaso', 'Michele', 'Vincenzo', 'Emanuele', 'Gabriele', 'Raffaele'],
        female: ['Giulia', 'Sofia', 'Aurora', 'Alice', 'Beatrice', 'Francesca', 'Chiara', 'Martina', 'Giorgia', 'Sara', 'Emma', 'Greta', 'Vittoria', 'Camilla', 'Matilde', 'Noemi', 'Elena', 'Elisabetta', 'Federica', 'Valentina', 'Alessandra', 'Silvia', 'Paola', 'Laura', 'Cristina', 'Monica', 'Anna', 'Roberta', 'Emanuela', 'Daniela'],
        surname: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone']
    },
    FRENCH: {
        male: ['Jean', 'Pierre', 'Louis', 'Charles', 'Guillaume', 'Philippe', 'Henri', 'Antoine', 'Michel', 'François', 'André', 'Nicolas', 'Claude', 'Bernard', 'Marcel', 'René', 'Paul', 'Robert', 'Jacques', 'Alain', 'Gérard', 'Yves', 'Christian', 'Thierry', 'Daniel', 'Patrick', 'Pascal', 'Olivier', 'Sébastien', 'Étienne'],
        female: ['Marie', 'Jeanne', 'Marguerite', 'Catherine', 'Isabelle', 'Louise', 'Anne', 'Françoise', 'Monique', 'Sylvie', 'Nicole', 'Christine', 'Brigitte', 'Martine', 'Chantal', 'Véronique', 'Nathalie', 'Sandrine', 'Valérie', 'Céline', 'Stéphanie', 'Virginie', 'Aurélie', 'Émilie', 'Caroline', 'Julie', 'Laure', 'Mathilde', 'Claire', 'Camille'],
        surname: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez']
    },
    GERMAN: {
        male: ['Johann', 'Wilhelm', 'Friedrich', 'Heinrich', 'Karl', 'Ludwig', 'Franz', 'Georg', 'Christian', 'Rudolf', 'Otto', 'Ernst', 'Hans', 'Werner', 'Klaus', 'Günter', 'Dieter', 'Helmut', 'Wolfgang', 'Manfred', 'Peter', 'Michael', 'Thomas', 'Andreas', 'Stefan', 'Markus', 'Alexander', 'Sebastian', 'Florian', 'Maximilian'],
        female: ['Anna', 'Maria', 'Elisabeth', 'Margarete', 'Gertrude', 'Emma', 'Bertha', 'Martha', 'Frieda', 'Marie', 'Helga', 'Ingrid', 'Ursula', 'Monika', 'Brigitte', 'Renate', 'Gisela', 'Sabine', 'Petra', 'Andrea', 'Claudia', 'Stefanie', 'Nicole', 'Julia', 'Katharina', 'Sandra', 'Christina', 'Melanie', 'Nadine', 'Tanja'],
        surname: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier']
    },
    RUSSIAN: {
        male: ['Ivan', 'Vladimir', 'Dmitri', 'Sergei', 'Alexei', 'Mikhail', 'Andrei', 'Nikolai', 'Pavel', 'Konstantin', 'Boris', 'Viktor', 'Yuri', 'Oleg', 'Roman', 'Maxim', 'Artem', 'Igor', 'Evgeni', 'Denis', 'Stanislav', 'Vadim', 'Leonid', 'Gennadi', 'Anatoli', 'Vitali', 'Valeri', 'Ruslan', 'Fyodor', 'Georgi'],
        female: ['Olga', 'Irina', 'Elena', 'Natasha', 'Svetlana', 'Maria', 'Tatyana', 'Anna', 'Lyudmila', 'Galina', 'Nadezhda', 'Valentina', 'Nina', 'Anastasia', 'Vera', 'Oksana', 'Yulia', 'Ekaterina', 'Marina', 'Larisa', 'Alla', 'Tamara', 'Raisa', 'Zinaida', 'Lyubov', 'Yelena', 'Polina', 'Darya', 'Alina', 'Kira'],
        surname: ['Ivanov', 'Petrov', 'Sidorov', 'Smirnov', 'Kuznetsov', 'Popov', 'Volkov', 'Sokolov', 'Mikhailov', 'Fedorov', 'Morozov', 'Volkov', 'Alekseev', 'Lebedev', 'Semenov', 'Egorov', 'Pavlov', 'Kozlov', 'Stepanov', 'Nikolaev', 'Orlov', 'Andreev', 'Makarov', 'Nikitin', 'Antonov', 'Timofeev', 'Filippov', 'Yakovlev', 'Prokofiev', 'Sergeev']
    },
    GREEK: {
        male: ['Alexandros', 'Dimitrios', 'Konstantinos', 'Georgios', 'Ioannis', 'Nikolaos', 'Panagiotis', 'Christos', 'Vasileios', 'Michail', 'Antonios', 'Theodoros', 'Spyridon', 'Andreas', 'Athanasios', 'Stefanos', 'Apostolos', 'Evangelos', 'Eleftherios', 'Charalampos', 'Petros', 'Odysseus', 'Leonidas', 'Lysander', 'Theofilos', 'Aristides', 'Demetrius', 'Kyriakos', 'Socrates', 'Platon'],
        female: ['Maria', 'Eleni', 'Katerina', 'Dimitra', 'Sofia', 'Anastasia', 'Georgia', 'Konstantina', 'Ioanna', 'Vasiliki', 'Paraskevi', 'Chrysoula', 'Antonia', 'Sophia', 'Alexandra', 'Despina', 'Kalliopi', 'Fotini', 'Evangelia', 'Panagiota', 'Theodora', 'Angeliki', 'Irini', 'Stavroula', 'Olympia', 'Penelope', 'Cassandra', 'Helena', 'Athena', 'Aphrodite'],
        surname: ['Papadopoulos', 'Georgiou', 'Dimitriou', 'Konstantinou', 'Ioannou', 'Nikolaou', 'Petrou', 'Andreou', 'Christou', 'Michail', 'Stefanou', 'Karagiannis', 'Vasiliou', 'Oikonomou', 'Antoniou', 'Stavrou', 'Theodossiou', 'Alexandrou', 'Charalambous', 'Evangelou', 'Panayiotou', 'Demetriou', 'Athanassiou', 'Economou', 'Spyrou', 'Kostas', 'Makris', 'Vlachos', 'Pappas', 'Kostopoulos']
    },
    // Ancient Celtic (800 BCE - 400 CE)
    CELTIC_ANCIENT: {
        male: ['Vercingetorix', 'Ambiorix', 'Indutiomarus', 'Cavarinus', 'Commius', 'Dumnorix', 'Diviciacus', 'Orgetorix', 'Cingetorix', 'Cavarillus', 'Lugotorix', 'Celtillus', 'Gobannitio', 'Convictolitavis', 'Litaviccus', 'Eporedorix', 'Viridomarus', 'Aneroestes', 'Bolgios', 'Brennos'],
        female: ['Boudica', 'Cartimandua', 'Onomaris', 'Chiomara', 'Camma', 'Eponina', 'Veleda', 'Medb', 'Scathach', 'Aife', 'Brigantia', 'Andraste', 'Sulis', 'Coventina', 'Rosmerta', 'Epona', 'Macha', 'Badb', 'Nemain', 'Morrigan'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    CELTIC_IRISH: {
        male: ['Seán', 'Liam', 'Conor', 'Cian', 'Aidan', 'Niall', 'Eoin', 'Oisín', 'Tadhg', 'Ruairí', 'Cillian', 'Darragh', 'Fionn', 'Ronan', 'Donnacha', 'Pádraig', 'Cormac', 'Brendan', 'Colm', 'Diarmuid', 'Eamon', 'Fergus', 'Ciarán', 'Lorcan', 'Muiris', 'Rían', 'Séamus', 'Cathal', 'Donal', 'Finn'],
        female: ['Aoife', 'Ciara', 'Niamh', 'Aisling', 'Sinéad', 'Caoimhe', 'Orla', 'Saoirse', 'Clodagh', 'Róisín', 'Ailbhe', 'Gráinne', 'Méabh', 'Siobhán', 'Muirenn', 'Brigid', 'Dervla', 'Fionnuala', 'Íde', 'Maeve', 'Nuala', 'Órlaith', 'Úna', 'Laoise', 'Aoibhinn', 'Bríd', 'Deirdre', 'Eimear', 'Fíona', 'Mairéad'],
        surname: ["O'Brien", "O'Sullivan", "O'Connor", "O'Neill", "O'Kelly", "Murphy", "Walsh", "Ryan", "Byrne", "McCarthy", "Kelly", "Doyle", "Gallagher", "Clarke", "Kennedy", "Lynch", "Murray", "Quinn", "Moore", "McLoughlin", "Carroll", "Connolly", "Daly", "Connell", "Wilson", "Dunne", "Griffin", "Breen", "Martin", "McDonnell"]
    },
    WELSH: {
        male: ['Gareth', 'Rhys', 'Owen', 'Dylan', 'Dafydd', 'Llyr', 'Iestyn', 'Geraint', 'Tudur', 'Aneurin', 'Cai', 'Emrys', 'Gwylim', 'Huw', 'Ieuan', 'Jestyn', 'Llewelyn', 'Mabyn', 'Neirin', 'Padrig', 'Rhodri', 'Steffan', 'Tomos', 'Wil', 'Ynyr', 'Brychan', 'Ceredig', 'Dewi', 'Efan', 'Gruffydd'],
        female: ['Angharad', 'Bethan', 'Cerys', 'Dilys', 'Elen', 'Ffion', 'Gwen', 'Heledd', 'Lowri', 'Mair', 'Nerys', 'Olwen', 'Rhiannon', 'Sian', 'Tegan', 'Bronwen', 'Carys', 'Delyth', 'Eira', 'Fflur', 'Gwenllian', 'Heulwen', 'Iona', 'Llinos', 'Megan', 'Non', 'Owena', 'Rhian', 'Sera', 'Tegwen'],
        surname: ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Edwards', 'Owen', 'Parry', 'Price', 'Jenkins', 'Phillips', 'Lloyd', 'John', 'Rees', 'James', 'Powell', 'Harris', 'Rogers', 'Watkins', 'Davies', 'Morris', 'Ellis', 'Richards', 'Jackson', 'Carter']
    },
    SCOTTISH: {
        male: ['Alasdair', 'Hamish', 'Ruaridh', 'Calum', 'Iain', 'Seumas', 'Torquil', 'Ewan', 'Gregor', 'Magnus', 'Finlay', 'Fraser', 'Duncan', 'Innes', 'Lachlan', 'Murray', 'Niall', 'Rory', 'Struan', 'Tavish', 'Blair', 'Bruce', 'Cameron', 'Douglas', 'Fergus', 'Gordon', 'Grant', 'Keith', 'Kyle', 'Ross'],
        female: ['Fiona', 'Morag', 'Aileas', 'Caoimhe', 'Eilidh', 'Iona', 'Kenna', 'Mairi', 'Shona', 'Tavish', 'Isla', 'Mhairi', 'Catriona', 'Elspeth', 'Fenella', 'Gillian', 'Heather', 'Ishbel', 'Jenna', 'Kirsty', 'Lesley', 'Marsali', 'Nairne', 'Oighrig', 'Peigi', 'Rhona', 'Seonag', 'Teasag', 'Una', 'Vaila'],
        surname: ['MacDonald', 'MacLeod', 'MacKenzie', 'Stewart', 'Campbell', 'MacLean', 'Morrison', 'MacKay', 'MacMillan', 'Fraser', 'Grant', 'MacFarlane', 'MacPherson', 'MacLellan', 'MacGillivray', 'MacInnes', 'MacBride', 'MacRae', 'MacQueen', 'MacBeth', 'Sinclair', 'Gordon', 'Cameron', 'Murray', 'Ross', 'Robertson', 'MacIntosh', 'MacNeil', 'MacArthur', 'MacKinnon']
    },
    DUTCH: {
        male: ['Willem', 'Jan', 'Pieter', 'Hendrik', 'Johannes', 'Cornelis', 'Adriaan', 'Antonius', 'Gerrit', 'Jacobus', 'Martinus', 'Nicolaas', 'Franciscus', 'Petrus', 'Albertus', 'Bernardus', 'Christiaan', 'Dirk', 'Eduard', 'Frederik', 'Gijsbert', 'Herman', 'Izaak', 'Johan', 'Karel', 'Lambertus', 'Michiel', 'Nicolaas', 'Otto', 'Paulus'],
        female: ['Maria', 'Anna', 'Catharina', 'Elisabeth', 'Hendrika', 'Johanna', 'Margaretha', 'Petronella', 'Cornelia', 'Adriana', 'Antonia', 'Bernardina', 'Christina', 'Dorothea', 'Francina', 'Geertruida', 'Helena', 'Jacoba', 'Josina', 'Klasina', 'Leonarda', 'Martina', 'Neeltje', 'Pieternella', 'Susanna', 'Theodora', 'Willemina', 'Alida', 'Betje', 'Dirkje'],
        surname: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'van der Linden', 'Kok', 'Jacobs', 'de Haan', 'Vermeulen']
    },
    SCANDINAVIAN: {
        male: ['Erik', 'Lars', 'Nils', 'Anders', 'Björn', 'Sven', 'Gunnar', 'Olof', 'Magnus', 'Per', 'Johan', 'Carl', 'Mikael', 'Stefan', 'Henrik', 'Mattias', 'Daniel', 'Alexander', 'Fredrik', 'Marcus', 'Oskar', 'Viktor', 'Emil', 'Oliver', 'William', 'Lucas', 'Hugo', 'Theo', 'Leon', 'Noah'],
        female: ['Anna', 'Eva', 'Karin', 'Birgitta', 'Elisabeth', 'Margareta', 'Kristina', 'Ingrid', 'Marie', 'Marianne', 'Lena', 'Emma', 'Astrid', 'Maja', 'Elsa', 'Agnes', 'Freja', 'Saga', 'Wilma', 'Ebba', 'Alicia', 'Vera', 'Klara', 'Molly', 'Meja', 'Lilly', 'Amanda', 'Sigrid', 'Tuva', 'Lovisa'],
        surname: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson', 'Jönsson', 'Lindberg', 'Jakobsson', 'Magnusson', 'Olofsson', 'Lindström', 'Lindqvist', 'Lindgren', 'Berg', 'Axelsson', 'Hedström', 'Mattsson', 'Henriksson', 'Sandberg', 'Forsberg']
    },

    // === ADDITIONAL EUROPEAN GROUPS ===
    BYZANTINE: {
        male: ['Ioannes', 'Konstantinos', 'Mikhael', 'Basilios', 'Theodoros', 'Nikephoros', 'Romanos', 'Alexios', 'Isaakios', 'Ioannikios', 'Stephanos', 'Georgios', 'Athanasios', 'Makarios', 'Prokopios', 'Nikodemos', 'Kallinikos', 'Photios', 'Ignatios', 'Maximos'],
        female: ['Anna', 'Theodora', 'Eirene', 'Zoe', 'Maria', 'Eudokia', 'Euphrosyne', 'Bertha', 'Agnes', 'Konstantina', 'Anastasia', 'Sophia', 'Elisabet', 'Aikaterine', 'Xene', 'Thomais', 'Pulcheria', 'Ariadne', 'Verina', 'Aelia'],
        surname: ['Komnenos', 'Palaiologos', 'Doukas', 'Kantakouzenos', 'Laskaris', 'Angelos', 'Botaneiates', 'Diogenes', 'Phokas', 'Skleros', 'Argyros', 'Maleinos', 'Dalassenos', 'Katakalon', 'Tornikes', 'Bryennios', 'Vatatzas', 'Tzykandyles', 'Raoul', 'Kantakouzenos']
    },
    SLAVIC_MEDIEVAL: {
        male: ['Bogdan', 'Dragomir', 'Milos', 'Stanislav', 'Radoslav', 'Svetoslav', 'Tomislav', 'Dobroslaw', 'Casimir', 'Boleslaw', 'Vladislav', 'Branislav', 'Predrag', 'Nemanja', 'Stefan', 'Dusan', 'Lazar', 'Milutin', 'Rastko', 'Vukan'],
        female: ['Milica', 'Ana', 'Teodora', 'Jelena', 'Katarina', 'Olivera', 'Mara', 'Despina', 'Dragana', 'Branka', 'Jovana', 'Andjelija', 'Vukosava', 'Stana', 'Ruza', 'Danica', 'Smiljana', 'Cveta', 'Nada', 'Vera'],
        surname: ['Nemanjic', 'Brankovic', 'Lazarevic', 'Balšic', 'Crnojevic', 'Kastrioti', 'Dukagjini', 'Thopia', 'Muzaka', 'Arianiti', 'Spani', 'Zaharia', 'Zenevisi', 'Dushmani', 'Blinishti', 'Golemi', 'Matarango', 'Jonima', 'Dusmani', 'Progoni']
    },
    HUNGARIAN_MEDIEVAL: {
        male: ['István', 'László', 'András', 'Géza', 'Kálmán', 'Béla', 'Imre', 'András', 'Endre', 'Salamon', 'Péter', 'Aba', 'Levente', 'Vazul', 'Előd', 'Ond', 'Kond', 'Ors', 'Koppány', 'Gyula'],
        female: ['Gizella', 'Anastasia', 'Adelajda', 'Judith', 'Sophia', 'Euphemia', 'Agnes', 'Anna', 'Margit', 'Erzsébet', 'Konstancia', 'Jolenta', 'Kinga', 'Yolanda', 'Kunigunda', 'Viola', 'Klémencia', 'Katalin', 'Ilona', 'Mária'],
        surname: ['Árpád', 'Hunyadi', 'Szapolyai', 'Báthory', 'Nádasdy', 'Esterházy', 'Rákóczi', 'Zrínyi', 'Frangepán', 'Thurzó', 'Széchenyi', 'Csáky', 'Forgách', 'Pálffy', 'Erdődy', 'Zichy', 'Festetics', 'Károlyi', 'Andrássy', 'Apponyi']
    },
    POLISH_MEDIEVAL: {
        male: ['Bolesław', 'Casimir', 'Władysław', 'Mieszko', 'Leszek', 'Konrad', 'Henryk', 'Przemysł', 'Wacław', 'Ziemowit', 'Janusz', 'Siemowit', 'Trojden', 'Bolesław', 'Kazimierz', 'Sigismund', 'Stefan', 'Jan', 'Stanisław', 'Aleksander'],
        female: ['Jadwiga', 'Elżbieta', 'Anna', 'Katarzyna', 'Zofia', 'Barbara', 'Konstancja', 'Agnieszka', 'Małgorzata', 'Dorota', 'Krystyna', 'Urszula', 'Euphemia', 'Anastazja', 'Beatrycze', 'Cecylia', 'Helena', 'Marianna', 'Teresa', 'Franciszka'],
        surname: ['Jagiełło', 'Piast', 'Vasa', 'Sobieski', 'Poniatowski', 'Czartoryski', 'Potocki', 'Radziwiłł', 'Zamoyski', 'Lubomirski', 'Sapieha', 'Mniszech', 'Ossoliński', 'Tarnowski', 'Kmita', 'Górka', 'Kostka', 'Leszczyński', 'Wiśniowiecki', 'Sanguszko']
    },
    // Modern Central European names (20th century)
    CZECH_MODERN: {
        male: ['Jan', 'Petr', 'Josef', 'Pavel', 'Martin', 'Tomáš', 'Jaroslav', 'František', 'Miroslav', 'Václav', 'Karel', 'Milan', 'Jiří', 'Zdeněk', 'Vladimír', 'Stanislav', 'Michal', 'Lukáš', 'David', 'Ondřej'],
        female: ['Marie', 'Jana', 'Eva', 'Anna', 'Hana', 'Lenka', 'Alena', 'Kateřina', 'Věra', 'Petra', 'Lucie', 'Jaroslava', 'Jitka', 'Helena', 'Ludmila', 'Zdeňka', 'Ivana', 'Monika', 'Tereza', 'Martina'],
        surname: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pospíšil', 'Marek', 'Pokorný', 'Hájek', 'Král', 'Jelínek', 'Růžička', 'Beneš', 'Fiala', 'Sedláček']
    },
    SLOVAK_MODERN: {
        male: ['Ján', 'Peter', 'Jozef', 'Štefan', 'Milan', 'Tomáš', 'Miroslav', 'Pavol', 'Martin', 'Michal', 'Lukáš', 'Andrej', 'Vladimír', 'Igor', 'Roman', 'Marek', 'Dušan', 'Branislav', 'Radoslav', 'Daniel'],
        female: ['Mária', 'Anna', 'Zuzana', 'Eva', 'Katarína', 'Jana', 'Elena', 'Monika', 'Viera', 'Martina', 'Ivana', 'Lucia', 'Gabriela', 'Alžbeta', 'Lenka', 'Andrea', 'Simona', 'Daniela', 'Barbora', 'Michaela'],
        surname: ['Horváth', 'Kováč', 'Varga', 'Tóth', 'Nagy', 'Baláž', 'Szabó', 'Molnár', 'Novák', 'Kočiš', 'Lukáč', 'Hudák', 'Pavlík', 'Gašpar', 'Marko', 'Jankovič', 'Krajčík', 'Urban', 'Šimko', 'Pavelka']
    },
    POLISH_MODERN: {
        male: ['Jan', 'Stanisław', 'Andrzej', 'Józef', 'Tadeusz', 'Jerzy', 'Zbigniew', 'Krzysztof', 'Henryk', 'Ryszard', 'Kazimierz', 'Marek', 'Marian', 'Piotr', 'Janusz', 'Władysław', 'Adam', 'Wiesław', 'Zdzisław', 'Edward'],
        female: ['Maria', 'Krystyna', 'Anna', 'Barbara', 'Teresa', 'Elżbieta', 'Janina', 'Zofia', 'Jadwiga', 'Danuta', 'Halina', 'Irena', 'Ewa', 'Małgorzata', 'Helena', 'Grażyna', 'Bożena', 'Stanisława', 'Jolanta', 'Urszula'],
        surname: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Wojciechowski', 'Kwiatkowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski']
    },
    YUGOSLAV: {
        male: ['Milan', 'Dragan', 'Zoran', 'Goran', 'Slobodan', 'Predrag', 'Nenad', 'Aleksandar', 'Vladimir', 'Branislav', 'Miloš', 'Marko', 'Stefan', 'Nikola', 'Petar', 'Đorđe', 'Radovan', 'Miroslav', 'Bojan', 'Dejan'],
        female: ['Milica', 'Jelena', 'Ana', 'Marija', 'Dragana', 'Snežana', 'Gordana', 'Ljiljana', 'Vesna', 'Biljana', 'Zorica', 'Slavica', 'Radmila', 'Mirjana', 'Nada', 'Vera', 'Dušanka', 'Milena', 'Svetlana', 'Branka'],
        surname: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Stanković', 'Pavlović', 'Milošević', 'Todorović', 'Ristić', 'Radovanović', 'Živković', 'Janković', 'Popović', 'Kostić', 'Mitić', 'Cvetković', 'Lazarević']
    },
    EAST_GERMAN: {
        male: ['Hans', 'Klaus', 'Werner', 'Günter', 'Dieter', 'Horst', 'Jürgen', 'Helmut', 'Gerhard', 'Wolfgang', 'Rolf', 'Bernd', 'Manfred', 'Uwe', 'Peter', 'Frank', 'Thomas', 'Andreas', 'Michael', 'Matthias'],
        female: ['Ingrid', 'Helga', 'Ursula', 'Renate', 'Monika', 'Karin', 'Brigitte', 'Gisela', 'Christa', 'Erika', 'Hannelore', 'Angelika', 'Petra', 'Sabine', 'Gabriele', 'Heike', 'Birgit', 'Martina', 'Katrin', 'Anja'],
        surname: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann']
    },
    BOHEMIAN: {
        male: ['Václav', 'Boleslav', 'Vratislav', 'Břetislav', 'Spytihněv', 'Otakar', 'Karel', 'Jan', 'Václav', 'Sigismund', 'Ladislav', 'Jiří', 'Ferdinand', 'Rudolf', 'Matyáš', 'Ferdinand'],
        female: ['Ludmila', 'Doubravka', 'Božena', 'Gerberga', 'Svatava', 'Adelheid', 'Judita', 'Kunhuta', 'Eliška', 'Anna', 'Alžběta', 'Barbora', 'Johanka', 'Markéta', 'Kateřina', 'Marie'],
        surname: ['Přemyslovec', 'Lucemburský', 'Habsburský', 'Rožmberk', 'Hradec', 'Lobkowicz', 'Pernštejn', 'Smiřický', 'Waldstein', 'Černín', 'Kinský', 'Clam-Gallas', 'Colloredo', 'Thun', 'Martinitz', 'Sternberg', 'Schlick', 'Berka', 'Vrtba', 'Nostitz']
    },
    ARMENIAN: {
        male: ['Aram', 'Armen', 'Ashot', 'Davit', 'Gagik', 'Gevorg', 'Garegin', 'Haig', 'Hovhannes', 'Krikor', 'Levon', 'Manuk', 'Mesrop', 'Nerses', 'Ohan', 'Parsegh', 'Ruben', 'Sarkis', 'Stepan', 'Vahram'],
        female: ['Anahit', 'Armine', 'Astghik', 'Gayane', 'Hripsime', 'Karine', 'Lena', 'Maro', 'Nairi', 'Nvard', 'Olga', 'Ripsime', 'Siran', 'Sona', 'Srpuhi', 'Taline', 'Vartanoush', 'Yeghisapet', 'Zaven', 'Zara'],
        surname: ['Karapetian', 'Hovhannessian', 'Parseghian', 'Aramian', 'Ghazarian', 'Keshishian', 'Manukian', 'Nazarian', 'Papazian', 'Sarkissian', 'Tavitian', 'Vartanian', 'Yacobian', 'Zakarian', 'Balabanian', 'Daoudian', 'Gulbenkian', 'Hagopian', 'Kaloustian', 'Mikaelian']
    },
    GEORGIAN: {
        male: ['Giorgi', 'Levan', 'Irakli', 'Davit', 'Aleksandre', 'Mamuka', 'Zurab', 'Mikheil', 'Vakhtang', 'Guram', 'Konstantine', 'Archil', 'Gocha', 'Gia', 'Beka', 'Lado', 'Nika', 'Tornike', 'Saba', 'Lasha'],
        female: ['Nana', 'Tamar', 'Nino', 'Maia', 'Ketevan', 'Mariam', 'Salome', 'Sopho', 'Eka', 'Ana', 'Nato', 'Rusudan', 'Elene', 'Manana', 'Lika', 'Nutsa', 'Tinatin', 'Darejan', 'Gulnara', 'Nestan'],
        surname: ['Georgievich', 'Dadiani', 'Bagrationi', 'Orbeliani', 'Eristavi', 'Amilakhvari', 'Tsereteli', 'Chavchavadze', 'Andronikashvili', 'Avalishvili', 'Baratashvili', 'Djaparidze', 'Gabashvili', 'Jorjadze', 'Khimshiashvili', 'Machabeli', 'Nakashidze', 'Palavandishvili', 'Sumbatashvili', 'Zubashvili']
    },

    // === EAST ASIAN SUB-GROUPS ===
    JAPANESE: { 
        male: ['Kenji', 'Haru', 'Akira', 'Daichi', 'Hiroshi', 'Takeda', 'Nobu', 'Hideo', 'Ichiro', 'Jiro', 'Kazuo', 'Masato', 'Naoki', 'Osamu', 'Ryuu', 'Satoshi', 'Tadashi', 'Wataru', 'Yasuo', 'Yuuki', 'Mamoru', 'Minoru', 'Shigeru', 'Takumi', 'Hayato', 'Katsuki', 'Ryo', 'Shin', 'Taiga', 'Yuma'],
        female: ['Yuki', 'Hana', 'Sakura', 'Rin', 'Aiko', 'Chiyo', 'Emiko', 'Fumiko', 'Haruka', 'Izumi', 'Junko', 'Kumiko', 'Machiko', 'Noriko', 'Reiko', 'Satomi', 'Tomoko', 'Yuriko', 'Akiko', 'Midori', 'Asuka', 'Ayumi', 'Emi', 'Kaori', 'Miki', 'Nana', 'Risa', 'Sayuri', 'Takako', 'Yoko'],
        surname: ['Tanaka', 'Sato', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Saito', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujita']
    },
    CHINESE_MANDARIN: {
        male: ['Wei', 'Bao', 'An', 'Hao', 'Jian', 'Long', 'Ming', 'Feng', 'Gang', 'Hui', 'Jun', 'Lei', 'Peng', 'Qiang', 'Tao', 'Xin', 'Yang', 'Zhang', 'Bin', 'Chao', 'Dong', 'Fang', 'Guang', 'Hong', 'Jin', 'Kai', 'Li', 'Meng', 'Ning', 'Ping'],
        female: ['Mei', 'Lien', 'Xiao', 'Jia', 'Ling', 'Nuo', 'Ai', 'Hua', 'Juan', 'Li', 'Min', 'Na', 'Ping', 'Qin', 'Rui', 'Shan', 'Ting', 'Wan', 'Xia', 'Yan', 'Yun', 'Zhen', 'Fang', 'Hong', 'Jing', 'Lan', 'Meng', 'Ning', 'Qing', 'Xue'],
        surname: ['Li', 'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo', 'Zheng', 'Liang', 'Xie', 'Song', 'Tang', 'Xu', 'Deng', 'Han', 'Feng', 'Cao']
    },
    CHINESE_CANTONESE: {
        male: ['Wai', 'Ho', 'Fai', 'Wing', 'Chi', 'Man', 'Kin', 'Lok', 'Cheung', 'Kwok', 'Ming', 'Shing', 'Chun', 'Ka', 'Pak', 'Siu', 'Tsz', 'Yiu', 'Ching', 'Hang', 'Hin', 'Hoi', 'Hok', 'Hon', 'Hung', 'Jim', 'Kai', 'Kit', 'Kwan', 'Lam'],
        female: ['Wing', 'Mei', 'Yuk', 'Yan', 'Pui', 'Ling', 'Ka', 'Siu', 'Yee', 'Man', 'Wai', 'Lai', 'Ying', 'Ching', 'Gigi',  'Yoyo'],
        surname: ['Chan', 'Leung', 'Wong', 'Li', 'Cheung', 'Lau', 'Ho', 'Mak', 'Ng', 'Ma', 'Lam', 'Fung', 'Chow', 'Yip', 'Tsang', 'Chui', 'Shek', 'Poon', 'Man', 'Lo', 'Yuen', 'Kwan', 'Mok', 'Pang', 'Tang', 'Tse', 'Tsoi', 'Wan', 'Yeung', 'Yiu']
    },
    // Ancient Korean names (Three Kingdoms period: 57 BCE - 668 CE)
    KOREAN_ANCIENT: {
        male: ['Geoseogan', 'Yuri', 'Ilseong', 'Adalla', 'Beolhyu', 'Naehae', 'Jobun', 'Cheomhae', 'Michu', 'Yurye', 'Girim', 'Heulhae', 'Sinmu', 'Naemul', 'Silseong', 'Nulji', 'Jabi', 'Soji', 'Maripgan', 'Beopheung', 'Jinheung', 'Jinji', 'Jinpyeong', 'Seondeok', 'Jindeok'],
        female: ['Seondeok', 'Jindeok', 'Jinseong', 'Aro', 'Wonhwa', 'Mishil', 'Mojiak', 'Banya', 'Deokmyeong', 'Cheonmyeong', 'Bohwa', 'Seungman', 'Jiso', 'Munhui', 'Oji', 'Seolhwa', 'Yeonhwa', 'Sohwa', 'Hwangok', 'Wolmyeong'],
        surname: ['Gim', 'Seok', 'Bak', 'Go', 'Buyeo', 'Hae', 'Gyeru', 'So', 'Yeon', 'Myeong', 'Jin', 'Wang', 'Yu', 'Gwon', 'Choe']
    },
    KOREAN: {
        male: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ha-jun', 'Eun-woo', 'Si-woo', 'Jun-seo', 'Ye-jun', 'Ji-ho', 'In-ho', 'Seung-woo', 'Hyun-woo', 'Jin-woo', 'Tae-hyun', 'Dong-hyun', 'Woo-jin', 'Chan-ho', 'Jae-min', 'Kyung-ho', 'Sang-ho', 'Young-soo', 'Min-ho', 'Joon-ho', 'Sung-min', 'Chang-ho', 'Kwang-soo', 'Hyung-min', 'Dae-hyun', 'Jun-ho', 'Seok-jin'],
        female: ['Ji-hye', 'Seo-yeon', 'Ha-eun', 'Ji-woo', 'Min-seo', 'So-yeon', 'Yoo-jin', 'Chae-won', 'Ga-eun', 'Ye-eun', 'Su-bin', 'Yu-na', 'Hye-jin', 'Eun-ji', 'Da-eun', 'Na-eun', 'Soo-jin', 'Min-ji', 'Ye-jin', 'Hyo-jin', 'Bo-ram', 'Hae-won', 'Ji-min', 'Seo-hyun', 'Yeon-seo', 'Ah-young', 'So-young', 'Hye-won', 'Jin-ah', 'Mi-young'],
        surname: ['Kim', 'Lee', 'Park', 'Choi', 'Jeong', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Jeon', 'Go', 'Moon', 'Yang', 'Baek', 'Heo', 'Nam', 'Shim', 'Ryu', 'Min']
    },
   
    MONGOLIAN: {
        male: ['Batbayar', 'Batmunkh', 'Battulga', 'Bold', 'Chinbat', 'Dorj', 'Erdene', 'Ganbat', 'Munkhbat', 'Otgonbayar', 'Purevdorj', 'Saikhan', 'Temujin', 'Tuguldur', 'Batkhuu', 'Byambaa', 'Gantulga', 'Khashbat', 'Munkhjargal', 'Naranbaatar', 'Ochirbal', 'Sukhbaatar', 'Tsogtbaatar', 'Ulziibayar', 'Zoljargal', 'Altangerel', 'Batsaikhan', 'Chinzorig', 'Dolgorsuren', 'Enkhbayar'],
        female: ['Altantsetseg', 'Battsetseg', 'Bolormaa', 'Enkhjargal', 'Gereltuya', 'Khaliun', 'Mandukhai', 'Narangerel', 'Oyunaa', 'Purevjav', 'Saikhantuya', 'Tsagaan', 'Ulaankhuu', 'Yesuntei', 'Altantuya', 'Bayarmaa', 'Chinbayar', 'Enkhtsetseg', 'Gansukh', 'Iderkhuu', 'Jargalmaa', 'Khongoroo', 'Munkhjin', 'Otgontsetseg', 'Sukhgerel', 'Tugsuu', 'Uranchimeg', 'Urantuya', 'Zolzaya', 'Ankhbayar'],
        surname: ['Bat', 'Bold', 'Byamba', 'Chinggis', 'Dolgoon', 'Erdene', 'Ganbold', 'Khuu', 'Munkh', 'Otgon', 'Purev', 'Saikhan', 'Temur', 'Tuul', 'Ulaan', 'Zaya', 'Altai', 'Baigal', 'Choijin', 'Doljin', 'Enkhbold', 'Gantulga', 'Javkhlan', 'Munkhjin', 'Naran', 'Oyunbat', 'Sainbayar', 'Tengis', 'Unurbat', 'Zorigbat']
    },
    TIBETAN: {
        male: ['Tenzin', 'Dorje', 'Lobsang', 'Pasang', 'Sonam', 'Karma', 'Tsering', 'Wangdu', 'Dhondup', 'Gyatso', 'Jampa', 'Norbu', 'Phuntsok', 'Rigzin', 'Sangye', 'Thupten', 'Yeshe', 'Chime', 'Dawa', 'Gyalpo', 'Jigme', 'Kalsang', 'Lhamo', 'Migmar', 'Namgyal', 'Palden', 'Rabten', 'Samten', 'Trinley', 'Urgyen'],
        female: ['Dolma', 'Pema', 'Dekyi', 'Yangchen', 'Nyima', 'Choden', 'Lhakpa', 'Tashi', 'Yangzom', 'Dechen', 'Kunsang', 'Lhamo', 'Metok', 'Norzin', 'Palmo', 'Rigdzin', 'Samten', 'Tsomo', 'Yeshe', 'Zangmo', 'Ani', 'Choying', 'Diki', 'Jamyang', 'Kundol', 'Mingma', 'Ngawang', 'Pemba', 'Sangyum', 'Wangmo'],
        surname: ['Dorje', 'Gyatso', 'Norbu', 'Tenzin', 'Wangchuk', 'Lhundup', 'Rinchen', 'Sonam', 'Tsering', 'Dondrup', 'Phuntsok', 'Namgyal', 'Chodon', 'Lhakpa', 'Palden', 'Samdup', 'Yeshe', 'Choedon', 'Dhondup', 'Jigme', 'Kunsang', 'Lobsang', 'Migmar', 'Nyima', 'Pemba', 'Rabten', 'Sangye', 'Thupten', 'Urgyen', 'Wangmo']
    },
    MANCHU: {
        male: ['Hongtaiji', 'Nurhaci', 'Dorgon', 'Yoto', 'Jirgalang', 'Hooge', 'Daišan', 'Amin', 'Manggūltai', 'Ajige', 'Dodo', 'Fŭlin', 'Sŭksaha', 'Oboi', 'Soni', 'Ebilung', 'Muksike', 'Tanggu', 'Fiyanggu', 'Šangse', 'Niyaha', 'Bahana', 'Giocangga', 'Fuman', 'Širhošu', 'Tungga', 'Hada', 'Yehe', 'Hoifa', 'Ula'],
        female: ['Bumbutai', 'Jerjer', 'Xiaozhuang', 'Donggo', 'Sumala', 'Borjigit', 'Niohuru', 'Heseri', 'Tatara', 'Tunggiya', 'Yehe', 'Nara', 'Fuca', 'Guwalgiya', 'Uya', 'Niuhuru', 'Sakda', 'Irgen', 'Magiya', 'Silin', 'Šurhaci', 'Fiyanggū', 'Ujara', 'Hifu', 'Solgo', 'Jifi', 'Mukūšu', 'Šuduri', 'Tulai', 'Bujantai'],
        surname: ['Aisin Gioro', 'Niohuru', 'Heseri', 'Tunggiya', 'Yehe Nara', 'Fuca', 'Guwalgiya', 'Tatara', 'Donggo', 'Borjigit', 'Uya', 'Sakda', 'Irgen', 'Magiya', 'Šumuru', 'Jalafun', 'Gioro', 'Šušu', 'Šarha', 'Wangga', 'Čengguari', 'Jušeri', 'Ujara', 'Suwan', 'Šokui', 'Hafan', 'Gorolo', 'Irgenggioro', 'Balda', 'Hölhošun']
    },
    UYGHUR: {
        male: ['Abdukerim', 'Abdurehim', 'Alim', 'Arslan', 'Ayup', 'Dilmurat', 'Ehmet', 'Enwer', 'Halmurat', 'Hebibulla', 'Ismayil', 'Kasim', 'Mahmut', 'Memet', 'Muhtar', 'Nijat', 'Nurmemet', 'Osman', 'Qadir', 'Rahmetullah', 'Seyyit', 'Tursun', 'Uyghur', 'Yasin', 'Yusup', 'Abdulla', 'Alimjan', 'Azat', 'Erkin', 'Gheni'],
        female: ['Ayxem', 'Dilber', 'Gülnar', 'Hörgül', 'Jamalya', 'Kamila', 'Letipe', 'Mahire', 'Nazugum', 'Parida', 'Rabiye', 'Sabirjan', 'Tursungül', 'Ümütjan', 'Yasmingül', 'Zöhre', 'Aynur', 'Dilnur', 'Gülanar', 'Hesret', 'Jelile', 'Ketencik', 'Mihray', 'Nurzat', 'Perhat', 'Rehime', 'Sumbul', 'Türkangül', 'Zulpiya', 'Ayshe'],
        surname: ['Abdulla', 'Ahmet', 'Alim', 'Dilmurat', 'Ehmetjan', 'Gheni', 'Halmurat', 'Ismayil', 'Kasim', 'Mahmut', 'Nurmemet', 'Osman', 'Qadir', 'Rahman', 'Seyyit', 'Tursun', 'Uyghur', 'Yasin', 'Yusup', 'Abdukerim', 'Arslan', 'Azat', 'Erkin', 'Hebibulla', 'Muhtar', 'Nijat', 'Rahmetullah', 'Tashpolat', 'Zunun', 'Ilham']
    },

    // === MENA SUB-GROUPS ===
    ARABIC_LEVANT: { 
        male: ['Ahmad', 'Omar', 'Yusuf', 'Ali', 'Mohammed', 'Hassan', 'Khaled', 'Ibrahim', 'Mahmoud', 'Abdallah', 'Marwan', 'Sami', 'Tareq', 'Walid', 'Ziad', 'Amjad', 'Bashar', 'Fadi', 'Ghassan', 'Jihad', 'Karim', 'Nabil', 'Rami', 'Samir', 'Wael', 'Yazan', 'Adel', 'Basel', 'Diyaa', 'Emad'],
        female: ['Fatima', 'Layla', 'Aisha', 'Zainab', 'Mariam', 'Noor', 'Farah', 'Yasmin', 'Hala', 'Rana', 'Reem', 'Sara', 'Dina', 'Jana', 'Lina', 'Maya', 'Rania', 'Salam', 'Widad', 'Yara', 'Abeer', 'Bushra', 'Ghada', 'Hanadi', 'Iman', 'Jumana', 'Khadija', 'Lara', 'Maha', 'Nadia'],
        surname: ['Haddad', 'Nasser', 'Masri', 'Khoury', 'Shami', 'Tahan', 'Khalil', 'Mansour', 'Qasemi', 'Rahhal', 'Sabbagh', 'Tannus', 'Bitar', 'Dahhan', 'Farah', 'Ghannam', 'Hamdan', 'Jarrar', 'Khouri', 'Maalouf', 'Najjar', 'Qaddoura', 'Rizk', 'Saab', 'Tarazi', 'Wakim', 'Yamak', 'Zreik', 'Aboud', 'Diab']
    },
    PERSIAN_FARSI: {
        male: ['Arash', 'Babak', 'Cyrus', 'Darius', 'Kian', 'Rostam', 'Farhad', 'Kaveh', 'Omid', 'Siavash', 'Shahriar', 'Jamshid', 'Kamran', 'Farzad', 'Hooman', 'Saeed', 'Navid', 'Reza', 'Behzad', 'Keyvan', 'Masoud', 'Parviz', 'Shahram', 'Touraj', 'Vahid', 'Bijan', 'Fariborz', 'Hossein', 'Majid', 'Sohrab'],
        female: ['Anahita', 'Roya', 'Yasmin', 'Roxana', 'Soraya', 'Parisa', 'Golnar', 'Shirin', 'Maryam', 'Nasrin', 'Shahrzad', 'Farah', 'Laleh', 'Mahsa', 'Niloufar', 'Pardis', 'Setareh', 'Taraneh', 'Nava', 'Zohreh', 'Bahar', 'Darya', 'Goli', 'Homa', 'Irana', 'Yara', 'Mitra', 'Nazanin', 'Pegah', 'Samira'],
        surname: ['Rostami', 'Khorasani', 'Yazdi', 'Isfahani', 'Tabrizi', 'Shirazi', 'Mashhadi', 'Tehrani', 'Ahvazi', 'Kermani', 'Rasht', 'Qomi', 'Hamadani', 'Kashani', 'Ardebili', 'Bandar', 'Dezfuli', 'Gorgan', 'Ilami', 'Jahrom', 'Kashan', 'Lorestan', 'Mazandaran', 'Najaf', 'Orumiyeh', 'Parsian', 'Qazvin', 'Rafsanjan', 'Sanandaj', 'Urmia', 'Pakzad']
    },
    TURKISH: {
        male: ['Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'İbrahim', 'İsmail', 'Ömer', 'Osman', 'Süleyman', 'Yusuf', 'Kemal', 'Fatih', 'Emre', 'Burak', 'Murat', 'Serkan', 'Tolga', 'Cem', 'Deniz', 'Erkan', 'Gökhan', 'Hakan', 'Onur', 'Özkan', 'Selim', 'Taner', 'Volkan', 'Yakup'],
        female: ['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Merve', 'Özge', 'Büşra', 'Gizem', 'Selin', 'Çiğdem', 'Derya', 'Esra', 'Gonca', 'Hülya', 'İrem', 'Kübra', 'Leyla', 'Melike', 'Neslihan', 'Pınar', 'Sevgi', 'Tuba', 'Ülkü', 'Yasemin', 'Asiye', 'Burcu', 'Dilek', 'Filiz'],
        surname: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydin', 'Özdemir', 'Arslan', 'Doğan', 'Kilic', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Erdoğan', 'Güneş', 'Aksu', 'Bayram', 'Çakır', 'Duman', 'Erdem', 'Güler', 'Kılıç', 'Polat']
    },
   HEBREW: {
     male: [
       "Yehoshua","Yehudah","Yosef","Moshe","Yitzhak","Yaakov","Shlomo","Shimon","Reuven","Ephraim",
       "Menashe","Eliyahu","Yonatan","Shmuel","Natan","Baruch","Eleazar","Hillel","Gamaliel","Hananiah",
       "Uriel","Azariah","Tobiah","Naftali","Zadok","Obadiah","Amram","Netanel","Yoel","Simeon"
     ],
     female: [
       "Sarah","Rivka","Rachel","Leah","Miriam","Esther","Ruth","Tamar","Avigail","Channah",
       "Devorah","Yehudit","Batsheva","Michal","Dinah","Yael","Tzipporah","Batya","Elisheva","Huldah",
       "Serah","Asenath","Shulamit","Keturah","Keziah","Ada","Orpah","Salome","Yaffa","Nava"
     ],
     surname: [
       "Cohen","HaCohen","Levi","HaLevi","benYosef","benAvraham","benDavid","benShimon","IbnEzra","IbnGabirol",
       "Alfasi","Abravanel","Benveniste","Maimon","Karo","Pardo","Toledano","Farhi","Najar","IbnDanan",
       "Dayan","Gabbai","Katzin","BenEzra","BenHayyim","Almog","Najara","Sepharadi",
       "Toledano","Abravaneli"
     ]
   },
    BERBER_AMAZIGH: {
        male: ['Amellal', 'Azru', 'Ifri', 'Lmahdi', 'Massinissa', 'Yuba', 'Azalay', 'Itri', 'Tamazight', 'Akli', 'Amyas', 'Azwaw', 'Dihya', 'Gaya', 'Matoub', 'Meziane', 'Mohand', 'Ouali', 'Slimane', 'Youcef', 'Amayas', 'Ameziane', 'Aqvayli', 'Aurassi', 'Azayku', 'Azegzaw', 'Azelmad', 'Azelmat', 'Azemour', 'Azeryul'],
        female: ['Dihya', 'Tafukt', 'Tilelli', 'Yemma', 'Tislit', 'Taqbaylit', 'Thilleli', 'Wardia', 'Yelli', 'Zahra', 'Tasa', 'Tamurt', 'Tafrawt', 'Takfarinas', 'Tamazight', 'Taneqqust', 'Targia', 'Tasekkurt', 'Tawenza', 'Taziri', 'Thiziri', 'Tifawt', 'Tilla', 'Tilleli', 'Tinhinan', 'Tiska', 'Tiziri', 'Ulac', 'Warda', 'Yemma'],
        surname: []
    },

    // === PHASE 1 HIGH-IMPACT REGIONAL ADDITIONS ===

    // Venetian Republic (9th-18th century) - Major Mediterranean trade power
    VENETIAN_MEDIEVAL: {
        male: ['Marco', 'Andrea', 'Francesco', 'Giovanni', 'Nicolò', 'Pietro', 'Alvise', 'Giacomo', 'Domenico', 'Lorenzo', 'Sebastiano', 'Antonio', 'Bernardo', 'Matteo', 'Zuane', 'Marin', 'Zorzi', 'Luca', 'Michiel', 'Piero', 'Alvise', 'Cristoforo', 'Bartolomeo', 'Hieronimo', 'Tomaso', 'Vicenzo', 'Zaccaria', 'Benedetto', 'Stefano', 'Agostino'],
        female: ['Caterina', 'Elena', 'Lucrezia', 'Bianca', 'Francesca', 'Elisabetta', 'Marietta', 'Andriana', 'Chiara', 'Paola', 'Violante', 'Cornelia', 'Modesta', 'Isabetta', 'Anzola', 'Diamante', 'Orsa', 'Costanza', 'Cassandra', 'Laura', 'Marina', 'Cecilia', 'Maddalena', 'Agnesina', 'Zanetta', 'Betta', 'Faustina', 'Helisabetta', 'Margarita', 'Veronica'],
        surname: ['Mocenigo', 'Contarini', 'Dandolo', 'Foscari', 'Gritti', 'Loredan', 'Morosini', 'Pesaro', 'Querini', 'Sagredo', 'Sanudo', 'Soranzo', 'Tron', 'Vendramin', 'Venier', 'Zeno', 'Barbarigo', 'Bembo', 'Bernardo', 'Bragadin', 'Cappello', 'Corner', 'Dolfin', 'Emo', 'Falier', 'Giustinian', 'Grimani', 'Malipiero', 'Marcello', 'Pisani']
    },

    // Moorish Al-Andalus (711-1492 CE) - Islamic Iberia
    MOORISH_ANDALUS: {
        male: ['Abd al-Rahman', 'Muhammad', 'Ahmad', 'Ali', 'Yusuf', 'Ibrahim', 'Ismail', 'Hakim', 'Tariq', 'Musa', 'Umar', 'Hasan', 'Abd Allah', 'Sulayman', 'Yahya', 'Idris', 'Marwan', 'Qasim', 'Rashid', 'Salim', 'Zakariya', 'Mansur', 'Nasr', 'Abd al-Malik', 'Hisham', 'Walid', 'Abd al-Aziz', 'Habib', 'Khalid', 'Sa\'id'],
        female: ['Fatima', 'Aisha', 'Khadija', 'Zaynab', 'Mariam', 'Safiyya', 'Umm Kulthum', 'Ruqayya', 'Hafsa', 'Sawda', 'Maymuna', 'Zahra', 'Wallada', 'Muhja', 'Nazhun', 'Umm al-Hana', 'Lubna', 'Radi\'a', 'Shuhda', 'Qamar', 'Thuraya', 'Buthayna', 'Hind', 'Layla', 'Su\'ad', 'Aminah', 'Asma', 'Salma', 'Umayma', 'Widad'],
        surname: ['al-Andalusi', 'al-Qurtubi', 'al-Ishbili', 'al-Gharnati', 'al-Balansiy', 'al-Tulaytuli', 'ibn Rushd', 'ibn Sina', 'ibn Hazm', 'ibn Arabi', 'al-Zarqali', 'ibn Bajja', 'ibn Tufayl', 'al-Idrisi', 'ibn Quzman', 'al-Shushtari', 'ibn Malik', 'al-Rundi', 'ibn Abbad', 'al-Lakhmi', 'ibn Masarra', 'al-Majriti', 'ibn al-Khatib', 'al-Shaqundi', 'ibn Firnas', 'al-Himyari', 'ibn Zuhr', 'al-Bitruji', 'ibn Baqi', 'al-Mursi']
    },

    // Byzantine Empire (330-1453 CE) - Eastern Roman continuation
    BYZANTINE_GREEK: {
        male: ['Konstantinos', 'Ioannes', 'Mikhael', 'Basileios', 'Theodoros', 'Nikephoros', 'Alexios', 'Isaakios', 'Stephanos', 'Georgios', 'Demetrios', 'Nikolas', 'Anastasios', 'Prokopios', 'Maximos', 'Leon', 'Romanos', 'Photios', 'Ignatios', 'Athanasios', 'Chrysostomos', 'Methodios', 'Kyrillos', 'Dionysios', 'Euthymios', 'Kallinikos', 'Leontios', 'Markianos', 'Nikandros', 'Philotheos'],
        female: ['Anna', 'Maria', 'Theodora', 'Irene', 'Eudokia', 'Zoe', 'Konstantina', 'Aikaterine', 'Euphemia', 'Helena', 'Sophia', 'Anastasia', 'Barbara', 'Kyriaki', 'Paraskevi', 'Agatha', 'Evdokia', 'Thomais', 'Xene', 'Kalomaria', 'Pelagia', 'Theodosia', 'Chryse', 'Eugenia', 'Gregoria', 'Ioanna', 'Kale', 'Magdalene', 'Nektaria', 'Olympia'],
        surname: ['Paleologos', 'Komnenos', 'Doukas', 'Kantakouzenos', 'Laskaris', 'Angelos', 'Botaneiates', 'Dalassenos', 'Skleros', 'Phokas', 'Argyros', 'Kourkouas', 'Tzykandyles', 'Tornikios', 'Bryennios', 'Diogenes', 'Botaneiates', 'Maleinos', 'Xiphias', 'Bourtzes', 'Kamytzes', 'Melissenos', 'Nikephoros', 'Palaiologina', 'Raoul', 'Synadenos', 'Tarchaneiotes', 'Vatatztes', 'Xeros', 'Zarides']
    },

    // Khmer Empire/Angkor Period (802-1431 CE) - Southeast Asian temple civilization
    KHMER_ANGKOR: {
        male: ['Jayavarman', 'Suryavarman', 'Indravarman', 'Udayadityavarman', 'Harshavarman', 'Rajendravarman', 'Yashovarman', 'Tribhuvanadityavarman', 'Preah Ket Mealea', 'Nirvanapada', 'Kavindrarimathana', 'Jaya Indravarman', 'Srindravarman', 'Dharanindravarman', 'Paramavishnuloka', 'Kambu', 'Preah Thong', 'Kaundinya', 'Rudravarman', 'Bhavavarman', 'Mahendravarman', 'Isanavarman', 'Pushkaraksha', 'Sambhuvarman', 'Jayadevi', 'Chitrasena', 'Mahendraparvata', 'Aninditapura', 'Banteay Prei', 'Srei Santhor'],
        female: ['Jayarajadevi', 'Indradevi', 'Kulaprabhavatikalai', 'Rajacudamani', 'Jayarajacudamani', 'Tribhuvaneshvari', 'Parameshvaralakshmi', 'Chudamani', 'Aparajita', 'Lakshmindralakshmi', 'Vijayalakshmi', 'Kamalesvaridevi', 'Ripusuddhi', 'Kambu', 'Mera', 'Soma', 'Neang Neak', 'Willow', 'Peou', 'Pich', 'Sophea', 'Chenda', 'Devi', 'Kanya', 'Lavea', 'Molica', 'Pisey', 'Rachana', 'Socheat', 'Tevy'],
        surname: ['(No Surname)', 'of Angkor', 'of Yashodharapura', 'of Hariharalaya', 'of Roluos', 'of Banteay Srei', 'of Preah Vihear', 'of Koh Ker', 'of Baphuon', 'of Bayon', 'of Ta Prohm', 'of Banteay Kdei', 'of Neak Pean', 'of East Mebon', 'of Pre Rup', 'of Srah Srang', 'of Phnom Bakheng', 'of Baksei Chamkrong', 'of Prasat Kravan', 'of Bat Chum']
    },

    // === PHASE 2 REGIONAL REFINEMENTS ===

    // Flemish/Low Countries (12th-16th century) - Trade networks and textile centers
    FLEMISH_MEDIEVAL: {
        male: ['Willem', 'Jan', 'Pieter', 'Hendrik', 'Jacob', 'Dirk', 'Cornelis', 'Andries', 'Thomas', 'Joris', 'Michiel', 'Philips', 'Karel', 'Lodewijk', 'Rogier', 'Hans', 'Aert', 'Claes', 'Lieven', 'Maerten', 'Wouter', 'Franchoys', 'Gillis', 'Joos', 'Lancelot', 'Boudewijn', 'Reinout', 'Govaert', 'Adriaen', 'Jeronimus'],
        female: ['Margaretha', 'Elisabeth', 'Catharina', 'Anna', 'Maria', 'Jacoba', 'Johanna', 'Agnes', 'Barbara', 'Clara', 'Cornelia', 'Dorothea', 'Susanna', 'Petronella', 'Apollonia', 'Beatrijs', 'Lijsbeth', 'Machteld', 'Aleydis', 'Berta', 'Gheertruid', 'Heilwich', 'Ide', 'Katelijne', 'Lievine', 'Mayken', 'Neel', 'Tanneken', 'Vrouwe', 'Ysabeau'],
        surname: ['van der Meer', 'de Vries', 'van den Berg', 'Janssen', 'de Jong', 'van Dijk', 'Bakker', 'de Groot', 'van Houten', 'Smit', 'van der Linden', 'Mulder', 'de Wit', 'van der Heijden', 'van Leeuwen', 'van der Ven', 'Dekker', 'van den Broek', 'de Boer', 'van der Steen', 'van Beek', 'Verhagen', 'van der Poel', 'de Bruijn', 'van den Heuvel', 'Vermeulen', 'van der Werf', 'de Haan', 'van der Kamp', 'Timmermans']
    },

    // Catalan Medieval (10th-15th century) - Mediterranean commercial culture
    CATALAN_MEDIEVAL: {
        male: ['Ramon', 'Berenguer', 'Pere', 'Jaume', 'Arnau', 'Guillem', 'Bernat', 'Ferran', 'Joan', 'Miquel', 'Antoni', 'Francesc', 'Bartomeu', 'Lluís', 'Galceran', 'Guerau', 'Dalmau', 'Ponç', 'Berenguer', 'Gilabert', 'Huguet', 'Jacint', 'Llorenç', 'Mateu', 'Nicolau', 'Onofre', 'Pau', 'Quintí', 'Rafael', 'Salvador'],
        female: ['Elisenda', 'Violant', 'Constança', 'Sibil·la', 'Ermessenda', 'Almodis', 'Beatriu', 'Blanca', 'Caterina', 'Dolça', 'Elionor', 'Francesca', 'Guillemona', 'Isabel', 'Joana', 'Llúcia', 'Margarida', 'Núria', 'Petronila', 'Sança', 'Teresa', 'Urraca', 'Violant', 'Agnès', 'Alamanda', 'Benvinguda', 'Clara', 'Dulcia', 'Estefania', 'Guisla'],
        surname: ['de Barcelona', 'de Montcada', 'de Cabrera', 'de Cardona', 'de Foix', 'de Pallars', 'de Urgell', 'de Empúries', 'de Cervera', 'de Montpellier', 'de Narbona', 'de Besalú', 'de Girona', 'de Tarragona', 'de Lleida', 'de Valencia', 'de Mallorca', 'de Rosselló', 'de Cerdanya', 'de Ribagorça', 'de Peralada', 'de Castellbó', 'de Luna', 'de Centelles', 'de Requesens', 'de Vilanova', 'de Pinós', 'de Rocabertí', 'de Sagarriga', 'de Sentmenat']
    },

    // Thai Ayutthaya Kingdom (1351-1767 CE) - Southeast Asian kingdom period
    THAI_AYUTTHAYA: {
        male: ['Ramathibodi', 'Borommaracha', 'Ramesuan', 'Boromarachathirat', 'Intharacha', 'Borommatrailokkanat', 'Borommarachathirat', 'Ramathibodi', 'Chairacha', 'Yotfa', 'Prasat Thong', 'Chai', 'Si', 'Narai', 'Phetracha', 'Sua', 'Thai Sa', 'Borommakot', 'Uthumphon', 'Suriyamarin', 'Ekkathat', 'Taksin', 'Somdet', 'Chao Phraya', 'Luang', 'Khun', 'Nai', 'Phra', 'Thao', 'Muen'],
        female: ['Si Suriyothai', 'Wisutkasat', 'Suriyenthrathibodi', 'Thotsarot', 'Kalyanamitra', 'Thepsutthavadi', 'Amarindra', 'Sunandha', 'Saovabha', 'Dara Rasmi', 'Mom Chao', 'Phrachao', 'Somdet Phra', 'Chao', 'Khunying', 'Mom Luang', 'Mom Rajawongse', 'Thanpuying', 'Ying', 'Nang', 'Mae', 'Khun Mae', 'Phra Mae', 'Chao Mae', 'Somdet', 'Ratana', 'Sirikit', 'Chulabhorn', 'Ubolratana', 'Sirindhorn'],
        surname: ['Na Ayutthaya', 'Na Bangkok', 'Na Lopburi', 'Na Phitsanulok', 'Na Sukhothai', 'Na Chainat', 'Na Suphanburi', 'Na Ratchaburi', 'Na Phetchaburi', 'Na Nakhon Pathom', 'Na Kanchanaburi', 'Na Prachinburi', 'Na Chachoengsao', 'Na Nonthaburi', 'Na Samut Prakan', 'Na Samut Sakhon', 'Na Samut Songkhram', 'Na Nakhon Nayok', 'Na Pathum Thani', 'Na Ang Thong', 'Na Sing Buri', 'Na Chai Nat', 'Na Uthai Thani', 'Na Kamphaeng Phet', 'Na Tak', 'Na Phichit', 'Na Phetchabun', 'Na Nakhon Sawan', 'Na Lop Buri', 'Na Sara Buri']
    },

    // Mamluk Egypt (1250-1517 CE) - Medieval Islamic Egypt specificity
    MAMLUK_EGYPT: {
        male: ['Baibars', 'Qalawun', 'Khalil', 'Nasir', 'Ashraf', 'Salih', 'Aybak', 'Shajar', 'Turanshah', 'Faraj', 'Muayyad', 'Barsbay', 'Jaqmaq', 'Inal', 'Khushqadam', 'Bilbay', 'Timurbugha', 'Qansuh', 'Tuman', 'Janbalat', 'Azbak', 'Qurqumas', 'Yashbak', 'Aqbirdi', 'Sudun', 'Taghribirdi', 'Jakam', 'Altunbugha', 'Yalbugha', 'Shaykhu'],
        female: ['Shajar al-Durr', 'Fatima', 'Aisha', 'Zaynab', 'Khadija', 'Umm Kulthum', 'Safiyya', 'Hafsa', 'Ruqayya', 'Mariam', 'Asma', 'Salma', 'Layla', 'Aminah', 'Thurayya', 'Qamar', 'Najma', 'Sahar', 'Dalal', 'Widad', 'Siham', 'Nawal', 'Fawzia', 'Nazira', 'Samira', 'Tahira', 'Zahira', 'Bashira', 'Munira', 'Sakinah'],
        surname: ['al-Misri', 'al-Qahiri', 'al-Mamluki', 'al-Bahri', 'al-Burji', 'al-Turkumani', 'al-Circassi', 'al-Rumi', 'al-Shami', 'al-Halabi', 'al-Dimashqi', 'al-Ghazzi', 'ibn Tulun', 'ibn Qalawun', 'ibn Ayyub', 'al-Nasiri', 'al-Ashraf', 'al-Zahir', 'al-Salih', 'al-Kamil', 'al-Adil', 'al-Mansur', 'al-Muzaffar', 'al-Afdal', 'ibn Mammati', 'ibn Muyassar', 'ibn Wasil', 'ibn Shaddad', 'ibn Nazif', 'al-Maqrizi']
    },

    // === SOUTH ASIAN SUB-GROUPS ===
    // === EXPANDED SOUTH ASIAN ===
    SANSKRIT_CLASSICAL: {
        male: ['Arjuna', 'Bhima', 'Yudhishthira', 'Nakula', 'Sahadeva', 'Karna', 'Duryodhana', 'Bhishma', 'Drona', 'Krishna', 'Rama', 'Lakshmana', 'Bharata', 'Shatrughna', 'Hanuman', 'Ravana', 'Vibhishana', 'Sugriva', 'Vali', 'Indrajit'],
        female: ['Draupadi', 'Kunti', 'Gandhari', 'Sita', 'Radha', 'Rukmini', 'Satyabhama', 'Subhadra', 'Mandodari', 'Urmila', 'Satyavati', 'Ambika', 'Ambalika', 'Ganga', 'Savitri', 'Shakuntala', 'Damayanti', 'Lopamudra', 'Arundhati', 'Anasuya'],
        surname: ['Pandava', 'Kaurava', 'Bharata', 'Ikshvaku', 'Raghu', 'Yadava', 'Vrishni', 'Kuru', 'Puru', 'Anu']
    },
    DRAVIDIAN: {
        male: ['Selvam', 'Murugan', 'Karthik', 'Senthil', 'Kumaran', 'Arun', 'Bala', 'Durai', 'Ganesan', 'Hari', 'Jagan', 'Kannan', 'Mani', 'Nandhan', 'Pandian', 'Rajan', 'Siva', 'Thiru', 'Velan', 'Vimal'],
        female: ['Kavitha', 'Priya', 'Lakshmi', 'Meera', 'Nithya', 'Oviya', 'Padma', 'Radha', 'Sangeetha', 'Tamil', 'Uma', 'Vani', 'Yamini', 'Anjali', 'Bhavani', 'Chitra', 'Devi', 'Geetha', 'Indira', 'Jaya'],
        surname: ['Pillai', 'Nair', 'Menon', 'Iyer', 'Iyengar', 'Nadar', 'Reddy', 'Naidu', 'Mudaliar', 'Chettiar']
    },
    RAJPUT: {
        male: ['Prithviraj', 'Rana', 'Maharana', 'Rao', 'Raja', 'Kunwar', 'Thakur', 'Rawat', 'Bhupendra', 'Chandrabhan', 'Durgadas', 'Fateh', 'Gaj', 'Hammir', 'Jai', 'Karan', 'Lakshman', 'Man', 'Narendra', 'Om'],
        female: ['Padmini', 'Padmavati', 'Mira', 'Gayatri', 'Sanyogita', 'Jaishree', 'Karnavati', 'Durgavati', 'Tarabai', 'Ahilyabai', 'Avantibai', 'Bhagwati', 'Champavati', 'Hansabai', 'Jodhabai', 'Kishori', 'Lilavati', 'Manvati', 'Narbada', 'Roopmati'],
        surname: ['Sisodia', 'Rathore', 'Chauhan', 'Parmar', 'Solanki', 'Kachwaha', 'Bundela', 'Chandela', 'Gahlot', 'Bhati']
    },
    BENGALI_TRADITIONAL: {
        male: ['Rabindra', 'Debendra', 'Satyendra', 'Jogendra', 'Birendra', 'Surendra', 'Narendra', 'Upendra', 'Mahendra', 'Dhirendra', 'Subrata', 'Sourav', 'Pranab', 'Amartya', 'Buddhadeb', 'Jyoti', 'Mamata', 'Manoj', 'Tapan', 'Utpal'],
        female: ['Sharmila', 'Aparna', 'Supriya', 'Rituparna', 'Moushumi', 'Konkona', 'Raima', 'Tanushree', 'Bipasha', 'Sushmita', 'Aishwarya', 'Kajol', 'Rani', 'Jaya', 'Sharmistha', 'Ananya', 'Debalina', 'Gayatri', 'Indrani', 'Jayanti'],
        surname: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Ganguly', 'Bhattacharya', 'Sen', 'Bose', 'Ghosh', 'Roy', 'Das']
    },
    HINDI: {
        male: ['Arjun', 'Rohan', 'Vikram', 'Ananda', 'Siddhartha', 'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Naresh', 'Hitesh', 'Ganesh', 'Yogesh', 'Umesh', 'Jitesh', 'Kamlesh', 'Lokesh', 'Ravi', 'Anil', 'Sunil', 'Manoj', 'Vinod', 'Pramod', 'Ajay', 'Vijay', 'Sanjay', 'Amitabh'],
        female: ['Priya', 'Anjali', 'Aisha', 'Lakshmi', 'Sita', 'Radha', 'Gita', 'Rita', 'Nita', 'Anita', 'Sunita', 'Mamta', 'Shanti', 'Bharti', 'Shakti', 'Kriti', 'Preeti', 'Neeti', 'Jyoti', 'Aarti', 'Sushma', 'Rekha', 'Meera', 'Geeta', 'Seeta', 'Veena', 'Leela', 'Sheela', 'Heera', 'Kiran'],
        surname: ['Kumar', 'Singh', 'Patel', 'Gupta', 'Sharma', 'Verma', 'Agarwal', 'Tiwari', 'Mishra', 'Shukla', 'Pandey', 'Chandra', 'Joshi', 'Yadav', 'Thakur', 'Sinha', 'Jain', 'Bansal', 'Goel', 'Agrawal', 'Saxena', 'Rastogi', 'Srivastava', 'Tripathi', 'Dwivedi', 'Chaturvedi', 'Bajpai', 'Pathak', 'Awasthi', 'Upadhyay']
    },
    BENGALI_MODERN: {
        male: ['Abhijit', 'Amitabha', 'Aniruddha', 'Bijoy', 'Debabrata', 'Goutam', 'Hiranmay', 'Jayanta', 'Kanchan', 'Mrinal', 'Nirmal', 'Partha', 'Ranjan', 'Sandip', 'Tapan', 'Uttam', 'Biswajit', 'Chandan', 'Dipankar', 'Gauranga', 'Haripada', 'Jagadish', 'Kalyan', 'Manish', 'Nitish', 'Pranab', 'Rajib', 'Subhash', 'Tarun', 'Vivek'],
        female: ['Anindita', 'Baishakhi', 'Chandrima', 'Debarati', 'Gargi', 'Indira', 'Jayanti', 'Keya', 'Labanya', 'Madhurima', 'Nandita', 'Paroma', 'Radhika', 'Sharmila', 'Tanuja', 'Urmila', 'Bijoya', 'Chaitali', 'Dola', 'Gita', 'Himani', 'Jaya', 'Kakali', 'Malabika', 'Namita', 'Pallavi', 'Ratna', 'Sumitra', 'Tapati', 'Vandana'],
        surname: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Bhattacharya', 'Chakraborty', 'Ghosh', 'Bose', 'Sen', 'Dutta', 'Roy', 'Sarkar', 'Das', 'Pal', 'Saha', 'Majumdar', 'Mitra', 'Biswas', 'Ganguly', 'Chowdhury', 'Mandal', 'Sinha', 'Kar', 'Nandi', 'Basu', 'Samanta', 'Halder', 'Naskar', 'Maiti', 'Jana', 'Adhikari']
    },
    TAMIL: {
        male: ['Anand', 'Balachandra', 'Chandrasekhar', 'Dhananjay', 'Ganesan', 'Hariharan', 'Jagannath', 'Karthik', 'Mahendra', 'Narayanan', 'Prakash', 'Raghavan', 'Sankaran', 'Thyagarajan', 'Venkatesh', 'Arjun', 'Balaji', 'Dinesh', 'Ganesh', 'Krishna', 'Murugan', 'Raman', 'Selvan', 'Suresh', 'Vimal', 'Arun', 'Deepak', 'Gopal', 'Hari', 'Mohan'],
        female: ['Aadhya', 'Bhuvana', 'Chitra', 'Divya', 'Geetha', 'Hema', 'Janani', 'Kamala', 'Lalitha', 'Meera', 'Nithya', 'Padma', 'Radha', 'Shanti', 'Thulasi', 'Uma', 'Vasuki', 'Yamuna', 'Anjali', 'Bharathi', 'Deepika', 'Gayathri', 'Indira', 'Kavitha', 'Malini', 'Nandini', 'Priya', 'Revathi', 'Suganya', 'Vani'],
        surname: ['Iyer', 'Iyengar', 'Pillai', 'Nair', 'Reddy', 'Mudaliar', 'Chettiar', 'Gounder', 'Nadar', 'Thevar', 'Raman', 'Krishnan', 'Subramanian', 'Venkataraman', 'Sundaram', 'Ayyar', 'Bhatt', 'Menon', 'Panicker', 'Warrier', 'Namboothiri', 'Nambiar', 'Unnithan', 'Kaimal', 'Thampi', 'Varma', 'Raja', 'Maharaja', 'Dewan', 'Patel']
    },
    PUNJABI: {
        male: ['Amarjit', 'Baljit', 'Charanjit', 'Davinder', 'Gurbachan', 'Hardeep', 'Jasbir', 'Kulbir', 'Maninder', 'Navjot', 'Paramjit', 'Ranjit', 'Simranjit', 'Tarlochan', 'Varinder', 'Amrik', 'Balwinder', 'Daljit', 'Gurmeet', 'Jaspal', 'Kuldeep', 'Makhan', 'Nirmal', 'Parminder', 'Satpal', 'Tejinder', 'Avtar', 'Bikram', 'Daler', 'Gagan'],
        female: ['Amarjeet', 'Baljeet', 'Charanjeet', 'Daljeet', 'Gurjeet', 'Harjeet', 'Jasjeet', 'Kulwant', 'Manjeet', 'Navjeet', 'Paramjeet', 'Ranjeet', 'Simranjeet', 'Tarnjeet', 'Varjeet', 'Amrit', 'Balwant', 'Davinder', 'Gurmeet', 'Jasleen', 'Kulpreet', 'Manpreet', 'Nirmal', 'Parmjeet', 'Satinder', 'Tejinder', 'Avneet', 'Bikramjit', 'Daman', 'Gaganjit'],
        surname: ['Singh', 'Kaur', 'Gill', 'Sandhu', 'Brar', 'Sidhu', 'Dhillon', 'Grewal', 'Bajwa', 'Virk', 'Mann', 'Randhawa', 'Cheema', 'Saini', 'Kang', 'Bath', 'Chahal', 'Deol', 'Ghuman', 'Johal', 'Kahlon', 'Lally', 'Minhas', 'Nagra', 'Panesar', 'Rahi', 'Sahota', 'Takhar', 'Uppal', 'Walia']
    },

    // === SUB-SAHARAN AFRICAN SUB-GROUPS ===
    YORUBA_MODERN: {
        male: ['Adebayo', 'Babatunde', 'Chukwuemeka', 'Damilola', 'Emeka', 'Folarin', 'Gbenga', 'Hakeem', 'Idris', 'Jide', 'Kemi', 'Lanre', 'Muyiwa', 'Niyi', 'Olu', 'Pelumi', 'Rotimi', 'Segun', 'Tunde', 'Uche', 'Wale', 'Yemi', 'Adamu', 'Bolaji', 'Chidi', 'Dayo', 'Femi', 'Goke', 'Kayode', 'Lekan'],
        female: ['Adunni', 'Bisi', 'Chioma', 'Dupe', 'Ebun', 'Funmi', 'Gbemi', 'Hadiza', 'Ife', 'Joke', 'Kemi', 'Lola', 'Moji', 'Nike', 'Ope', 'Peju', 'Ronke', 'Sade', 'Titi', 'Uche', 'Wunmi', 'Yemi', 'Abisola', 'Bukola', 'Chiamaka', 'Damilola', 'Folake', 'Gbemisola', 'Kehinde', 'Modupe'],
        surname: ['Adebayo', 'Babatunde', 'Ogundimu', 'Oluwaseun', 'Adeyemi', 'Ogundipe', 'Adesanya', 'Oyebanji', 'Oladapo', 'Adebisi', 'Oguntade', 'Akinwale', 'Ogunbayo', 'Adebola', 'Oyewole', 'Adesola', 'Ogundare', 'Akinola', 'Ogunleye', 'Adewale', 'Oyekanmi', 'Adekunle', 'Ogundiran', 'Akinyemi', 'Ogunmola', 'Adeniyi', 'Oyedele', 'Adesina', 'Oguntoye', 'Akintola']
    },
    SWAHILI_INTERIOR: {
        male: ['Abdi', 'Bakari', 'Chuma', 'Dalila', 'Faraji', 'Hakeem', 'Jabari', 'Kesi', 'Maulidi', 'Omari', 'Rashidi', 'Salim', 'Tariq', 'Uthman', 'Wasaki', 'Yusuf', 'Azizi', 'Babu', 'Daudi', 'Fadhili', 'Haruni', 'Jengo', 'Kito', 'Mwangi', 'Pemba', 'Saidi', 'Tumbo', 'Vuai', 'Waziri', 'Zuberi'],
        female: ['Aisha', 'Bahati', 'Chiku', 'Dalila', 'Eshe', 'Furaha', 'Hadiya', 'Imara', 'Jengo', 'Kamaria', 'Layla', 'Malkia', 'Nia', 'Penda', 'Raziya', 'Safiya', 'Tatu', 'Uzuri', 'Wema', 'Zaina', 'Amara', 'Busara', 'Dada', 'Fadhila', 'Hawa', 'Jalia', 'Kesi', 'Mwajuma', 'Neema', 'Subira'],
        surname: ['Mwangi', 'Kariuki', 'Wanjiku', 'Kamau', 'Njoroge', 'Wanjiru', 'Mutua', 'Kiprotich', 'Chepkemoi', 'Rotich', 'Kiplagat', 'Jeptoo', 'Kiptoo', 'Chepkoech', 'Kibet', 'Cheruiyot', 'Sang', 'Ruto', 'Koech', 'Lagat', 'Kemboi', 'Tanui', 'Korir', 'Kirui', 'Biwott', 'Cherono', 'Keter', 'Langat', 'Kipchoge', 'Chepngetich']
    },
    AMHARIC: {
        male: ['Abebe', 'Bekele', 'Dawit', 'Girma', 'Haile', 'Kebede', 'Meles', 'Negussie', 'Solomon', 'Teshome', 'Worku', 'Yohannes', 'Addisu', 'Berhanu', 'Desta', 'Getachew', 'Kassahun', 'Lemma', 'Mulugeta', 'Tadesse', 'Aklilu', 'Biniam', 'Daniel', 'Eskinder', 'Fisseha', 'Gebru', 'Henok', 'Tekle', 'Wondwossen', 'Yared'],
        female: ['Almaz', 'Bethlehem', 'Desta', 'Genet', 'Hanna', 'Kidist', 'Meron', 'Netsanet', 'Selamawit', 'Tigist', 'Workitu', 'Yeshimebet', 'Azeb', 'Birtukan', 'Elsa', 'Firehiwot', 'Hiwot', 'Kalkidan', 'Mahlet', 'Ruth', 'Samrawit', 'Tsige', 'Abeba', 'Belaynesh', 'Eden', 'Gelila', 'Helen', 'Liya', 'Mulu', 'Rekik'],
        surname: ['Tadesse', 'Kebede', 'Bekele', 'Tesfaye', 'Desta', 'Girma', 'Haile', 'Worku', 'Negash', 'Abebe', 'Getachew', 'Mulugeta', 'Berhanu', 'Tekle', 'Lemma', 'Kassahun', 'Meles', 'Teshome', 'Yohannes', 'Addisu', 'Aklilu', 'Biniam', 'Daniel', 'Eskinder', 'Fisseha', 'Gebru', 'Henok', 'Wondwossen', 'Yared', 'Almaz']
    },
    ZULU: {
        male: ['Andile', 'Bongani', 'Cedric', 'Dumisani', 'Fikile', 'Gcina', 'Hlengiwe', 'Jabu', 'Khulani', 'Lungelo', 'Mandla', 'Nkosana', 'Phumelelo', 'Sbu', 'Themba', 'Vusi', 'Wiseman', 'Xolani', 'Yenzokuhle', 'Zinhle', 'Ayanda', 'Buhle', 'Clement', 'Daluxolo', 'Fanele', 'Gugu', 'Happy', 'Lwazi', 'Menzi', 'Nhlanhla'],
        female: ['Anele', 'Busisiwe', 'Cebile', 'Duduzile', 'Fikile', 'Gcina', 'Hlengiwe', 'Jabulile', 'Khanyisile', 'Lindiwe', 'Mbali', 'Nokuthula', 'Precious', 'Sandile', 'Thabile', 'Unathi', 'Vuyelwa', 'Winnie', 'Xolisile', 'Yolanda', 'Zandile', 'Ayanda', 'Buhle', 'Cynthia', 'Dimakatso', 'Faith', 'Gugu', 'Happiness', 'Lerato', 'Nomsa'],
        surname: ['Zulu', 'Dlamini', 'Nkomo', 'Mthembu', 'Khumalo', 'Ndlovu', 'Mahlangu', 'Sibiya', 'Mnguni', 'Zwane', 'Shange', 'Vilakazi', 'Makhanya', 'Nxumalo', 'Ngcobo', 'Cele', 'Madlala', 'Mhlongo', 'Ntuli', 'Khoza', 'Gumede', 'Mbeki', 'Radebe', 'Sithole', 'Maseko', 'Shabalala', 'Mazibuko', 'Maphumulo', 'Buthelezi', 'Mseleku']
    },
    HAUSA: {
        male: ['Abdu', 'Ahmed', 'Aliyu', 'Abubakar', 'Bala', 'Dauda', 'Garba', 'Hassan', 'Ibrahim', 'Isa', 'Musa', 'Muhammed', 'Sani', 'Shehu', 'Usman', 'Yusuf', 'Ahmadu', 'Audu', 'Bello', 'Dan', 'Faruk', 'Gidado', 'Hamza', 'Idris', 'Kabir', 'Lawan', 'Mamman', 'Nasiru', 'Rabiu', 'Suleiman'],
        female: ['Aisha', 'Amina', 'Bilkisu', 'Dije', 'Fatima', 'Hafsat', 'Hauwa', 'Jamila', 'Khadija', 'Laraba', 'Maryam', 'Nana', 'Rakiya', 'Ramatu', 'Safiya', 'Salamatu', 'Suwaiba', 'Talatu', 'Yagana', 'Zainab', 'Adama', 'Balkisu', 'Falmata', 'Halima', 'Hadiza', 'Jummai', 'Kande', 'Maimunat', 'Rashida', 'Zulaiha'],
        surname: ['Bello', 'Abdullahi', 'Ibrahim', 'Mohammed', 'Ahmad', 'Usman', 'Aliyu', 'Hassan', 'Musa', 'Abubakar', 'Suleiman', 'Sani', 'Yusuf', 'Garba', 'Bala', 'Isa', 'Dauda', 'Shehu', 'Audu', 'Rabiu', 'Lawan', 'Nasiru', 'Idris', 'Kabir', 'Faruk', 'Gidado', 'Hamza', 'Mamman', 'Dan', 'Ahmadu']
    },
    AKAN: {
        male: ['Kofi', 'Kwame', 'Kwasi', 'Yaw', 'Kwaku', 'Kojo', 'Kwabena', 'Agyei', 'Akwasi', 'Nti', 'Osei', 'Adom', 'Adu', 'Agyeman', 'Akoto', 'Anane', 'Asante', 'Boateng', 'Bonsu', 'Mensah', 'Owusu', 'Opoku', 'Prempeh', 'Safo', 'Tutu', 'Yeboah', 'Addo', 'Appiah', 'Asiedu', 'Boakye'],
        female: ['Abena', 'Akua', 'Afia', 'Yaa', 'Ama', 'Adwoa', 'Akosua', 'Aba', 'Afua', 'Adjoa', 'Efua', 'Akosua', 'Esi', 'Konadu', 'Nana', 'Nyame', 'Abenaa', 'Adoma', 'Akosia', 'Araba', 'Fosua', 'Kessewaa', 'Maabena', 'Nhyira', 'Obaapanin', 'Serwaa', 'Tawiah', 'Yeboaa', 'Ahenewaa', 'Akyaa'],
        surname: ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Opoku', 'Agyei', 'Agyeman', 'Appiah', 'Yeboah', 'Osei', 'Anane', 'Bonsu', 'Tutu', 'Akoto', 'Addo', 'Safo', 'Asiedu', 'Boakye', 'Adom', 'Prempeh', 'Nti', 'Adu', 'Akwasi', 'Kofi', 'Kwame', 'Kwasi', 'Yaw', 'Kwaku', 'Kojo', 'Kwabena']
    },
    SOMALI: {
        male: ['Abdi', 'Ahmed', 'Ali', 'Farah', 'Hassan', 'Hersi', 'Ismail', 'Jama', 'Mahdi', 'Mohamed', 'Omar', 'Osman', 'Saeed', 'Yusuf', 'Abdullahi', 'Abdirahman', 'Abdulkadir', 'Bile', 'Dahir', 'Duale', 'Guled', 'Hashi', 'Hussein', 'Ibrahim', 'Issa', 'Mohamud', 'Musa', 'Nur', 'Rashid', 'Sharif'],
        female: ['Amina', 'Asli', 'Fadumo', 'Fatuma', 'Habiba', 'Halima', 'Hodan', 'Hawa', 'Iman', 'Khadija', 'Ladan', 'Maryan', 'Naima', 'Rahma', 'Sahra', 'Sagal', 'Samira', 'Shukri', 'Ubah', 'Yasmin', 'Aisha', 'Deqa', 'Farhiya', 'Idil', 'Ifrah', 'Jamila', 'Kaltun', 'Muna', 'Nimco', 'Zahra'],
        surname: ['Abdi', 'Ahmed', 'Ali', 'Farah', 'Hassan', 'Mohamed', 'Omar', 'Yusuf', 'Abdullahi', 'Hersi', 'Ismail', 'Jama', 'Mahdi', 'Osman', 'Saeed', 'Abdirahman', 'Abdulkadir', 'Dahir', 'Duale', 'Guled', 'Hashi', 'Hussein', 'Ibrahim', 'Issa', 'Mohamud', 'Musa', 'Nur', 'Rashid', 'Sharif', 'Bile']
    },

    /**
     * The Bantu-speaking centre and south of Africa, which had no naming
     * traditions of its own here at all.
     *
     * `SUB_SAHARAN_AFRICAN` was standing in for the Congo basin, Angola and
     * everything south of the Zambezi, and its contents are West African —
     * Kwame, Chinedu, Babatunde, surnames Ogundimu and Oluwaseun. So a woman
     * in the Kingdom of Kongo in 1400 came out named as a Yoruba fifteen
     * hundred kilometres away, and pre-colonial Southern Africa was Zulu or
     * Yoruba on a 10:6 draw with nothing else available. These six sets are
     * the traditions those regions actually used.
     *
     * IGBO is here for the same reason on the other side of the continent:
     * "West African Forests" contains a locale called Ibo Plateau and the rule
     * offered only Yoruba and Akan.
     */
    IGBO: {
        male: ['Chinedu', 'Emeka', 'Obinna', 'Ikenna', 'Chukwuma', 'Nnamdi', 'Uche', 'Chidi', 'Ifeanyi', 'Kelechi', 'Chibueze', 'Ekene', 'Arinze', 'Obiora', 'Nwachukwu', 'Chigozie', 'Ndubuisi', 'Onyeka', 'Amaechi', 'Chukwuemeka', 'Ebuka', 'Obiajulu', 'Udoka', 'Somtochukwu', 'Ozoemena', 'Chinonso', 'Ikechukwu', 'Nnaemeka', 'Okwudili', 'Tochukwu'],
        female: ['Adaeze', 'Chinwe', 'Ngozi', 'Amaka', 'Chiamaka', 'Ifeoma', 'Nneka', 'Obiageli', 'Uzoma', 'Chidinma', 'Ada', 'Nkiru', 'Oluchi', 'Ezinne', 'Ogechi', 'Nwakaego', 'Adaobi', 'Ijeoma', 'Chinyere', 'Uchechi', 'Nkechi', 'Onyinye', 'Chioma', 'Ugochi', 'Akachi', 'Ebele', 'Ihuoma', 'Munachi', 'Ndidi', 'Adanna'],
        surname: ['Okafor', 'Okonkwo', 'Nwosu', 'Eze', 'Okeke', 'Obi', 'Nwankwo', 'Anyanwu', 'Madu', 'Nnaji', 'Okoye', 'Onwuka', 'Udeh', 'Ugwu', 'Agu', 'Ezeani', 'Ibe', 'Iheanacho', 'Mbah', 'Ndukwe', 'Nwachukwu', 'Ogbonna', 'Ojukwu', 'Onuoha', 'Uba', 'Ugochukwu', 'Chukwu', 'Ike', 'Okoro', 'Anozie']
    },
    /**
     * Kikongo, of the lower Congo and northern Angola. The four Kongo market
     * days — Nsona, Nkenge, Konzo, Nkandu — are personal names in their own
     * right, as are the twin names Nsimba and Nzuzi. The surnames are clan and
     * province names of the kingdom.
     */
    KONGO: {
        male: ['Nsimba', 'Nzuzi', 'Lukeni', 'Mvemba', 'Nkanga', 'Mpanzu', 'Ntinu', 'Mbemba', 'Nsaku', 'Makaya', 'Ndombe', 'Mavungu', 'Nkosi', 'Lemba', 'Kudia', 'Nsona', 'Konzo', 'Nkandu', 'Bakala', 'Muanda', 'Tembo', 'Nzau', 'Mbuta', 'Luzolo', 'Kanga', 'Ngoma', 'Nlaza', 'Mpemba', 'Diakanua', 'Zola'],
        female: ['Nsimba', 'Nzuzi', 'Kimpa', 'Nkenge', 'Mafuta', 'Kiese', 'Vuvu', 'Nzinga', 'Lunga', 'Mbila', 'Nkento', 'Luzolo', 'Ndona', 'Mpemba', 'Bunga', 'Nsona', 'Nlandu', 'Kudia', 'Zola', 'Makaya', 'Nsangu', 'Mbombo', 'Kiala', 'Ntima', 'Nzola', 'Mavinga', 'Nkumu', 'Lukombo', 'Matondo', 'Kimbembe'],
        surname: ['Nsundi', 'Mbata', 'Soyo', 'Mpangu', 'Nkanga', 'Lemba', 'Mavungu', 'Ndongala', 'Nzita', 'Malonga', 'Matondo', 'Nkodia', 'Bakala', 'Loko', 'Kiala', 'Mbemba', 'Diakanua', 'Makaba', 'Kimbanda', 'Nzuzi', 'Mpanzu', 'Luzolo', 'Nkosi', 'Mbanza', 'Nsaku', 'Vuzi', 'Nlandu', 'Kimbembe', 'Mbungu', 'Nzambi']
    },
    /**
     * The southern savanna and the Congo interior — Luba, Lunda, Songye, Teke
     * and the Lualaba headwaters where the Luba states formed.
     */
    LUBA: {
        male: ['Kalala', 'Ilunga', 'Kasongo', 'Mutombo', 'Kabongo', 'Ngoy', 'Mwamba', 'Kabila', 'Tshibangu', 'Kayembe', 'Banza', 'Mukendi', 'Ngongo', 'Kalonji', 'Mbuyi', 'Kanyinda', 'Muteba', 'Nkulu', 'Kazadi', 'Tshimanga', 'Mulumba', 'Kabemba', 'Lukusa', 'Musumba', 'Kapenda', 'Ntambwe', 'Mwepu', 'Kilolo', 'Bwana', 'Kongolo'],
        female: ['Mbombo', 'Ngalula', 'Kapinga', 'Tshiala', 'Mujinga', 'Bilonda', 'Kabedi', 'Nsona', 'Mwadi', 'Kanku', 'Ntumba', 'Banza', 'Lubaki', 'Mpiana', 'Kasongo', 'Bijoux', 'Tshiabu', 'Kalombo', 'Mande', 'Nkashama', 'Mbuyi', 'Kazadi', 'Lusamba', 'Ngoyi', 'Mwenze', 'Kabuya', 'Tshibola', 'Musenge', 'Kalunga', 'Mputu'],
        surname: ['Ilunga', 'Kalala', 'Mutombo', 'Kabongo', 'Tshibangu', 'Kayembe', 'Mukendi', 'Kalonji', 'Mbuyi', 'Kanyinda', 'Kazadi', 'Tshimanga', 'Mulumba', 'Lukusa', 'Ntambwe', 'Kongolo', 'Ngoy', 'Mwamba', 'Banza', 'Muteba', 'Nkulu', 'Kabemba', 'Kapenda', 'Mwepu', 'Ngongo', 'Kasongo', 'Kabila', 'Musumba', 'Numbi', 'Wetshi']
    },
    /**
     * Shona, of the Zimbabwe plateau between the Limpopo and the Zambezi. The
     * surnames are mostly mutupo — clan totems, an animal or a body part —
     * which is how Shona people identify a family.
     */
    SHONA: {
        male: ['Tendai', 'Tafadzwa', 'Farai', 'Takudzwa', 'Munashe', 'Tinashe', 'Simba', 'Kudakwashe', 'Panashe', 'Anesu', 'Tapiwa', 'Chenjerai', 'Garikai', 'Tonderai', 'Shingirai', 'Batsirai', 'Mufaro', 'Tatenda', 'Ngonidzashe', 'Munyaradzi', 'Tichaona', 'Zvikomborero', 'Kudzai', 'Nyasha', 'Tavonga', 'Rugare', 'Taonga', 'Chiedza', 'Mudiwa', 'Simbarashe'],
        female: ['Rudo', 'Chipo', 'Tsitsi', 'Nyasha', 'Vimbai', 'Rutendo', 'Ropafadzo', 'Anesu', 'Fadzai', 'Chiedza', 'Tariro', 'Shamiso', 'Nyaradzo', 'Rumbidzai', 'Tendai', 'Kudzai', 'Mazvita', 'Netsai', 'Sekai', 'Tambudzai', 'Yeukai', 'Chenai', 'Danai', 'Farirai', 'Gamuchirai', 'Kundai', 'Tapiwa', 'Nhamo', 'Ratidzo', 'Muchaneta'],
        surname: ['Moyo', 'Ncube', 'Sibanda', 'Dube', 'Shumba', 'Gumbo', 'Nyoni', 'Mpofu', 'Mhlanga', 'Zhou', 'Mutasa', 'Chirwa', 'Makoni', 'Rusike', 'Madziva', 'Chikwanha', 'Mavhunga', 'Nyathi', 'Bhebhe', 'Muzenda', 'Zvobgo', 'Chigumba', 'Marufu', 'Mangwiro', 'Nyandoro', 'Chihuri', 'Mutumbuka', 'Gwenzi', 'Mureyi', 'Tsvangirai']
    },
    /**
     * Xhosa, of the Eastern Cape. The surnames are isiduko — clan names —
     * which precede and outrank the personal name in introduction.
     */
    XHOSA: {
        male: ['Sipho', 'Thembekile', 'Vuyani', 'Zolani', 'Lungile', 'Bulelani', 'Sandile', 'Luthando', 'Siyabonga', 'Mzwandile', 'Nkosinathi', 'Anele', 'Khaya', 'Lwandle', 'Mthetho', 'Odwa', 'Sive', 'Thando', 'Unathi', 'Vuyo', 'Xolani', 'Yanga', 'Zwelethu', 'Athi', 'Loyiso', 'Masixole', 'Sibusiso', 'Mandla', 'Ayanda', 'Mzukisi'],
        female: ['Nomsa', 'Nomvula', 'Thandiwe', 'Nobuhle', 'Zanele', 'Nolitha', 'Nosipho', 'Bulelwa', 'Asanda', 'Lindiwe', 'Nokwanda', 'Phumla', 'Sindiswa', 'Zodwa', 'Babalwa', 'Nomalanga', 'Nozipho', 'Khanyisa', 'Lulama', 'Nandipha', 'Nokuthula', 'Nomonde', 'Ntombizanele', 'Sisipho', 'Thandeka', 'Vuyokazi', 'Xoliswa', 'Zintle', 'Noluthando', 'Nobantu'],
        surname: ['Mandela', 'Sisulu', 'Tutu', 'Mbeki', 'Sobukwe', 'Matanzima', 'Mqhayi', 'Jabavu', 'Rubusana', 'Soga', 'Bhele', 'Dlomo', 'Gcaleka', 'Hlubi', 'Jola', 'Khawuta', 'Mpondo', 'Ndlambe', 'Ngqika', 'Rharhabe', 'Thembu', 'Zizi', 'Ngcuka', 'Makhanda', 'Mnyanda', 'Nkosiyane', 'Qwathi', 'Tshawe', 'Mfengu', 'Sukwini']
    },
    /**
     * Sotho-Tswana, of the highveld, Lesotho and the Kalahari margin. The
     * surnames are chiefly and clan lines — Moshoeshoe, Khama, Sechele.
     */
    SOTHO_TSWANA: {
        male: ['Thabo', 'Lehlohonolo', 'Katlego', 'Tumelo', 'Kagiso', 'Neo', 'Tshepo', 'Mpho', 'Karabo', 'Bokang', 'Kabelo', 'Lesego', 'Ofentse', 'Boitumelo', 'Tebogo', 'Itumeleng', 'Motheo', 'Realeboga', 'Sechaba', 'Teboho', 'Mothusi', 'Kgosi', 'Oarabile', 'Tshiamo', 'Refiloe', 'Reabetswe', 'Molefi', 'Lebohang', 'Onkgopotse', 'Ditiro'],
        female: ['Palesa', 'Lerato', 'Dikeledi', 'Nthabiseng', 'Mmabatho', 'Kelebogile', 'Boitumelo', 'Tshegofatso', 'Refilwe', 'Keneilwe', 'Mamello', 'Mosa', 'Naledi', 'Puleng', 'Realeboga', 'Tebogo', 'Bontle', 'Gomolemo', 'Kagiso', 'Lebohang', 'Masego', 'Mpho', 'Neo', 'Onalenna', 'Reitumetse', 'Kgomotso', 'Matshidiso', 'Sethunya', 'Mmapula', 'Ntsoaki'],
        surname: ['Molefe', 'Moloi', 'Mokoena', 'Sekhukhune', 'Modise', 'Motaung', 'Mokgatle', 'Letsie', 'Mofokeng', 'Tsotetsi', 'Mabaso', 'Phiri', 'Selepe', 'Tau', 'Mothibi', 'Khama', 'Sechele', 'Moshoeshoe', 'Seretse', 'Pilane', 'Rakoma', 'Kgosana', 'Setshwane', 'Nkoane', 'Mmusi', 'Motlanthe', 'Ramotswe', 'Lekota', 'Masire', 'Ntsu']
    },

    // === OCEANIA SUB-GROUPS ===
    /**
     * The post-missionisation set — it begins in 1814, and everything before it
     * is `POLYNESIAN_PRECONTACT`, which is mononymic and should stay so.
     *
     * The surnames were simply `[]`, which produced a mononym every time, and
     * the `post-1700-surnames` invariant could never see it because Oceania was
     * 0.3% of draws and never accumulated enough personas to fail on. Pacific
     * naming did become binomial through the nineteenth century: chiefly and
     * matai titles hardened into family names in Samoa and Tonga, Māori took
     * hapū and ancestor names, and mission registers fixed both.
     */
    POLYNESIAN: {
        male: ['Manaia', 'Hemi', 'Tane', 'Rangi', 'Kai', 'Aroha', 'Wiremu', 'Te Koha', 'Mahina', 'Teiva', 'Koa', 'Keoni', 'Nalani', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Anaru', 'Rawiri', 'Tamati', 'Hoani', 'Pita', 'Rewi', 'Tawhiri', 'Rongo', 'Tama', 'Koru', 'Whai', 'Turi'],
        female: ['Moana', 'Hina', 'Leilani', 'Malia', 'Aroha', 'Kiri', 'Anahera', 'Mere', 'Ngaire', 'Roimata', 'Ataahua', 'Marama', 'Kaia', 'Lani', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Tiaré', 'Tiare', 'Raina', 'Moea', 'Haumea', 'Nayeli'],
        surname: SURNAME_POLYNESIAN
    },
    MELANESIAN: {
        male: ['Bani', 'Tavu', 'Kem', 'Wani', 'Nalu', 'Kila', 'Mendi', 'Vanua', 'Tiko', 'Ratu', 'Seru', 'Jone', 'Viliame', 'Epeli', 'Tomasi', 'Aisea', 'Manoa', 'Tevita', 'Salote', 'Rusiate', 'Simione', 'Peni', 'Waisea', 'Iowane', 'Mosese', 'Lasaro', 'Filipe', 'Petero', 'Apisai', 'Isikeli'],
        female: ['Salote', 'Ana', 'Mere', 'Mele', 'Litia', 'Vika', 'Sala', 'Adi', 'Bulou', 'Lavenia', 'Serena', 'Talei', 'Nanise', 'Alanieta', 'Makereta', 'Veniana', 'Arieta', 'Kelera', 'Melaia', 'Raijeli', 'Timoci', 'Vasiti', 'Akanisi', 'Salanieta', 'Laisani', 'Taraivini', 'Vulimila', 'Wainikiti', 'Salome', 'Eta'],
        surname: SURNAME_MELANESIAN
    },
    ABORIGINAL_AUSTRALIAN: {
        male: ['Birrani', 'Darel', 'Jarrah', 'Koori', 'Mandawuy', 'Nullah', 'Tjandrawati', 'Warwick', 'Yurrampi', 'Kirra', 'Bindi', 'Boori', 'Budgeree', 'Cooinda', 'Daku', 'Gidgee', 'Jannali', 'Kiah', 'Lachlan', 'Miro', 'Namatjira', 'Oodgeroo', 'Poolamacca', 'Quandong', 'Tarkine', 'Uluru', 'Wagga', 'Yamba', 'Yarrawarra', 'Bidjigal'],
        female: ['Allira', 'Brindabella', 'Colebee', 'Doolhof', 'Elanora', 'Gindarra', 'Jannali', 'Kirra', 'Lowanna', 'Marlee', 'Naia', 'Pemulwuy', 'Queanbeyan', 'Tallara', 'Ulladulla', 'Wagga', 'Yamba', 'Alinta', 'Bindi', 'Coolah', 'Djarragun', 'Eliza', 'Goorialla', 'Jundah', 'Kalgoorlie', 'Merinda', 'Narrandera', 'Papunya', 'Tiwi', 'Warrnambool'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === SOUTH AMERICAN SUB-GROUPS ===
    ANDEAN_QUECHUA: {
        male: ['Apu', 'Atawallpa', 'Inti', 'Pachakutiq', 'Tupaq', 'Wayna', 'Qhapaq', 'Inka', 'Manco', 'Sayri', 'Thupa', 'Wiraqocha', 'Amaru', 'Challwa', 'Huascar', 'Illapa', 'Kuntur', 'Puma', 'Rumi', 'Sumaq', 'Tayta', 'Ukuku', 'Vicuña', 'Waman', 'Yakana', 'Zara', 'Chaska', 'Huanca', 'Kimsa', 'Lloque'],
        female: ['Coya', 'Killa', 'Mama', 'Ñusta', 'Quispe', 'Sisa', 'Sumaq', 'Tika', 'Urpi', 'Wayna', 'Yaku', 'Chaska', 'Chuya', 'Illa', 'Inti', 'Kusi', 'Phuyupatamanta', 'Qori', 'Raymi', 'Sarita', 'Tanta', 'Umiña', 'Warmi', 'Yana', 'Achik', 'Chakana', 'Hanan', 'Khuya', 'Munay', 'Phaway'],
        surname: ['Yupanki', 'Wankár', 'Quespi', 'Kondori', 'Waman', 'Amaru', 'Choque', 'Quispe', 'Huanca', 'Mamani', 'Apaza', 'Ccopa', 'Cusipaucar', 'Hancco', 'Inca', 'Llanos', 'Marca', 'Nina', 'Pacco', 'Quiso', 'Soncco', 'Ttito', 'Waskar', 'Xerez', 'Yabar', 'Zapana', 'Alanoca']
    },
    /**
     * Guaraní of Paraguay, the Paraná and the Jesuit reduction country.
     *
     * Caetano, Karim and Açucena were Portuguese, Arabic and Spanish; Iansã is
     * a Yoruba orisha that arrived in Brazil with the slave trade; Tupã, Jaci,
     * Rudá and Boitatá are deities; Iracema, Moema, Ceci, Peri and Ubirajara
     * are Alencar's again. `Guaraní` was in its own list as a given name.
     *
     * What is left is attested caciques and shamans from the Spanish and Jesuit
     * record — Lambaré, Paraguá, Guarambaré, and the two shamans Ñezú and
     * Guiravera who led the risings against the reductions in the 1620s and
     * 30s — plus Guaraní nature and quality words, which is what the rest of
     * the naming drew on.
     */
    GUARANI: {
        male: ['Lambaré', 'Paraguá', 'Guarambaré', 'Yanduazubí', 'Ñezú', 'Guiravera', 'Arandu', 'Karaí', 'Guyrá', 'Yaguá', 'Mbaracá', 'Takuara', 'Yvyrá', 'Aguará', 'Tatú', 'Avaeté', 'Tavaí', 'Mbói', 'Ñanduá', 'Ruvichá'],
        female: ['Panambi', 'Yvoty', 'Poty', 'Ysapy', 'Kuñataĩ', 'Guavirá', 'Pytã', 'Mbyja', 'Yrupé', 'Takuarí', 'Kaʻaguy', 'Aramí'],
        surname: []
    },

    // Default fallbacks (broad)
    EUROPEAN: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Roger', 'Bartholomew', 'Geoffrey', 'Edmund', 'Stephen', 'Nicholas', 'Christopher', 'Alexander', 'Michael', 'Anthony', 'Peter', 'Charles', 'Francis', 'Arthur', 'Frederick', 'George', 'Harold', 'Ralph', 'Philip', 'Mark', 'Matthew'],
        female: ['Mary', 'Eliza', 'Anne', 'Eleanor', 'Margaret', 'Alice', 'Joan', 'Isabella', 'Matilda', 'Catherine', 'Beatrice', 'Agnes', 'Elizabeth', 'Jane', 'Sarah', 'Emma', 'Grace', 'Rose', 'Helen', 'Victoria', 'Florence', 'Charlotte', 'Sophia', 'Diana', 'Rebecca', 'Rachel', 'Judith', 'Caroline', 'Frances', 'Arabella'],
        surname: ['Smith', 'Baker', 'Cook', 'Taylor', 'Miller', 'Hill', 'Green', 'Carter', 'Wright', 'Mason', 'Cooper', 'Fletcher', 'Turner', 'Parker', 'Brown', 'Davis', 'Wilson', 'Moore', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall']
    },
    EAST_ASIAN: { 
        male: ['Kenji', 'Haru', 'Wei', 'Bao', 'Min-jun', 'Akira', 'Long', 'Seo-jun', 'Hiroshi', 'Gang', 'Do-yun', 'Takeda', 'Ming', 'Ha-jun', 'Nobu', 'Feng', 'Eun-woo', 'Hideo', 'Hui', 'Si-woo', 'Ichiro', 'Jun', 'Jun-seo', 'Jiro', 'Lei', 'Ye-jun', 'Kazuo', 'Peng', 'Ji-ho', 'Masato'],
        female: ['Yuki', 'Hana', 'Mei', 'Lien', 'Ji-hye', 'Sakura', 'Xiao', 'Seo-yeon', 'Rin', 'Jia', 'Ha-eun', 'Aiko', 'Ling', 'Ji-woo', 'Chiyo', 'Nuo', 'Min-seo', 'Emiko', 'Ai', 'So-yeon', 'Fumiko', 'Hua', 'Yoo-jin', 'Haruka', 'Juan', 'Chae-won', 'Izumi', 'Li', 'Ga-eun', 'Junko'],
        surname: ['Tanaka', 'Sato', 'Li', 'Wang', 'Kim', 'Lee', 'Suzuki', 'Zhang', 'Park', 'Takahashi', 'Liu', 'Choi', 'Watanabe', 'Chen', 'Jeong', 'Ito', 'Yang', 'Kang', 'Yamamoto', 'Huang', 'Cho', 'Nakamura', 'Zhao', 'Yoon', 'Kobayashi', 'Wu', 'Jang', 'Saito', 'Zhou', 'Lim']
    },
    MENA: { 
        male: ['Ahmad', 'Omar', 'Yusuf', 'Arash', 'Kian', 'Ali', 'Babak', 'Mohammed', 'Cyrus', 'Hassan', 'Darius', 'Khaled', 'Farhad', 'Ibrahim', 'Kaveh', 'Mahmoud', 'Omid', 'Abdallah', 'Siavash', 'Marwan', 'Shahriar', 'Sami', 'Jamshid', 'Tareq', 'Kamran', 'Walid', 'Farzad', 'Ziad', 'Hooman', 'Amjad'],
        female: ['Fatima', 'Layla', 'Aisha', 'Yasmin', 'Soraya', 'Zainab', 'Anahita', 'Mariam', 'Esther', 'Noor', 'Roxana', 'Farah', 'Parisa', 'Hala', 'Golnar', 'Rana', 'Shirin', 'Reem', 'Maryam', 'Sara', 'Nasrin', 'Dina', 'Shahrzad', 'Jana', 'Farah', 'Lina', 'Laleh', 'Maya', 'Mahsa', 'Rania'],
        surname: ['Haddad', 'Nasser', 'Rostami', 'Yazdi', 'Masri', 'Khorasani', 'Khoury', 'Isfahani', 'Shami', 'Tabrizi', 'Tahan', 'Shirazi', 'Khalil', 'Mashhadi', 'Mansour', 'Tehrani', 'Qasemi', 'Ahvazi', 'Rahhal', 'Kermani', 'Sabbagh', 'Rasht', 'Tannus', 'Qomi', 'Bitar', 'Hamadani', 'Dahhan', 'Kashani', 'Farah', 'Ardebili']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        male: ['Nanabozho', 'Wabigwan', 'Makoons', 'Migizi', 'Giizhig', 'Binesi', 'Makak', 'Waabigwanii', 'Ogichidaa', 'Gichi', 'Migwech', 'Anishinaabe', 'Boozhoo', 'Giwedin', 'Ishkode', 'Manidoo', 'Miigwech', 'Nooko', 'Ozhaawashko', 'Waaboos', 'Chayton', 'Ezhno', 'Hakan', 'Kuruk', 'Nantan', 'Pachu', 'Sani', 'Takoda', 'Wapi', 'Aiukli'],
        female: ['Nokomis', 'Waabigwanii', 'Ogichidaakwe', 'Migizi', 'Giizhigokwe', 'Binesi', 'Makoons', 'Waabigwan', 'Anishinaabekwe', 'Gichigami', 'Ishkodekwe', 'Manidookwe', 'Miigwech', 'Nookookwe', 'Ozhaawashko', 'Waaboos', 'Giiwedin', 'Migwech', 'Boozhoo', 'Wabana', 'Aiyana', 'Chenoa', 'Dyani', 'Halona', 'Imala', 'Kachina', 'Leotie', 'Nayeli', 'Orenda', 'Papina'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    OCEANIA: {
        male: ['Manaia', 'Hemi', 'Tane', 'Rangi', 'Kai', 'Aroha', 'Wiremu', 'Te Koha', 'Mahina', 'Teiva', 'Koa', 'Keoni', 'Nalani', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Anaru', 'Rawiri', 'Tamati', 'Hoani', 'Pita', 'Rewi', 'Tawhiri', 'Rongo', 'Tama', 'Koru', 'Whai', 'Turi'],
        female: ['Moana', 'Hina', 'Leilani', 'Malia', 'Aroha', 'Kiri', 'Anahera', 'Mere', 'Ngaire', 'Roimata', 'Ataahua', 'Marama', 'Kaia', 'Lani', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Tiaré', 'Tiare', 'Raina', 'Moea', 'Haumea', 'Nayeli'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    SOUTH_ASIAN: {
        male: ['Arjun', 'Rohan', 'Vikram', 'Ananda', 'Siddhartha', 'Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Naresh', 'Hitesh', 'Ganesh', 'Yogesh', 'Umesh', 'Jitesh', 'Kamlesh', 'Lokesh', 'Ravi', 'Anil', 'Sunil', 'Manoj', 'Vinod', 'Pramod', 'Ajay', 'Vijay', 'Sanjay', 'Amitabh'],
        female: ['Priya', 'Anjali', 'Aisha', 'Lakshmi', 'Sita', 'Radha', 'Gita', 'Rita', 'Nita', 'Anita', 'Sunita', 'Mamta', 'Shanti', 'Bharti', 'Shakti', 'Kriti', 'Preeti', 'Neeti', 'Jyoti', 'Aarti', 'Sushma', 'Rekha', 'Meera', 'Geeta', 'Seeta', 'Veena', 'Leela', 'Sheela', 'Heera', 'Kiran'],
        surname: ['Kumar', 'Singh', 'Patel', 'Gupta', 'Khan', 'Sharma', 'Verma', 'Agarwal', 'Tiwari', 'Mishra', 'Shukla', 'Pandey', 'Chandra', 'Joshi', 'Yadav', 'Thakur', 'Sinha', 'Jain', 'Bansal', 'Goel', 'Agrawal', 'Saxena', 'Rastogi', 'Srivastava', 'Tripathi', 'Dwivedi', 'Chaturvedi', 'Bajpai', 'Pathak', 'Awasthi']
    },
    SOUTH_AMERICAN: {
        male: ['Apu', 'Atawallpa', 'Inti', 'Pachakutiq', 'Tupaq', 'Wayna', 'Qhapaq', 'Inka', 'Manco', 'Sayri', 'Thupa', 'Wiraqocha', 'Amaru', 'Challwa', 'Huascar', 'Illapa', 'Kuntur', 'Puma', 'Rumi', 'Sumaq', 'Tayta', 'Ukuku', 'Vicuña', 'Waman', 'Yakana', 'Zara', 'Chaska', 'Huanca', 'Kimsa', 'Lloque'],
        female: ['Coya', 'Killa', 'Mama', 'Ñusta', 'Quispe', 'Sisa', 'Sumaq', 'Tika', 'Urpi', 'Wayna', 'Yaku', 'Chaska', 'Chuya', 'Illa', 'Inti', 'Kusi', 'Phuyupatamanta', 'Qori', 'Raymi', 'Sarita', 'Tanta', 'Umiña', 'Warmi', 'Yana', 'Achik', 'Chakana', 'Hanan', 'Khuya', 'Munay', 'Phaway'],
        surname: ['Yupanki', 'Wankár', 'Quespi', 'Kondori', 'Waman', 'Amaru', 'Choque', 'Quispe', 'Huanca', 'Mamani', 'Flores', 'Apaza', 'Ccopa', 'Cusipaucar', 'Hancco', 'Inca', 'Llanos', 'Marca', 'Nina', 'Pacco', 'Quiso', 'Ramos', 'Soncco', 'Ttito', 'Vargas', 'Waskar', 'Xerez', 'Yabar', 'Zapana', 'Alanoca']
    },
    SUB_SAHARAN_AFRICAN: {
        male: ['Kwame', 'Abebe', 'Chinedu', 'Musa', 'Babatunde', 'Adebayo', 'Chukwuemeka', 'Damilola', 'Emeka', 'Folarin', 'Gbenga', 'Hakeem', 'Idris', 'Jide', 'Kemi', 'Lanre', 'Muyiwa', 'Niyi', 'Olu', 'Pelumi', 'Rotimi', 'Segun', 'Tunde', 'Uche', 'Wale', 'Yemi', 'Adamu', 'Bolaji', 'Chidi', 'Dayo'],
        female: ['Aba', 'Imani', 'Zola', 'Nia', 'Asha', 'Adunni', 'Bisi', 'Chioma', 'Dupe', 'Ebun', 'Funmi', 'Gbemi', 'Hadiza', 'Ife', 'Joke', 'Kemi', 'Lola', 'Moji', 'Nike', 'Ope', 'Peju', 'Ronke', 'Sade', 'Titi', 'Uche', 'Wunmi', 'Yemi', 'Abisola', 'Bukola', 'Chiamaka'],
        surname: ['Okoro', 'Diallo', 'Traoré', 'Nkosi', 'Adebayo', 'Babatunde', 'Ogundimu', 'Oluwaseun', 'Adeyemi', 'Ogundipe', 'Adesanya', 'Oyebanji', 'Oladapo', 'Adebisi', 'Oguntade', 'Akinwale', 'Ogunbayo', 'Adebola', 'Oyewole', 'Adesola', 'Ogundare', 'Akinola', 'Ogunleye', 'Adewale', 'Oyekanmi', 'Adekunle', 'Ogundiran', 'Akinyemi', 'Ogunmola', 'Adeniyi']
    },

    // === COLONIAL PERIOD NAMES ===
    NORTH_AMERICAN_COLONIAL: {
        male: ['John', 'William', 'Thomas', 'Robert', 'James', 'Richard', 'Edward', 'Henry', 'Walter', 'Samuel', 'Benjamin', 'Nathaniel', 'Jonathan', 'Daniel', 'David', 'Isaac', 'Jacob', 'Joshua', 'Ezekiel', 'Jeremiah', 'Ebenezer', 'Cornelius', 'Barnabas', 'Gideon', 'Caleb', 'Elijah', 'Josiah', 'Zechariah', 'Obadiah', 'Hezekiah'],
        female: ['Mary', 'Elizabeth', 'Sarah', 'Hannah', 'Rebecca', 'Ruth', 'Esther', 'Rachel', 'Deborah', 'Abigail', 'Martha', 'Lydia', 'Priscilla', 'Susanna', 'Charity', 'Faith', 'Hope', 'Patience', 'Temperance', 'Prudence', 'Mercy', 'Comfort', 'Submit', 'Silence', 'Experience', 'Thankful', 'Deliverance', 'Bathsheba', 'Mehitable', 'Keturah'],
        surname: ['Smith', 'Brown', 'Johnson', 'Williams', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King']
    },

    /**
     * North America after the colonial naming world.
     *
     * NORTH_AMERICAN_COLONIAL is a seventeenth- and eighteenth-century set —
     * Ebenezer, Hezekiah, Thankful, Experience, Submit — and it was serving as
     * the fallback for the whole zone right up to the present, so a student
     * generating 1920s California met a Puritan. It now stops at 1840 and this
     * takes over. The given names are the ones the US census and Social
     * Security records actually show as common between the mid-nineteenth
     * century and the mid-twentieth; the surnames keep the mix of Anglo,
     * Irish, German, Italian, Jewish, Mexican and African American names that
     * a US city of that period would hold, because the previous list was Anglo
     * with three Spanish surnames appended.
     */
    NORTH_AMERICAN_MODERN: {
        male: ['John', 'William', 'James', 'Charles', 'George', 'Robert', 'Joseph', 'Frank', 'Edward', 'Thomas', 'Henry', 'Walter', 'Harry', 'Arthur', 'Albert', 'Fred', 'Raymond', 'Clarence', 'Howard', 'Ernest', 'Leo', 'Roy', 'Earl', 'Chester', 'Floyd', 'Vernon', 'Clyde', 'Melvin', 'Stanley', 'Herman', 'Lloyd', 'Willie', 'Eugene', 'Norman', 'Russell'],
        female: ['Mary', 'Helen', 'Margaret', 'Anna', 'Ruth', 'Elizabeth', 'Dorothy', 'Marie', 'Florence', 'Mildred', 'Alice', 'Ethel', 'Lillian', 'Gladys', 'Edna', 'Frances', 'Rose', 'Louise', 'Grace', 'Bertha', 'Evelyn', 'Pearl', 'Clara', 'Hazel', 'Irene', 'Marion', 'Beatrice', 'Thelma', 'Doris', 'Viola', 'Agnes', 'Josephine', 'Bernice', 'Lucille', 'Wilma'],
        surname: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Murphy', 'Kelly', 'Sullivan', "O'Brien", 'Ryan', 'Schmidt', 'Mueller', 'Schneider', 'Hoffman', 'Weber', 'Rossi', 'Russo', 'Esposito', 'Marino', 'Ricci', 'Cohen', 'Levy', 'Goldberg', 'Katz', 'Garcia', 'Martinez', 'Rodriguez', 'Hernandez', 'Lopez', 'Gonzalez', 'Ramirez', 'Flores', 'Washington', 'Jefferson', 'Freeman', 'Jackson', 'Robinson', 'Nowak', 'Kowalski', 'Novak', 'Larsen', 'Olson', 'Hansen']
    },

    // === MADAGASCAR & INDIAN OCEAN ===
    MALAGASY_MERINA: {
        male: ['Andriamanelo', 'Ralambo', 'Andrianampoinimerina', 'Radama', 'Rakoto', 'Rainivoninahitriniony', 'Ratsimandrava', 'Rainilaiarivony', 'Ramaroson', 'Razafy', 'Ratsiraka', 'Raherimanana', 'Rajaobelina', 'Randrianasolo', 'Rasolo', 'Razafindrakoto', 'Ramanantsoa', 'Ratsimamanga', 'Rakotondrabe', 'Rakotoniaina'],
        female: ['Ranavalona', 'Rasoherina', 'Rasalimo', 'Raketaka', 'Ranoro', 'Rabodo', 'Raharimalala', 'Razanamaro', 'Raveloson', 'Razafy', 'Ratsimbazafy', 'Rasoamanarivo', 'Raharijaona', 'Razanatseheno', 'Rasendrasoa', 'Rasolofonirina', 'Ravelomanantsoa', 'Razanadrakoto', 'Ratsimbaharison', 'Rabemananjara'],
        surname: ['Andriamahefa', 'Razakandrainy', 'Ramanampisoa', 'Andrianarivelo', 'Rasamoelina', 'Razanakolona', 'Randriamampionona', 'Rabearimanana', 'Andriamampandry', 'Razafindratsima', 'Randriamahaleo', 'Rasoloniaina', 'Andriamamonjy', 'Razafimaharo', 'Randrianasolo', 'Rabekoto', 'Andriamanga', 'Razafindrakoto', 'Randrianary', 'Rasolonjatovo']
    },
    MALAGASY_BETSILEO: {
        male: ['Andriamanalina', 'Rainimaharavo', 'Ramenia', 'Rabetsara', 'Andrianony', 'Rafaralahy', 'Rabeandrianina', 'Razanadrakoto', 'Ramilison', 'Rainitantely', 'Rasolofoson', 'Ratsimbazafy', 'Ramaroson', 'Rabary', 'Andriamanantena', 'Rasoanaivo', 'Randriamanantena', 'Rabemananjara', 'Ratsizafy', 'Ramanampisoa'],
        female: ['Rasoanandrasana', 'Rabenanahary', 'Rasoamampianina', 'Razanadrakoto', 'Raharimanga', 'Razanamahasoa', 'Ravelomanantsoa', 'Rasolonjatovo', 'Randrianasolo', 'Rabemanantsoa', 'Razafindrakoto', 'Raharinomena', 'Rasolondraibe', 'Razanabahiny', 'Randriamanitra', 'Rabearimanana', 'Razafimaharo', 'Raveloson', 'Rasoanaivo', 'Rabary'],
        surname: ['Ramanantsoa', 'Razafindralambo', 'Andriamampandry', 'Rasolonjatovo', 'Randriamanantena', 'Rabemanantsoa', 'Razanadrakoto', 'Rabemananjara', 'Andriamanalina', 'Rasoanaivo', 'Razafindrakoto', 'Randriamanitra', 'Rabearimanana', 'Razafimaharo', 'Ravelomanantsoa', 'Rasolofoson', 'Andriamanantena', 'Rabenanahary', 'Razanamahasoa', 'Ramilison']
    },
    MALAGASY_SAKALAVA: {
        male: ['Andriandahifotsy', 'Andriamandisoarivo', 'Andriantompokoindrindra', 'Boina', 'Menabe', 'Andriamasinavalona', 'Andriambolamena', 'Andriamanelo', 'Andriantsitoha', 'Andriantsoly', 'Andriamandresy', 'Andrianampoinimerina', 'Andriantompokoindrindra', 'Andriamanalina', 'Ramaromanompo', 'Ramavo', 'Ramboasalama', 'Raminia', 'Ramonja', 'Randriana'],
        female: ['Ravahiny', 'Rafohy', 'Rangita', 'Rasoamampianina', 'Ranoro', 'Rabehaza', 'Razanakoto', 'Ravelomanantsoa', 'Rasolofoson', 'Rabetsara', 'Rasoanandrasana', 'Raharimanga', 'Rasoanaivo', 'Randrianasolo', 'Razanadrakoto', 'Rabemanantsoa', 'Rabemananjara', 'Razafindrakoto', 'Raveloson', 'Razafimaharo'],
        surname: ['Andriambolamena', 'Andriamandisoarivo', 'Andriantompokoindrindra', 'Andriamasinavalona', 'Andriandahifotsy', 'Andrianampoinimerina', 'Andriamanalina', 'Andriamandresy', 'Andriantsitoha', 'Andriantsoly', 'Ramaromanompo', 'Ramboasalama', 'Randrianasolo', 'Razanadrakoto', 'Ravelomanantsoa', 'Rabemananjara', 'Razafindrakoto', 'Rasolofoson', 'Rasoanaivo', 'Rabemanantsoa']
    },

    // === SOUTHEAST ASIAN SPECIFICS ===
    VIETNAMESE: {
        male: ['Nguyen', 'Minh', 'Duc', 'Hoang', 'Quang', 'Huy', 'Tuan', 'Dung', 'Hung', 'Nam', 'Thang', 'Long', 'Son', 'Phong', 'Truong', 'Cuong', 'Hai', 'Viet', 'Bao', 'Thanh', 'Kien', 'Tam', 'Lam', 'Khoa', 'An', 'Tien', 'Dat', 'Loc', 'Binh', 'Hieu'],
        female: ['Linh', 'Hoa', 'Mai', 'Lan', 'Huong', 'Thuy', 'Nga', 'Yen', 'Ha', 'Phuong', 'Trinh', 'Hong', 'Thu', 'Trang', 'Ly', 'Kim', 'Hang', 'Van', 'Duyen', 'Hien', 'Nhung', 'Tuyet', 'Dieu', 'Quynh', 'Chau', 'Thao', 'Anh', 'My', 'Ngoc', 'Xuan'],
        surname: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly', 'Thai', 'Trinh', 'Dinh', 'Cao', 'Ta', 'Lam', 'Luong', 'Truong', 'Doan', 'Huynh', 'Mai', 'Vo', 'Bach', 'Tong', 'Lac', 'Phung']
    },
    THAI: {
        male: ['Somchai', 'Somsak', 'Surachai', 'Wichai', 'Prasit', 'Narong', 'Sombat', 'Suchart', 'Surin', 'Thanet', 'Wiwat', 'Amnuay', 'Kamon', 'Preecha', 'Chaiwat', 'Bandit', 'Manit', 'Chusak', 'Pichet', 'Pornsak', 'Kamron', 'Boonmee', 'Niran', 'Thawat', 'Kriengsak', 'Bundit', 'Prasert', 'Thana', 'Worawit', 'Sathit'],
        female: ['Siriporn', 'Malee', 'Suda', 'Wannee', 'Pranee', 'Ratana', 'Pensri', 'Niran', 'Duangjai', 'Somjit', 'Wassana', 'Anchalee', 'Benjawan', 'Chanida', 'Duangporn', 'Janya', 'Kannika', 'Ladda', 'Maneerat', 'Naree', 'Oraphin', 'Piyanut', 'Ratchanee', 'Siriwan', 'Tipawan', 'Uraiwan', 'Wanida', 'Yupa', 'Amporn', 'Boonsri'],
        surname: ['Srisawat', 'Charoensuk', 'Wongsuwan', 'Thanakit', 'Piyapan', 'Siriporn', 'Kamolpan', 'Ratanachai', 'Prasertporn', 'Wichayaporn', 'Chinawong', 'Suksamran', 'Theerawat', 'Vorachote', 'Charoenrat', 'Amnuayporn', 'Boonchana', 'Sirichai', 'Thanapon', 'Wanichkorn', 'Chalermporn', 'Duangrat', 'Keeratiporn', 'Naruepon', 'Prasertsuk', 'Ratchanee', 'Somchaiporn', 'Thawatchai', 'Wachiraporn', 'Yingyong']
    },
    BURMESE: {
        male: ['Thant', 'Tin', 'Than', 'Htun', 'Win', 'Khin', 'Mya', 'Soe', 'Zaw', 'Htin', 'Kyaw', 'Aung', 'Thet', 'Ye', 'Ko', 'Min', 'Nyi', 'Oo', 'Phyo', 'Pyae', 'Set', 'Thu', 'Wai', 'Yan', 'Zin', 'Kaung', 'Naing', 'Paing', 'Thura', 'Wunna'],
        female: ['Khin', 'Mya', 'Tin', 'Thant', 'Win', 'Aye', 'Hla', 'May', 'Nwe', 'San', 'Swe', 'Htay', 'Kyi', 'Mar', 'Nan', 'Nu', 'Pwint', 'Su', 'Thandar', 'Yi', 'Cho', 'Ei', 'Htet', 'Kay', 'Lwin', 'Myat', 'Nilar', 'Phyu', 'Sandar', 'Wah'],
        surname: ['Maung', 'Kyaw', 'Aung', 'Tun', 'Hlaing', 'Oo', 'Thant', 'Win', 'Than', 'Htun', 'Soe', 'Zaw', 'Mya', 'Khin', 'Tin', 'Ye', 'Min', 'Thu', 'Naing', 'Wai', 'Zin', 'Htay', 'Lwin', 'Nyi', 'Phyo', 'Set', 'Thura', 'Wunna', 'Yan', 'Kaung']
    },
    KHMER: {
        male: ['Sovann', 'Pisach', 'Chanthy', 'Rith', 'Makara', 'Vichet', 'Bunroeun', 'Dara', 'Kosal', 'Marady', 'Narith', 'Pheaktra', 'Raksa', 'Samnang', 'Thearith', 'Vanna', 'Watthana', 'Yunos', 'Bophal', 'Chamnan'],
        female: ['Chenda', 'Davi', 'Kanitha', 'Lyhour', 'Mealea', 'Neary', 'Panha', 'Ravy', 'Sophea', 'Thida', 'Veasna', 'Chantrea', 'Ratana', 'Bopha', 'Phary', 'Sreypov', 'Chamroeun', 'Kolab', 'Pichsamnang', 'Sreypich'],
        surname: ['Chea', 'Chhun', 'Heng', 'Huy', 'Keo', 'Khem', 'Kong', 'Leng', 'Ly', 'Mao', 'Nhem', 'Ouk', 'Pen', 'Ros', 'Sam', 'Seng', 'Sim', 'Sok', 'Soun', 'Touch', 'Try', 'Vann', 'Vong', 'Yim', 'Yorn', 'Chey', 'Khiev', 'Nget', 'Proeung', 'Roeun']
    },
    LAO: {
        male: ['Bounmy', 'Phouthone', 'Sisavath', 'Khampheng', 'Sengdara', 'Vongphachan', 'Chanthavong', 'Phomma', 'Soulichan', 'Thongsy', 'Vilay', 'Bounthong', 'Keovilay', 'Manivone', 'Phetsavanh', 'Sayavong', 'Thavone', 'Viengkham', 'Bounthavy', 'Keomany', 'Phetmany', 'Souphavanh', 'Thongvanh', 'Vongkham', 'Chanthaly', 'Khamphanh', 'Phouthong', 'Saysamone', 'Thongphet', 'Xayavong'],
        female: ['Bounheng', 'Khamla', 'Phetsamone', 'Saysamone', 'Viengthong', 'Bounmy', 'Keooudone', 'Phouvanh', 'Somphavanh', 'Viengphone', 'Chanthaphone', 'Khampheng', 'Phouthone', 'Souphavanh', 'Xaysavath', 'Bouaphanh', 'Lattanavongsa', 'Phouvong', 'Soudalath', 'Vongphachan', 'Chansamone', 'Khamphone', 'Phoutthavong', 'Soulivanh', 'Vilayvong', 'Bounyavong', 'Keobounpheng', 'Phoutdavone', 'Sysomphone', 'Xayarath'],
        surname: ['Sisavath', 'Vongphachan', 'Phommasavanh', 'Chanthavong', 'Sengdara', 'Bounthong', 'Keovilay', 'Phetsavanh', 'Sayavong', 'Viengkham', 'Thongvanh', 'Xayavong', 'Phomma', 'Souphavanh', 'Vongkham', 'Bounmy', 'Khampheng', 'Manivone', 'Thavone', 'Vilay', 'Bounthavy', 'Keomany', 'Phouthone', 'Soulichan', 'Thongsy', 'Xaysavath', 'Bouaphanh', 'Lattanavongsa', 'Phouvanh', 'Somphavanh']
    },
    JAVANESE: {
        male: ['Bambang', 'Sutrisno', 'Wahyudi', 'Prabowo', 'Joko', 'Suryanto', 'Hadi', 'Budi', 'Agus', 'Eko', 'Hendra', 'Dwi', 'Aris', 'Yudi', 'Slamet', 'Tono', 'Rudi', 'Sugeng', 'Dedi', 'Yanto', 'Gatot', 'Suharto', 'Wiranto', 'Basuki', 'Subiyanto', 'Purwanto', 'Sugianto', 'Mulyono', 'Priyono', 'Widodo'],
        female: ['Siti', 'Sri', 'Endang', 'Sulistyowati', 'Retno', 'Titik', 'Wulan', 'Dewi', 'Indah', 'Ratna', 'Lestari', 'Ningsih', 'Utami', 'Wahyuni', 'Susanti', 'Purwanti', 'Astuti', 'Rahayu', 'Widya', 'Suryani', 'Mulyani', 'Handayani', 'Wati', 'Yuliana', 'Marwati', 'Sumiati', 'Kusuma', 'Sumarni', 'Puspita', 'Cahyani'],
        surname: ['Sutrisno', 'Prabowo', 'Suryanto', 'Widodo', 'Santoso', 'Hartono', 'Mulyono', 'Priyono', 'Subiyanto', 'Purwanto', 'Sugianto', 'Basuki', 'Wiranto', 'Suharto', 'Gatot', 'Setiawan', 'Kurniawan', 'Wibowo', 'Nugroho', 'Haryanto', 'Darmawan', 'Raharjo', 'Sudarsono', 'Gunawan', 'Susanto', 'Pranoto', 'Sulistyo', 'Handoko', 'Riyanto', 'Yulianto']
    },
    MALAY: {
        male: ['Ahmad', 'Abdul', 'Muhammad', 'Ali', 'Hassan', 'Ibrahim', 'Ismail', 'Omar', 'Yusof', 'Zakaria', 'Rahman', 'Salleh', 'Mahmud', 'Sulaiman', 'Rashid', 'Hamid', 'Karim', 'Rahim', 'Latif', 'Halim', 'Razak', 'Aziz', 'Nasir', 'Hakim', 'Farid', 'Nizam', 'Zain', 'Bakar', 'Azman', 'Rosli'],
        female: ['Siti', 'Fatimah', 'Aminah', 'Khadijah', 'Zainab', 'Hafsah', 'Aishah', 'Maryam', 'Halimah', 'Ruqayyah', 'Safiyyah', 'Ummu', 'Raudhah', 'Wardina', 'Nur', 'Farah', 'Sarah', 'Laila', 'Aisyah', 'Nabila', 'Salma', 'Huda', 'Iman', 'Hidayah', 'Syahirah', 'Alya', 'Syafiqah', 'Widad', 'Zara', 'Qistina'],
        surname: ['Abdullah', 'Rahman', 'Ibrahim', 'Ahmad', 'Hassan', 'Ali', 'Muhammad', 'Yusof', 'Ismail', 'Omar', 'Zakaria', 'Mahmud', 'Salleh', 'Sulaiman', 'Rashid', 'Hamid', 'Karim', 'Rahim', 'Latif', 'Halim', 'Razak', 'Aziz', 'Nasir', 'Hakim', 'Farid', 'Nizam', 'Zain', 'Bakar', 'Azman', 'Rosli']
    },
    // Conservative given-name pool for Muslim communities in the pre-1945
    // Malay-Indonesian archipelago. A single given name is safer here than
    // inventing a modern hereditary surname for an ordinary historical person.
    MALAY_ISLAMIC_HISTORICAL: {
        male: ['Ahmad', 'Muhammad', 'Ali', 'Hasan', 'Husain', 'Ibrahim', 'Ismail', 'Umar', 'Yusuf', 'Zakaria', 'Mahmud', 'Sulaiman', 'Hamzah', 'Jafar', 'Abdullah', 'Abdul Rahman'],
        female: ['Siti', 'Fatimah', 'Aminah', 'Khadijah', 'Zainab', 'Aishah', 'Maryam', 'Halimah', 'Safiyyah', 'Salmah', 'Nur', 'Ruqayyah'],
        surname: ['(No Surname)']
    },
    INDONESIAN: {
        male: ['Budi', 'Agus', 'Hendra', 'Dedi', 'Eko', 'Rudi', 'Joko', 'Wahyu', 'Bambang', 'Yudi', 'Andi', 'Indra', 'Yanto', 'Hadi', 'Slamet', 'Tono', 'Dwi', 'Rizki', 'Adi', 'Bayu', 'Dimas', 'Fajar', 'Gilang', 'Heri', 'Irfan', 'Kuncoro', 'Lutfi', 'Maulana', 'Nova', 'Ozi'],
        female: ['Sri', 'Sari', 'Dewi', 'Ratna', 'Indah', 'Maya', 'Rina', 'Yuni', 'Wati', 'Lestari', 'Fitri', 'Nur', 'Ayu', 'Dian', 'Eka', 'Farida', 'Gita', 'Hani', 'Ika', 'Jihan', 'Kania', 'Lia', 'Mega', 'Nina', 'Olivia', 'Putri', 'Qory', 'Rani', 'Sinta', 'Tyas'],
        surname: ['Setiawan', 'Gunawan', 'Wijaya', 'Santoso', 'Kurniawan', 'Wibowo', 'Sutrisno', 'Hartono', 'Susanto', 'Pranoto', 'Suryanto', 'Nugroho', 'Darmawan', 'Prabowo', 'Haryanto', 'Sudarsono', 'Raharjo', 'Widodo', 'Iskandar', 'Sugiarto', 'Maulana', 'Permana', 'Suharto', 'Pratama', 'Nurdiansyah', 'Mahendra', 'Kusuma', 'Utomo', 'Syahputra', 'Rahman']
    },
    FILIPINO: {
        male: ['Bayani', 'Datu', 'Lapu', 'Makisig', 'Rajah', 'Juan', 'Jose', 'Miguel', 'Rafael', 'Gabriel', 'Daniel', 'Carlos', 'Antonio', 'Pedro', 'Francisco', 'Manuel', 'Ricardo', 'Eduardo', 'Roberto', 'Alberto', 'Rodrigo', 'Diego', 'Fernando', 'Andres', 'Emilio', 'Ramon', 'Luis', 'Mario', 'Ernesto', 'Alfredo'],
        female: ['Diwata', 'Tala', 'Mayumi', 'Ligaya', 'Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Gloria', 'Elena', 'Lucia', 'Isabel', 'Cristina', 'Patricia', 'Josefina', 'Luisa', 'Esperanza', 'Concepcion', 'Remedios', 'Corazon', 'Milagros', 'Felicidad', 'Paz', 'Soledad', 'Rosario', 'Aurora', 'Estrella', 'Angelica', 'Beatriz'],
        surname: ['dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Gonzales', 'Castillo', 'Cruz', 'Morales', 'Rodriguez', 'Lopez', 'Martinez', 'Hernandez', 'Villanueva', 'Santiago', 'Ramos', 'Aquino', 'Bautista', 'Fernandez', 'Gutierrez', 'Valdez', 'Rivera', 'Mercado', 'Dizon', 'Navarro', 'Salazar', 'Domingo', 'Aguilar']
    },

    // === EASTERN EUROPEAN SPECIFICS ===
    CZECH: {
        male: ['Jan', 'Petr', 'Josef', 'Pavel', 'Tomas', 'Jaroslav', 'Frantisek', 'Miroslav', 'Vaclav', 'Martin', 'Jiri', 'Michal', 'Vladislav', 'Lukas', 'David', 'Jakub', 'Stanislav', 'Ladislav', 'Ondrej', 'Radek', 'Marek', 'Filip', 'Ales', 'Milan', 'Viktor', 'Roman', 'Daniel', 'Adam', 'Matej', 'Vojtech'],
        female: ['Marie', 'Jana', 'Eva', 'Anna', 'Hana', 'Vera', 'Alena', 'Lenka', 'Kvetoslava', 'Jarmila', 'Ludmila', 'Helena', 'Jirina', 'Božena', 'Zuzana', 'Libuse', 'Milada', 'Vlasta', 'Jaromira', 'Marketa', 'Tereza', 'Katerina', 'Petra', 'Simona', 'Michaela', 'Veronika', 'Barbora', 'Klara', 'Adela', 'Nikola'],
        surname: ['Novak', 'Svoboda', 'Novotny', 'Dvorak', 'Cerny', 'Prochazka', 'Krejci', 'Horak', 'Nemec', 'Pokorny', 'Pospisil', 'Havel', 'Kadlec', 'Ruzicka', 'Benes', 'Fiala', 'Sedlacek', 'Dolejsi', 'Zeman', 'Nguyen', 'Kucerov', 'Vesely', 'Bartos', 'Kolar', 'Cervenka', 'Urban', 'Brabec', 'Sikora', 'Machacek', 'Tuma']
    },
    HUNGARIAN_MODERN: {
        male: ['József', 'János', 'László', 'István', 'Ferenc', 'Sándor', 'Gábor', 'Péter', 'Zoltán', 'Attila', 'Tamás', 'Balázs', 'Mihály', 'Tibor', 'András', 'Károly', 'Géza', 'Imre', 'Gyula', 'Béla', 'Árpád', 'Kálmán', 'Ernő', 'Jenő', 'Viktor', 'Dezső', 'Olivér', 'Ákos', 'Csaba', 'Levente'],
        female: ['Mária', 'Erzsébet', 'Katalin', 'Ilona', 'Éva', 'Anna', 'Margit', 'Judit', 'Andrea', 'Krisztina', 'Ágnes', 'Zsuzsanna', 'Gabriella', 'Mónika', 'Erika', 'Aniko', 'Beatrix', 'Brigitta', 'Csilla', 'Dorottya', 'Eszter', 'Fanni', 'Hajnalka', 'Ildikó', 'Julianna', 'Klára', 'Lívia', 'Noémi', 'Orsolya', 'Réka'],
        surname: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete', 'Szűcs', 'Kerekes', 'Antal', 'Magyar', 'Gál', 'Fülöp', 'Hegedűs', 'Deák', 'Hajdu', 'Vincze']
    },
    ROMANIAN: {
        male: ['Ion', 'Gheorghe', 'Nicolae', 'Vasile', 'Dumitru', 'Petru', 'Constantin', 'Stefan', 'Marin', 'Florin', 'Adrian', 'Mihai', 'Dan', 'Lucian', 'Cristian', 'Alexandru', 'George', 'Marius', 'Daniel', 'Dragos', 'Radu', 'Catalin', 'Bogdan', 'Andrei', 'Sorin', 'Liviu', 'Ionut', 'Viorel', 'Gabriel', 'Cosmin'],
        female: ['Maria', 'Elena', 'Ioana', 'Ana', 'Mihaela', 'Daniela', 'Cristina', 'Andreea', 'Carmen', 'Lidia', 'Monica', 'Simona', 'Alina', 'Gabriela', 'Diana', 'Roxana', 'Oana', 'Luminita', 'Florentina', 'Adina', 'Camelia', 'Lavinia', 'Raluca', 'Corina', 'Nicoleta', 'Ramona', 'Viorica', 'Florina', 'Lacramioara', 'Georgiana'],
        surname: ['Popescu', 'Popa', 'Pop', 'Radu', 'Stoica', 'Dragomir', 'Munteanu', 'Dima', 'Georgescu', 'Matei', 'Barbu', 'Nistor', 'Florea', 'Diaconu', 'Toma', 'Stancu', 'Mocanu', 'Grigore', 'Iancu', 'Marinescu', 'Dumitrescu', 'Rusu', 'Cristea', 'Mihai', 'Preda', 'Andrei', 'Nicolae', 'Radulescu', 'Ionescu', 'Constantinescu']
    },
    BULGARIAN: {
        male: ['Ivan', 'Georgi', 'Dimitar', 'Nikolai', 'Petar', 'Stefan', 'Hristo', 'Todor', 'Angel', 'Bozhidar', 'Vasil', 'Asen', 'Kamen', 'Rumen', 'Plamen', 'Lyubomir', 'Zdravko', 'Stanimir', 'Borislav', 'Radoslav', 'Milen', 'Valentin', 'Emil', 'Yordan', 'Krasimir', 'Atanas', 'Kiril', 'Pavel', 'Martin', 'Alexander'],
        female: ['Maria', 'Elena', 'Svetlana', 'Valentina', 'Nadia', 'Gergana', 'Desislava', 'Tsvetanka', 'Rumiana', 'Milena', 'Zlatka', 'Anelia', 'Daniela', 'Vesela', 'Miglena', 'Radka', 'Teodora', 'Bilyana', 'Petya', 'Galina', 'Iskra', 'Rositsa', 'Boryana', 'Dimitrina', 'Yordanka', 'Kalina', 'Margarita', 'Antonia', 'Silviya', 'Kristina'],
        surname: ['Ivanov', 'Petrov', 'Dimitrov', 'Georgiev', 'Nikolov', 'Hristov', 'Todorov', 'Angelov', 'Stoyanov', 'Stefanov', 'Vasilev', 'Bozhilov', 'Kamenov', 'Rumenov', 'Plamenov', 'Lyubomirov', 'Zdravkov', 'Stanimirov', 'Borislavov', 'Radoslavov', 'Milenov', 'Valentinov', 'Emilov', 'Yordanov', 'Krasimirov', 'Atanasov', 'Kirilov', 'Pavlov', 'Martinov', 'Alexandrov']
    },
    SERBIAN: {
        male: ['Marko', 'Stefan', 'Nikola', 'Aleksandar', 'Milos', 'Luka', 'Filip', 'Nemanja', 'Dusan', 'Vladimir', 'Petar', 'Milan', 'Jovana', 'Bogdan', 'Dejan', 'Zoran', 'Dragan', 'Goran', 'Sasa', 'Branko', 'Predrag', 'Nebojsa', 'Miroslav', 'Rajko', 'Slobodan', 'Milorad', 'Bojan', 'Darko', 'Srdjan', 'Velimir'],
        female: ['Ana', 'Marija', 'Jovana', 'Milica', 'Aleksandra', 'Tamara', 'Jelena', 'Nadja', 'Sara', 'Teodora', 'Mina', 'Isidora', 'Andrea', 'Anja', 'Sofija', 'Una', 'Katarina', 'Magdalena', 'Petra', 'Iva', 'Dunja', 'Mila', 'Andjela', 'Lara', 'Nevena', 'Maša', 'Emilija', 'Vanja', 'Kristina', 'Dragana'],
        surname: ['Jovanovic', 'Petrovic', 'Nikolic', 'Stojanovic', 'Popovic', 'Milosevic', 'Markovic', 'Djordjevic', 'Stankovic', 'Ilic', 'Pavlovic', 'Milenkovic', 'Vasic', 'Tosic', 'Radic', 'Savic', 'Antic', 'Milic', 'Stefanovic', 'Bogdanovic', 'Zivojinovic', 'Mladenovic', 'Andjelkovic', 'Lazic', 'Matic', 'Simic', 'Dimitrijevic', 'Vukovic', 'Radovanovic', 'Jankovic']
    },
    CROATIAN: {
        male: ['Marko', 'Luka', 'Filip', 'David', 'Mateo', 'Petar', 'Antonio', 'Josip', 'Ivan', 'Matej', 'Dario', 'Nikola', 'Lovro', 'Tomislav', 'Kristijan', 'Stjepan', 'Mario', 'Ante', 'Zvonimir', 'Dragan', 'Miljenko', 'Davor', 'Goran', 'Zoran', 'Ivo', 'Branko', 'Mladen', 'Božo', 'Zdravko', 'Franjo'],
        female: ['Petra', 'Ana', 'Lucija', 'Ema', 'Sara', 'Lana', 'Mia', 'Tea', 'Elena', 'Nika', 'Marija', 'Klara', 'Iva', 'Karin', 'Dora', 'Paula', 'Antonija', 'Karla', 'Marta', 'Nina', 'Lara', 'Anja', 'Barbara', 'Katarina', 'Mirna', 'Vesna', 'Gordana', 'Božica', 'Ljiljana', 'Jadranka'],
        surname: ['Horvat', 'Kovačić', 'Babić', 'Marić', 'Novak', 'Jurić', 'Knežević', 'Marković', 'Petrović', 'Matić', 'Tomić', 'Kovačević', 'Šimić', 'Božić', 'Blažević', 'Pavić', 'Grgić', 'Radić', 'Pavlović', 'Vuković', 'Lovrić', 'Jukić', 'Zec', 'Šarić', 'Stipić', 'Bilić', 'Cvjetković', 'Dragić', 'Filipović', 'Galić']
    },

    // === CENTRAL ASIAN SPECIFICS ===
    KAZAKH: {
        male: ['Abai', 'Almas', 'Arman', 'Askhat', 'Baurzhan', 'Beibit', 'Damir', 'Dias', 'Dinmukhamed', 'Erlan', 'Galymzhan', 'Kanat', 'Marat', 'Nurasyl', 'Olzhas', 'Rustem', 'Samat', 'Serik', 'Talgat', 'Timur', 'Askar', 'Bakhytzhan', 'Darkhan', 'Eldos', 'Farabi', 'Kairat', 'Maksut', 'Nurlan', 'Saltanat', 'Yerzhan'],
        female: ['Aida', 'Aigerim', 'Aizhan', 'Akmaral', 'Assel', 'Bakhyt', 'Daniya', 'Gulnara', 'Indira', 'Kamila', 'Karlygash', 'Kundyz', 'Madina', 'Nazgul', 'Raushan', 'Saule', 'Symbat', 'Togzhan', 'Ulbala', 'Zhansaya', 'Ainur', 'Balzhan', 'Dinara', 'Elmira', 'Fariza', 'Gaukhar', 'Kamshat', 'Meruyert', 'Perizat', 'Saltanat'],
        surname: ['Nazarbayev', 'Tokayev', 'Kasymov', 'Masanov', 'Sarybaev', 'Omarov', 'Zhumabekov', 'Karimov', 'Serikbaev', 'Akhmetov', 'Tursunbaev', 'Kenzhebaev', 'Urazbaev', 'Suleimenov', 'Iskakov', 'Zhakypov', 'Mukanov', 'Berdyev', 'Kozhakhmetov', 'Aydarbaev', 'Kairatuly', 'Alikhanuly', 'Tolegenuly', 'Dauletuly', 'Serikuly', 'Abilkhanuly', 'Kairatovich', 'Serikovich', 'Tolegenovich', 'Dauletovich']
    },
    UZBEK: {
        male: ['Akmal', 'Alisher', 'Aziz', 'Bobur', 'Davron', 'Dilshod', 'Farhod', 'Gulom', 'Hamza', 'Islom', 'Jasur', 'Kamol', 'Laziz', 'Muhammed', 'Nodir', 'Otabek', 'Pulat', 'Ravshan', 'Sanjar', 'Temur', 'Ulugbek', 'Vohid', 'Xasan', 'Yusuf', 'Zafar', 'Abbos', 'Bakhtiyor', 'Doniyor', 'Elbek', 'Feruz'],
        female: ['Aziza', 'Dilnoza', 'Feruza', 'Gulnoza', 'Hilola', 'Iroda', 'Jamila', 'Kamola', 'Latifa', 'Mavluda', 'Nafisa', 'Ozoda', 'Parvina', 'Roziya', 'Sabina', 'Tanzila', 'Umida', 'Vasila', 'Ximoya', 'Yulduz', 'Zarina', 'Adolat', 'Barno', 'Dilafruz', 'Elmira', 'Fazila', 'Gulchehra', 'Husnora', 'Iqbol', 'Jahongir'],
        surname: ['Karimov', 'Mirziyoyev', 'Rakhmonov', 'Saidov', 'Toshmatov', 'Umarov', 'Vakhobov', 'Xolmatov', 'Yusupov', 'Zokirov', 'Abdullayev', 'Baxtiyorov', 'Davlatov', 'Erkinov', 'Fayzullayev', 'Gulomov', 'Hakimov', 'Ismoilov', 'Juraev', 'Komilov', 'Latipov', 'Mahmudov', 'Normatov', 'Olimov', 'Pulatov', 'Rustamov', 'Sobirov', 'Turdiev', 'Usmonov', 'Valiyev']
    },
    KYRGYZ: {
        male: ['Adilet', 'Almaz', 'Askar', 'Azamat', 'Bakyt', 'Bektur', 'Dastan', 'Ermek', 'Gulzar', 'Kanybek', 'Manas', 'Nurdin', 'Omurbek', 'Ruslan', 'Sanzhar', 'Taalai', 'Ulan', 'Zhanybek', 'Akylbek', 'Bakirdin', 'Cholpon', 'Daniyar', 'Eldiyar', 'Farkhad', 'Kadyrbek', 'Maksat', 'Nurlan', 'Sanjar', 'Timur', 'Ulanbek'],
        female: ['Aida', 'Bermet', 'Cholpon', 'Dinara', 'Elnura', 'Gulzat', 'Jyldyz', 'Kanykei', 'Medina', 'Nazgul', 'Perizat', 'Saira', 'Tolkun', 'Umut', 'Zarina', 'Ainagul', 'Baktygul', 'Chynara', 'Elmira', 'Gulnara', 'Kunduz', 'Nurgul', 'Saltanat', 'Venera', 'Zamira', 'Asel', 'Burul', 'Damira', 'Gulsara', 'Kalima'],
        surname: ['Jeenbekov', 'Atambaev', 'Akayev', 'Bakiyev', 'Isakov', 'Mamatov', 'Orozov', 'Satybaldiev', 'Tashiev', 'Usubaliev', 'Abdyldaev', 'Bakirov', 'Davletov', 'Ergeshov', 'Kasybekov', 'Moldokmatov', 'Nurmatov', 'Osmonov', 'Rayimkulov', 'Sharipov', 'Temirov', 'Urmatov', 'Zulpukarov', 'Aitmatov', 'Beishenaliev', 'Choroev', 'Dzhumakadyrov', 'Esengaliev', 'Kydyraliev', 'Mamytov']
    },
    TURKMEN: {
        male: ['Agamyrat', 'Atamyrat', 'Berdimuhamedow', 'Dovletmyrat', 'Gurbansoltan', 'Maksat', 'Niyazov', 'Oguzhan', 'Serdar', 'Wyacheslav', 'Amangeldy', 'Batyr', 'Dowletgeldi', 'Gurbanmyrat', 'Kerim', 'Meret', 'Oraz', 'Rustam', 'Tachmyrat', 'Yklym', 'Akmyrat', 'Begench', 'Dovrangeldi', 'Gurbanguly', 'Kemal', 'Myrat', 'Orazmyrat', 'Saparmurad', 'Tagamyrat', 'Yazmyrat'],
        female: ['Akgul', 'Aygul', 'Bibi', 'Gulnar', 'Jamila', 'Leyli', 'Maral', 'Nazik', 'Ogulabat', 'Soltan', 'Altyn', 'Bahar', 'Gozal', 'Jennet', 'Mahri', 'Nargiz', 'Ogulabibi', 'Rahima', 'Shirin', 'Yasmyn', 'Ayna', 'Begul', 'Gulzada', 'Jemile', 'Mambet', 'Nazgul', 'Orazsoltan', 'Sona', 'Turkan', 'Ziba'],
        surname: ['Berdimuhamedow', 'Niyazov', 'Gurbanguly', 'Atayev', 'Durdyev', 'Geldyev', 'Hojayev', 'Jumaev', 'Kurbanov', 'Mamedov', 'Nuryev', 'Orazov', 'Rejepov', 'Saparmuradov', 'Tachmyradov', 'Yazmuradov', 'Agayev', 'Berdyev', 'Durdymyradov', 'Garayev', 'Ilyasov', 'Kadyrov', 'Muradov', 'Omarov', 'Sadykov', 'Urazov', 'Veliyev', 'Yusupov', 'Charyyev', 'Hojanepesov']
    },

    // === SPECIFIC PACIFIC ISLANDS ===
    HAWAIIAN: {
        male: ['Koa', 'Keoni', 'Kawika', 'Ikaika', 'Akamu', 'Keanu', 'Makoa', 'Kekoa', 'Kahoku', 'Kanoa', 'Kalani', 'Kaleo', 'Keola', 'Kainoa', 'Keawe', 'Kekai', 'Kapono', 'Lopaka', 'Mahina', 'Nalani', 'Pika', 'Tane', 'Ulani', 'Waika', 'Keali', 'Kimo', 'Kaipo', 'Kamal', 'Kanaloa', 'Kamalu'],
        female: ['Leilani', 'Malia', 'Nalani', 'Mahina', 'Naia', 'Lehua', 'Pua', 'Kalani', 'Noelani', 'Kalea', 'Mele', 'Pikake', 'Lilia', 'Anela', 'Kailani', 'Mailani', 'Kaila', 'Kawena', 'Akela', 'Ailana', 'Eleu', 'Haumea', 'Iolana', 'Kaia', 'Laka', 'Moana', 'Nayeli', 'Olina', 'Palila', 'Ulani'],
        surname: ['o Koa', 'o Keoni', 'o Kawika', 'o Ikaika', 'o Akamu', 'o Keanu', 'o Makoa', 'o Kekoa', 'o Kahoku', 'o Kanoa', 'o Kalani', 'o Kaleo', 'o Keola', 'o Kainoa', 'o Keawe', 'o Kekai', 'o Kapono', 'o Lopaka', 'o Mahina', 'o Nalani']
    },
    TAHITIAN: {
        male: ['Teiva', 'Marama', 'Pito', 'Terai', 'Hiro', 'Manuarii', 'Pomare', 'Tuahine', 'Teriitearia', 'Mahina', 'Heimana', 'Vaitea', 'Teikihuupoko', 'Teriimana', 'Tehei', 'Teva', 'Tuanaki', 'Raimana', 'Taumalolo', 'Vaite', 'Teiti', 'Heiarii', 'Tuianu', 'Moea', 'Teanua', 'Vaea', 'Ahuarii', 'Teariki', 'Tauatua', 'Terupe'],
        female: ['Tiare', 'Moea', 'Raina', 'Maeva', 'Vaimiti', 'Terehia', 'Hinanui', 'Tehina', 'Vaiata', 'Maituarii', 'Rava', 'Titaua', 'Tarita', 'Teiva', 'Poehina', 'Vaiana', 'Hinatea', 'Mehiata', 'Teuira', 'Vaitea', 'Tehei', 'Moina', 'Raita', 'Teariki', 'Vahine', 'Poema', 'Marama', 'Heiata', 'Teura', 'Mareva'],
        surname: ['a Teiva', 'a Marama', 'a Pito', 'a Terai', 'a Hiro', 'a Manuarii', 'a Pomare', 'a Tuahine', 'a Mahina', 'a Heimana', 'a Vaitea', 'a Teriimana', 'a Tehei', 'a Teva', 'a Tuanaki', 'a Raimana', 'a Taumalolo', 'a Vaite', 'a Teiti', 'a Heiarii']
    },
    SAMOAN: {
        male: ['Sione', 'Tavita', 'Paulo', 'Lemi', 'Filipo', 'Ioane', 'Mika', 'Pita', 'Siaki', 'Toma', 'Falaniko', 'Iakopo', 'Mose', 'Siaosi', 'Teleke', 'Uelese', 'Viliami', 'Salesi', 'Tanielu', 'Iosua', 'Simona', 'Lopeti', 'Kalolo', 'Manoa', 'Pauli', 'Setu', 'Tuifua', 'Vaea', 'Alamai', 'Faletau'],
        female: ['Sina', 'Mele', 'Ana', 'Luisa', 'Mere', 'Salote', 'Talei', 'Vika', 'Elisapeta', 'Katalina', 'Losa', 'Maria', 'Penelopi', 'Silia', 'Teuila', 'Vaofou', 'Adeline', 'Faasisina', 'Ilaisa', 'Leilua', 'Moana', 'Noumea', 'Peka', 'Rosita', 'Taimalelagi', 'Vaitoa', 'Christina', 'Fialelei', 'Lagi', 'Tausala'],
        surname: ['Tuisamoa', 'Malietoa', 'Mataafa', 'Tamasese', 'Tuimalealiifano', 'Tuiatua', 'Tuivaga', 'Aiono', 'Leaupepe', 'Luamanuvao', 'Namulauulu', 'Papalii', 'Seumanutafa', 'Tanuvasa', 'Tootoovao', 'Tuatagaloa', 'Vaai', 'Afamasaga', 'Faumuina', 'Fuimaono']
    },
    TONGAN: {
        male: ['Tevita', 'Sione', 'Pita', 'Sitiveni', 'Viliami', 'Paula', 'Manu', 'Salote', 'Koli', 'Folau', 'Tevita', 'Finau', 'Latu', 'Moala', 'Pohiva', 'Taumalolo', 'Vea', 'Afeaki', 'Havea', 'Kilikiti', 'Lopeti', 'Mafile', 'Naufahu', 'Palani', 'Sia', 'Taufua', 'Uikelotu', 'Vaipulu', 'Wolfgramm', 'Faka'],
        female: ['Salote', 'Mele', 'Ana', 'Sela', 'Mere', 'Luisa', 'Ofa', 'Vika', 'Talei', 'Lupe', 'Malia', 'Siutiti', 'Tevita', 'Losaline', 'Pilimilose', 'Seini', 'Telani', 'Vahe', 'Amelia', 'Filomena', 'Kalo', 'Lavinia', 'Makerita', 'Nola', 'Penina', 'Semisi', 'Tupou', 'Unaloto', 'Veiongo', 'Alohalani'],
        surname: ['Tupou', 'Moala', 'Finau', 'Latu', 'Pohiva', 'Taumalolo', 'Vea', 'Afeaki', 'Havea', 'Kilikiti', 'Lopeti', 'Mafile', 'Naufahu', 'Palani', 'Sia', 'Taufua', 'Uikelotu', 'Vaipulu', 'Wolfgramm', 'Faka', 'Helu', 'Kaho', 'Manu', 'Otai', 'Puloka', 'Taione', 'Vake', 'Aleamotu', 'Fonua', 'Kaufusi']
    },
    FIJIAN: {
        male: ['Jone', 'Ratu', 'Seru', 'Temo', 'Viliame', 'Watisoni', 'Aminiasi', 'Josaia', 'Lemeki', 'Marika', 'Penioni', 'Sakiasi', 'Tomasi', 'Alipate', 'Isoa', 'Kolinio', 'Manasa', 'Neumi', 'Pauliasi', 'Semiti', 'Uraia', 'Viliami', 'Apakuki', 'Ilaisa', 'Kitione', 'Milika', 'Osea', 'Seremaia', 'Tevita', 'Waisea'],
        female: ['Mere', 'Salote', 'Ana', 'Litia', 'Maria', 'Sala', 'Teresia', 'Adi', 'Bulou', 'Episalote', 'Kesaia', 'Makereta', 'Salanieta', 'Talei', 'Vasiti', 'Alisi', 'Fulori', 'Kelera', 'Lusi', 'Naomi', 'Salote', 'Tokasa', 'Varanisese', 'Asenaca', 'Ilisapeci', 'Loloma', 'Milika', 'Raijeli', 'Sera', 'Una'],
        surname: ['Bose', 'Dakuwaqa', 'Leweniqila', 'Mataitoga', 'Nailatikau', 'Ratunabuabua', 'Seniloli', 'Tavatavanawai', 'Vuanirewa', 'Waqa', 'Cakobau', 'Ganilau', 'Koroilavesau', 'Mara', 'Qarase', 'Roko', 'Tui', 'Vuki', 'Bolabola', 'Cavuilati']
    },
    /**
     * Guam and the Marianas after the Spanish mission of 1668.
     *
     * Micronesia had no name set at all, so its region rule listed four
     * colonial ones — Spanish, German, Japanese, English — and every persona
     * born in the islands from 1668 onwards was one of the administrators. In
     * 1900 Guam that gave Otto Krause and Midori Abe on an island that was
     * overwhelmingly Chamorro.
     *
     * Given names are Spanish because the mission made them so; the surnames
     * are the Chamorro ones borne on Guam and Saipan today, several of which
     * (Taitano, Quitugua, Pangelinan, Chargualaf) are Chamorro rather than
     * Spanish and none of which are the administrators'.
     */
    CHAMORRO: {
        male: ['Juan', 'Jose', 'Vicente', 'Francisco', 'Antonio', 'Pedro', 'Ignacio', 'Ramon', 'Joaquin', 'Manuel', 'Luis', 'Jesus', 'Felix', 'Tomas', 'Mariano', 'Eduardo', 'Benigno', 'Carlos', 'Rafael', 'Gregorio'],
        female: ['Maria', 'Rosa', 'Ana', 'Josefa', 'Carmen', 'Dolores', 'Concepcion', 'Rita', 'Isabel', 'Teresita', 'Juana', 'Antonia', 'Soledad', 'Consuelo', 'Remedios', 'Asuncion', 'Magdalena', 'Vicenta', 'Francisca', 'Encarnacion'],
        surname: ['Cruz', 'Santos', 'Camacho', 'Taitano', 'Quitugua', 'Pangelinan', 'Sablan', 'Guerrero', 'Borja', 'Aguon', 'Tenorio', 'Babauta', 'Blas', 'Cepeda', 'Chargualaf', 'Duenas', 'Manglona', 'Muna', 'Salas', 'Mendiola']
    },
    /**
     * The Carolines, the Marshalls and the Gilberts — Chuuk, Pohnpei, Kosrae,
     * Yap, Majuro, Tarawa. A different naming world from the Marianas, and
     * mission-influenced from the 1850s rather than the 1660s, so the given
     * names are a genuine mixture of Indigenous and biblical.
     *
     * Approximate rather than exhaustive: these are five language families in
     * one set, kept together because the map region does not distinguish them.
     */
    MICRONESIAN: {
        male: ['Kessai', 'Litokwa', 'Amata', 'Anote', 'Teburoro', 'Taneti', 'Ieremia', 'Manny', 'Redley', 'Sebastian', 'Wesley', 'Jurelang', 'Ruben', 'Tarcisius', 'Bailey', 'Emanuel', 'Peter', 'Halvorsen', 'Kaiko', 'Berman'],
        female: ['Hilda', 'Lijon', 'Neijon', 'Teuru', 'Tekarei', 'Rosalia', 'Mariana', 'Emi', 'Kiluwe', 'Sisilia', 'Marlene', 'Doreen', 'Anna', 'Teresia', 'Nariko', 'Loeak', 'Betwel', 'Elina', 'Tiare', 'Nahnken'],
        surname: ['Kabua', 'Loeak', 'Heine', 'Note', 'Zackhras', 'Tong', 'Tito', 'Teannaki', 'Tabai', 'Nakayama', 'Mori', 'Christian', 'Falcam', 'Panuelo', 'Silk', 'Elimo', 'Mailo', 'Sigrah', 'Tosie', 'Weilbacher']
    },
    /**
     * Sakha (Yakut), Buryat and Evenk, for the Siberia region.
     *
     * Its rule was `['RUSSIAN']` and nothing else from 1600 onwards, so the
     * peoples the conquest found there stopped existing in the generator on
     * the year the first Cossack fort went up. Russians did become the large
     * majority of Siberia — this set is weighted as the minority it is, not
     * removed as the absence it was.
     *
     * Surnames are Russified because they are: civil registration in the
     * Russian Empire and then the USSR gave Sakha and Buryat families
     * -ov/-ev names, and those are what people carry.
     */
    SIBERIAN_INDIGENOUS: {
        male: ['Ayaal', 'Aisen', 'Uyguun', 'Nyurgun', 'Erchim', 'Dokhsun', 'Sargylan', 'Bair', 'Bator', 'Zorigto', 'Dorzho', 'Ayuur', 'Batu', 'Gomboyn', 'Rinchin', 'Tumen', 'Damdin', 'Sanzhi', 'Chimit', 'Bulat'],
        female: ['Sardaana', 'Kyunnei', 'Aiyyna', 'Tuyaara', 'Nariyana', 'Keskil', 'Michiye', 'Sesegma', 'Dulma', 'Erzhena', 'Namjilma', 'Tuyana', 'Oyuuna', 'Handa', 'Darima', 'Bairma', 'Sajaana', 'Solongo', 'Aryuna', 'Zhargalma'],
        surname: ['Nikolaev', 'Sleptsov', 'Gogolev', 'Struchkov', 'Ivanov', 'Popov', 'Sivtsev', 'Alekseev', 'Dashiev', 'Tsydenov', 'Badmaev', 'Ochirov', 'Rinchinov', 'Zhamsuev', 'Bazarov', 'Dorzhiev', 'Budaev', 'Garmaev', '(No Surname)', '(No Surname)']
    },

    // === OCEANIA BEFORE THE MISSIONS ===
    /**
     * Every set above this comment — SAMOAN, TONGAN, FIJIAN, HAWAIIAN,
     * TAHITIAN, MELANESIAN, POLYNESIAN — is a *mission-era* register, and the
     * era gate had them floored at the settlement date of the islands instead.
     * Settlement certifies that the people were there. It says nothing about
     * when the names were used. So Sione and Ioane (John), Viliami (William),
     * Iakopo (Jacob), Mose, Maria, Kawika (David), Keoni (John), Lopaka
     * (Robert), Jone, Petero, Mosese — and the Amelia, Filomena and Lavinia in
     * the Tongan list — were all reachable in the Bronze Age, roughly 2,600
     * years before the London Missionary Society reached Tahiti.
     *
     * The sets below cover the period from settlement to the mission. They draw
     * on three things, in descending order of confidence: individuals named in
     * recorded genealogy (Tuʻi Tonga succession, Hawaiian moʻokūʻauhau, Māori
     * whakapapa, the sons of Pili in Samoa); individuals recorded by the first
     * European visitors before missionaries arrived — Wallis and Cook in the
     * Societies, Cook in Tonga and Hawaiʻi; and, where those run out, ordinary
     * compounds built from the naming elements those sources show in use (Te-,
     * Tu-, Ka-, Hine-, -ariki/-aliki/-aliʻi, -lani/-rangi/-lagi, -nui, -roa).
     * The female lists are shorter than the male ones everywhere, because the
     * record is: chiefly genealogy names women when they carry rank and title,
     * and the European visitors mostly wrote down men.
     *
     * Three honest limits. Polynesian names were freely coined and frequently
     * changed — at an event, on taking a title, or when a chief's name became
     * tapu — so any fixed list understates how inventive the real system was.
     * No name here is a surname: descent was stated as a phrase, and rank came
     * from titles held rather than names inherited. And the attested
     * individuals cluster in the last few centuries of each window, because
     * that is where the genealogies are dense and the visitors were writing —
     * so a persona in 1200 may carry the name of someone recorded in 1770.
     * That is a real error, but a much smaller one than the mission names it
     * replaces: Kaʻahumanu and Cakobau are ordinary formations in a continuous
     * tradition, whereas Amelia and Sione could not exist before the press.
     */
    POLYNESIAN_PRECONTACT: {
        male: ['Tui', 'Aliki', 'Toa', 'Tautai', 'Fetu', 'Malama', 'Matagi', 'Moana', 'Manu', 'Vaka', 'Tama', 'Hau', 'Fatu', 'Lagi', 'Vasa', 'Fanua', 'Ao', 'Mahina', 'Tupua', 'Kaveinga'],
        female: ['Sina', 'Hina', 'Lupe', 'Masina', 'Fetuao', 'Moana', 'Vai', 'Lagi', 'Ata', 'Malama', 'Ua', 'Alofa', 'Vaine', 'Marama', 'Fua', 'Niu', 'Mahina', 'Tiare'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /** Aotearoa from settlement (c. 1250) to the mission presses of the 1810s. */
    MAORI_PRECONTACT: {
        male: ['Kupe', 'Toi', 'Whātonga', 'Turi', 'Hoturoa', 'Tamatea', 'Ngātoro-i-rangi', 'Tama-te-kapua', 'Rakaihautū', 'Paikea', 'Uenuku', 'Rangitihi', 'Tūhourangi', 'Porourangi', 'Tahupōtiki', 'Rongokako', 'Kahungunu', 'Ruapani', 'Māhaki', 'Manaia', 'Ruaeo', 'Tūwharetoa', 'Tūtānekai', 'Hotunui', 'Marutūāhu', 'Rāhiri', 'Nukutawhiti', 'Toroa', 'Puhi', 'Whakatau'],
        female: ['Kuramārōtini', 'Rongomaiwahine', 'Hinemoa', 'Wairaka', 'Muriwai', 'Mahinaarangi', 'Whakaotirangi', 'Ruapūtahanga', 'Hinematioro', 'Hinerupe', 'Waimirirangi', 'Torere', 'Rerenga', 'Papauma', 'Hinepare', 'Rongomaipapa', 'Hinekehu', 'Marama'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * Samoa from the Lapita landfall to the arrival of John Williams in 1830.
     * Pili and his sons Ātua, Tua, Saga and Tolufale are the founding division
     * of the islands in Samoan tradition; Salamāsina, who held all four papā
     * titles around 1500, and her kin are the best-attested named individuals
     * before contact.
     */
    SAMOAN_PRECONTACT: {
        male: ['Pili', 'Ātua', 'Tua', 'Saga', 'Tolufale', 'Fonotī', 'Tigilau', 'Sāveasiʻuleo', 'Muagututiʻa', 'Tupua', 'Galumalemana', 'Tamālelagi', 'Fitisemanu', 'Ulufanuaseseʻe', 'Lāfai', 'Alo', 'Vaea', 'Tuilagi', 'Manaia', 'Fetū'],
        female: ['Sinā', 'Nāfanua', 'Salamāsina', 'Levālasi', 'Fenunuivao', 'Vaetoeifaga', 'Taemā', 'Tilafaigā', 'Gauifaleai', 'Fofoaivaoʻese', 'Vaetamasoāliʻi', 'Lupe', 'Masina', 'Fetūao', 'Alofa', 'Moana', 'Lagi', 'Teuila'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * Tonga to the Wesleyan mission of 1826. The male list runs down the Tuʻi
     * Tonga succession from ʻAhoʻeitu, and includes the chiefs Cook met in
     * 1773–77 — Paulaho, Finau, Maealiuaki, Mumui — under the names he was
     * given. Sinaitakala is the recurring name of the Tuʻi Tonga Fefine.
     */
    TONGAN_PRECONTACT: {
        male: ['ʻAhoʻeitu', 'Lolofakangalo', 'Momo', 'Tuʻitātui', 'Talatama', 'Havea', 'Takalaua', 'Kauʻulufonua', 'Ngata', 'Fatafehi', 'Paulaho', 'Maealiuaki', 'Finau', 'Mumui', 'Vuna', 'Ata', 'Veʻehala', 'Luani', 'Tungī', 'Maʻafu'],
        female: ['Sinaitakala', 'Tupoumoheofo', 'Halaevalu', 'Fusipala', 'Lātūfuipeka', 'Tuʻimala', 'Toafilimoeʻunga', 'Fatafehi', 'Talafaiva', 'Hina', 'Lupe', 'Nanasipauʻu', 'ʻOfa', 'Moheofo', 'Tuputupu', 'Kaloafu'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * The Society Islands from settlement (c. 1000–1100) to the London
     * Missionary Society landing of 1797. Tupaia, Ahutoru, Purea, Tū, Vehiatua
     * and Ori are recorded by Wallis, Bougainville and Cook between 1767 and
     * 1777 — a thirty-year window of Tahitian names written down before any
     * mission. The remainder are compounds in Te-/-ariʻi/-nui/-rai.
     */
    TAHITIAN_PRECONTACT: {
        male: ['Tū', 'Tūteha', 'Amo', 'Vehiatua', 'Tupaia', 'Ahutoru', 'Hitihiti', 'Mahine', 'Puni', 'Ori', 'Reti', 'Poeno', 'Tepau', 'Vaetua', 'Ariipaea', 'Teriirere', 'Tayeto', 'Marua', 'Tuiterai', 'Teraʻimana'],
        female: ['Purea', 'Itia', 'Tetupaia', 'Marama', 'Taurua', 'Poe', 'Teano', 'Vavea', 'Auo', 'Teura', 'Fatuarai', 'Vaiareti', 'Tetuanui', 'Maerehia', 'Terero', 'Hinaariʻi'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * Hawaiʻi from settlement (c. 1000–1200) to the first company of American
     * missionaries in 1820. Almost all of these are named in the recorded
     * moʻokūʻauhau of the ruling lines of Hawaiʻi, Maui, Oʻahu and Kauaʻi;
     * Kalaniʻōpuʻu, Kīwalaʻō, Kahekili, Kaʻiana and Kekūhaupiʻo are the chiefs
     * of Cook's visit and the wars that followed it.
     */
    HAWAIIAN_PRECONTACT: {
        male: ['Līloa', 'ʻUmi', 'Hākau', 'Keawe', 'Kalaniʻōpuʻu', 'Kīwalaʻō', 'Kahekili', 'Keōua', 'Kekūhaupiʻo', 'Kaʻiana', 'Piʻilani', 'Kihapiʻilani', 'Lonoikamakahiki', 'Kūaliʻi', 'Peleioholani', 'Kahahana', 'Kaumualiʻi', 'Māʻilikūkahi', 'Kākuhihewa', 'Kekaulike'],
        female: ['Akahiakuleana', 'Piʻikea', 'Kaikilani', 'Keakamahana', 'Keakealaniwahine', 'Kalanikauleleiaiwi', 'Kekelaokalani', 'Kalola', 'Kekuiapoiwa', 'Kaʻahumanu', 'Keōpūolani', 'Manono', 'Namahana', 'Kapukini', 'Kaneikapolei', 'Lonomaʻaikanaka', 'Kahakuhaʻakoi'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * Fiji before the Wesleyan mission of 1835 and the conversion of Bau in
     * 1854. Seru, Naulivou, Tanoa, Cakobau, Qaraniqio and Nailatikau are all
     * attested; Koroi and Bati are war-names earned rather than given at birth,
     * which is itself how a good deal of Fijian male naming worked. The female
     * list is short and partly built from Fijian lexical material — Adi and
     * Bulou are ranks of address, not birth names — because the pre-Christian
     * record for women is thin.
     */
    FIJIAN_PRECONTACT: {
        male: ['Seru', 'Naulivou', 'Tanoa', 'Udreudre', 'Qaraniqio', 'Nailatikau', 'Rokomoutu', 'Vueti', 'Cakobau', 'Rasolo', 'Koroi', 'Bati', 'Waqa', 'Naivalu', 'Matanitobua', 'Kubunavanua'],
        female: ['Talei', 'Loloma', 'Tokasa', 'Vasemaca', 'Bulou', 'Marama', 'Vani', 'Sereana', 'Naibuka', 'Torika', 'Adi'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    /**
     * A composite, and flagged as one. "Melanesian" covers New Guinea, the
     * Bismarcks, the Solomons, Vanuatu and New Caledonia — well over a thousand
     * languages and no shared naming system, so no honest single list exists.
     * These are drawn from the traditions with the best early record: Motu of
     * the Papuan coast, Tolai of the Gazelle Peninsula (whose To- and Ia-
     * prefixes mark male and female), and the Solomons. Roi Mata is the
     * Vanuatu paramount whose c. 1600 burial was excavated at Retoka.
     */
    MELANESIAN_PRECONTACT: {
        male: ['Lohia', 'Vagi', 'Kila', 'Morea', 'Hitolo', 'Bada', 'Tau', 'Rei', 'Gau', 'Daera', 'Koani', 'Rakatani', 'Vaburi', 'Sisia', 'ToVue', 'ToLiman', 'ToKilang', 'Roi Mata', 'Basiana', 'Ramo'],
        female: ['Heni', 'Igo', 'Boio', 'Nou', 'Gaudi', 'Mea', 'Dika', 'Sinaka', 'Vani', 'IaMur', 'IaVaira', 'IaTagul', 'Bore', 'Rutu'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },

    // === NATIVE AMERICAN TRIBAL SPECIFICS ===
    APACHE: {
        male: ['Bidziil', 'Cochise', 'Dahkeya', 'Elan', 'Goyahkla', 'Hastiin', 'Illanipi', 'Jacy', 'Klah', 'Kuruk', 'Naiche', 'Nayati', 'Nantan', 'Mangas', 'Chato', 'Taza', 'Nana', 'Loco', 'Juh', 'Alchise', 'Tsela', 'Bodaway', 'Delshay', 'Eskiminzin', 'Nahiossi', 'Naalnish', 'Tsintah', 'Itza-chu', 'Kas-tziden', 'Tse-ne-gat'],
        female: ['Aiyana', 'Chosposi', 'Dezba', 'Gouyen', 'Huera', 'Ipa', 'Jacali', 'Kachina', 'Lozen', 'Nalin', 'Ooljee', 'Paloma', 'Sonseeahray', 'Tala', 'Unega', 'Dahteste', 'Ishton', 'Siki', 'Zi-yeh', 'Beshad-e', 'Ih-tedda', 'She-gha', 'Ih-na-tah', 'Nah-dos-te', 'Shtsha-she', 'E-clah-heh', 'Dilth-cleyhen', 'Bi-ya-neta', 'Tzoe-ay', 'Nah-de-yole'],
        // Chiricahua, Mescalero, Jicarilla and Lipan are bands, not families —
        // nobody is surnamed "Western-Apache" any more than a Yorkshireman is
        // surnamed Yorkshire. Apache naming in this register is a single name.
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    CHEROKEE: {
        male: ['Atsila', 'Danuwoa', 'Gola', 'Kanuna', 'Mohe', 'Onacona', 'Salali', 'Tsiyi', 'Waya', 'Yona', 'Aganvdisi', 'Adahy', 'Ahanu', 'Degotoga', 'Gawonii', 'Kanoska', 'Oconostota', 'Ostenaco', 'Attakullakulla', 'Doublehead', 'Pathkiller', 'Tahchee', 'Utsidihi', 'Wohali', 'Yonaguska', 'Tsunu', 'Ganundalegi', 'Sequoyah', 'Junaluska', 'Oosahwee'],
        female: ['Adsila', 'Agasga', 'Amadahy', 'Awenasa', 'Ayita', 'Galilahi', 'Immookalee', 'Inola', 'Nanye-hi', 'Noya', 'Salali', 'Selu', 'Tayanita', 'Tsula', 'Walela', 'Winona', 'Ghigau', 'Ama', 'Gola', 'Kamama', 'Nidia', 'Oota', 'Sequoia', 'Tala', 'Usdi', 'Wahya', 'Yonah', 'Nvda', 'Svnoyi', 'Agitsi'],
        surname: ['Aniwaya', 'Anigatogewi', 'Anisahoni', 'Aniwodi', 'Anitsisqua', 'Aniwahya', 'Anikawi', 'Wolf-Clan', 'Deer-Clan', 'Bird-Clan', 'Paint-Clan', 'Blue-Clan', 'Long-Hair-Clan', 'Wild-Potato-Clan']
    },
    IROQUOIS_HAUDENOSAUNEE: {
        male: ['Deganawidah', 'Hiawatha', 'Tadodaho', 'Skenandoa', 'Oronhyatekha', 'Kanonwat', 'Tekarihoga', 'Otsembo', 'Kanonsonnion', 'Ganeodiyo', 'Donehogawa', 'Sganyadaiyoh', 'Kaienke', 'Ronkahrawah', 'Tahamont', 'Kaneeda', 'Soyent', 'Ganunda', 'Kanadagea', 'Oneida', 'Onondaga', 'Cayuga', 'Seneca', 'Mohawk', 'Tuscarora'],
        female: ['Kateri', 'Onatah', 'Aiyana', 'Kachina', 'Oneida', 'Tekawitha', 'Konwatsi', 'Kahente', 'Kawenaa', 'Katsitsio', 'Otsi', 'Onen', 'Skennen', 'Tewenissa', 'Yakowi', 'Kohana', 'Wenona', 'Kanontiio', 'Onawa', 'Wadewi', 'Awenasa', 'Gawonii', 'Kanessa', 'Ojistah', 'Sequoia'],
        surname: ['Turtle-Clan', 'Wolf-Clan', 'Bear-Clan', 'Beaver-Clan', 'Deer-Clan', 'Hawk-Clan', 'Snipe-Clan', 'Heron-Clan', 'Eel-Clan']
    },
    CREEK_MUSKOGEE: {
        male: ['Opothleyahola', 'Menawa', 'Chitto', 'Harjo', 'Emathla', 'Yahola', 'Fixico', 'Micco', 'Tustunnuggee', 'Holata', 'Hadjo', 'Chopco', 'Kono', 'Semo', 'Nokose', 'Isfaha', 'Taskigi', 'Hopoithle', 'Apushimataha', 'Takosa'],
        female: ['Coosa', 'Lowak', 'Talisi', 'Mahila', 'Sehoy', 'Pakana', 'Chehaw', 'Nanih', 'Wakokai', 'Fuswa', 'Hillis', 'Osochi', 'Sawokli', 'Tukabahchi', 'Wetumpka', 'Abihka', 'Atasi', 'Kealedji', 'Kolomi', 'Okchai'],
        surname: ['Harjo', 'Emathla', 'Yahola', 'Fixico', 'Micco', 'Hadjo', 'Chopco', 'Wind-Clan', 'Bear-Clan', 'Beaver-Clan', 'Bird-Clan', 'Deer-Clan', 'Alligator-Clan', 'Potato-Clan', 'Hickory-Clan']
    },
    ALGONQUIAN: {
        male: ['Metacomet', 'Massasoit', 'Powhatan', 'Pontiac', 'Tecumseh', 'Wabanaki', 'Samoset', 'Squanto', 'Canonicus', 'Miantonomo', 'Uncas', 'Sassacus', 'Paugus', 'Passaconaway', 'Wonalancet', 'Kancamagus', 'Madockawando', 'Bashaba', 'Nanapush', 'Keokuk'],
        female: ['Pocahontas', 'Wetamoo', 'Awashonks', 'Weetamoo', 'Mononotto', 'Cockacoeske', 'Totopotomoi', 'Nicketti', 'Wunne', 'Askook', 'Namumpum', 'Quaiapen', 'Magnus', 'Matantuck', 'Wootonekanuske', 'Oppussoquionuske', 'Aspenquid', 'Mamanuette', 'Sunksquaw', 'Winema'],
        surname: ['Wampanoag', 'Narragansett', 'Pequot', 'Mohegan', 'Nipmuc', 'Pocumtuck', 'Pennacook', 'Abenaki', 'Passamaquoddy', 'Micmac', 'Maliseet', 'Lenape', 'Shawnee', 'Ojibwe', 'Potawatomi', 'Menominee', 'Sauk', 'Fox', 'Kickapoo', 'Miami']
    },
    /**
     * The Rio Grande and Western pueblos before the entrada.
     *
     * Rewritten because almost none of it was names. The male list was mostly
     * *pueblos* — Acoma, Taos, Cochiti, Nambé, Picurís, Pojoaque, Sandia,
     * Tesuque, Isleta, Laguna are places, and Tewa, Tiwa and Keres are language
     * groups; the female list included Hopi (a people), Kokopelli and Kachina
     * (not personal names, and the second not a thing a person is called at
     * all). What remains is the handful the historical record actually carries,
     * with figures from Pueblo oral tradition beside them.
     *
     * The surnames were fifteen invented English clan-glosses — "Antelope-Clan",
     * "Badger-Clan", "Sun-Clan". Clan membership is real and matters; it is not
     * and was not a surname, and rendering it as one produced personas called
     * Richard Antelope-Clan. Pueblo naming before the missions was a single
     * name, so that is what this set now carries. See [PUEBLO_MODERN] for the
     * names Pueblo people have borne since.
     */
    PUEBLO: {
        male: ['Popé', 'Tupatú', 'Malacate', 'Catiti', 'Jaca', 'Masewa', 'Oyoyewa', 'Poseyemu', 'Payatamu', 'Ahayuta', 'Kwatoko', 'Sowitu', 'Tsiping', 'Okuwa', 'Povi', 'Tsehpo', 'Kanyi', 'Shruwi', 'Aiyaye', 'Hemish'],
        female: ['Kotcimanyako', 'Tsipiya', 'Povika', 'Okuwatsire', 'Yellow-Corn', 'Blue-Corn', 'White-Shell', 'Turquoise', 'Tsiwema', 'Kayemo', 'Shiwana', 'Nampeyo', 'Kotyiti', 'Aiyana', 'Tiva', 'Kiva', 'Sowi', 'Poviyemo', 'Tsapu', 'Hanoma'],
        surname: ['(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)', '(No Surname)']
    },
    /**
     * Pueblo people from the missions to now: a Spanish given name over a
     * Pueblo or Hispanicised surname, the same form the conquest produced in
     * Yucatán and the Andes. Suina, Naranjo, Tafoya, Yepa, Toya, Waquie, Pecos,
     * Cheromiah and Sarracino are ordinary surnames at Jemez, Cochiti, Santa
     * Clara, Laguna and Acoma today.
     */
    PUEBLO_MODERN: {
        male: ['Juan', 'José', 'Antonio', 'Manuel', 'Diego', 'Santiago', 'Felipe', 'Ramón', 'Alfonso', 'Emilio', 'Reyes', 'Vicente', 'Andrés', 'Benito', 'Cipriano', 'Domingo', 'Estevan', 'Lorenzo', 'Pablo', 'Refugio'],
        female: ['María', 'Josefa', 'Lupita', 'Dolores', 'Ramona', 'Isabel', 'Juanita', 'Rosita', 'Carmelita', 'Anita', 'Petra', 'Crucita', 'Eloisa', 'Filomena', 'Guadalupe', 'Manuelita', 'Reyecita', 'Serafina', 'Teresita', 'Ursula'],
        surname: ['Suina', 'Naranjo', 'Tafoya', 'Lucero', 'Cata', 'Yepa', 'Toya', 'Waquie', 'Pecos', 'Analla', 'Chino', 'Shije', 'Sarracino', 'Cheromiah', 'Tenorio', 'Quintana', 'Trujillo', 'Romero', 'Vigil', 'Sandoval', 'Loretto', 'Tosa']
    },
    INUIT: {
        male: ['Nanook', 'Amarok', 'Atka', 'Nukka', 'Tulugaq', 'Qimmiq', 'Siku', 'Akiak', 'Desna', 'Iluq', 'Kallik', 'Malik', 'Nuka', 'Pakak', 'Sesi', 'Taqtu', 'Ukiuk', 'Yuka', 'Toklo', 'Nayuk'],
        female: ['Sedna', 'Sila', 'Pania', 'Kira', 'Miki', 'Nayuk', 'Suki', 'Uki', 'Yura', 'Aput', 'Atiqtalik', 'Buniq', 'Cupun', 'Ila', 'Kavik', 'Malina', 'Naia', 'Purnaq', 'Sakari', 'Uki'],
        surname: ['Angakok', 'Tikivik', 'Kakortok', 'Nanuq', 'Sirmiq', 'Tulugaq', 'Umiak', 'Iglu', 'Kayak', 'Tupik', 'Kamik', 'Anorak', 'Mukluk', 'Parka', 'Qiviut']
    },
    LAKOTA_SIOUX: {
        male: ['Tatanka', 'Mahpiya', 'Wanbli', 'Mato', 'Cetan', 'Hehaka', 'Takoda', 'Ohiyesa', 'Akecheta', 'Chayton', 'Enapay', 'Kangee', 'Lootah', 'Nashoba', 'Ogleesha', 'Pahana', 'Shappa', 'Tashunka', 'Wahkan', 'Yahto', 'Chaska', 'Ezhno', 'Hotah', 'Bidziil', 'Kohana'],
        female: ['Winona', 'Wakanda', 'Talulah', 'Kimama', 'Maka', 'Nina', 'Ojinjintka', 'Ptaysanwee', 'Skawin', 'Tawana', 'Wachiwi', 'Weayaya', 'Winema', 'Zitkala', 'Anpao', 'Chumani', 'Ehawee', 'Hanwi', 'Kimimela', 'Makawee', 'Mitena', 'Nahimana', 'Pakuna', 'Sahkyo', 'Takala'],
        surname: ['Mato-Tope', 'Wanbli-Waste', 'Tatanka-Iyotanka', 'Mahpiya-Luta', 'Sunkawakan-Ska', 'Hehaka-Sapa', 'Cetan-Maza', 'Kangee-Sunka', 'Tashunka-Witco', 'Wahkan-Tanka', 'Mato-Sapa', 'Wanbli-Gli', 'Tasunka-Kokipa', 'Mahpiya-Icahtagya', 'Ptaysanwee-Win', 'Hanwi-Wi', 'Wachiwi-Win', 'Zitkala-Sha', 'Anpao-Win', 'Maka-Win']
    },
    NAVAJO: {
        male: ['Hastiin', 'Hosteen', 'Narbona', 'Manuelito', 'Barboncito', 'Ganado', 'Herrero', 'Delgadito', 'Zarcillos', 'Cayetano', 'Ashkii', 'Bidziil', 'Dibe', 'Gad', 'Hashke', 'Naalnish', 'Ahiga', 'Bilagaana', 'Chaha', 'Dezbah', 'Hataali', 'Klizzie', 'Nakai', 'Tsosie', 'Yazzie', 'Begay', 'Benally', 'Curley', 'Etsitty', 'Goldtooth'],
        female: ['Dezba', 'Nizhoni', 'Shima', 'Ayasha', 'Chenoa', 'Halona', 'Kaliska', 'Kasa', 'Kiona', 'Leotie', 'Muna', 'Nita', 'Pocahontas', 'Sakari', 'Shada', 'Taini', 'Wyanet', 'Yepa', 'Adsila', 'Aponi', 'Ayita', 'Cocheta', 'Etenia', 'Huyana', 'Kimi', 'Lenmana', 'Lomasi', 'Meda', 'Nuna', 'Tuwa'],
        surname: ['Begay', 'Yazzie', 'Benally', 'Tsosie', 'Nez', 'Curley', 'Etsitty', 'Goldtooth', 'Jumbo', 'Largo', 'Begaye', 'Silversmith', 'Tallsalt', 'Yellowhair', 'Bluehouse', 'Blackhorse', 'Redhouse', 'Whitehorse', 'Manygoats', 'Manykids']
    },
    COMANCHE: {
        male: ['Quanah', 'Peta', 'Nokoni', 'Isa', 'Tabananica', 'Ten Bears', 'Buffalo Hump', 'Santa Anna', 'Wild Horse', 'Iron Jacket', 'Horseback', 'Mow-way', 'Tabbaquena', 'Pahayuca', 'Tosawi', 'Kobay', 'Potsanaquahip', 'Esacapa', 'Cumaro', 'Paruakevitsi', 'Ecueracapa', 'Howeah', 'Muguara', 'Sanaco', 'Esihabit', 'Noconi', 'Yamparikas', 'Tenewa', 'Penateka', 'Kotsoteka'],
        female: ['Naduah', 'Topasannah', 'Weckeah', 'Chony', 'Nautdah', 'Kee-wot-see', 'Tabbequena', 'Tohau-son', 'Puhihwikwasu', 'Kwasibo', 'Pia', 'Tekwashana', 'Mowitch', 'Aiko', 'Itsachu', 'Kauna', 'Koha', 'Kwahu', 'Mea', 'Nona', 'Pamah', 'Pihpe', 'Soha', 'Ura', 'Wana', 'Wipia', 'Yiha', 'Ena', 'Hupiah', 'Kwehnai'],
        surname: ['Parker', 'Chocktoby', 'Cheebetah', 'Cozad', 'Paddlety', 'Poafpybitty', 'Tahmahkera', 'Werybone', 'Yackeschi', 'Karty', 'Motah', 'Niwot', 'Quoetone', 'Redbird', 'Suppah', 'Tsatoke', 'Wocoche', 'Yahpah', 'Sovo', 'Tonemah']
    },
    SEMINOLE: {
        male: ['Osceola', 'Micanopy', 'Billy Bowlegs', 'Wild Cat', 'Alligator', 'Jumper', 'Abraham', 'John Horse', 'Chipco', 'Tiger Tail', 'Sam Jones', 'Holata', 'Micco', 'Emathla', 'Arpeika', 'Thlocklo', 'Tustenuggee', 'Hadjo', 'Yaha', 'Yahola', 'Nokosi', 'Fusco', 'Chekika', 'Chakaika', 'Hospetarke', 'Arpucke', 'Econchattimico', 'Neamathla', 'Charley', 'Cowacooche'],
        female: ['Morning Dew', 'Wildflower', 'Alachee', 'Oconee', 'Talasi', 'Wakulla', 'Yuchee', 'Apopka', 'Kissimmee', 'Ocala', 'Thonotosassa', 'Wewahitchka', 'Aucilla', 'Ichetucknee', 'Sopchoppy', 'Weeki', 'Homosassa', 'Chassahowitzka', 'Withlacoochee', 'Econlockhatchee', 'Alapaha', 'Okefenokee', 'Suwannee', 'Tawaquena', 'Hatchineha', 'Yeehaw', 'Apalachicola', 'Chattahoochee', 'Okeechobee', 'Caloosahatchee'],
        surname: ['Osceola', 'Jumper', 'Tiger', 'Cypress', 'Billie', 'Tommie', 'Jim', 'Johns', 'Smith', 'Jones', 'Micco', 'Bowers', 'Buster', 'Frank', 'Henry', 'Motlow', 'Shore', 'Snow', 'Willie', 'Bowlegs']
    },
    BLACKFEET: {
        male: ['Ninastoko', 'Naatosi', 'Iiniskim', 'Apikuni', 'Ookaan', 'Matokii', 'Soyiitapi', 'Omahksapohkii', 'Aapinakoi', 'Kainai', 'Siksika', 'Piikuni', 'Nitaakii', 'Oki', 'Napi', 'Kipitaki', 'Aakii', 'Istowun', 'Ponokaomitaa', 'Sooyii', 'Mamii', 'Saamis', 'Ksisskstaki', 'Natosi', 'Moksgmii', 'Imitaa', 'Naapi', 'Aahksstohmii', 'Mokiis', 'Niitsitapi'],
        female: ['Natosina', 'Soatsaki', 'Kipitaaki', 'Oonahsii', 'Sikatsi', 'Aakii', 'Sskayi', 'Oki', 'Aakiimaan', 'Matakii', 'Ponokaomitaa', 'Sinaaki', 'Apistotokii', 'Itsipaitapiiyo', 'Kaatoyii', 'Saahkiimaan', 'Omahksapohkii', 'Niitawahsin', 'Motokii', 'Aakiikoan', 'Ksaahkii', 'Okaan', 'Ninna', 'Akomokan', 'Sooyaawa', 'Isskatsi', 'Mamiioyis', 'Piiksi', 'Nitaniko', 'Aakaikoan'],
        surname: ['Many-Guns', 'Running-Crane', 'Bull-Shield', 'Heavy-Runner', 'Crow-Flag', 'Wolf-Plume', 'Red-Crow', 'Medicine-Owl', 'Black-Eagle', 'White-Calf', 'Little-Bear', 'Mountain-Chief', 'Big-Brave', 'Morning-Owl', 'Yellow-Horn', 'Iron-Shield', 'Spotted-Eagle', 'Lone-Fighter', 'Thunder-Chief', 'Crazy-Dog']
    },

    // === SURNAME PATTERN IMPLEMENTATIONS ===
    ICELANDIC: {
        male: ['Bjorn', 'Erik', 'Magnus', 'Olaf', 'Ragnar', 'Sigurd', 'Thorvald', 'Gunnar', 'Harald', 'Leif', 'Njal', 'Ulf', 'Egil', 'Snorri', 'Hjalti', 'Kettil', 'Orm', 'Skuli', 'Thord', 'Vigfus', 'Ari', 'Einar', 'Grim', 'Halfdan', 'Jon', 'Kjartan', 'Ljot', 'Odd', 'Ref', 'Stein'],
        female: ['Astrid', 'Bergthora', 'Gudrun', 'Hallgerd', 'Helga', 'Ingrid', 'Jorunn', 'Kristin', 'Ragnhild', 'Sigrid', 'Thora', 'Unn', 'Vigdis', 'Aud', 'Brynhild', 'Dalla', 'Eir', 'Freydis', 'Gro', 'Hild', 'Inga', 'Jora', 'Kari', 'Lif', 'Marta', 'Nanna', 'Oddny', 'Randi', 'Sif', 'Thordis'],
        surname: ['Bjornsson', 'Eriksson', 'Magnusson', 'Olafsson', 'Ragnarsson', 'Sigurdsson', 'Thorvaldsson', 'Gunnarsson', 'Haraldsson', 'Leifsson', 'Njalsson', 'Ulfsson', 'Egilsson', 'Snorrisson', 'Hjaltisson', 'Kettilsson', 'Ormsson', 'Skulisson', 'Thordsson', 'Vigfusson', 'Arisson', 'Einarsson', 'Grimsson', 'Halfdansson', 'Jonsson', 'Kjartansson', 'Ljotsson', 'Oddsson', 'Refsson', 'Steinsson']
    },
    ARABIC_TRADITIONAL: {
        male: ['Ahmad', 'Muhammad', 'Ali', 'Hassan', 'Hussein', 'Omar', 'Khalid', 'Yusuf', 'Ibrahim', 'Ismail', 'Abdullah', 'Abdul Rahman', 'Mahmoud', 'Saeed', 'Tariq', 'Walid', 'Ziad', 'Nasser', 'Faisal', 'Rashid', 'Hamza', 'Jamal', 'Karim', 'Marwan', 'Nabil', 'Qasim', 'Salim', 'Tamer', 'Wael', 'Yazid'],
        female: ['Fatima', 'Aisha', 'Khadija', 'Maryam', 'Zainab', 'Layla', 'Amina', 'Safiya', 'Hajar', 'Ruqayya', 'Umm Kulthum', 'Asma', 'Hafsa', 'Sawda', 'Juwayriya', 'Zaynab', 'Maymuna', 'Umm Salama', 'Ramla', 'Safiyya', 'Ramlah', 'Zaynab', 'Umm Habiba', 'Juwayriyah', 'Safiyyah', 'Maymunah', 'Saudah', 'Hafsah', 'Aishah', 'Khadijah'],
        surname: ['ibn Ahmad', 'ibn Muhammad', 'ibn Ali', 'ibn Hassan', 'ibn Hussein', 'ibn Omar', 'ibn Khalid', 'ibn Yusuf', 'ibn Ibrahim', 'ibn Ismail', 'ibn Abdullah', 'ibn Abdul Rahman', 'ibn Mahmoud', 'ibn Saeed', 'ibn Tariq', 'ibn Walid', 'ibn Ziad', 'ibn Nasser', 'ibn Faisal', 'ibn Rashid', 'al-Hashimi', 'al-Qureshi', 'al-Ansari', 'al-Muhajir', 'al-Tamimi', 'al-Azdi', 'al-Kindi', 'al-Baghdadi', 'al-Dimashqi', 'al-Misri']
    },
    MONGOLIAN_TRADITIONAL: {
        male: ['Temujin', 'Boroldai', 'Jamukha', 'Ong Khan', 'Nilka Sengun', 'Jamuqa', 'Targutai', 'Toghrul', 'Senggum', 'Dai Sechen', 'Yesugei', 'Munlik', 'Charaka', 'Sorgan Shira', 'Chilagun', 'Belgutei', 'Kasar', 'Kachun', 'Temuge', 'Jochi', 'Chagatai', 'Ogedei', 'Tolui', 'Guyuk', 'Mongke', 'Kublai', 'Hulagu', 'Arik Boke', 'Kaidu', 'Nayan'],
        female: ['Borte', 'Khulan', 'Yesugen', 'Yesui', 'Hoelun', 'Sochigel', 'Qojin', 'Ibaqa', 'Tegulen', 'Al-Altun', 'Dokuz Khatun', 'Sorghaqtani', 'Oghul Qaimish', 'Toregene', 'Altani', 'Bayarmaa', 'Enkhtaivan', 'Gantuya', 'Iderkhangai', 'Jargalan', 'Khulan', 'Mandukhai', 'Naran', 'Oyunaa', 'Purevjav', 'Sarangerel', 'Tuul', 'Uyanga', 'Zolzaya', 'Ariiunaa'],
        surname: ['of the Blue Wolf clan', 'of the Golden Eagle clan', 'of the White Horse clan', 'of the Grey Wolf clan', 'of the Black Bear clan', 'of the Red Deer clan', 'of the Silver Fox clan', 'of the Iron Mountain clan', 'of the Jade River clan', 'of the Crystal Lake clan', 'Borjigin', 'Merkid', 'Tayichiud', 'Jadaran', 'Khatagin', "Salji'ud", 'Dorben', 'Ikires', 'Oirat', 'Naiman', 'Kerait', 'Tatar', 'Onggirat', 'Hongirad', 'Unggirat', 'Khonggirat', 'Barlas', 'Dughlat', 'Arlat', 'Manghud']
    }
};

/**
 * Which naming traditions a region could draw on, in a given window of years.
 *
 * `keys` were drawn from uniformly, which is a claim about demography nobody
 * made on purpose: listing the region's own tradition beside the language of
 * whoever administered it gave a colonial name to half the personas born there.
 * A quarter of everyone in 1940s Tanganyika came out German. `weights` says how
 * common each tradition actually was among ordinary people — not among the
 * people who wrote the records — and anything unlisted weighs 1.
 *
 * Weights are relative within a rule, so a settler minority is written as the
 * small number it was: `{ SWAHILI_INTERIOR: 30, ENGLISH: 1 }` is a region where
 * roughly one persona in thirty-one is a settler, which is still generous.
 */
export const REGION_NAME_MAPPING: Record<string, Record<string, Array<{
    before?: number;
    after?: number;
    keys: string[];
    weights?: Record<string, number>;
}>>> = {
   "EUROPEAN": {
    // British Isles
    "British Isles": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History: Bronze Age
        { after: -800, before: 55, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Iron Age Celts
        { after: 55, before: 410, keys: ['CELTIC_ANCIENT', 'ANCIENT_ROMAN'] }, // Roman Britain
        { after: 410, before: 793, keys: ['ENGLISH_ANGLO_SAXON', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 793, before: 1066, keys: ['ENGLISH_ANGLO_SAXON', 'SCANDINAVIAN', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 1066, before: 1300, keys: ['ENGLISH_MEDIEVAL', 'NORMAN_FRENCH', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] },
        { after: 1300, keys: ['ENGLISH', 'WELSH', 'SCOTTISH', 'CELTIC_IRISH'] }
    ],
    // France (Gaul)
    "France": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History: Bronze Age
        { after: -800, before: -52, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Iron Age Gauls
        { after: -52, before: 486, keys: ['ANCIENT_ROMAN', 'PREHISTORIC_PROTO_GERMANIC'] }, // Roman Gaul & Frankish incursions
        { after: 486, before: 751, keys: ['FRANKISH_MEROVINGIAN'] },
        { after: 751, before: 987, keys: ['FRANKISH_CAROLINGIAN'] },
        { after: 987, before: 1100, keys: ['FRENCH_MEDIEVAL', 'NORMAN_FRENCH'] },
        { after: 1100, before: 1450, keys: ['FRENCH_MEDIEVAL'] },
        { after: 1450, keys: ['FRENCH'] }
    ],
    // Iberian Peninsula
    "Iberian Peninsula": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Deep History
        { after: -800, before: -218, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Celtiberian Iron Age
        { after: -218, before: 410, keys: ['ANCIENT_ROMAN'] }, // Roman Hispania
        { after: 410, before: 711, keys: ['ANCIENT_ROMAN', 'GERMAN'] }, // Visigothic period
        // al-Andalus. ARABIAN_HEJAZ ends in 700 — it is a Companions-era
        // register — so the Arab-Andalusi share of this rule was dropped on
        // every draw. MOORISH_ANDALUS is the set written for exactly this
        // place and period, and had never been used anywhere.
        { after: 711, before: 1200, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN', 'MOORISH_ANDALUS', 'MAGHREBI', 'JEWISH_ASHKENAZI'],
          weights: { SPANISH_CASTILIAN: 6, PORTUGUESE: 4, GALICIAN: 3, MOORISH_ANDALUS: 8, MAGHREBI: 5, JEWISH_ASHKENAZI: 2 } },
        { after: 1200, before: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN', 'MAGHREBI'] },
        { after: 1492, keys: ['SPANISH_CASTILIAN', 'PORTUGUESE', 'GALICIAN'] }
    ],
     "Galicia": [
        { before: -25, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Pre-Roman Gallaeci
        { after: -25, before: 410, keys: ['ANCIENT_ROMAN'] },
        { after: 410, before: 711, keys: ['GERMAN'] }, // Suebi & Visigothic
        { after: 711, keys: ['GALICIAN', 'PORTUGUESE', 'SPANISH_CASTILIAN'] }
    ],
    // Italy
    "Italy": [
        { before: -753, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Pre-Roman Italic Tribes
        { after: -753, before: 476, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] }, // Roman Republic/Empire
        { after: 476, before: 774, keys: ['BYZANTINE', 'GERMAN'] }, // Ostrogothic/Lombard
        { after: 774, before: 1400, keys: ['ITALIAN', 'BYZANTINE', 'NORMAN_FRENCH'] },
        { after: 1400, keys: ['ITALIAN'] }
    ],
    // Germanic Lands
    "Germanic Lands": [
        { before: -500, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Pre-Germanic
        { after: -500, before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Core Proto-Germanic period
        { after: 200, before: 486, keys: ['GERMAN', 'ANCIENT_ROMAN'] }, // Migration Period
        { after: 486, before: 843, keys: ['FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN'] },
        { after: 843, before: 1945, keys: ['GERMAN'] },
        { after: 1945, before: 1990, keys: ['GERMAN', 'EAST_GERMAN', 'TURKISH'] },
        { after: 1990, keys: ['GERMAN', 'TURKISH'] }
    ],
    // Central Europe
    "Central Europe": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] }, // Celtic heartland (e.g., Boii)
        { after: -100, before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC', 'GERMAN'] }, // Germanic migrations
        { after: 500, before: 900, keys: ['SLAVIC_MEDIEVAL', 'FRANKISH_CAROLINGIAN', 'BOHEMIAN'] }, // Slavic migrations
        { after: 900, before: 1918, keys: ['GERMAN', 'BOHEMIAN', 'HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN', 'POLISH_MEDIEVAL', 'POLISH_MODERN'] },
        { after: 1918, keys: ['CZECH_MODERN', 'SLOVAK_MODERN', 'HUNGARIAN_MODERN', 'GERMAN'] }
    ],
    "Carpathian Foothills": [
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC'] },
        { after: -100, before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC', 'GERMAN'] },
        { after: 500, before: 900, keys: ['SLAVIC_MEDIEVAL'] },
        { after: 900, before: 1526, keys: ['HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN', 'POLISH_MEDIEVAL', 'POLISH_MODERN', 'TRANSYLVANIAN'] },
        { after: 1526, before: 1918, keys: ['HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN', 'POLISH_MEDIEVAL', 'POLISH_MODERN', 'TRANSYLVANIAN', 'ROMANIAN', 'GERMAN'] },
        { after: 1918, keys: ['HUNGARIAN_MODERN', 'POLISH_MODERN', 'SLOVAK_MODERN', 'ROMANIAN'] }
    ],
     "Transylvania": [
        { before: 100, keys: ['CELTIC_ANCIENT'] }, // Dacian/Celtic period
        { after: 100, before: 900, keys: ['SLAVIC_MEDIEVAL', 'GERMAN'] },
        { after: 900, before: 1918, keys: ['TRANSYLVANIAN', 'HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN', 'ROMANIAN', 'GERMAN'] },
        { after: 1918, keys: ['ROMANIAN', 'HUNGARIAN_MODERN', 'GERMAN'] }
    ],
    // Balkans
    /**
     * The Balkans as a *map region*, which reaches further than the word does:
     * its areas include the Bosporus and the Thracian Plain — Istanbul and
     * Turkish Thrace — and those two hold more people than any other part of
     * it. The rule below dropped `TURKISH` at 1912, correctly for Ottoman
     * Europe and disastrously for the fifteen million people still living on
     * the European side of Turkey, who were left with a 0% share of the region
     * they live in. A persona born in Istanbul in 1952 came out as Emilija
     * Petrovic, Serbian-named, Orthodox, and a native speaker of Turkish.
     *
     * The two Turkish areas now have their own entries below, which the locale
     * lookup prefers; this rule is what remains of the region, and is weighted
     * to it. Romania is the largest of those populations and was drawing a
     * sixth; Croatia is among the smaller and was drawing a quarter.
     */
    "Balkans": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Paleo-Balkan tribes (Illyrians, Thracians)
        { after: -400, before: 146, keys: ['ANCIENT_GREEK'] }, // Hellenistic influence
        { after: 146, before: 600, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] },
        { after: 600, before: 1453, keys: ['BYZANTINE', 'SLAVIC_MEDIEVAL', 'SERBIAN', 'BULGARIAN', 'CROATIAN'] },
        {
            after: 1453, before: 1912, keys: ['TURKISH', 'GREEK', 'SERBIAN', 'BULGARIAN', 'CROATIAN', 'ROMANIAN'],
            weights: { GREEK: 8, SERBIAN: 8, ROMANIAN: 8, BULGARIAN: 6, TURKISH: 5, CROATIAN: 4 },
        },
        {
            // The Yugoslav set is Serbo-Croat, so listing it *instead of*
            // Serbian and Croatian is right — but Greece and Romania were never
            // in Yugoslavia and are the two largest populations here.
            after: 1912, before: 1991, keys: ['YUGOSLAV', 'ROMANIAN', 'GREEK', 'BULGARIAN'],
            weights: { YUGOSLAV: 9, ROMANIAN: 8, GREEK: 6, BULGARIAN: 4 },
        },
        {
            after: 1991, keys: ['ROMANIAN', 'GREEK', 'SERBIAN', 'BULGARIAN', 'CROATIAN'],
            weights: { ROMANIAN: 9, GREEK: 6, SERBIAN: 5, BULGARIAN: 4, CROATIAN: 3 },
        }
    ],
    /**
     * Istanbul and its straits. A locale entry, so it wins over the Balkans
     * rule above for the one area of the region that has been Turkish-speaking
     * since 1453 and is now a city of sixteen million.
     *
     * The Rum, Armenian and Jewish communities of the city were large into the
     * twentieth century and are tiny now, so they are bounded rather than
     * carried forward: the 1955 pogrom and the 1964 expulsions ended them.
     */
    "Bosporus": [
        { before: 330, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
        { after: 330, before: 1453, keys: ['BYZANTINE', 'GREEK', 'ARMENIAN'], weights: { BYZANTINE: 10, GREEK: 6, ARMENIAN: 2 } },
        {
            after: 1453, before: 1923, keys: ['TURKISH', 'GREEK', 'ARMENIAN', 'JEWISH_ASHKENAZI'],
            weights: { TURKISH: 20, GREEK: 7, ARMENIAN: 4, JEWISH_ASHKENAZI: 1 },
        },
        { after: 1923, keys: ['TURKISH', 'GREEK', 'ARMENIAN'], weights: { TURKISH: 40, GREEK: 1, ARMENIAN: 1 } }
    ],
    /**
     * Thrace, which the map region splits between three countries — Turkish
     * Eastern Thrace, Greek Western Thrace and Bulgarian Northern Thrace. The
     * population exchange of 1923 is what sorted them, and is the date here.
     */
    "Thracian Plain": [
        { before: 1453, keys: ['BYZANTINE', 'GREEK', 'BULGARIAN'], weights: { BYZANTINE: 6, GREEK: 6, BULGARIAN: 5 } },
        {
            after: 1453, before: 1923, keys: ['TURKISH', 'GREEK', 'BULGARIAN'],
            weights: { TURKISH: 8, GREEK: 6, BULGARIAN: 6 },
        },
        { after: 1923, keys: ['TURKISH', 'BULGARIAN', 'GREEK'], weights: { TURKISH: 9, BULGARIAN: 6, GREEK: 4 } }
    ],
    "Croatia and Environs": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -100, keys: ['PREHISTORIC_PROTO_CELTIC'] }, // Illyrian/Celtic tribes
        { after: -100, before: 395, keys: ['ANCIENT_ROMAN'] },
        { after: 395, before: 925, keys: ['SLAVIC_MEDIEVAL', 'BYZANTINE'] },
        { after: 925, before: 1527, keys: ['CROATIAN', 'HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN'] },
        { after: 1527, before: 1918, keys: ['CROATIAN', 'HUNGARIAN_MEDIEVAL', 'HUNGARIAN_MODERN', 'GERMAN'] },
        { after: 1918, before: 1991, keys: ['YUGOSLAV'] },
        { after: 1991, keys: ['CROATIAN'] }
    ],
    // Scandinavia
    "Scandinavia": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Nordic Bronze Age & Pre-Roman Iron Age
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] }, // Proto-Norse / Migration Period
        { after: 793, before: 1100, keys: ['SCANDINAVIAN', 'ICELANDIC'] }, // Viking Age
        { after: 1100, before: 1500, keys: ['SCANDINAVIAN', 'ICELANDIC'] }, // Norse names still current
        // The ICELANDIC set is this file's Old Norse pool, and it was reaching
        // to the era ceiling: an 1856 Stockholmer drew "Ljot Vigfusson" and a
        // 1920 one "Olaf Thorvaldsson" with a mother surnamed -dóttir, in a
        // country that froze patronymics into hereditary surnames through the
        // nineteenth century. The SCANDINAVIAN pool is already modern Swedish —
        // Erik, Lars, Andersson, Johansson — so from the early modern period on
        // it is the only one that should be offered here.
        { after: 1500, keys: ['SCANDINAVIAN'] }
    ],
    // Scandinavian sub-regions (inherit from main Scandinavia mapping)
    "Stockholm Archipelago": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    "Norwegian Fjords": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    "Jutland Peninsula": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    "Lapland": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    "Gotland": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    "Øresund Strait": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, before: 793, keys: ['SCANDINAVIAN'] },
        { after: 793, keys: ['SCANDINAVIAN'] }
    ],
    // Atlantic Islands (Iceland, Faroe Islands, Azores, etc.)
    "Atlantic Islands": [
        { before: 870, keys: ['SCANDINAVIAN'] }, // Norse settlement of Iceland
        { after: 870, before: 1100, keys: ['SCANDINAVIAN', 'ICELANDIC'] }, // Viking Age
        { after: 1100, before: 1400, keys: ['ICELANDIC', 'SCANDINAVIAN'] }, // Medieval Iceland
        { after: 1400, keys: ['ICELANDIC', 'SCANDINAVIAN', 'CELTIC_IRISH', 'PORTUGUESE'] } // Later periods with diverse settlements
    ],
    // Eastern Europe
    "Eastern Europe": [
       { before: -100, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: 500, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Gothic and other East Germanic tribes
        { after: 500, before: 882, keys: ['SLAVIC_MEDIEVAL', 'SCANDINAVIAN', 'BYZANTINE'] },
        { after: 882, before: 1240, keys: ['RUSSIAN', 'SLAVIC_MEDIEVAL'] }, // Kievan Rus'
        { after: 1240, before: 1480, keys: ['RUSSIAN', 'MONGOLIAN_TRADITIONAL', 'TURKIC_STEPPE'] }, // Mongol Yoke
        { after: 1480, before: 1721, keys: ['RUSSIAN', 'POLISH_MEDIEVAL', 'POLISH_MODERN'] },
        { after: 1721, keys: ['RUSSIAN', 'RUSSIAN', 'RUSSIAN', 'POLISH_MODERN', 'JEWISH_ASHKENAZI'] }
    ],
    // Low Countries
    "Low Countries": [
         { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { before: -58, keys: ['PREHISTORIC_PROTO_CELTIC', 'PREHISTORIC_PROTO_GERMANIC'] }, // Belgae tribes
        { after: -58, before: 486, keys: ['ANCIENT_ROMAN', 'GERMAN'] },
        { after: 486, before: 843, keys: ['FRANKISH_MEROVINGIAN', 'FRANKISH_CAROLINGIAN'] },
        { after: 843, before: 1581, keys: ['DUTCH', 'FRENCH', 'GERMAN'] },
        { after: 1581, keys: ['DUTCH', 'FRENCH'] }
    ],
    // Greece and Aegean
    "Greece and Aegean": [
        { before: -1200, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] }, // Represents pre-Mycenaean peoples
        { after: -1200, before: 146, keys: ['ANCIENT_GREEK'] }, // Mycenaean, Classical, Hellenistic
        { after: 146, before: 330, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
        { after: 330, before: 1453, keys: ['BYZANTINE'] },
        { after: 1453, before: 1821, keys: ['GREEK', 'TURKISH', 'ITALIAN'] },
        { after: 1821, keys: ['GREEK'] }
    ],
    // Ural and Arctic Europe
    "Ural and Arctic Europe": [
         { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] }, // Replaces the generic 'EUROPEAN'
         { after: 200, before: 1200, keys: ['SCANDINAVIAN'] }, // Norse expansion
         { after: 1200, keys: ['RUSSIAN', 'SCANDINAVIAN'] }
    ],
    "Ural Mountains": [
         { before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
         { after: 200, before: 1200, keys: ['SCANDINAVIAN'] },
         { after: 1200, keys: ['RUSSIAN'] }
    ],
    // European Waters and seas (match with capital W)
    "European Waters": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -800, before: 800, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'PREHISTORIC_PROTO_CELTIC'] },
        { after: 800, keys: ['SCANDINAVIAN', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'ITALIAN', 'GREEK'] }
    ],
    "Atlantic Ocean": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -800, before: 800, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'PREHISTORIC_PROTO_CELTIC'] },
        { after: 800, keys: ['SCANDINAVIAN', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'PORTUGUESE'] }
    ],
    "North Sea": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -400, before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC', 'PREHISTORIC_PROTO_CELTIC'] },
        { after: 200, before: 793, keys: ['ANCIENT_ROMAN', 'GERMAN'] },
        { after: 793, keys: ['SCANDINAVIAN', 'ENGLISH', 'DUTCH'] }
    ],
    "Irish Sea": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -800, before: 55, keys: ['PREHISTORIC_PROTO_CELTIC', 'CELTIC_ANCIENT'] },
        { after: 55, keys: ['CELTIC_IRISH', 'ENGLISH', 'SCOTTISH', 'WELSH'] }
    ],
    "Baltic Sea": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -400, before: 200, keys: ['PREHISTORIC_PROTO_GERMANIC'] },
        { after: 200, keys: ['SCANDINAVIAN', 'GERMAN', 'POLISH_MEDIEVAL', 'POLISH_MODERN', 'RUSSIAN'] }
    ],
    "Aegean Sea": [
        { before: -1200, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -1200, before: 330, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
        { after: 330, before: 1453, keys: ['BYZANTINE'] },
        { after: 1453, keys: ['GREEK', 'TURKISH'] }
    ],
    "Adriatic Sea": [
        { before: -400, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -400, before: 146, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN'] },
        { after: 146, before: 476, keys: ['ANCIENT_ROMAN'] },
        { after: 476, before: 1797, keys: ['ITALIAN', 'BYZANTINE', 'SLAVIC_MEDIEVAL'] },
        { after: 1797, keys: ['ITALIAN', 'CROATIAN', 'GREEK'] }
    ],
    "Tyrrhenian Sea": [
        { before: -753, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -753, before: 476, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] },
        { after: 476, keys: ['ITALIAN'] }
    ],
    // European waters (Generic entry for naval encounters etc. - lowercase for fallback)
    "European waters": [
        { before: -800, keys: ['PREHISTORIC_PROTO_INDO_EUROPEAN'] },
        { after: -800, before: 800, keys: ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'PREHISTORIC_PROTO_CELTIC'] },
        { after: 800, keys: ['SCANDINAVIAN', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN', 'ITALIAN', 'GREEK'] }
    ]
},
    "NORTH_AMERICAN_PRE_COLUMBIAN": {
        // Pacific Coast & California
        "Pacific Coast": [
            { keys: ['PACIFIC_NORTHWEST', 'CALIFORNIA_NATIVE'] }
        ],
        "Northern California": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        "Central California Coast": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        "Southern California": [
            { keys: ['CALIFORNIA_NATIVE'] }
        ],
        // Southwest & Great Plains
        "Southwest": [
            { keys: ['PUEBLO', 'SOUTHWEST_NATIVE', 'APACHE'] }
        ],
        "Great Plains": [
            { keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'APACHE'] }
        ],
        // East and Midwest
        "Mississippi Valley": [
            { keys: ['MISSISSIPPIAN', 'CREEK_MUSKOGEE', 'ALGONQUIAN'] }
        ],
        "Northeast Woodlands": [
            { keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] }
        ],
        "Northeastern Seaboard": [
            { keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] }
        ],
        "Southeast": [
            { keys: ['CHEROKEE', 'CREEK_MUSKOGEE', 'MISSISSIPPIAN'] }
        ],
        "Atlantic Coast": [
            { keys: ['ALGONQUIAN'] }
        ],
        // North
        "Arctic and Subarctic": [
            { keys: ['INUIT', 'NORTH_AMERICAN_ALGONQUIAN'] }
        ],
        "Canada": [
            { keys: ['ALGONQUIAN', 'IROQUOIS_HAUDENOSAUNEE', 'INUIT'] }
        ],
        "Hudson Bay": [
            { keys: ['INUIT', 'NORTH_AMERICAN_ALGONQUIAN'] }
        ],
        "Northwest Territory": [
            { keys: ['GREAT_BASIN_NATIVE', 'PLAINS_NATIVE'] }
        ],
        // Mexico & Central America
        "Mexico and Central Highlands": [
            { keys: ['AZTEC'] }
        ],
        "Valley of Mexico": [
            { keys: ['AZTEC'] }
        ],
        "Central America": [
            { keys: ['MAYA', 'MIXTEC', 'ZAPOTEC'] }
        ],
        "Mayan Lowlands": [
            { keys: ['MAYA'] }
        ],
        "Yucatán Peninsula": [
            { keys: ['MAYA'] }
        ],
        "Oaxaca Highlands": [
            { keys: ['ZAPOTEC', 'MIXTEC'] }
        ],
        "Mosquito Coast": [
            { keys: ['MAYA', 'CARIB'] }
        ],
        "Panama Isthmus": [
            { keys: ['MUISCA', 'CARIB'] }
        ],
        "The Caribbean": [
            { keys: ['TAINO', 'CARIB'] }
        ],
        "Greater Antilles": [
            { keys: ['TAINO'] }
        ],
        "Lesser Antilles": [
            { keys: ['CARIB'] }
        ]
    },
    "NORTH_AMERICAN": {
        // Pacific Coast & California
        "Pacific Coast": [
            { before: 1769, keys: ['PACIFIC_NORTHWEST', 'CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['PACIFIC_NORTHWEST', 'SPANISH_CASTILIAN', 'RUSSIAN'] },
            { after: 1848, keys: ['ENGLISH', 'CHINESE_CANTONESE', 'SPANISH_LATIN_AMERICAN', 'PACIFIC_NORTHWEST'] }
        ],
        "Northern California": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['SPANISH_CASTILIAN', 'RUSSIAN', 'CALIFORNIA_NATIVE'] },
            { after: 1848, keys: ['ENGLISH', 'TEXAS_ANGLO', 'CHINESE_CANTONESE', 'ITALIAN', 'SPANISH_LATIN_AMERICAN'] }
        ],
        "Central California Coast": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            { after: 1769, before: 1848, keys: ['SPANISH_CASTILIAN', 'CALIFORNIA_NATIVE'] },
            { after: 1848, keys: ['ENGLISH', 'TEXAS_ANGLO', 'PORTUGUESE', 'FILIPINO', 'SPANISH_LATIN_AMERICAN'] }
        ],
        "Southern California": [
            { before: 1769, keys: ['CALIFORNIA_NATIVE'] },
            // The pobladores came up from Sonora and Sinaloa and were mostly
            // mestizo and mulatto, not Castilian and not Mexica: `AZTEC` had
            // lapsed in 1600 and was dropped on every draw regardless.
            { after: 1769, before: 1848, keys: ['CALIFORNIA_NATIVE', 'TEXAS_SPANISH_COLONIAL', 'SPANISH_CASTILIAN'],
              weights: { CALIFORNIA_NATIVE: 10, TEXAS_SPANISH_COLONIAL: 6, SPANISH_CASTILIAN: 3 } },
            { after: 1848, keys: ['TEXAS_ANGLO', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'CHINESE_CANTONESE', 'JAPANESE', 'KOREAN'] }
        ],
        // Southwest & Great Plains
        "Southwest": [
            {
                // The farming pueblos held most of the people; the Apache and
                // Diné bands ranged over most of the ground.
                before: 1540, keys: ['PUEBLO', 'SOUTHWEST_NATIVE', 'APACHE'],
                weights: { PUEBLO: 10, SOUTHWEST_NATIVE: 6, APACHE: 5 },
            },
            {
                // New Mexico under Spain and Mexico stayed overwhelmingly
                // Pueblo and Hispano-genízaro; peninsular Castilians were a
                // governor and his household.
                after: 1540, before: 1848, keys: ['PUEBLO', 'PUEBLO_MODERN', 'TEXAS_SPANISH_COLONIAL', 'APACHE', 'NAVAJO', 'SPANISH_CASTILIAN'],
                weights: { PUEBLO: 7, PUEBLO_MODERN: 7, TEXAS_SPANISH_COLONIAL: 8, APACHE: 4, NAVAJO: 3, SPANISH_CASTILIAN: 2 },
            },
            {
                // After the Mexican Cession. A uniform draw put two Indigenous
                // sets against two settler ones and made the modern Southwest
                // half Native American, in states that are around a tenth —
                // which is still the largest Indigenous share in the country,
                // and is why all three nations stay in the rule.
                after: 1848, keys: ['TEXAS_ANGLO', 'SPANISH_LATIN_AMERICAN', 'NAVAJO', 'PUEBLO_MODERN', 'APACHE'],
                weights: { TEXAS_ANGLO: 40, SPANISH_LATIN_AMERICAN: 38, NAVAJO: 6, PUEBLO_MODERN: 5, APACHE: 2 },
            }
        ],
        "Great Plains": [
            { before: 1700, keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'APACHE'] },
            { after: 1700, before: 1860, keys: ['PLAINS_NATIVE', 'LAKOTA_SIOUX', 'FRENCH', 'SPANISH_LATIN_AMERICAN'] },
            { after: 1860, keys: ['TEXAS_ANGLO', 'GERMAN', 'SCANDINAVIAN', 'PLAINS_NATIVE', 'LAKOTA_SIOUX'] }
        ],
        // East and Midwest
        "Mississippi Valley": [
            { before: 1673, keys: ['MISSISSIPPIAN', 'CREEK_MUSKOGEE', 'ALGONQUIAN'] },
            { after: 1673, before: 1803, keys: ['FRENCH', 'CREEK_MUSKOGEE', 'SPANISH_CASTILIAN'] },
            { after: 1803, keys: ['NORTH_AMERICAN_COLONIAL', 'AFRICAN_AMERICAN', 'GERMAN', 'CELTIC_IRISH'] }
        ],
        "Northeast Woodlands": [
            { before: 1600, keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] },
            { after: 1600, before: 1783, keys: ['NORTH_AMERICAN_COLONIAL', 'FRENCH', 'DUTCH', 'IROQUOIS_HAUDENOSAUNEE'] },
            { after: 1783, keys: ['ENGLISH', 'FRENCH', 'GERMAN', 'CELTIC_IRISH', 'ITALIAN', 'POLISH_MEDIEVAL', 'POLISH_MODERN'] }
        ],
        "Northeastern Seaboard": [
            { before: 1600, keys: ['IROQUOIS_HAUDENOSAUNEE', 'ALGONQUIAN'] },
            { after: 1600, before: 1783, keys: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'DUTCH', 'FRENCH', 'IROQUOIS_HAUDENOSAUNEE'] },
            { after: 1783, keys: ['ENGLISH', 'GERMAN', 'CELTIC_IRISH', 'ITALIAN', 'JEWISH_ASHKENAZI', 'FRENCH'] }
        ],
        // Colonial South Carolina had a Black majority from about 1708 and held
        // it for most of the eighteenth century; by 1860 the enslaved were
        // roughly forty percent of the whole South. Neither of these regions
        // carried an African-descended name set before 1783 at all, so the
        // entire colonial period — the Chesapeake from 1619, the Lowcountry
        // rice plantations, the Middle Passage itself — generated nobody.
        // Free people of colour before 1865, the whole Black population after —
        // see the note on the Caribbean above for why these two are different
        // numbers. Free Black people were about six percent of the American
        // Black population in 1860 and a much larger share of it in the upper
        // South, where manumission was commoner; `slavery-lowcountry`,
        // `slavery-chesapeake` and `slavery-deep-south` carry the rest.
        "Southeast": [
            { before: 1550, keys: ['CHEROKEE', 'CREEK_MUSKOGEE'] },
            { after: 1550, before: 1670, keys: ['SPANISH_CASTILIAN', 'ENGLISH', 'FRENCH', 'CHEROKEE'] },
            { after: 1670, before: 1865, keys: ['AFRICAN_AMERICAN', 'ENGLISH', 'SPANISH_CASTILIAN', 'FRENCH', 'CHEROKEE'],
              weights: { AFRICAN_AMERICAN: 0.05, ENGLISH: 0.45, SPANISH_CASTILIAN: 0.14, FRENCH: 0.12, CHEROKEE: 0.24 } },
            // NORTH_AMERICAN_COLONIAL ends in 1840, so its 24% was being
            // silently redistributed here; NORTH_AMERICAN_MODERN is the same
            // population a generation on, and is what that ceiling exists to
            // hand over to.
            { after: 1865, keys: ['AFRICAN_AMERICAN', 'NORTH_AMERICAN_MODERN', 'ENGLISH', 'SCOTTISH'],
              weights: { AFRICAN_AMERICAN: 0.40, NORTH_AMERICAN_MODERN: 0.24, ENGLISH: 0.24, SCOTTISH: 0.12 } }
        ],
        "Atlantic Coast": [
            { before: 1607, keys: ['ALGONQUIAN'] },
            { after: 1607, before: 1640, keys: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'DUTCH'] },
            { after: 1640, before: 1865, keys: ['AFRICAN_AMERICAN', 'NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'DUTCH'],
              weights: { AFRICAN_AMERICAN: 0.05, NORTH_AMERICAN_COLONIAL: 0.33, ENGLISH: 0.48, DUTCH: 0.14 } },
            { after: 1865, before: 1900, keys: ['AFRICAN_AMERICAN', 'ENGLISH', 'CELTIC_IRISH', 'GERMAN'],
              weights: { AFRICAN_AMERICAN: 0.30, ENGLISH: 0.34, CELTIC_IRISH: 0.20, GERMAN: 0.16 } },
            { after: 1900, keys: ['AFRICAN_AMERICAN', 'ENGLISH', 'JEWISH_ASHKENAZI', 'ITALIAN', 'PUERTO_RICAN'],
              weights: { AFRICAN_AMERICAN: 0.26, ENGLISH: 0.30, JEWISH_ASHKENAZI: 0.14, ITALIAN: 0.16, PUERTO_RICAN: 0.14 } }
        ],
        // North
        "Arctic and Subarctic": [
            { before: 1730, keys: ['INUIT', 'ALGONQUIAN'] },
            { after: 1730, keys: ['INUIT', 'RUSSIAN', 'FRENCH', 'ENGLISH', 'SCANDINAVIAN'] }
        ],
        "Northern Rockies": [
            { before: 1805, keys: ['GREAT_BASIN_NATIVE', 'PLAINS_NATIVE'] },
            { after: 1805, keys: ['ENGLISH', 'SCANDINAVIAN', 'GERMAN', 'GREAT_BASIN_NATIVE'] }
        ],
        // Mexico & Central America
        "Mexico and Central Highlands": [
            { before: 1521, keys: ['AZTEC'] },
            { after: 1521, before: 1821, keys: ['SPANISH_CASTILIAN', 'AZTEC'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN'] }
        ],
        /**
         * Mexico and Central America after independence.
         *
         * Every rule in this block named its Indigenous set beside the Spanish
         * one and meant it — and every one of those keys had lapsed by 1600, so
         * the era gate dropped it and the Spanish set took the whole draw. The
         * intent was in the table the entire time; only the mechanism was
         * missing. The modern sets below carry it out.
         *
         * The weights are census orders of magnitude, not precision: Yucatán
         * was around a third Maya-speaking in the mid-twentieth century and
         * Maya-surnamed far beyond that, Oaxaca about half Indigenous,
         * Guatemala's highlands a clear majority, and the Valley of Mexico a
         * small but real Nahua minority in a mostly mestizo city.
         */
        "Valley of Mexico": [
            { before: 1521, keys: ['AZTEC'] },
            { after: 1521, before: 1821, keys: ['SPANISH_CASTILIAN', 'AZTEC'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN'] }
        ],
        "Central America": [
            { before: 1520, keys: ['MAYA', 'MIXTEC', 'ZAPOTEC'] },
            { after: 1520, before: 1821, keys: ['SPANISH_CASTILIAN', 'MAYA', 'MAYA_MODERN'], weights: { MAYA_MODERN: 10, MAYA: 6, SPANISH_CASTILIAN: 4 } },
            {
                after: 1821, keys: ['MAYA_MODERN', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN'],
                weights: { MAYA_MODERN: 10, SPANISH_LATIN_AMERICAN: 9, AFRICAN_AMERICAN: 1 },
            }
        ],
        "Mayan Lowlands": [
            { before: 1520, keys: ['MAYA'] },
            { after: 1520, before: 1821, keys: ['MAYA', 'MAYA_MODERN', 'SPANISH_CASTILIAN'], weights: { MAYA: 8, MAYA_MODERN: 9, SPANISH_CASTILIAN: 2 } },
            { after: 1821, keys: ['MAYA_MODERN', 'SPANISH_LATIN_AMERICAN'], weights: { MAYA_MODERN: 12, SPANISH_LATIN_AMERICAN: 6 } }
        ],
        "Yucatán Peninsula": [
            { before: 1520, keys: ['MAYA'] },
            { after: 1520, before: 1821, keys: ['MAYA', 'MAYA_MODERN', 'SPANISH_CASTILIAN'], weights: { MAYA: 8, MAYA_MODERN: 9, SPANISH_CASTILIAN: 2 } },
            { after: 1821, keys: ['MAYA_MODERN', 'SPANISH_LATIN_AMERICAN'], weights: { MAYA_MODERN: 11, SPANISH_LATIN_AMERICAN: 7 } }
        ],
        "Oaxaca Highlands": [
            { before: 1521, keys: ['ZAPOTEC', 'MIXTEC'] },
            { after: 1521, before: 1821, keys: ['ZAPOTEC', 'MIXTEC', 'ZAPOTEC_MODERN', 'SPANISH_CASTILIAN'], weights: { ZAPOTEC: 5, MIXTEC: 4, ZAPOTEC_MODERN: 8, SPANISH_CASTILIAN: 2 } },
            { after: 1821, keys: ['ZAPOTEC_MODERN', 'SPANISH_LATIN_AMERICAN'], weights: { ZAPOTEC_MODERN: 10, SPANISH_LATIN_AMERICAN: 8 } }
        ],
        "Mosquito Coast": [
            { before: 1630, keys: ['MAYA', 'CARIB'] },
            {
                // The Miskito kingdom under British protection, and the Black
                // Carib deported to the bay islands in 1797. `CARIB` lapses at
                // 1700 and `MAYA` at 1600, which left this window British and
                // African-American — the two smallest populations on the coast.
                after: 1630, before: 1860, keys: ['CARIB', 'MAYA_MODERN', 'AFRO_CARIBBEAN', 'AFRICAN_AMERICAN', 'ENGLISH'],
                weights: { CARIB: 8, MAYA_MODERN: 5, AFRO_CARIBBEAN: 5, AFRICAN_AMERICAN: 2, ENGLISH: 2 },
            },
            {
                after: 1860, keys: ['MAYA_MODERN', 'AFRO_CARIBBEAN', 'SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'ENGLISH'],
                weights: { MAYA_MODERN: 7, AFRO_CARIBBEAN: 6, SPANISH_LATIN_AMERICAN: 6, AFRICAN_AMERICAN: 2, ENGLISH: 1 },
            }
        ],
        "Panama Isthmus": [
            { before: 1510, keys: ['MUISCA', 'CARIB'] },
            { after: 1510, before: 1821, keys: ['SPANISH_CASTILIAN', 'AFRICAN_AMERICAN'] },
            { after: 1821, keys: ['SPANISH_LATIN_AMERICAN', 'AFRICAN_AMERICAN', 'CHINESE_CANTONESE'] }
        ],
        // These weights are the **free** population of colour, not the whole
        // Afro-descended population — and the distinction is the whole reason
        // the numbers look low beside the demography.
        //
        // `populationStrata.ts` already produces the enslaved, and it produces
        // them properly: the stratum sets the legal status, the trade, the
        // wealth and the ancestry, and the ancestry then *chooses the name
        // set*. So an enslaved woman in 1780 Saint-Domingue is named
        // `AFRO_CARIBBEAN` by that path before this table is ever consulted.
        // Weighting this table to the enslaved share as well double-counted:
        // it added a second, parallel Afro-descended population who were free
        // by construction, because nothing on this path ever asks about
        // bondage. Measured, only 46% of Afro-descended personas in the
        // plantation centuries carried any condition at all.
        //
        // So before abolition these carry the gens de couleur libres and the
        // free coloured of the British islands — a real and important group,
        // and a small one: five to ten percent of the Afro-descended
        // population in most of the Caribbean. After abolition the strata stop
        // applying and this table becomes the whole mechanism, so the weights
        // rise to the actual population share.
        //
        // Abolition: British 1834, French 1848, Puerto Rico 1873, Cuba 1886.
        "The Caribbean": [
            { before: 1492, keys: ['TAINO', 'CARIB'] },
            { after: 1492, before: 1848, keys: ['AFRO_CARIBBEAN', 'SPANISH_CASTILIAN', 'FRENCH', 'ENGLISH', 'DUTCH', 'TAINO'],
              weights: { AFRO_CARIBBEAN: 0.10, SPANISH_CASTILIAN: 0.30, FRENCH: 0.18, ENGLISH: 0.20, DUTCH: 0.07, TAINO: 0.15 } },
            { after: 1848, before: 1898, keys: ['AFRO_CARIBBEAN', 'SPANISH_CASTILIAN', 'FRENCH', 'ENGLISH', 'DUTCH'],
              weights: { AFRO_CARIBBEAN: 0.55, SPANISH_CASTILIAN: 0.17, FRENCH: 0.11, ENGLISH: 0.13, DUTCH: 0.04 } },
            { after: 1898, keys: ['AFRO_CARIBBEAN', 'PUERTO_RICAN', 'SPANISH_LATIN_AMERICAN', 'ENGLISH', 'FRENCH'],
              weights: { AFRO_CARIBBEAN: 0.55, PUERTO_RICAN: 0.14, SPANISH_LATIN_AMERICAN: 0.16, ENGLISH: 0.09, FRENCH: 0.06 } }
        ],
        "Greater Antilles": [
            { before: 1492, keys: ['TAINO'] },
            { after: 1492, before: 1886, keys: ['AFRO_CARIBBEAN', 'SPANISH_CASTILIAN', 'TAINO'],
              weights: { AFRO_CARIBBEAN: 0.12, SPANISH_CASTILIAN: 0.72, TAINO: 0.16 } },
            { after: 1886, before: 1898, keys: ['AFRO_CARIBBEAN', 'SPANISH_CASTILIAN'],
              weights: { AFRO_CARIBBEAN: 0.45, SPANISH_CASTILIAN: 0.55 } },
            { after: 1898, keys: ['AFRO_CARIBBEAN', 'PUERTO_RICAN', 'SPANISH_LATIN_AMERICAN'],
              weights: { AFRO_CARIBBEAN: 0.42, PUERTO_RICAN: 0.28, SPANISH_LATIN_AMERICAN: 0.30 } }
        ],
        "Lesser Antilles": [
            { before: 1492, keys: ['CARIB'] },
            { after: 1492, before: 1834, keys: ['AFRO_CARIBBEAN', 'FRENCH', 'ENGLISH', 'DUTCH', 'CARIB'],
              weights: { AFRO_CARIBBEAN: 0.08, FRENCH: 0.28, ENGLISH: 0.36, DUTCH: 0.12, CARIB: 0.16 } },
            { after: 1834, keys: ['AFRO_CARIBBEAN', 'ENGLISH', 'FRENCH', 'SPANISH_LATIN_AMERICAN'],
              weights: { AFRO_CARIBBEAN: 0.76, ENGLISH: 0.12, FRENCH: 0.08, SPANISH_LATIN_AMERICAN: 0.04 } }
        ]
    },
    "SOUTH_AMERICAN": {
        "Andes North": [
            { keys: ['INCA', 'MUISCA'] }
        ],
        "Andes South": [
            { keys: ['INCA', 'MAPUCHE'] }
        ],
        "Amazon Basin": [
            { keys: ['TUPI', 'GUARANI', 'INCA'] }
        ],
        "Gran Chaco and Pampas": [
            { keys: ['GUARANI', 'MAPUCHE'] }
        ],
        "Atlantic Coast": [
            { keys: ['TUPI', 'GUARANI'] }
        ],
        "Guiana Shield": [
            { keys: ['CARIB', 'TUPI', 'GUARANI'] }
        ],
        "Patagonia": [
            { keys: ['MAPUCHE'] }
        ],
        "Southern Highlands": [
            { keys: ['INCA'] }
        ],
        "Llanos and Orinoco": [
            { keys: ['MUISCA', 'CARIB'] }
        ]
    },
    "SOUTH_AMERICAN_COLONIAL": {
        /**
         * The Andes, where the same lapse did the most damage. `INCA` ends in
         * 1580 and every post-independence rule here named it, so the Quechua
         * and Aymara majorities of Peru and Bolivia were unreachable in any
         * year after 1820 — while the German and Italian immigration to the
         * southern cone, listed beside them, drew at full strength. Measured
         * before this change, the southern Andes in 1950 came out 30% Italian
         * and 20% German and 0% Andean.
         *
         * `ANDEAN_MODERN` is the same people the `INCA` set is about, named the
         * way they were named after the conquest rather than before it.
         */
        "Andes North": [
            { before: 1533, keys: ['INCA', 'MUISCA'] },
            { after: 1533, before: 1820, keys: ['INCA', 'MUISCA', 'ANDEAN_MODERN', 'SPANISH_CASTILIAN'], weights: { INCA: 6, MUISCA: 4, ANDEAN_MODERN: 8, SPANISH_CASTILIAN: 3 } },
            {
                // Ecuador and highland Colombia: Indigenous, and mestizo in a
                // way that keeps the surnames.
                after: 1820, keys: ['ANDEAN_MODERN', 'SPANISH_LATIN_AMERICAN'],
                weights: { ANDEAN_MODERN: 8, SPANISH_LATIN_AMERICAN: 10 },
            }
        ],
        "Andes South": [
            { before: 1533, keys: ['INCA', 'MAPUCHE'] },
            { after: 1533, before: 1820, keys: ['INCA', 'MAPUCHE', 'ANDEAN_MODERN', 'SPANISH_CASTILIAN'], weights: { INCA: 6, MAPUCHE: 5, ANDEAN_MODERN: 8, SPANISH_CASTILIAN: 3 } },
            {
                // Peru, Bolivia and northern Chile. The German colonisation of
                // Valdivia and the Italian arrival in the southern cone were
                // real and are kept, at something nearer their size against an
                // Andean population that is a plurality of both republics.
                after: 1820, keys: ['ANDEAN_MODERN', 'SPANISH_LATIN_AMERICAN', 'MAPUCHE', 'ITALIAN', 'GERMAN'],
                weights: { ANDEAN_MODERN: 14, SPANISH_LATIN_AMERICAN: 12, MAPUCHE: 4, ITALIAN: 2, GERMAN: 1 },
            }
        ],
        "Amazon Basin": [
            { before: 1541, keys: ['TUPI', 'GUARANI', 'INCA'] },
            { after: 1541, keys: ['PORTUGUESE_BRAZIL', 'SPANISH_LATIN_AMERICAN', 'TUPI', 'GUARANI'] }
        ],
        "Gran Chaco and Pampas": [
            { before: 1536, keys: ['GUARANI', 'MAPUCHE'] },
            { after: 1536, before: 1816, keys: ['SPANISH_CASTILIAN', 'GUARANI', 'MAPUCHE'] },
            { after: 1816, keys: ['SPANISH_LATIN_AMERICAN', 'ITALIAN', 'GERMAN', 'GUARANI'] }
        ],
        // Brazil, not Virginia. `AFRICAN_AMERICAN` is a set of United States
        // names — its given names are twentieth-century US census names, Shirley
        // and Patricia among them — and it was standing in for the enslaved and
        // free Black population of colonial Brazil, who were baptised into
        // Portuguese names. That is how a persona on the São Paulo Plateau in
        // 1681 came out as "John Allen". `AFRO_BRAZILIAN` replaces it.
        //
        // Dutch Brazil was real but narrow: Pernambuco and Bahia, 1630 to 1654,
        // and never São Paulo. It is bounded below rather than spread across
        // three centuries of the whole coast.
        "Atlantic Coast": [
            { before: 1500, keys: ['TUPI', 'GUARANI'] },
            // Free people of colour were a far larger share in Brazil than
            // anywhere else in the Americas — manumission was commoner and
            // cheaper, and by the 1872 census the free coloured outnumbered
            // the enslaved. So this weight is higher than the Caribbean's
            // while still being the *free* population; `brazilian-slavery`
            // and its sugar-coast and mining variants carry the rest.
            { after: 1500, before: 1888, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE', 'TUPI', 'GUARANI'],
              weights: { AFRO_BRAZILIAN: 0.18, PORTUGUESE: 0.46, TUPI: 0.20, GUARANI: 0.16 } },
            { after: 1888, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE_BRAZIL', 'ITALIAN', 'GERMAN', 'JAPANESE'],
              weights: { AFRO_BRAZILIAN: 0.48, PORTUGUESE_BRAZIL: 0.28, ITALIAN: 0.12, GERMAN: 0.07, JAPANESE: 0.05 } }
        ],
        "Pernambuco Highlands": [
            { before: 1500, keys: ['TUPI'] },
            { after: 1500, before: 1630, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE', 'TUPI'],
              weights: { AFRO_BRAZILIAN: 0.16, PORTUGUESE: 0.54, TUPI: 0.30 } },
            { after: 1630, before: 1654, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE', 'DUTCH', 'TUPI'],
              weights: { AFRO_BRAZILIAN: 0.16, PORTUGUESE: 0.42, DUTCH: 0.18, TUPI: 0.24 } },
            { after: 1654, before: 1888, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE', 'TUPI'],
              weights: { AFRO_BRAZILIAN: 0.20, PORTUGUESE: 0.56, TUPI: 0.24 } },
            { after: 1888, keys: ['AFRO_BRAZILIAN', 'PORTUGUESE_BRAZIL'],
              weights: { AFRO_BRAZILIAN: 0.58, PORTUGUESE_BRAZIL: 0.42 } }
        ],
        "Guiana Shield": [
            { before: 1600, keys: ['CARIB', 'TUPI', 'GUARANI'] },
            { after: 1600, keys: ['DUTCH', 'ENGLISH', 'FRENCH', 'AFRICAN_AMERICAN', 'HINDI', 'CARIB'] }
        ],
        "Patagonia": [
            { before: 1880, keys: ['MAPUCHE'] },
            { after: 1880, keys: ['SPANISH_LATIN_AMERICAN', 'WELSH', 'GERMAN', 'MAPUCHE'] }
        ],
        "Southern Highlands": [
            { before: 1538, keys: ['INCA'] },
            { after: 1538, before: 1825, keys: ['INCA', 'ANDEAN_MODERN', 'SPANISH_CASTILIAN'], weights: { INCA: 7, ANDEAN_MODERN: 9, SPANISH_CASTILIAN: 3 } },
            // Highland Bolivia: Quechua and Aymara are the majority, not the
            // footnote this rule made them by naming a set that had lapsed.
            { after: 1825, keys: ['ANDEAN_MODERN', 'SPANISH_LATIN_AMERICAN'], weights: { ANDEAN_MODERN: 13, SPANISH_LATIN_AMERICAN: 7 } }
        ],
        "Llanos and Orinoco": [
            { before: 1531, keys: ['MUISCA', 'CARIB'] },
            { after: 1531, before: 1811, keys: ['SPANISH_CASTILIAN', 'MUISCA'] },
            { after: 1811, keys: ['SPANISH_LATIN_AMERICAN'] }
        ]
    },
    /**
     * MENA. The weighting pass that went through Africa, South Asia and
     * Southeast Asia never reached this zone, and it had the same defect in the
     * same place: every rule that named a ruling or a settler tradition beside
     * the local one drew from them uniformly. Ottoman Egypt came out half
     * Turkish; British-and-French-period Egypt came out two-thirds European, so
     * a dock worker in Cairo in 1950 was called Nicholas Mason. Ottoman Anatolia
     * gave a quarter of its personas Ashkenazi names, in a province where Jews —
     * Sephardi ones — were about one percent.
     *
     * The numbers below are shares of population, not of political weight. An
     * imperial language is not a demography: Ottoman Turkish administrators in
     * Cairo, French colons in Algiers and Latin knights in Crusader Acre were
     * all small minorities of the people living there.
     */
    "MENA": {
        "Nile Valley": [
            { before: -3100, keys: ['PREHISTORIC_MENA'] }, // Predynastic Egypt
            { after: -3100, before: 332, keys: ['PREHISTORIC_MENA'] }, // Dynastic Egypt (Pharaonic)
            {
                // Ptolemaic and Roman Egypt. Greeks held the cities and the
                // administration and were perhaps a tenth of the country;
                // Romans were a garrison.
                after: 332, before: 641, keys: ['EGYPTIAN_COPTIC', 'ANCIENT_GREEK', 'ANCIENT_ROMAN'],
                weights: { EGYPTIAN_COPTIC: 15, ANCIENT_GREEK: 4, ANCIENT_ROMAN: 1 },
            },
            {
                // Conquest to roughly the Fatimid period: Egypt is ruled in
                // Arabic and still overwhelmingly Christian on the ground.
                after: 641, before: 1100, keys: ['EGYPTIAN_COPTIC', 'ARABIC_LEVANT'],
                weights: { EGYPTIAN_COPTIC: 11, ARABIC_LEVANT: 8 },
            },
            {
                // The long conversion. By the Mamluk period the balance has
                // turned over.
                after: 1100, before: 1517, keys: ['ARABIC_LEVANT', 'EGYPTIAN_COPTIC'],
                weights: { ARABIC_LEVANT: 13, EGYPTIAN_COPTIC: 6 },
            },
            {
                after: 1517, before: 1882, keys: ['ARABIC_LEVANT', 'EGYPTIAN_COPTIC', 'TURKISH'],
                weights: { ARABIC_LEVANT: 26, EGYPTIAN_COPTIC: 3, TURKISH: 1 },
            },
            {
                // Occupation and the Kingdom. Alexandria's Greek and Italian
                // houses and the British administration were real and are
                // reachable; together they were a percent or two of Egypt.
                after: 1882, keys: ['ARABIC_LEVANT', 'EGYPTIAN_COPTIC', 'GREEK', 'ENGLISH', 'FRENCH'],
                weights: { ARABIC_LEVANT: 44, EGYPTIAN_COPTIC: 5, GREEK: 1, ENGLISH: 1, FRENCH: 1 },
            }
        ],
        "Nubian Corridor": [
            { before: -3000, keys: ['PREHISTORIC_MENA'] },
            { after: -3000, before: 785, keys: ['NUBIAN', 'EGYPTIAN_COPTIC', 'PREHISTORIC_MENA'] },
            { after: 785, keys: ['NUBIAN', 'ARABIC_TRADITIONAL'], weights: { NUBIAN: 3, ARABIC_TRADITIONAL: 2 } }
        ],
        "Levant": [
            { before: -3000, keys: ['PREHISTORIC_MENA'] }, // Early Bronze Age
            { after: -3000, before: 332, keys: ['MESOPOTAMIAN_ANCIENT', 'HEBREW'] },
            { after: 332, before: 636, keys: ['ANCIENT_GREEK', 'ANCIENT_ROMAN', 'BYZANTINE', 'HEBREW'] },
            {
                after: 636, before: 1099, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'BYZANTINE'],
                weights: { ARABIC_LEVANT: 10, LEVANTINE: 8, BYZANTINE: 3 },
            },
            {
                // Crusader period. The Latin states were a thin ruling layer in
                // the coastal towns — a uniform draw made half the Levant
                // Frankish for two centuries.
                after: 1099, before: 1291, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'FRENCH_MEDIEVAL', 'ITALIAN'],
                weights: { ARABIC_LEVANT: 11, LEVANTINE: 8, FRENCH_MEDIEVAL: 2, ITALIAN: 1 },
            },
            {
                after: 1291, before: 1918, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'TURKISH'],
                weights: { ARABIC_LEVANT: 14, LEVANTINE: 10, TURKISH: 1 },
            },
            {
                // The Mandate. The Yishuv was roughly a tenth of Palestine in
                // 1918 and Palestine is a fraction of this map region.
                after: 1918, before: 1948, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'HEBREW'],
                weights: { ARABIC_LEVANT: 13, LEVANTINE: 8, HEBREW: 1 },
            },
            {
                after: 1948, keys: ['ARABIC_LEVANT', 'LEVANTINE', 'HEBREW'],
                weights: { ARABIC_LEVANT: 12, LEVANTINE: 7, HEBREW: 3 },
            }
        ],
        "Anatolia": [
            { before: -2000, keys: ['PREHISTORIC_MENA'] }, // Hattian period
            { after: -2000, before: 334, keys: ['PERSIAN_ANCIENT', 'ANCIENT_GREEK'] }, // Hittite, Phrygian, Lydian, Persian periods
            {
                after: 334, before: 1071, keys: ['BYZANTINE', 'ARMENIAN', 'GEORGIAN'],
                // Georgians are on the far northeastern edge of this region, not
                // a third of it.
                weights: { BYZANTINE: 14, ARMENIAN: 5, GEORGIAN: 1 },
            },
            {
                // Seljuk to Ottoman: the Turkification of the plateau is in
                // progress and the Greek and Armenian populations are still
                // large.
                after: 1071, before: 1453, keys: ['TURKIC_STEPPE', 'BYZANTINE', 'ARMENIAN', 'GREEK'],
                weights: { TURKIC_STEPPE: 9, BYZANTINE: 7, GREEK: 5, ARMENIAN: 4 },
            },
            {
                // Ottoman Anatolia was around four-fifths Muslim. The Rum and
                // Armenian millets were each roughly a tenth before 1915; the
                // Jewish communities were about one percent, and Sephardi
                // rather than Ashkenazi — the set named here is the closest one
                // that exists, so it is kept and made rare.
                after: 1453, before: 1922, keys: ['TURKISH', 'GREEK', 'ARMENIAN', 'JEWISH_ASHKENAZI'],
                weights: { TURKISH: 32, GREEK: 4, ARMENIAN: 4, JEWISH_ASHKENAZI: 1 },
            },
            { after: 1922, keys: ['TURKISH'] }
        ],
        "Mesopotamia": [
            { before: -3000, keys: ['PREHISTORIC_MENA'] }, // Prehistoric/Ubaid period
            { after: -3000, before: 539, keys: ['MESOPOTAMIAN_ANCIENT'] }, // Sumerian, Akkadian, Babylonian, Assyrian
            // Sasanian Mesopotamia — Aramaic-speaking under Persian rule. The
            // Greek set named here ends in 400 and was dropped on every draw,
            // which was right by accident: Seleucid Greek naming was long gone.
            { after: 539, before: 633, keys: ['PERSIAN_ANCIENT', 'LEVANTINE'], weights: { PERSIAN_ANCIENT: 4, LEVANTINE: 5 } },
            { after: 633, before: 1258, keys: ['ARABIAN_HEJAZ', 'ARABIC_TRADITIONAL', 'PERSIAN_FARSI'], weights: { ARABIAN_HEJAZ: 6, ARABIC_TRADITIONAL: 6, PERSIAN_FARSI: 4 } },
            {
                // The Ilkhanate and its successors ruled Iraq; they did not
                // repopulate it. This rule named no Arabic set at all, so for
                // three centuries nobody in Basra or Mosul had an Arabic name.
                after: 1258, before: 1534, keys: ['ARABIC_LEVANT', 'PERSIAN_FARSI', 'TURKIC_STEPPE', 'MONGOLIAN_TRADITIONAL'],
                weights: { ARABIC_LEVANT: 16, PERSIAN_FARSI: 5, TURKIC_STEPPE: 3, MONGOLIAN_TRADITIONAL: 1 },
            },
            {
                after: 1534, before: 1918, keys: ['ARABIC_LEVANT', 'PERSIAN_FARSI', 'TURKISH'],
                weights: { ARABIC_LEVANT: 16, PERSIAN_FARSI: 4, TURKISH: 2 },
            },
            {
                after: 1918, keys: ['ARABIC_LEVANT', 'PERSIAN_FARSI'],
                weights: { ARABIC_LEVANT: 16, PERSIAN_FARSI: 3 },
            }
        ],
        "Maghreb": [
            { before: 146, keys: ['BERBER_AMAZIGH'] },
            { after: 146, before: 647, keys: ['ANCIENT_ROMAN', 'BERBER_AMAZIGH'] },
            { after: 647, before: 1500, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'ARABIAN_HEJAZ', 'ARABIC_TRADITIONAL'], weights: { MAGHREBI: 10, BERBER_AMAZIGH: 9, ARABIAN_HEJAZ: 2, ARABIC_TRADITIONAL: 2 } },
            {
                // The regencies and then Algérie française. The pieds-noirs were
                // the largest settler population anywhere in Africa and still
                // only about a tenth of Algeria at their height; the Ottoman
                // corps in Algiers and Tunis numbered in the thousands.
                after: 1500, before: 1962, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'FRENCH', 'SPANISH_CASTILIAN', 'TURKISH'],
                weights: { MAGHREBI: 20, BERBER_AMAZIGH: 13, FRENCH: 2, SPANISH_CASTILIAN: 1, TURKISH: 1 },
            },
            {
                after: 1962, keys: ['MAGHREBI', 'BERBER_AMAZIGH', 'FRENCH'],
                weights: { MAGHREBI: 22, BERBER_AMAZIGH: 14, FRENCH: 1 },
            }
        ],
        "Arabian Peninsula": [
            { before: 622, keys: ['ARABIAN_HEJAZ', 'HEBREW'] },
            { after: 622, before: 1517, keys: ['ARABIAN_HEJAZ', 'ARABIC_TRADITIONAL'] },
            {
                // Ottoman authority over the Hejaz was a garrison and a
                // railway, not a settlement.
                // Written as ARABIAN_HEJAZ, which ends in 700, so this rule
                // was handing every persona in Ottoman Arabia a Turkish name.
                after: 1517, before: 1918, keys: ['ARABIC_TRADITIONAL', 'TURKISH'],
                weights: { ARABIC_TRADITIONAL: 24, TURKISH: 1 },
            },
            { after: 1918, keys: ['ARABIC_TRADITIONAL'] }
        ],
        "Hejaz Mountains": [
            { before: 1918, keys: ['ARABIAN_HEJAZ', 'ARABIC_TRADITIONAL', 'TURKISH'], weights: { ARABIAN_HEJAZ: 12, ARABIC_TRADITIONAL: 12, TURKISH: 1 } },
            { after: 1918, keys: ['ARABIC_TRADITIONAL'] }
        ],
        "Persian Plateau": [
            { before: 651, keys: ['PERSIAN_ANCIENT', 'SOGDIAN'] },
            { after: 651, before: 1220, keys: ['PERSIAN_FARSI', 'PERSIAN_KHORASAN', 'ARABIAN_HEJAZ', 'ARABIC_TRADITIONAL'], weights: { PERSIAN_FARSI: 9, PERSIAN_KHORASAN: 7, ARABIAN_HEJAZ: 2, ARABIC_TRADITIONAL: 2 } },
            { after: 1220, before: 1501, keys: ['PERSIAN_FARSI', 'MONGOLIAN_TRADITIONAL', 'TURKIC_STEPPE'] },
            { after: 1501, keys: ['PERSIAN_FARSI'] }
        ],
        "Caucasus": [
            { before: 600, keys: ['ARMENIAN', 'GEORGIAN', 'PERSIAN_ANCIENT', 'ANCIENT_ROMAN'] },
            {
                after: 600, before: 1800, keys: ['ARMENIAN', 'GEORGIAN', 'PERSIAN_FARSI', 'TURKISH'],
                weights: { ARMENIAN: 8, GEORGIAN: 8, PERSIAN_FARSI: 4, TURKISH: 3 },
            },
            {
                // Russian rule brought soldiers, officials and a Cossack
                // frontier, and Russians are a real minority in the North
                // Caucasus — but the mountains stayed Caucasian.
                after: 1800, keys: ['ARMENIAN', 'GEORGIAN', 'RUSSIAN'],
                weights: { ARMENIAN: 8, GEORGIAN: 8, RUSSIAN: 3 },
            }
        ]
    },
    /**
     * Sub-Saharan Africa. Every rule here previously named an African tradition
     * first and then two or three European ones, and the draw was uniform, so
     * the colonial pool won most of the time — and the African key it was
     * competing against ('YORUBA', 'SWAHILI') was not a key in CHARACTER_NAMES
     * at all, so it lost every draw it did win. The real sets are era-qualified
     * (YORUBA_TRADITIONAL / YORUBA_MODERN, SWAHILI_COASTAL / SWAHILI_INTERIOR);
     * both eras are listed and the era gate in filterNameKeys drops whichever
     * cannot exist yet.
     *
     * The weights are deliberately not equal. Settler populations in colonial
     * Africa were small — a few per cent of the whole even at their height, and
     * far less outside the towns — so a settler name is written as the rare
     * outcome it was rather than as a coin flip.
     */
    "SUB_SAHARAN_AFRICAN": {
        "Sahel": [
            { before: 800, keys: ['WEST_AFRICAN_SAHEL'] },
            {
                after: 800, before: 1900, keys: ['WEST_AFRICAN_SAHEL', 'HAUSA', 'MAGHREBI'],
                // Maghrebi names come with the trans-Saharan trade and the
                // towns it fed, not with the countryside.
                weights: { WEST_AFRICAN_SAHEL: 12, HAUSA: 8, MAGHREBI: 2 },
            },
            {
                after: 1900, keys: ['WEST_AFRICAN_SAHEL', 'HAUSA', 'FRENCH'],
                weights: { WEST_AFRICAN_SAHEL: 12, HAUSA: 8, FRENCH: 1 },
            }
        ],
        "Upper Guinea": [
            { before: 1500, keys: ['YORUBA_TRADITIONAL', 'WEST_AFRICAN_SAHEL'] },
            {
                // Before the settlements. The rule below used to start at 1500,
                // which put anglophone Americo-Liberian names on this coast a
                // century and a half before the Province of Freedom existed —
                // a 1648 persona from the Ivory Coast came out called Annie.
                after: 1500, before: 1787,
                keys: ['YORUBA_TRADITIONAL', 'WEST_AFRICAN_SAHEL', 'PORTUGUESE'],
                weights: { YORUBA_TRADITIONAL: 12, WEST_AFRICAN_SAHEL: 9, PORTUGUESE: 2 },
            },
            {
                // AFRICAN_AMERICAN covers the Americo-Liberian and Sierra
                // Leone Krio settlements — freed and recaptured people landed
                // on this coast from 1787 (Granville Town) and 1822 (Cape
                // Mesurado), carrying anglophone names. A real population, and
                // a small one against the interior.
                after: 1787, before: 1960,
                keys: ['YORUBA_TRADITIONAL', 'YORUBA_MODERN', 'WEST_AFRICAN_SAHEL', 'AFRICAN_AMERICAN', 'PORTUGUESE', 'ENGLISH', 'FRENCH'],
                weights: { YORUBA_TRADITIONAL: 10, YORUBA_MODERN: 6, WEST_AFRICAN_SAHEL: 8, AFRICAN_AMERICAN: 2, PORTUGUESE: 1, ENGLISH: 1, FRENCH: 1 },
            },
            {
                after: 1960, keys: ['YORUBA_MODERN', 'YORUBA_TRADITIONAL', 'WEST_AFRICAN_SAHEL'],
                weights: { YORUBA_MODERN: 10, YORUBA_TRADITIONAL: 6, WEST_AFRICAN_SAHEL: 8 },
            }
        ],
        // Cross River Delta, Bantu Uplands, Kinshasa Hinterland, Ituri, the
        // Congo bend and the Kongo coast. Not one Yoruba locality among them,
        // and Yoruba plus the West African house set were the only options.
        // `SUB_SAHARAN_AFRICAN` is deliberately gone from this region and the
        // two below: its contents are West African, so as a stand-in for the
        // Congo it was not a generic answer but a wrong one. Kikongo and Luba
        // stand in for the peoples still without sets — Mongo, Teke, Fang —
        // which at least keeps the family and the continent's half right.
        // Cross River is Igbo and Efik country, a thousand kilometres from the
        // Kongo coast at the other end of the same map region.
        "Cross River Delta": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            { after: 500, keys: ['IGBO'] }
        ],
        "Kongo Coast": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            { after: 500, before: 1480, keys: ['KONGO'] },
            { after: 1480, keys: ['KONGO', 'PORTUGUESE'], weights: { KONGO: 30, PORTUGUESE: 1 } }
        ],
        "Kinshasa Hinterland": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            { after: 500, keys: ['KONGO', 'LUBA'], weights: { KONGO: 12, LUBA: 5 } }
        ],
        "Lualaba Headwaters": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            { after: 500, keys: ['LUBA'] }
        ],
        "Lower Guinea and Congo Basin": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            {
                after: 500, before: 1480, keys: ['KONGO', 'LUBA', 'IGBO'],
                weights: { KONGO: 14, LUBA: 10, IGBO: 8 },
            },
            {
                after: 1480, before: 1960,
                keys: ['KONGO', 'LUBA', 'IGBO', 'PORTUGUESE', 'FRENCH', 'DUTCH'],
                weights: { KONGO: 14, LUBA: 10, IGBO: 8, PORTUGUESE: 1, FRENCH: 1, DUTCH: 1 },
            },
            {
                after: 1960, keys: ['KONGO', 'LUBA', 'IGBO', 'FRENCH'],
                weights: { KONGO: 14, LUBA: 10, IGBO: 8, FRENCH: 1 },
            }
        ],
        "Horn of Africa": [
            { before: 1270, keys: ['ETHIOPIAN_HIGHLAND'] },
            {
                after: 1270, before: 1936, keys: ['AMHARIC', 'SOMALI', 'ETHIOPIAN_HIGHLAND'],
                weights: { AMHARIC: 10, SOMALI: 8, ETHIOPIAN_HIGHLAND: 4 },
            },
            {
                // Italian rule over Ethiopia lasted five years and never
                // displaced local naming; Somali and Amharic names are the
                // ordinary case throughout.
                after: 1936, keys: ['AMHARIC', 'SOMALI', 'ITALIAN'],
                weights: { AMHARIC: 12, SOMALI: 10, ITALIAN: 1 },
            }
        ],
        "East African Rift": [
            { before: 700, keys: ['PREHISTORIC_AFRICAN'] },
            {
                after: 700, before: 1880, keys: ['SWAHILI_INTERIOR', 'RWANDA_BURUNDI', 'ARABIC_TRADITIONAL'],
                // Arab names reach the interior along the caravan roads, and
                // then only near them.
                weights: { SWAHILI_INTERIOR: 12, RWANDA_BURUNDI: 8, ARABIC_TRADITIONAL: 2 },
            },
            {
                // Tanganyika, Kenya and Uganda under British and (to 1919)
                // German administration. The European settler population of
                // Kenya peaked around sixty thousand against some six million
                // Africans; the South Asian population was larger but still a
                // small minority, and concentrated in the towns and the trades.
                after: 1880, keys: ['SWAHILI_INTERIOR', 'RWANDA_BURUNDI', 'HINDI', 'ENGLISH'],
                weights: { SWAHILI_INTERIOR: 30, RWANDA_BURUNDI: 12, HINDI: 2, ENGLISH: 1 },
            }
        ],
        "Swahili Coast": [
            { before: 700, keys: ['SWAHILI_COASTAL'] },
            {
                after: 700, before: 1500, keys: ['SWAHILI_COASTAL', 'ARABIC_TRADITIONAL', 'PERSIAN_FARSI'],
                // The Shirazi and Omani presence on the coast is real and old,
                // and the Swahili towns were Muslim, but the population was
                // overwhelmingly local.
                weights: { SWAHILI_COASTAL: 14, ARABIC_TRADITIONAL: 4, PERSIAN_FARSI: 2 },
            },
            {
                after: 1500, before: 1960, keys: ['SWAHILI_COASTAL', 'ARABIC_TRADITIONAL', 'PORTUGUESE', 'ENGLISH'],
                weights: { SWAHILI_COASTAL: 20, ARABIC_TRADITIONAL: 5, PORTUGUESE: 1, ENGLISH: 1 },
            },
            { after: 1960, keys: ['SWAHILI_COASTAL'] }
        ],
        // The Cape and Karoo are Xhosa, the highveld and Kalahari margin are
        // Sotho-Tswana, the Limpopo and Zambezi are Shona, and only the
        // Drakensberg side is Zulu — and Zulu as a naming tradition dates from
        // the kingdom, so the era gate keeps it out of the earlier window on
        // its own. Khoisan naming is still missing and nothing here stands in
        // for it honestly; the Cape before the Bantu arrival is the gap.
        "Southern Africa": [
            { before: 300, keys: ['PREHISTORIC_AFRICAN'] },
            {
                after: 300, before: 1652, keys: ['SOTHO_TSWANA', 'XHOSA', 'SHONA', 'ZULU'],
                weights: { SOTHO_TSWANA: 13, XHOSA: 9, SHONA: 14, ZULU: 12 },
            },
            {
                // The one region where a settler pool genuinely deserves real
                // weight: by 1900 whites were about a fifth of the population
                // of what became South Africa. Still not half, which is what a
                // uniform draw over four keys was giving them — and this region
                // reaches well past South Africa, into Zimbabwe and the
                // Zambezi, where they were a few percent at most.
                after: 1652, before: 1994, keys: ['ZULU', 'XHOSA', 'SOTHO_TSWANA', 'SHONA', 'DUTCH', 'ENGLISH'],
                weights: { ZULU: 12, XHOSA: 9, SOTHO_TSWANA: 13, SHONA: 14, DUTCH: 3, ENGLISH: 3 },
            },
            {
                after: 1994, keys: ['ZULU', 'XHOSA', 'SOTHO_TSWANA', 'SHONA', 'ENGLISH', 'DUTCH'],
                weights: { ZULU: 12, XHOSA: 9, SOTHO_TSWANA: 13, SHONA: 14, ENGLISH: 2, DUTCH: 2 },
            }
        ],
        // Ubangi, the equatorial forest, Lake Tanganyika, the Bateke plateau
        // and the Lualaba headwaters, which is where the Luba states formed.
        "Central Africa": [
            { before: 500, keys: ['PREHISTORIC_AFRICAN'] },
            {
                after: 500, before: 1870, keys: ['LUBA', 'RWANDA_BURUNDI', 'KONGO'],
                weights: { LUBA: 14, RWANDA_BURUNDI: 10, KONGO: 7 },
            },
            {
                // Belgian and French Central Africa had among the smallest
                // settler populations on the continent. The old rule listed
                // no African set at all for this window, so every persona in
                // the Congo basin after 1870 came out French or Portuguese.
                after: 1870, keys: ['LUBA', 'RWANDA_BURUNDI', 'KONGO', 'FRENCH', 'PORTUGUESE'],
                weights: { LUBA: 14, RWANDA_BURUNDI: 10, KONGO: 7, FRENCH: 1, PORTUGUESE: 1 },
            }
        ],
        // The Niger is the line: Yoruba and Edo to the west of it, Igbo to the
        // east, and the region-level rule below cannot tell them apart — it put
        // Igbo names in the Oyo hinterland, which is the Yoruba heartland, as
        // readily as on the Ibo plateau. The locale rules do the dividing.
        "Oyo Hinterland": [
            { before: 1960, keys: ['YORUBA_TRADITIONAL'] },
            { after: 1960, keys: ['YORUBA_MODERN', 'YORUBA_TRADITIONAL'], weights: { YORUBA_MODERN: 10, YORUBA_TRADITIONAL: 4 } }
        ],
        "Ogun River Basin": [
            { before: 1960, keys: ['YORUBA_TRADITIONAL'] },
            { after: 1960, keys: ['YORUBA_MODERN', 'YORUBA_TRADITIONAL'], weights: { YORUBA_MODERN: 10, YORUBA_TRADITIONAL: 4 } }
        ],
        // Benin is Edo, which has no set of its own; Yoruba is the neighbouring
        // tradition and the closer of the two by a long way.
        "Benin Lowlands": [
            { before: 1960, keys: ['YORUBA_TRADITIONAL'] },
            { after: 1960, keys: ['YORUBA_MODERN', 'YORUBA_TRADITIONAL'], weights: { YORUBA_MODERN: 10, YORUBA_TRADITIONAL: 4 } }
        ],
        "Ibo Plateau": [
            { keys: ['IGBO'] }
        ],
        // Ijaw, Itsekiri and Efik have no sets; Igbo is the delta's largest
        // tradition and its immediate neighbour.
        "Niger Delta": [
            { keys: ['IGBO'] }
        ],
        // The Middle Belt is neither: Hausa and the Sahel reach down into it.
        "Jos Plateau": [
            {
                keys: ['HAUSA', 'WEST_AFRICAN_SAHEL', 'IGBO'],
                weights: { HAUSA: 10, WEST_AFRICAN_SAHEL: 8, IGBO: 4 },
            }
        ],
        // One of this region's six locales is called Ibo Plateau and another is
        // the Niger Delta, and the rule offered Yoruba or Akan. Igbo speakers
        // are about as numerous as Yoruba and were being named as Yoruba.
        "West African Forests": [
            { before: 1600, keys: ['YORUBA_TRADITIONAL', 'IGBO', 'AKAN'], weights: { YORUBA_TRADITIONAL: 14, IGBO: 14, AKAN: 7 } },
            {
                after: 1600, before: 1960,
                keys: ['YORUBA_TRADITIONAL', 'YORUBA_MODERN', 'IGBO', 'AKAN', 'ENGLISH'],
                weights: { YORUBA_TRADITIONAL: 10, YORUBA_MODERN: 4, IGBO: 14, AKAN: 7, ENGLISH: 1 },
            },
            {
                after: 1960, keys: ['YORUBA_MODERN', 'YORUBA_TRADITIONAL', 'IGBO', 'AKAN'],
                weights: { YORUBA_MODERN: 10, YORUBA_TRADITIONAL: 4, IGBO: 14, AKAN: 7 },
            }
        ],
        "Madagascar and Islands": [
            { before: 1000, keys: ['MALAGASY_SAKALAVA', 'SWAHILI_COASTAL'] },
            { after: 1000, before: 1817, keys: ['MALAGASY_SAKALAVA', 'MALAGASY_BETSILEO'] },
            { after: 1817, before: 1897, keys: ['MALAGASY_MERINA', 'MALAGASY_BETSILEO', 'MALAGASY_SAKALAVA'] },
            {
                after: 1897, keys: ['MALAGASY_MERINA', 'MALAGASY_BETSILEO', 'MALAGASY_SAKALAVA', 'FRENCH'],
                weights: { MALAGASY_MERINA: 10, MALAGASY_BETSILEO: 6, MALAGASY_SAKALAVA: 6, FRENCH: 1 },
            }
        ]
    },
    /**
     * Southeast Asia, which now has its own cultural zone. These four regions
     * were entries under `SOUTH_ASIAN`, so the lookup only reached them when
     * the zone happened to be South Asian — which it always was, because the
     * geography filed the Philippines under the South Asian continent.
     */
    "SOUTHEAST_ASIAN": {
        // Maritime Southeast Asia below had its colonial keys removed outright;
        // these three rules kept theirs on a uniform draw, which put French
        // settlers at two in five on the mainland and one in three in Siam —
        // a country that was never colonised at all. French Indochina held
        // perhaps forty thousand Europeans against twenty million Vietnamese.
        "Mainland Southeast Asia": [
            { before: 1000, keys: ['KHMER', 'BURMESE'] },
            { after: 1000, before: 1887, keys: ['KHMER', 'VIETNAMESE', 'THAI', 'BURMESE', 'MALAY'] },
            {
                after: 1887, keys: ['VIETNAMESE', 'THAI', 'KHMER', 'FRENCH', 'ENGLISH'],
                weights: { VIETNAMESE: 16, THAI: 12, KHMER: 10, FRENCH: 1, ENGLISH: 1 },
            }
        ],
        "Indochina Interior": [
            { before: 1893, keys: ['THAI', 'KHMER', 'VIETNAMESE'] },
            {
                after: 1893, keys: ['THAI', 'FRENCH', 'VIETNAMESE'],
                weights: { THAI: 24, VIETNAMESE: 15, FRENCH: 1 },
            }
        ],
        "Maritime Southeast Asia": [
           { before: 800, keys: ['INDONESIAN', 'VIETNAMESE'] },
            { before: 1300, keys: ['MALAY', 'INDONESIAN', 'DRAVIDIAN', 'VIETNAMESE'] },
            // Ordinary-person generation defaults to local naming. Colonial and
            // merchant-diaspora identities need a coordinated explicit track;
            // selecting a European name here by itself also changed appearance
            // while leaving religion and household context local.
            { after: 1300, before: 1945, keys: ['MALAY_ISLAMIC_HISTORICAL', 'MALAY', 'INDONESIAN', 'JAVANESE'] },
            { after: 1945, keys: ['MALAY', 'INDONESIAN', 'CHINESE_CANTONESE'] }
        ],
        // The FILIPINO set already carries the hispanised surnames the Clavería
        // decree of 1849 made near-universal — dela Cruz, Santos, Reyes, Garcia
        // — so listing a Spanish set beside it does not add Spanish naming, it
        // adds actual Spaniards, who were well under one percent. Same for the
        // American and Japanese periods, neither of which displaced local names.
        "Philippines": [
            { before: 1565, keys: ['MELANESIAN'] },
            {
                after: 1565, before: 1898, keys: ['FILIPINO', 'SPANISH_CASTILIAN'],
                weights: { FILIPINO: 39, SPANISH_CASTILIAN: 1 },
            },
            {
                after: 1898, keys: ['FILIPINO', 'ENGLISH', 'SPANISH_LATIN_AMERICAN', 'JAPANESE'],
                weights: { FILIPINO: 37, ENGLISH: 1, SPANISH_LATIN_AMERICAN: 1, JAPANESE: 1 },
            }
        ],
    },
    /**
     * The Raj-era rules named `ENGLISH` beside the region's own traditions and
     * left the draw uniform, so a quarter to a third of everyone born in India
     * after 1857 came out called Florence Green. Anglo-Indians and resident
     * Britons together never reached half a percent of the population; the
     * weights below put them at roughly one in forty, which is still generous
     * and leaves the set reachable for the households where it belongs.
     */
    "SOUTH_ASIAN": {
        "Indus Valley": [
            { before: 1206, keys: ['SANSKRIT_CLASSICAL', 'PUNJABI'] },
            { after: 1206, before: 1857, keys: ['PUNJABI', 'PERSIAN_FARSI', 'HINDI'] },
            {
                after: 1857, keys: ['PUNJABI', 'HINDI', 'ENGLISH'],
                weights: { PUNJABI: 22, HINDI: 17, ENGLISH: 1 },
            }
        ],
        "Gangetic Plain": [
            { before: 1206, keys: ['SANSKRIT_CLASSICAL', 'HINDI'] },
            { after: 1206, before: 1857, keys: ['HINDI', 'PERSIAN_FARSI', 'RAJPUT'] },
            {
                after: 1857, keys: ['HINDI', 'BENGALI_TRADITIONAL', 'BENGALI_MODERN', 'ENGLISH'],
                weights: { HINDI: 21, BENGALI_TRADITIONAL: 9, BENGALI_MODERN: 9, ENGLISH: 1 },
            }
        ],
        "Deccan Plateau": [
            { before: 1347, keys: ['DRAVIDIAN', 'TAMIL'] },
            { after: 1347, before: 1857, keys: ['TAMIL', 'DRAVIDIAN', 'HINDI', 'PERSIAN_FARSI'] },
            {
                after: 1857, keys: ['TAMIL', 'DRAVIDIAN', 'HINDI', 'ENGLISH'],
                weights: { TAMIL: 15, DRAVIDIAN: 13, HINDI: 11, ENGLISH: 1 },
            }
        ],
        "Himalayas and Northeast": [
            { keys: ['SANSKRIT_CLASSICAL', 'HINDI', 'BENGALI_TRADITIONAL', 'BENGALI_MODERN', 'CHINESE_MANDARIN'] }
        ],
        "Central India": [
            { before: 1200, keys: ['SANSKRIT_CLASSICAL', 'DRAVIDIAN'] },
            { after: 1200, keys: ['HINDI', 'RAJPUT', 'BENGALI_TRADITIONAL', 'BENGALI_MODERN'] }
        ],
        // Four colonial windows stacked here, each drawn from uniformly, so
        // half of British-period Ceylon was coming out European. The Burghers
        // were about half a percent. Portuguese weighs higher than the others
        // from the Dutch period on: coastal Catholic converts kept Portuguese
        // given names and surnames long after the Portuguese left, which is a
        // local naming tradition rather than a settler one.
        "Sri Lanka": [
            { before: 1505, keys: ['DRAVIDIAN', 'TAMIL', 'SANSKRIT_CLASSICAL'] },
            {
                after: 1505, before: 1658, keys: ['TAMIL', 'DRAVIDIAN', 'PORTUGUESE'],
                weights: { TAMIL: 20, DRAVIDIAN: 19, PORTUGUESE: 1 },
            },
            {
                after: 1658, before: 1796, keys: ['TAMIL', 'DRAVIDIAN', 'DUTCH', 'PORTUGUESE'],
                weights: { TAMIL: 20, DRAVIDIAN: 16, PORTUGUESE: 3, DUTCH: 1 },
            },
            {
                after: 1796, before: 1948, keys: ['TAMIL', 'DRAVIDIAN', 'ENGLISH', 'DUTCH'],
                weights: { TAMIL: 22, DRAVIDIAN: 16, ENGLISH: 1, DUTCH: 1 },
            },
            {
                after: 1948, keys: ['TAMIL', 'DRAVIDIAN', 'ENGLISH'],
                weights: { TAMIL: 24, DRAVIDIAN: 15, ENGLISH: 1 },
            }
        ],
        // Southeast Asia
        "Taiwan and East China Sea": [
            { before: 1624, keys: ['CHINESE_CANTONESE', 'POLYNESIAN'] },
            // The Dutch held Formosa from 1624 to 1662 with a garrison and a
            // few hundred civilians; this window runs to 1895, so half of two
            // and a half centuries of Taiwanese were coming out Dutch.
            { after: 1624, before: 1895, keys: ['CHINESE_CANTONESE', 'DUTCH'], weights: { CHINESE_CANTONESE: 30, DUTCH: 1 } },
            { after: 1895, before: 1945, keys: ['JAPANESE', 'CHINESE_MANDARIN'] },
            { after: 1945, keys: ['CHINESE_MANDARIN'] }
        ]
    },
    "EAST_ASIAN": {
        "Siberia": [
            { before: 1600, keys: ['SIBERIAN_INDIGENOUS', 'PREHISTORIC_ASIAN', 'TURKIC_STEPPE'], weights: { SIBERIAN_INDIGENOUS: 6, PREHISTORIC_ASIAN: 1, TURKIC_STEPPE: 3 } },
            {
                // This rule was `['RUSSIAN']`, full stop, so the Sakha, Buryat,
                // Evenk, Khanty and Nenets stopped existing in 1600 — the year
                // of the conquest, not of their disappearance. Russians did
                // become the great majority of Siberia and the weights say so;
                // the point is that the minority is now reachable at all.
                after: 1600, keys: ['RUSSIAN', 'SIBERIAN_INDIGENOUS'],
                weights: { RUSSIAN: 4, SIBERIAN_INDIGENOUS: 1 },
            }
        ],
        "Kazakh Steppes": [
            { before: 1200, keys: ['TURKIC_STEPPE', 'SOGDIAN', 'PERSIAN_KHORASAN'] },
            { after: 1200, before: 1850, keys: ['MONGOLIAN_TRADITIONAL', 'KAZAKH', 'TURKIC_STEPPE'] },
            {
                // The one Russian-frontier rule that was close to right on a
                // uniform draw: Russians and Ukrainians were about two-fifths
                // of the Kazakh SSR after the Virgin Lands campaign, and
                // briefly outnumbered Kazakhs outright.
                after: 1850, keys: ['KAZAKH', 'RUSSIAN'],
                weights: { KAZAKH: 3, RUSSIAN: 2 },
            }
        ],
        "Khorasan": [
            { before: 651, keys: ['PERSIAN_ANCIENT', 'SOGDIAN'] },
            { after: 651, before: 1220, keys: ['PERSIAN_KHORASAN', 'TURKIC_STEPPE'] },
            { after: 1220, keys: ['PERSIAN_KHORASAN', 'MONGOLIAN_TRADITIONAL', 'UZBEK'] }
        ],
        "Transoxiana": [
            { before: 712, keys: ['SOGDIAN', 'PERSIAN_ANCIENT'] },
            { after: 712, before: 1220, keys: ['PERSIAN_KHORASAN', 'SOGDIAN', 'TURKIC_STEPPE'] },
            { after: 1220, before: 1873, keys: ['UZBEK', 'MONGOLIAN_TRADITIONAL', 'PERSIAN_FARSI'] },
            {
                // Russian settlement in Transoxiana was urban and thin — a
                // tenth of Uzbekistan at the Soviet peak, concentrated in
                // Tashkent — not a third of everybody.
                after: 1873, keys: ['UZBEK', 'KYRGYZ', 'RUSSIAN'],
                weights: { UZBEK: 12, KYRGYZ: 6, RUSSIAN: 2 },
            }
        ],
        "Central Asian Oases": [
            { before: 1220, keys: ['SOGDIAN', 'PERSIAN_KHORASAN', 'TURKIC_STEPPE'] },
            { after: 1220, before: 1873, keys: ['UZBEK', 'TURKMEN', 'MONGOLIAN_TRADITIONAL'] },
            {
                after: 1873, keys: ['UZBEK', 'TURKMEN', 'KYRGYZ', 'RUSSIAN'],
                weights: { UZBEK: 10, TURKMEN: 8, KYRGYZ: 5, RUSSIAN: 2 },
            }
        ],
        "Mongolia and Manchuria": [
            { before: 1206, keys: ['MONGOLIAN', 'TURKIC_STEPPE'] },
            { after: 1206, before: 1700, keys: ['MONGOLIAN', 'MONGOLIAN_TRADITIONAL'] },
            { after: 1700, keys: ['MONGOLIAN', 'CHINESE_MANDARIN'] }
        ],
        "North China Plain": [
            { before: 1279, keys: ['CHINESE_MANDARIN'] },
            { after: 1279, before: 1368, keys: ['MONGOLIAN_TRADITIONAL', 'CHINESE_MANDARIN'] }, // Yuan Dynasty
            { after: 1368, before: 1644, keys: ['CHINESE_MANDARIN'] }, // Ming Dynasty
            { after: 1644, before: 1912, keys: ['CHINESE_MANDARIN'] }, // Qing Dynasty (Manchu)
            { after: 1912, keys: ['CHINESE_MANDARIN'] }
        ],
        /**
         * The colonial enclaves were written into the rule for the whole
         * region: an undated `['CHINESE_CANTONESE', 'ENGLISH', 'PORTUGUESE']`
         * drawn uniformly, so two out of every three personas anywhere in
         * South China after 1900 were named as though Hong Kong and Macau had
         * annexed the Yangtze — a kitchen porter in the Yangtze Delta in 1951
         * called Jane Scott, married to George Walker.
         *
         * The enclaves belong to the Pearl River Delta locale, and even there
         * they were a small minority: Hong Kong was overwhelmingly Chinese
         * under British rule, and an English *surname* was rarer still than an
         * English given name. So the region keeps its own traditions and the
         * locale carries the colonial sets at a weight that matches how many
         * people actually bore them.
         */
        "South China": [
            { before: 1900, keys: ['CHINESE_CANTONESE', 'VIETNAMESE'], weights: { CHINESE_CANTONESE: 9, VIETNAMESE: 1 } },
            { after: 1900, keys: ['CHINESE_CANTONESE', 'CHINESE_MANDARIN'], weights: { CHINESE_CANTONESE: 3, CHINESE_MANDARIN: 2 } }
        ],
        // Wu-speaking, and Mandarin in every official register since. Cantonese
        // names here are the region rule reaching a place it does not describe.
        "Yangtze Delta": [
            { before: 1900, keys: ['CHINESE_MANDARIN'] },
            { after: 1900, keys: ['CHINESE_MANDARIN'] }
        ],
        // Canton, Hong Kong, Macau.
        "Pearl River Delta": [
            { before: 1557, keys: ['CHINESE_CANTONESE'] },
            { after: 1557, before: 1841, keys: ['CHINESE_CANTONESE', 'PORTUGUESE'], weights: { CHINESE_CANTONESE: 24, PORTUGUESE: 1 } },
            { after: 1841, keys: ['CHINESE_CANTONESE', 'ENGLISH', 'PORTUGUESE'], weights: { CHINESE_CANTONESE: 24, ENGLISH: 1, PORTUGUESE: 1 } }
        ],
        /**
         * One undated rule of `['CHINESE_MANDARIN', 'PREHISTORIC_ASIAN']` for
         * the whole of history, so every persona from Lhasa to Kailash in every
         * century came out with a Han name — while a fully authored `TIBETAN`
         * set sat in CHARACTER_NAMES unreachable from any rule.
         *
         * The three Tibetan-plateau locales are split out because the region
         * bundles them with the Sichuan basin, and its locales draw close to
         * evenly: a single rule here is wrong for half the region whichever way
         * it leans. Written Tibetan dates from the imperial period in the
         * seventh century; before that the plateau takes the reconstructed set.
         */
        "Tibetan Plateau": [
            { before: 600, keys: ['PREHISTORIC_ASIAN'] },
            { after: 600, keys: ['TIBETAN', 'CHINESE_MANDARIN'], weights: { TIBETAN: 24, CHINESE_MANDARIN: 1 } }
        ],
        "Kailash Region": [
            { before: 600, keys: ['PREHISTORIC_ASIAN'] },
            { after: 600, keys: ['TIBETAN'] }
        ],
        "Himalayan Slopes": [
            { before: 600, keys: ['PREHISTORIC_ASIAN'] },
            { after: 600, keys: ['TIBETAN', 'BENGALI_TRADITIONAL'], weights: { TIBETAN: 14, BENGALI_TRADITIONAL: 3 } }
        ],
        // Kham and Amdo: genuinely mixed, and the Sichuan basin behind them is
        // Han and has been since the Qin.
        "Eastern Plateau Slopes": [
            { before: 600, keys: ['PREHISTORIC_ASIAN'] },
            { after: 600, keys: ['TIBETAN', 'CHINESE_MANDARIN'], weights: { TIBETAN: 10, CHINESE_MANDARIN: 7 } }
        ],
        "West China and Tibet": [
            { before: -1500, keys: ['PREHISTORIC_ASIAN'] },
            { after: -1500, keys: ['CHINESE_MANDARIN', 'TIBETAN'], weights: { CHINESE_MANDARIN: 12, TIBETAN: 5 } }
        ],
        "Japan": [
            { keys: ['JAPANESE'] } // Relatively isolated
        ],
        "Korea": [
            { before: 668, keys: ['KOREAN_ANCIENT'] },
            { after: 668, before: 1910, keys: ['KOREAN'] },
            { after: 1910, before: 1945, keys: ['KOREAN', 'JAPANESE'] },
            { after: 1945, keys: ['KOREAN'] }
        ],
        /**
         * The region named after the Uyghurs never drew a Uyghur name: the set
         * exists in CHARACTER_NAMES and no rule reached it, so the Tarim basin
         * was populated with Uzbeks and Kazakhs instead. The Uyghurs move into
         * the Tarim after the Khaganate falls in 840 and the oasis towns are
         * Uyghur-speaking and Muslim from the tenth century on; today they are
         * about 45% of Xinjiang against 42% Han.
         */
        "Xinjiang": [
            { before: -200, keys: ['PREHISTORIC_ASIAN', 'SOGDIAN', 'PERSIAN_ANCIENT'] }, // Tocharian/Indo-European period
            { after: -200, before: 750, keys: ['SOGDIAN', 'CHINESE_MANDARIN', 'PERSIAN_KHORASAN'] }, // Silk Road period
            {
                after: 750, before: 1000, keys: ['UYGHUR', 'SOGDIAN', 'TURKIC_STEPPE', 'CHINESE_MANDARIN'],
                weights: { UYGHUR: 8, SOGDIAN: 6, TURKIC_STEPPE: 5, CHINESE_MANDARIN: 2 },
            }, // Uyghur Khaganate collapses in 840; the Tarim becomes Uyghur
            {
                after: 1000, before: 1759, keys: ['UYGHUR', 'TURKIC_STEPPE', 'UZBEK', 'MONGOLIAN_TRADITIONAL'],
                weights: { UYGHUR: 16, TURKIC_STEPPE: 5, UZBEK: 3, MONGOLIAN_TRADITIONAL: 3 },
            },
            {
                after: 1759, keys: ['UYGHUR', 'CHINESE_MANDARIN', 'KAZAKH', 'UZBEK'],
                weights: { UYGHUR: 16, CHINESE_MANDARIN: 10, KAZAKH: 3, UZBEK: 1 },
            } // Qing and modern period
        ],
        "Taiwan and Ryukyu": [
            { before: 1600, keys: ['CHINESE_CANTONESE', 'POLYNESIAN', 'PREHISTORIC_ASIAN'] }, // Indigenous Austronesian + early Chinese contact
            {
                // Dutch Formosa and the Ryukyu Kingdom. As above: the Dutch
                // were here for 38 of these 295 years.
                after: 1600, before: 1895, keys: ['CHINESE_CANTONESE', 'JAPANESE', 'DUTCH'],
                weights: { CHINESE_CANTONESE: 20, JAPANESE: 10, DUTCH: 1 },
            },
            { after: 1895, keys: ['JAPANESE', 'CHINESE_MANDARIN'] } // Japanese colonial period
        ]
    },
    "OCEANIA": {
        // Australia
        // As with New Guinea below: the cultural zone denotes a local persona,
        // and colonial settlement should not replace their naming tradition
        // wholesale. Irish settlers in Australia used anglicised names, so the
        // Gaelic set — which carries Irish-language patronymics — does not
        // belong here at all.
        //
        // The ratios here are deliberately *not* the Australian census, and
        // that is the one place in this table where population share is not
        // the measure. Settler Australians are generated through the EUROPEAN
        // zone; a persona who has been placed in OCEANIA is an Aboriginal one,
        // and the English share below is intermarriage and mission naming
        // rather than the settler population. Three of these four rules used
        // to say this by repeating the key two or three times in the list,
        // which is the same claim written where nobody could adjust it.
        "Australia – Southeast": [
            { before: 1788, keys: ['ABORIGINAL_AUSTRALIAN'] },
            {
                after: 1788, keys: ['ABORIGINAL_AUSTRALIAN', 'ENGLISH'],
                // The southeast is where mission and Protection Board naming
                // reached furthest, so the English share is the highest of the
                // four — but it was never half, which is what this rule said.
                weights: { ABORIGINAL_AUSTRALIAN: 5, ENGLISH: 2 },
            }
        ],
        "Australia – Outback and Center": [
            { before: 1870, keys: ['ABORIGINAL_AUSTRALIAN'] },
            // The interior remained overwhelmingly Aboriginal long after the
            // pastoral frontier reached it.
            {
                after: 1870, keys: ['ABORIGINAL_AUSTRALIAN', 'ENGLISH'],
                weights: { ABORIGINAL_AUSTRALIAN: 3, ENGLISH: 1 },
            }
        ],
        "Australia – North and Queensland": [
            { before: 1824, keys: ['ABORIGINAL_AUSTRALIAN'] },
            {
                // The Queensland canefields brought Melanesian labourers and
                // the goldfields brought Cantonese miners; both were real and
                // both were small beside the people already there.
                after: 1824, keys: ['ABORIGINAL_AUSTRALIAN', 'ENGLISH', 'MELANESIAN', 'CHINESE_CANTONESE'],
                weights: { ABORIGINAL_AUSTRALIAN: 12, ENGLISH: 4, MELANESIAN: 2, CHINESE_CANTONESE: 2 },
            }
        ],
        "Australia – West and Desert": [
            { before: 1829, keys: ['ABORIGINAL_AUSTRALIAN'] },
            {
                after: 1829, keys: ['ABORIGINAL_AUSTRALIAN', 'ENGLISH'],
                weights: { ABORIGINAL_AUSTRALIAN: 4, ENGLISH: 1 },
            }
        ],
        // Pacific Islands
        //
        // Every rule below is split on the *mission*, not on first European
        // sight of the island. The two are decades apart and only the second
        // one changed anyone's name: Cook reached Hawaiʻi in 1778 and the
        // Hawaiian naming world was intact until the Thaddeus landed the first
        // American company in 1820. Splitting on contact instead would have put
        // Kawika and Keoni — David and John — in Kamehameha's boyhood.
        "New Zealand": [
            { before: 1814, keys: ['MAORI_PRECONTACT'] },
            // Marsden's mission, 1814, and the printed transliterations that
            // followed it. Māori naming did not stop; it gained a second layer.
            { after: 1814, before: 1840, keys: ['MAORI_PRECONTACT', 'POLYNESIAN'], weights: { MAORI_PRECONTACT: 2, POLYNESIAN: 1 } },
            {
                // Same reasoning as Australia: Pākehā New Zealanders come
                // through the EUROPEAN zone, so a persona routed here is
                // Māori. Two settler sets against one Polynesian made this
                // rule two-thirds British in a zone that means the opposite.
                after: 1840, keys: ['POLYNESIAN', 'ENGLISH', 'SCOTTISH'],
                weights: { POLYNESIAN: 6, ENGLISH: 2, SCOTTISH: 1 },
            }
        ],
        "New Guinea and Melanesia": [
            { before: 1840, keys: ['MELANESIAN_PRECONTACT'] },
            // Cultural zone OCEANIA denotes a local persona; colonial presence alone
            // should not randomly replace that person's naming tradition.
            { after: 1840, before: 1884, keys: ['MELANESIAN_PRECONTACT', 'MELANESIAN'] },
            { after: 1884, keys: ['MELANESIAN'] }
        ],
        "Polynesia": [
            { before: 1797, keys: ['TAHITIAN_PRECONTACT', 'TONGAN_PRECONTACT', 'SAMOAN_PRECONTACT', 'POLYNESIAN_PRECONTACT'] },
            // LMS Tahiti 1797, Wesleyan Tonga 1826, Williams in Samoa 1830. The
            // middle window is genuinely mixed and weighted towards the older
            // names, which is what the mission rolls themselves show.
            { after: 1797, before: 1830, keys: ['TAHITIAN_PRECONTACT', 'TONGAN_PRECONTACT', 'SAMOAN_PRECONTACT', 'POLYNESIAN_PRECONTACT', 'TAHITIAN'] },
            {
                // Three European sets against three Polynesian ones made half
                // of post-mission Polynesia European. The planters, traders
                // and missionaries of Papeete and Apia were a few thousand
                // people across an ocean of islands.
                after: 1830, keys: ['TAHITIAN', 'SAMOAN', 'TONGAN', 'FRENCH', 'ENGLISH', 'GERMAN'],
                weights: { TAHITIAN: 10, SAMOAN: 10, TONGAN: 8, FRENCH: 1, ENGLISH: 1, GERMAN: 1 },
            }
        ],
        "Micronesia": [
            // The Marianas were settled from island Southeast Asia some three
            // thousand years ago and the Carolines and Marshalls after them;
            // the precontact Polynesian and Melanesian sets are the wrong
            // peoples, but they are the right register and the closest thing
            // the table has for the era before CHAMORRO begins.
            { before: 1668, keys: ['MICRONESIAN', 'POLYNESIAN_PRECONTACT', 'MELANESIAN_PRECONTACT'], weights: { MICRONESIAN: 6, POLYNESIAN_PRECONTACT: 1, MELANESIAN_PRECONTACT: 1 } },
            {
                // Spain, then Germany, then Japan, then the United States —
                // four administrations in three centuries, and the rule named
                // all four and nobody who lived there. Guam was Chamorro and
                // the Carolines and Marshalls were and are Micronesian; the
                // Japanese share is the largest of the colonial ones because
                // Nan'yō settlement genuinely was, reaching a majority on
                // Saipan by the 1930s.
                after: 1668, keys: ['CHAMORRO', 'MICRONESIAN', 'JAPANESE', 'SPANISH_CASTILIAN', 'GERMAN', 'ENGLISH'],
                weights: { CHAMORRO: 14, MICRONESIAN: 14, JAPANESE: 4, SPANISH_CASTILIAN: 1, GERMAN: 1, ENGLISH: 1 },
            }
        ],
        "Hawaii and Central Pacific": [
            { before: 1820, keys: ['HAWAIIAN_PRECONTACT'] },
            {
                // The one rule in this block where a near-uniform draw is
                // roughly right: plantation Hawaiʻi really was that mixed. The
                // weights are the 1900 territorial census — about two-fifths
                // Japanese, a sixth Native Hawaiian or part-Hawaiian, an
                // eighth Chinese, a sixth Portuguese and other European, with
                // Filipino recruitment beginning after 1906.
                after: 1820, keys: ['HAWAIIAN', 'JAPANESE', 'CHINESE_CANTONESE', 'PORTUGUESE', 'ENGLISH', 'FILIPINO'],
                weights: { HAWAIIAN: 10, JAPANESE: 9, CHINESE_CANTONESE: 4, PORTUGUESE: 4, ENGLISH: 3, FILIPINO: 3 },
            }
        ],
        "Indonesian and Melanesian Islands": [
            { before: 1512, keys: ['INDONESIAN', 'MALAY', 'MELANESIAN_PRECONTACT'] },
            {
                // Europeans in the Netherlands East Indies never reached one
                // percent of it. At two keys in five they were forty.
                after: 1512, before: 1949, keys: ['INDONESIAN', 'MALAY', 'MELANESIAN', 'DUTCH', 'PORTUGUESE'],
                weights: { INDONESIAN: 14, MALAY: 10, MELANESIAN: 8, DUTCH: 1, PORTUGUESE: 1 },
            },
            { after: 1949, keys: ['INDONESIAN', 'MALAY'] }
        ],
        "Major Seas and Oceans": [
            { before: 1500, keys: ['POLYNESIAN_PRECONTACT', 'MELANESIAN_PRECONTACT', 'SWAHILI_COASTAL', 'ARABIAN_HEJAZ', 'CHINESE_CANTONESE'] },
            {
                // A deep-water crew after 1500 is genuinely mixed and often
                // European-officered, so this rule keeps a real European
                // share — but five European sets against one Polynesian put it
                // at five in six, and the Atlantic and Indian Ocean crews that
                // sailed under those flags were substantially Lascar, Kru,
                // Manila-men and Pacific islanders.
                after: 1500, keys: ['ENGLISH', 'PORTUGUESE', 'SPANISH_CASTILIAN', 'DUTCH', 'FRENCH', 'POLYNESIAN', 'MALAY', 'SWAHILI_COASTAL', 'CHINESE_CANTONESE'],
                weights: { ENGLISH: 6, PORTUGUESE: 4, SPANISH_CASTILIAN: 3, DUTCH: 3, FRENCH: 3, POLYNESIAN: 4, MALAY: 4, SWAHILI_COASTAL: 3, CHINESE_CANTONESE: 3 },
            }
        ]
    }
};

// ============================================================================
// ERA-SPECIFIC FALLBACK NAME GENERATION
// ============================================================================
// These systems generate culturally and historically appropriate names when
// specific cultural data is not available. Each cultural zone has era-based
// fallback rules to avoid anachronistic English names appearing in, e.g.,
// pre-Columbian North America.

/**
 * Compound name parts for indigenous North American names (pre-1600)
 * Pattern: Adjective/Verb + Animal/Nature element
 */

/**
 * Proto-Semitic style name components for ancient MENA (before 1000 BCE)
 */
const PROTO_SEMITIC_PARTS = {
    divine: ['El', 'Ilu', 'Baal', 'Hadad', 'Dagan', 'Mot', 'Yam', 'Ashtar'],
    meanings: ['abi', 'ahu', 'ammi', 'rapi', 'malik', 'natan', 'sama', 'yada', 'barak', 'shalem'],
    endings: {
        male: ['u', 'um', 'a', 'i', 'an', 'il'],
        female: ['at', 'atu', 'a', 'i', 'iti', 'ah']
    }
};

/**
 * Generates a compound Native American style name
 */
/**
 * Delegates to the regional generator. The parts table this used to draw on was
 * one continent-wide list, so a family on the Baffin coast in 1400 came out as
 * Flying Turkey, Sitting Raccoon and Summer Bee — none of which live within two
 * thousand miles of there. `deepTimeAmericanNames.ts` keeps a lexicon per
 * region, so an Arctic name is built from seals and ptarmigan.
 */
function generateCompoundNativeAmericanName(
    _gender: 'male' | 'female',
    region = '',
    year = 0,
): string {
    return generateDeepTimeAmericanName({ region, location: region, year, random: seededRandom });
}

/**
 * Generates a proto-Semitic style name for ancient MENA
 */
function generateProtoSemiticName(gender: 'male' | 'female'): string {
    const divine = PROTO_SEMITIC_PARTS.divine[Math.floor(seededRandom() * PROTO_SEMITIC_PARTS.divine.length)];
    const meaning = PROTO_SEMITIC_PARTS.meanings[Math.floor(seededRandom() * PROTO_SEMITIC_PARTS.meanings.length)];
    const endings = PROTO_SEMITIC_PARTS.endings[gender];
    const ending = endings[Math.floor(seededRandom() * endings.length)];

    // 50% chance of divine element first vs meaning first
    if (seededRandom() > 0.5) {
        return `${divine}-${meaning}${ending}`;
    } else {
        return `${meaning.charAt(0).toUpperCase()}${meaning.slice(1)}-${divine.toLowerCase()}${ending}`;
    }
}

/**
 * Era-specific fallback configurations for each cultural zone
 * Returns appropriate cultural group keys or generates names directly
 */
export interface FallbackConfig {
    groups?: string[];
    /** `region` and `year` matter to the American generator; others ignore them. */
    generator?: (gender: 'male' | 'female', region?: string, year?: number) => string;
}

export function getEraSpecificFallback(zone: CulturalZone, year: number): FallbackConfig {
    switch (zone) {
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
            // All pre-Columbian North America uses compound nature names
            return { generator: generateCompoundNativeAmericanName };

        case 'NORTH_AMERICAN_COLONIAL':
            if (year < 1492) {
                // Before Columbus, use native naming
                return { generator: generateCompoundNativeAmericanName };
            } else if (year < 1600) {
                // Early contact period - mix of native and Spanish
                return { groups: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SPANISH_CASTILIAN'] };
            } else {
                // Colonial period proper
                return { groups: ['NORTH_AMERICAN_COLONIAL', 'ENGLISH', 'FRENCH', 'SPANISH_CASTILIAN'] };
            }

        case 'SOUTH_AMERICAN':
            if (year < 1492) {
                return { groups: ['ANDEAN_QUECHUA', 'GUARANI', 'SOUTH_AMERICAN'] };
            } else if (year < 1600) {
                return { groups: ['ANDEAN_QUECHUA', 'GUARANI', 'SPANISH_CASTILIAN'] };
            } else {
                return { groups: ['SPANISH_LATIN_AMERICAN', 'PORTUGUESE_BRAZIL', 'ANDEAN_QUECHUA'] };
            }

        case 'MENA':
            if (year < -1000) {
                // Proto-Semitic era
                return { generator: generateProtoSemiticName };
            } else if (year < 650) {
                // Pre-Islamic - mix of ancient cultures
                return { groups: ['PERSIAN_FARSI', 'JEWISH_ASHKENAZI', 'ANCIENT_GREEK', 'ANCIENT_ROMAN'] };
            } else {
                // Islamic era onwards - Arabic works broadly
                return { groups: ['ARABIC_TRADITIONAL', 'ARABIC_LEVANT', 'PERSIAN_FARSI'] };
            }

        case 'EUROPEAN':
            if (year < -500) {
                return { groups: ['PREHISTORIC_PROTO_INDO_EUROPEAN', 'PREHISTORIC_PROTO_CELTIC'] };
            } else if (year < 500) {
                return { groups: ['ANCIENT_ROMAN', 'ANCIENT_GREEK', 'PREHISTORIC_PROTO_CELTIC'] };
            } else if (year < 1000) {
                return { groups: ['FRANKISH_CAROLINGIAN', 'ENGLISH_ANGLO_SAXON', 'SCANDINAVIAN', 'BYZANTINE'] };
            } else if (year < 1500) {
                return { groups: ['ENGLISH_MEDIEVAL', 'FRENCH_MEDIEVAL', 'GERMAN', 'ITALIAN', 'SPANISH_CASTILIAN'] };
            } else {
                return { groups: ['ENGLISH', 'FRENCH', 'GERMAN', 'ITALIAN', 'SPANISH_CASTILIAN', 'DUTCH'] };
            }

        case 'EAST_ASIAN':
            // Chinese-style names work broadly across most of East Asian history
            if (year < 0) {
                return { groups: ['CHINESE_MANDARIN'] };
            } else if (year < 1000) {
                return { groups: ['CHINESE_MANDARIN', 'KOREAN_ANCIENT', 'JAPANESE'] };
            } else {
                return { groups: ['CHINESE_MANDARIN', 'JAPANESE', 'KOREAN', 'VIETNAMESE'] };
            }

        case 'SOUTHEAST_ASIAN':
            // Austronesian on the islands, Austroasiatic and Tai on the
            // mainland. Sanskrit-derived court names arrive with Indic religion
            // but never displace the local stock.
            if (year < -500) return { groups: ['PREHISTORIC_AUSTRONESIAN'] };
            if (year < 800) return { groups: ['PREHISTORIC_AUSTRONESIAN', 'MALAY', 'KHMER', 'VIETNAMESE'] };
            if (year < 1500) return { groups: ['MALAY', 'JAVANESE', 'KHMER', 'THAI', 'BURMESE', 'VIETNAMESE'] };
            return { groups: ['MALAY', 'INDONESIAN', 'JAVANESE', 'FILIPINO', 'THAI', 'KHMER', 'VIETNAMESE', 'BURMESE'] };

        case 'SOUTH_ASIAN':
            // Sanskrit-derived names work broadly
            if (year < 500) {
                return { groups: ['HINDI', 'TAMIL'] }; // Ancient Sanskrit-derived
            } else {
                return { groups: ['HINDI', 'BENGALI_TRADITIONAL', 'BENGALI_MODERN', 'TAMIL', 'PUNJABI'] };
            }

        case 'SUB_SAHARAN_AFRICAN':
            // Every other zone here branches on the year; this one did not, and
            // two of the five sets it named ('YORUBA', 'SWAHILI') were not keys
            // in CHARACTER_NAMES, so two draws in five fell through again to
            // the last-resort pool.
            if (year < -1000) return { groups: ['PREHISTORIC_AFRICAN'] };
            if (year < 800) {
                return { groups: ['PREHISTORIC_AFRICAN', 'ETHIOPIAN_HIGHLAND', 'SUB_SAHARAN_AFRICAN'] };
            }
            return {
                groups: [
                    'YORUBA_TRADITIONAL', 'IGBO', 'AKAN', 'HAUSA', 'WEST_AFRICAN_SAHEL',
                    'SWAHILI_COASTAL', 'SWAHILI_INTERIOR', 'AMHARIC', 'SOMALI',
                    'ZULU', 'XHOSA', 'SOTHO_TSWANA', 'SHONA', 'KONGO', 'LUBA',
                    'RWANDA_BURUNDI', 'SUB_SAHARAN_AFRICAN',
                ],
            };

        case 'OCEANIA':
            // Split on the missions, as the region rules are: the unsuffixed
            // Oceanic sets are mission-era registers and must not run backwards.
            if (year < 1830) {
                return { groups: ['POLYNESIAN_PRECONTACT', 'MELANESIAN_PRECONTACT', 'ABORIGINAL_AUSTRALIAN'] };
            } else {
                return { groups: ['POLYNESIAN', 'HAWAIIAN', 'SAMOAN', 'OCEANIA'] };
            }

        default:
            // Ultimate fallback - try to be contextual
            if (year < 500) {
                return { groups: ['ANCIENT_ROMAN', 'ANCIENT_GREEK'] };
            }
            return { groups: ['EUROPEAN'] };
    }
}

/**
 * Naming traditions that carry a European naming world with them.
 *
 * Listed rather than inferred, because "is this name European" cannot be
 * answered from the name: Jean is French and Jeanne d'Arc is not the point —
 * "Marie" is a Vietnamese Catholic's name too, "Mason" is a Yoruba surname
 * nowhere and an English one everywhere, and any spelling test built out of
 * such examples is a list of the cases somebody happened to think of.
 */
const EUROPEAN_DIASPORA_SETS = new Set([
    'ENGLISH', 'ENGLISH_MEDIEVAL', 'ENGLISH_ANGLO_SAXON', 'SCOTTISH', 'WELSH', 'CELTIC_IRISH',
    'FRENCH', 'FRENCH_MEDIEVAL', 'NORMAN_FRENCH', 'GERMAN', 'EAST_GERMAN', 'DUTCH', 'ITALIAN',
    'SPANISH_CASTILIAN', 'PORTUGUESE', 'RUSSIAN', 'SCANDINAVIAN', 'ICELANDIC', 'GALICIAN',
    'EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'NORTH_AMERICAN_MODERN',
]);

export function isEuropeanNameSet(key?: string): boolean {
    return Boolean(key && EUROPEAN_DIASPORA_SETS.has(key));
}

/**
 * Does this region's own table actually offer this naming tradition, in this
 * year?
 *
 * The question a "wrong name" check has to ask. A French surname in Algiers is
 * correct — the Maghreb rule lists `FRENCH`, deliberately and at low weight,
 * because that population existed. The same surname in 1400 Kyoto is a
 * generator failure. The two are indistinguishable by inspection of the name
 * and trivially distinguishable by looking at the rule the name should have
 * come from, which is what this does.
 *
 * Returns false when the region has no rules at all, so a caller can treat "not
 * offered here" and "nothing is offered here" alike.
 */
export function nameKeyOfferedByRegion(
    culturalZone: string,
    region: string | undefined,
    year: number,
    key: string | undefined,
    location?: string,
): boolean {
    if (!key || !region) return false;
    const zoneRules = REGION_NAME_MAPPING[culturalZone];
    if (!zoneRules) return false;
    // The locale first, then the region it sits in — the same precedence the
    // generator itself uses.
    const rules = (location ? zoneRules[location] : undefined) ?? zoneRules[region];
    if (!rules) return false;
    for (const rule of rules) {
        const afterMatch = rule.after === undefined || year >= rule.after;
        const beforeMatch = rule.before === undefined || year < rule.before;
        if (afterMatch && beforeMatch) return rule.keys.includes(key);
    }
    return false;
}
