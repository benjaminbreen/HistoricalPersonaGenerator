/**
 * constants/characterData/eliteNaming.ts
 *
 * What a name does when the person carrying it belongs to a privileged order.
 *
 * `nameConventions.ts` answers how a culture builds a name. This answers a
 * different question laid over the top of it: what that culture *adds* when the
 * bearer is of the estate. The two are separate because the elite form is almost
 * never a different convention — it is the ordinary convention plus a marker. A
 * Castilian hidalgo has the same kind of name as his tenant and then has "don"
 * in front of it, a second surname behind it, and a "de" holding the two
 * together.
 *
 * ## Why this is not a rich-people flag
 *
 * `eliteStrata.ts` gives each order the share of the local population that held
 * it, and the shares are the point: Hidalgo 10%, Szlachcic 8.5%, Yangban 9%,
 * Rajput 8%, Samurai 6%, Askerî 6%, Brahmin 5.5%, the Attic citizen body 12%,
 * and the northern Spanish fueros an extraordinary 55%. These are not the one-
 * in-a-thousand cases the portrait puts a diamond on. They are large minorities,
 * and in the societies that had them a name carrying "Singh" or "Sayyid" or a
 * clan seat was an ordinary thing to hear. So the styles here fire for everyone
 * the stratum table places in the order, not for the rarest tail of it.
 *
 * Money is deliberately not the trigger. Standing and wealth are separate axes
 * in this codebase — each stratum carries its own wealth distribution precisely
 * to keep the penniless hidalgo and the rice-stipend samurai where they belong —
 * and a rich merchant who buys an estate does not thereby acquire a *gotra*.
 *
 * ## Why devices rather than name lists
 *
 * The temptation is to write an "elite surnames" pool per culture. That gets one
 * thing right and the important thing wrong: it produces grander vocabulary in
 * the same grammar, so every name still has the shape given-name-plus-surname.
 * What actually marks these names is *structure* — a particle, a second
 * surname, a chain of ancestors, a courtesy name beside the given name, a
 * reverential suffix, a clan seat in front. So each style is a set of small
 * composable devices, each with its own probability, and the probabilities
 * matter: "don" was not universal among hidalgos, and a style where every
 * device always fires reads as a costume rather than as a society.
 *
 * ## What is not attempted
 *
 * Transliteration is a gloss for an English-language reader, following the rest
 * of this directory. Where a title is genuinely untranslatable the society's own
 * word is used, because that is what the card already prints. And no style tries
 * to encode a full genealogy: an Arabic nasab could run six generations and a
 * Polynesian recitation forty, and at the length a name has to be read on a card
 * two links is the honest limit.
 */

export type NameGender = 'Male' | 'Female';

/** Gendered word lists. `female` falls back to `male` where a title is common. */
interface Gendered {
  male: string[];
  female?: string[];
}

export interface EliteNameStyle {
  /**
   * Words placed before the whole name: Don, Sayyid, Ras, Ariki.
   *
   * The commonest elite marker on earth and the cheapest to read, which is why
   * most styles have one.
   */
  honorific?: Gendered & { chance: number };
  /**
   * Words placed after: Bey, Singh, Esquire, -dono.
   *
   * Distinct from `honorific` because several traditions put the rank behind the
   * name and a few put one at each end.
   */
  postnominal?: Gendered & { chance: number };
  /**
   * A lineage, clan, house or seat placed *before* the given name — the Manchu
   * hala, the Mongol clan, the Korean bon-gwan, the Parthian great house.
   *
   * In these traditions the lineage is not a surname in the European sense: it
   * precedes the personal name and is a statement about descent rather than a
   * family label, and dropping it is what makes a bannerman indistinguishable
   * from a Han commoner.
   */
  lineagePrefix?: { names: string[]; chance: number; connector?: string };
  /** A clan or sept name placed after the given name — Rajput, Nahua, Akan. */
  lineageSuffix?: { names: string[]; chance: number };
  /**
   * A nobiliary particle inserted before an existing surname. Only fires when
   * the base convention actually produced a surname.
   */
  particle?: { forms: string[]; chance: number };
  /**
   * Two surnames joined. `connector` is the Iberian "y" / "de", the British
   * hyphen, or a bare space for the Latin-American paternal-maternal pair.
   */
  doubleSurname?: { connector: string; chance: number };
  /**
   * A second given name, and how often it appears as a bare initial instead.
   * Baptismal chains in Catholic Europe and its colonies; the Anglo-American
   * middle initial is the same device worn down.
   */
  middleGiven?: { chance: number; initialOnly?: number };
  /** Jr, III. Narrowly Anglo-American, and later than people assume. */
  generational?: { forms: string[]; chance: number };
  /**
   * A second name used beside the first: the Chinese courtesy name (zi), the
   * Egyptian "beautiful name", the Japanese nanori. Rendered with the linking
   * word spelled out, because "Zhuge Liang Kongming" is not readable and
   * "Zhuge Liang, styled Kongming" is.
   */
  courtesyName?: { pool: string[]; link: string; chance: number };
  /**
   * A reverential ending fused to the given name: Nahuatl -tzin, the Indic
   * dynastic -varman.
   *
   * `only` restricts it to one sex, which the dynastic endings need — the famous
   * ones are masculine, and `-varman` on a woman's name is not a rarer form of
   * the same thing, it is wrong. It produced "Anasuyavarman" before this existed.
   */
  reverentialSuffix?: { suffix: string; chance: number; only?: NameGender };
  /**
   * "…, of the house of X" — the third tier of a Babylonian urban name, the
   * Maya emblem lineage, the Inca panaca. A descent claim beyond the father.
   */
  ancestorLine?: { pool: string[]; link: string; chance: number };
  /**
   * Nudges the base convention toward hereditary forms.
   *
   * This is the one device that reaches back into `nameConventions.ts`, and it
   * is needed because in several of these societies the estate had heritable
   * surnames while the people around them did not. A Polish szlachcic in 1600
   * carried an inherited "-ski"; the peasant on his land was known by one name
   * and his father's. Choosing the surname pool without also raising the odds of
   * *having* a surname would put a nobiliary particle on one noble in five.
   */
  conventionBias?: Partial<Record<'inherited' | 'toponymic' | 'patronymic' | 'clan' | 'personal', number>>;
}

// ---------------------------------------------------------------------------
// Shared vocabularies
//
// Kept out of the styles below wherever two orders genuinely drew on the same
// pool, so the Castilian and the Latin-American hidalguía cannot drift apart by
// accident.
// ---------------------------------------------------------------------------

/** Iberian toponymic second elements — the estate the "de" points at. */
const IBERIAN_SEATS = [
  'Aguilar', 'Alarcón', 'Almazán', 'Ayala', 'Benavides', 'Caravajal', 'Cárdenas',
  'Castañeda', 'Córdoba', 'Figueroa', 'Guzmán', 'Haro', 'Herrera', 'Lara',
  'Mendoza', 'Miranda', 'Molina', 'Narváez', 'Ovando', 'Padilla', 'Quesada',
  'Ribera', 'Salazar', 'Sandoval', 'Silva', 'Sotomayor', 'Tovar', 'Ulloa',
  'Valdés', 'Vargas', 'Velasco', 'Villalobos', 'Zúñiga',
];

/** Polish armorial and estate names. The herb is the szlachta's own marker. */
const POLISH_ARMS = [
  'Jelita', 'Leliwa', 'Nałęcz', 'Ostoja', 'Pobóg', 'Rawicz', 'Sas', 'Śreniawa',
  'Topór', 'Trąby', 'Abdank', 'Bogoria', 'Doliwa', 'Gryf', 'Jastrzębiec',
  'Korczak', 'Łabędź', 'Odrowąż', 'Pilawa', 'Radwan', 'Rola', 'Wieniawa',
];

/** Rajput clans (kul). Carried after the given name, before or instead of Singh. */
const RAJPUT_CLANS = [
  'Rathore', 'Chauhan', 'Sisodia', 'Kachwaha', 'Tomar', 'Parmar', 'Solanki',
  'Bhati', 'Jadeja', 'Chandela', 'Gohil', 'Hada', 'Shekhawat', 'Bundela',
  'Baghela', 'Dodiya', 'Jhala', 'Rana', 'Chudasama', 'Gaur',
];

/** Brahmin lineage surnames, which double as a claim about learning. */
const BRAHMIN_LINES = [
  'Sharma', 'Shastri', 'Trivedi', 'Chaturvedi', 'Dwivedi', 'Joshi', 'Bhatt',
  'Dikshit', 'Upadhyaya', 'Pandit', 'Apte', 'Iyer', 'Iyengar', 'Bhattacharya',
  'Chakraborty', 'Mukherjee', 'Ganguly', 'Deshpande', 'Kulkarni', 'Agnihotri',
];

/** Manchu clan names (hala), which precede the personal name and replace a surname. */
const MANCHU_HALA = [
  'Guwalgiya', 'Nara', 'Šumuru', 'Tunggiya', 'Hešeri', 'Fuca', 'Ilari',
  'Wanggiya', 'Jaogiya', 'Magiya', 'Niohuru', 'Yehe Nara', 'Šose', 'Irgen Gioro',
];

/** Mongol and Turkic ruling clans. */
const STEPPE_CLANS = [
  'Borjigin', 'Kereyid', 'Naiman', 'Jalair', 'Barulas', 'Tayichiud', 'Onggirat',
  'Khongirad', 'Merkid', 'Oirat', 'Uriankhai', 'Baarin', 'Suldus', 'Besud',
];

/** Korean clan seats (bon-gwan). The seat, not the surname, is the yangban marker. */
const KOREAN_SEATS = [
  'Gimhae', 'Gyeongju', 'Jeonju', 'Andong', 'Pyeongsan', 'Miryang', 'Yeoheung',
  'Papyeong', 'Cheongsong', 'Haeju', 'Namyang', 'Neungseong', 'Uiryeong', 'Hadong',
];

/** Chinese courtesy names (zi), used beside the given name by the educated. */
const CHINESE_COURTESY = [
  'Kongming', 'Zhongde', 'Yuanzhi', 'Bofu', 'Zilong', 'Mengde', 'Gongjin',
  'Shiyuan', 'Wenchang', 'Ziyu', 'Yanzu', 'Junqing', 'Shuye', 'Boyan',
  'Zhongshu', 'Yuanhui', 'Ruoxu', 'Zizhan', 'Tuizhi', 'Mengqi',
];

/** Japanese formal given names (nanori), used alongside the everyday yobina. */
const JAPANESE_NANORI = [
  'Yoshio', 'Naomasa', 'Terumoto', 'Ujiyasu', 'Katsumoto', 'Nagayoshi',
  'Tadakatsu', 'Munenori', 'Harunobu', 'Kiyomasa', 'Tsunetomo', 'Mitsuhide',
  'Sadanobu', 'Yasutoki', 'Motochika', 'Shigenari',
];

/** Parthian and Sasanian great houses. */
const IRANIAN_HOUSES = ['Suren', 'Karen', 'Spandiyad', 'Mihran', 'Zik', 'Aspahbadh', 'Waraz'];

/** Babylonian ancestral family names — the third tier of an urban notable's name. */
const BABYLONIAN_ANCESTORS = [
  'Egibi', 'Nappahu', 'Sin-leqe-unninni', 'Ekur-zakir', 'Gahal', 'Ir’anni',
  'Nur-Sin', 'Ile’i-Marduk', 'Bel-eteru', 'Shangu-Ishtar',
];

/** Maya emblem lineages. */
const MAYA_LINEAGES = ['Mutal', 'Kaanul', 'Baakal', 'Oxwitza', 'Yokib', 'Sak Tzi', 'Wakaab'];

/** Inca royal lineages (panaca). */
const INCA_PANACA = [
  'Hatun Ayllu', 'Qhapaq Ayllu', 'Sucsu Panaca', 'Aucaylli Panaca',
  'Iñaca Panaca', 'Vicaquirao Panaca', 'Raurau Panaca',
];

/** Akan and Yoruba stool and title names carried before a personal name. */
const WEST_AFRICAN_TITLES = ['Nana', 'Oba', 'Eze', 'Obi', 'Olu', 'Otumfuo', 'Osei', 'Asantehene'];

/** English gentry second surnames, for the hyphenated and maiden-name forms. */
const ENGLISH_SEATS = [
  'Wentworth', 'Fitzwilliam', 'Cavendish', 'Sackville', 'Grosvenor', 'Percy',
  'Neville', 'Talbot', 'Hastings', 'Devereux', 'Villiers', 'Compton', 'Cecil',
  'Wyndham', 'Ashburnham', 'Fane', 'Lyttelton', 'Bagot', 'Cholmondeley', 'Vane',
];

// ---------------------------------------------------------------------------
// The styles
// ---------------------------------------------------------------------------

/**
 * Castile and Spanish America. "Don" was restricted to hidalgos and above for
 * most of this period before inflating in the eighteenth century, and the double
 * surname with "de" pointing at an estate is the other half of the signal.
 */
const IBERIAN_HIDALGO: EliteNameStyle = {
  honorific: { male: ['Don'], female: ['Doña'], chance: 0.55 },
  particle: { forms: ['de'], chance: 0.5 },
  doubleSurname: { connector: 'y', chance: 0.4 },
  middleGiven: { chance: 0.35 },
  conventionBias: { inherited: 2.4, toponymic: 1.6, personal: 0.25 },
};

const POLISH_SZLACHTA: EliteNameStyle = {
  honorific: { male: ['Pan'], female: ['Pani'], chance: 0.3 },
  // "herbu Jelita" — of the Jelita arms. No other European order put its
  // heraldry into the spoken name like this.
  ancestorLine: { pool: POLISH_ARMS, link: 'herbu', chance: 0.45 },
  particle: { forms: ['z'], chance: 0.2 },
  conventionBias: { inherited: 3, personal: 0.2 },
};

const HUNGARIAN_NEMES: EliteNameStyle = {
  // The előnév, the estate predicate, which in English convention trails as "de".
  particle: { forms: ['de'], chance: 0.5 },
  honorific: { male: ['Vitézlő'], female: ['Nemes'], chance: 0.15 },
  conventionBias: { inherited: 2.6, toponymic: 1.5, personal: 0.25 },
};

/**
 * England. "Sir" belongs to knights rather than to the gentry at large, so it is
 * rare here and "Esquire" — which is exactly the gentry's own postnominal — is
 * the common case. The hyphenated double surname arrives with eighteenth-century
 * inheritance settlements, not before.
 */
const ENGLISH_GENTRY: EliteNameStyle = {
  honorific: { male: ['Sir'], female: ['Lady', 'Dame'], chance: 0.12 },
  postnominal: { male: ['Esquire', 'Gent.'], female: [], chance: 0.3 },
  doubleSurname: { connector: '-', chance: 0.2 },
  middleGiven: { chance: 0.45, initialOnly: 0.3 },
  conventionBias: { inherited: 3, personal: 0.1 },
};

const ITALIAN_PATRICIATE: EliteNameStyle = {
  honorific: { male: ['Ser', 'Messer'], female: ['Madonna'], chance: 0.35 },
  particle: { forms: ['de’', 'di', 'da'], chance: 0.45 },
  conventionBias: { inherited: 2.8, personal: 0.2 },
};

/**
 * Russia. The marker is not a title but the *full* three-part name — given,
 * patronymic, family — which was the respectful register and which serfs were
 * not addressed in. Titled families take Knyaz or Graf on top.
 */
const RUSSIAN_DVORYANSTVO: EliteNameStyle = {
  honorific: { male: ['Knyaz', 'Graf'], female: ['Knyazhna', 'Grafinya'], chance: 0.18 },
  conventionBias: { inherited: 2.6, patronymic: 1.4, personal: 0.15 },
};

const MEDIEVAL_KNIGHTLY: EliteNameStyle = {
  honorific: { male: ['Sir'], female: ['Lady'], chance: 0.4 },
  particle: { forms: ['de'], chance: 0.6 },
  conventionBias: { toponymic: 3, personal: 0.2 },
};

/**
 * Rome. The tria nomina *is* the status marker — the enslaved had one name, and
 * by late antiquity senatorial families ran to strings of five and six. `v.c.`
 * for vir clarissimus is the late form.
 */
const ROMAN_CURIAL: EliteNameStyle = {
  middleGiven: { chance: 0.8 },
  postnominal: { male: ['vir clarissimus'], female: ['clarissima femina'], chance: 0.15 },
  conventionBias: { inherited: 2.6, personal: 0.2 },
};

/** Attic and Ionian citizens: the deme, which metics and the enslaved lacked. */
const GREEK_CITIZEN: EliteNameStyle = {
  particle: { forms: ['of'], chance: 0.45 },
  conventionBias: { patronymic: 2, toponymic: 1.6, personal: 0.4 },
};

const SOVIET_NOMENKLATURA: EliteNameStyle = {
  // No honorifics — the order abolished them and replaced them with the full
  // formal name and an office. The three-part name is what remains.
  conventionBias: { inherited: 2.6, patronymic: 1.3, personal: 0.1 },
  middleGiven: { chance: 0.15 },
};

// ---- MENA -----------------------------------------------------------------

/**
 * Descent from the Prophet, which is a claim of lineage rather than of office
 * and was carried by a few per cent of the population across the Muslim world.
 * The nisba is the other half: al-Husayni, al-Hashimi.
 */
const SAYYID: EliteNameStyle = {
  honorific: { male: ['Sayyid', 'Sharif', 'Mir'], female: ['Sayyida', 'Sharifa'], chance: 0.7 },
  ancestorLine: { pool: ['al-Husayni', 'al-Hashimi', 'al-Alawi', 'al-Jilani', 'al-Idrisi', 'al-Rifai'], link: '', chance: 0.4 },
  conventionBias: { patronymic: 2.2, personal: 0.5 },
};

const OTTOMAN_ASKERI: EliteNameStyle = {
  postnominal: { male: ['Bey', 'Efendi', 'Ağa', 'Paşa', 'Çelebi'], female: ['Hanım', 'Hatun'], chance: 0.65 },
  conventionBias: { patronymic: 1.6, personal: 0.7 },
};

const PERSIAN_AZADAN: EliteNameStyle = {
  lineagePrefix: { names: IRANIAN_HOUSES, chance: 0.4, connector: 'of the House of' },
  postnominal: { male: ['the Azad'], female: ['the Azad'], chance: 0.12 },
  conventionBias: { patronymic: 2, personal: 0.6 },
};

/** Egypt: the "beautiful name", a second name a scribal official went by. */
const EGYPTIAN_SCRIBAL: EliteNameStyle = {
  courtesyName: {
    pool: ['Huy', 'Pay', 'Sen', 'Tia', 'Mose', 'Nakht', 'Pen', 'Kha', 'Ini', 'Sase'],
    link: 'called', chance: 0.4,
  },
  postnominal: { male: ['the Scribe'], female: ['of the House of Life'], chance: 0.25 },
};

/**
 * Babylonian urban notables carried three tiers: their own name, their father's,
 * and an ancestral family name reaching back centuries. The third tier is the
 * one that marks the temple and merchant houses.
 */
const MESOPOTAMIAN_TEMPLE: EliteNameStyle = {
  ancestorLine: { pool: BABYLONIAN_ANCESTORS, link: 'descendant of', chance: 0.55 },
  conventionBias: { patronymic: 2.4, personal: 0.4 },
};

const MAMLUK: EliteNameStyle = {
  honorific: { male: ['Amir'], female: ['Khatun'], chance: 0.4 },
  // A mamluk's nisba points at the master who bought and freed him, which is why
  // it stands in for a lineage he does not have.
  ancestorLine: { pool: ['al-Bunduqdari', 'al-Salihi', 'al-Nasiri', 'al-Zahiri', 'al-Mansuri', 'al-Ashrafi'], link: '', chance: 0.6 },
  conventionBias: { personal: 1.4, patronymic: 0.6 },
};

const MENA_NOTABLES: EliteNameStyle = {
  honorific: { male: ['Hajji'], female: ['Hajja'], chance: 0.2 },
  postnominal: { male: ['Bey', 'Pasha', 'Effendi'], female: ['Hanem'], chance: 0.3 },
  conventionBias: { inherited: 2.4, personal: 0.3 },
};

// ---- SOUTH ASIA -----------------------------------------------------------

const BRAHMIN: EliteNameStyle = {
  honorific: { male: ['Pandit', 'Sri'], female: ['Srimati'], chance: 0.4 },
  lineageSuffix: { names: BRAHMIN_LINES, chance: 0.75 },
  conventionBias: { inherited: 2, personal: 0.4 },
};

const RAJPUT: EliteNameStyle = {
  // 'Baisa' is dropped from the female list on purpose: it means much what
  // 'Kunwar' below does, and the two together gave "Baisa Baljeet Kanwar" —
  // the rank stated twice around one name.
  honorific: { male: ['Thakur', 'Rana', 'Rao'], female: ['Rani'], chance: 0.3 },
  // Singh — lion — is the near-universal Rajput postnominal, and the clan sits
  // behind it: Jaswant Singh Rathore.
  postnominal: { male: ['Singh'], female: ['Kunwar', 'Kanwar'], chance: 0.8 },
  lineageSuffix: { names: RAJPUT_CLANS, chance: 0.5 },
  conventionBias: { clan: 2, personal: 0.4 },
};

const VEDIC_KSHATRIYA: EliteNameStyle = {
  honorific: { male: ['Sri'], female: ['Sri'], chance: 0.3 },
  // The dynastic endings: -varman, -sena, -gupta. Fused rather than spaced, and
  // masculine — the feminine forms are not the same word with the same ending.
  reverentialSuffix: { suffix: 'varman', chance: 0.35, only: 'Male' },
  conventionBias: { clan: 1.8, personal: 0.6 },
};

const SAYYID_SOUTH_ASIA: EliteNameStyle = {
  honorific: { male: ['Syed', 'Mir'], female: ['Syeda', 'Begum'], chance: 0.75 },
  postnominal: { male: ['Shah'], female: [], chance: 0.25 },
  conventionBias: { patronymic: 1.6, personal: 0.6 },
};

const MUGHAL_MANSABDAR: EliteNameStyle = {
  honorific: { male: ['Mirza', 'Amir'], female: ['Begum'], chance: 0.45 },
  postnominal: { male: ['Khan', 'Beg', 'Khan Bahadur'], female: ['Begum'], chance: 0.6 },
  conventionBias: { personal: 1.2, patronymic: 0.8 },
};

const ZAMINDAR: EliteNameStyle = {
  honorific: { male: ['Babu'], female: ['Rani'], chance: 0.3 },
  postnominal: { male: ['Rai', 'Chaudhuri', 'Khan Bahadur'], female: ['Devi'], chance: 0.45 },
  conventionBias: { inherited: 2.4, personal: 0.3 },
};

// ---- EAST ASIA ------------------------------------------------------------

/**
 * The Chinese literate elite. Two devices: the courtesy name used beside the
 * given name by anyone with an education, and the choronym — the ancestral
 * commandery a lineage claimed, "of the Longxi Li" — which is a statement about
 * descent that a commoner had no occasion to make.
 */
const CHINESE_GENTRY: EliteNameStyle = {
  courtesyName: { pool: CHINESE_COURTESY, link: 'styled', chance: 0.5 },
  ancestorLine: {
    pool: ['the Longxi Li', 'the Taiyuan Wang', 'the Qinghe Cui', 'the Fanyang Lu',
      'the Xingyang Zheng', 'the Hedong Pei', 'the Langye Wang'],
    link: 'of', chance: 0.3,
  },
  conventionBias: { inherited: 2, personal: 0.3 },
};

const QING_BANNERMAN: EliteNameStyle = {
  // The hala precedes the personal name and takes the place of a surname
  // outright — Guwalgiya Ronglu, not Ronglu Guwalgiya.
  lineagePrefix: { names: MANCHU_HALA, chance: 0.7 },
  conventionBias: { personal: 2.2, inherited: 0.2 },
};

const STEPPE_RULING_CLAN: EliteNameStyle = {
  lineagePrefix: { names: STEPPE_CLANS, chance: 0.6 },
  postnominal: { male: ['Noyan', 'Khan', 'Tayishi'], female: ['Beki', 'Khatun'], chance: 0.3 },
  conventionBias: { personal: 1.8, clan: 1.2 },
};

const SAMURAI: EliteNameStyle = {
  // Two given names — the everyday yobina and the formal nanori — is the samurai
  // signature, and a surname at all was largely their privilege until 1875.
  courtesyName: { pool: JAPANESE_NANORI, link: 'formally', chance: 0.45 },
  postnominal: { male: ['-dono'], female: [], chance: 0.1 },
  conventionBias: { inherited: 3, personal: 0.1 },
};

const YANGBAN: EliteNameStyle = {
  // The bon-gwan, the clan's seat of origin, which is how two men both surnamed
  // Kim are distinguished and which only a registered lineage had.
  lineagePrefix: { names: KOREAN_SEATS, chance: 0.6 },
  honorific: { male: ['Nari'], female: ['Ssi'], chance: 0.1 },
  conventionBias: { inherited: 2.8, personal: 0.15 },
};

const JAPAN_SHIZOKU: EliteNameStyle = {
  postnominal: { male: ['-shi'], female: [], chance: 0.12 },
  conventionBias: { inherited: 3, personal: 0.1 },
};

const HAN_OFFICIALDOM: EliteNameStyle = {
  courtesyName: { pool: CHINESE_COURTESY, link: 'styled', chance: 0.45 },
  postnominal: { male: ['Gong'], female: ['Furen'], chance: 0.2 },
  conventionBias: { inherited: 2, personal: 0.3 },
};

// ---- AFRICA ---------------------------------------------------------------

const SAHEL_RULING: EliteNameStyle = {
  honorific: { male: ['Alhaji', 'Mai', 'Sarki'], female: ['Hajiya', 'Magajiya'], chance: 0.45 },
  conventionBias: { patronymic: 2, personal: 0.6 },
};

/**
 * Ethiopia. The court titles are numerous and specific, and Ethiopian naming has
 * no surname at all — a person is their name and their father's — so the title is
 * doing the whole of the work the European particle does elsewhere.
 */
const ETHIOPIAN_MEKWANENT: EliteNameStyle = {
  honorific: {
    male: ['Ras', 'Dejazmach', 'Blatta', 'Ato', 'Lij', 'Aleqa', 'Kegnazmach'],
    female: ['Woizero', 'Emahoy', 'Etege'],
    chance: 0.6,
  },
  conventionBias: { patronymic: 2.4, personal: 0.5, inherited: 0.1 },
};

const WEST_AFRICAN_CHIEFLY: EliteNameStyle = {
  honorific: { male: WEST_AFRICAN_TITLES, female: ['Nana', 'Iyalode', 'Olori', 'Ohemaa'], chance: 0.5 },
  conventionBias: { clan: 1.6, personal: 0.8 },
};

const AFRICAN_SENIOR_LINEAGE: EliteNameStyle = {
  honorific: { male: ['Elder'], female: ['Elder'], chance: 0.15 },
  ancestorLine: { pool: ['the senior house', 'the first-founded house', 'the elder line'], link: 'of', chance: 0.35 },
  conventionBias: { clan: 2, personal: 0.7 },
};

// ---- AMERICAS -------------------------------------------------------------

const MAYA_AJAW: EliteNameStyle = {
  honorific: { male: ['Ajaw', "K'uhul Ajaw", 'Sajal'], female: ['Ix Ajaw', 'Ix'], chance: 0.55 },
  ancestorLine: { pool: MAYA_LINEAGES, link: 'of', chance: 0.35 },
};

const NAHUA_PIPILTIN: EliteNameStyle = {
  // -tzin is the Nahuatl reverential, fused to the name: Moteuczoma →
  // Moteuczomatzin. It is the single clearest marker of pilli rank.
  reverentialSuffix: { suffix: 'tzin', chance: 0.6 },
  postnominal: { male: ['Tecuhtli'], female: ['Cihuapilli'], chance: 0.25 },
};

const INCA_ELITE: EliteNameStyle = {
  honorific: { male: ['Apu', 'Inka'], female: ['Mama'], chance: 0.5 },
  ancestorLine: { pool: INCA_PANACA, link: 'of', chance: 0.3 },
};

const ANDEAN_KURAKA: EliteNameStyle = {
  honorific: { male: ['Kuraka', 'Apu'], female: ['Mama'], chance: 0.45 },
  conventionBias: { clan: 1.6, personal: 0.8 },
};

const MISSISSIPPIAN_ELITE: EliteNameStyle = {
  // The Natchez sun titles, which the surrounding chiefdoms echo.
  honorific: { male: ['Great Sun', 'Sun', 'Noble'], female: ['White Woman', 'Sun'], chance: 0.4 },
  ancestorLine: { pool: ['the elder mound', 'the sun house', 'the senior clan'], link: 'of', chance: 0.25 },
};

/**
 * Colonial and Gilded-Age North America, where every device your ear expects
 * actually belongs: Esquire and the honorific Mr/Mrs — a genuine status marker
 * in the seventeenth century, not a courtesy — plus the middle name, the
 * generational suffix and the maiden surname carried as a middle name.
 */
const ANGLO_GENTRY: EliteNameStyle = {
  honorific: { male: ['Mr.'], female: ['Mrs.', 'Miss'], chance: 0.3 },
  postnominal: { male: ['Esq.', 'Gent.'], female: [], chance: 0.25 },
  middleGiven: { chance: 0.5, initialOnly: 0.35 },
  doubleSurname: { connector: ' ', chance: 0.25 },
  generational: { forms: ['Jr.', 'II', 'III'], chance: 0.12 },
  conventionBias: { inherited: 3, personal: 0.05 },
};

const AMERICAN_PROPERTIED: EliteNameStyle = {
  postnominal: { male: ['Esq.'], female: [], chance: 0.1 },
  middleGiven: { chance: 0.7, initialOnly: 0.45 },
  // Clare Boothe Luce: the maiden surname kept as a middle name, which is an
  // elite Anglophone women's marker of exactly this period.
  doubleSurname: { connector: ' ', chance: 0.35 },
  generational: { forms: ['Jr.', 'III', 'IV'], chance: 0.18 },
  conventionBias: { inherited: 3, personal: 0.05 },
};

const LATIN_HACENDADO: EliteNameStyle = {
  honorific: { male: ['Don'], female: ['Doña'], chance: 0.5 },
  particle: { forms: ['de'], chance: 0.4 },
  doubleSurname: { connector: 'y', chance: 0.45 },
  middleGiven: { chance: 0.4 },
  conventionBias: { inherited: 2.8, personal: 0.2 },
};

const NATIVE_COUNCIL: EliteNameStyle = {
  postnominal: { male: ['of the Council'], female: ['of the Council'], chance: 0.2 },
  middleGiven: { chance: 0.2 },
};

// ---- OCEANIA AND SOUTHEAST ASIA -------------------------------------------

const POLYNESIAN_CHIEFLY: EliteNameStyle = {
  honorific: {
    male: ['Ariki', "Ali'i", 'Tui', 'Ratu', 'Tama'],
    female: ["Ali'i", 'Ariki', 'Adi'],
    chance: 0.55,
  },
  ancestorLine: { pool: ['the senior line', 'the elder house', 'the first canoe'], link: 'of', chance: 0.3 },
};

const SEA_DATU: EliteNameStyle = {
  honorific: { male: ['Datu', 'Lakan', 'Rajah', 'Gat'], female: ['Dayang', 'Hara'], chance: 0.55 },
};

const SEA_COURT: EliteNameStyle = {
  honorific: {
    male: ['Raden', 'Raden Mas', 'Phraya', 'Luang', 'Khun', 'U'],
    female: ['Raden Ayu', 'Mom', 'Daw', 'Nyai'],
    chance: 0.55,
  },
  conventionBias: { personal: 1.6, inherited: 0.6 },
};

const SEA_GOVERNING: EliteNameStyle = {
  honorific: { male: ['Datuk', 'Raden', 'Tan Sri'], female: ['Datin', 'Raden Ayu'], chance: 0.35 },
  conventionBias: { inherited: 2, personal: 0.5 },
};

// ---------------------------------------------------------------------------
// Stratum → style
//
// Keyed by the `id` in `eliteStrata.ts`, so the two tables cannot disagree about
// which orders exist. An id with no entry simply gets no elite naming, which is
// the right default for an order whose naming this file has not researched — a
// missing style costs a plain name, a guessed one costs a false claim.
// ---------------------------------------------------------------------------

export const ELITE_NAME_STYLES: Record<string, EliteNameStyle> = {
  'castile-hidalguia': IBERIAN_HIDALGO,
  'north-spain-hidalguia': IBERIAN_HIDALGO,
  'poland-szlachta': POLISH_SZLACHTA,
  'hungary-nemesseg': HUNGARIAN_NEMES,
  'england-gentry': ENGLISH_GENTRY,
  'italian-patriciate': ITALIAN_PATRICIATE,
  'russia-dvoryanstvo': RUSSIAN_DVORYANSTVO,
  'medieval-knightly': MEDIEVAL_KNIGHTLY,
  'roman-curial': ROMAN_CURIAL,
  'europe-late-antique-curiales': ROMAN_CURIAL,
  'greek-citizen-body': GREEK_CITIZEN,
  'soviet-nomenklatura': SOVIET_NOMENKLATURA,

  'sayyid-lineage': SAYYID,
  'ottoman-askeri': OTTOMAN_ASKERI,
  'persian-azadan': PERSIAN_AZADAN,
  'egyptian-scribal': EGYPTIAN_SCRIBAL,
  'mesopotamian-temple': MESOPOTAMIAN_TEMPLE,
  'mamluk-egypt': MAMLUK,
  'mena-modern-notables': MENA_NOTABLES,

  brahmin: BRAHMIN,
  'rajput-lineage': RAJPUT,
  'vedic-kshatriya': VEDIC_KSHATRIYA,
  'sayyid-south-asia': SAYYID_SOUTH_ASIA,
  'mughal-mansabdar': MUGHAL_MANSABDAR,
  'south-asia-zamindar': ZAMINDAR,

  'han-tang-officialdom': HAN_OFFICIALDOM,
  'china-degree-gentry': CHINESE_GENTRY,
  'qing-bannerman': QING_BANNERMAN,
  'steppe-ruling-clan': STEPPE_RULING_CLAN,
  'tokugawa-samurai': SAMURAI,
  'joseon-yangban': YANGBAN,
  'japan-shizoku': JAPAN_SHIZOKU,

  'sahel-ruling-lineage': SAHEL_RULING,
  'ethiopia-mekwanent': ETHIOPIAN_MEKWANENT,
  'west-african-chiefly': WEST_AFRICAN_CHIEFLY,
  'africa-early-lineage-heads': AFRICAN_SENIOR_LINEAGE,

  'maya-ajaw': MAYA_AJAW,
  'mesoamerican-pipiltin': NAHUA_PIPILTIN,
  'inca-privilege': INCA_ELITE,
  'andean-kuraka': ANDEAN_KURAKA,
  'mississippian-elite': MISSISSIPPIAN_ELITE,
  'colonial-gentry': ANGLO_GENTRY,
  'north-america-gilded': AMERICAN_PROPERTIED,
  'north-america-reservation-leadership': NATIVE_COUNCIL,
  'latin-hacendado': LATIN_HACENDADO,
  'south-america-republican': LATIN_HACENDADO,

  'polynesian-arii': POLYNESIAN_CHIEFLY,
  'oceania-ariki': POLYNESIAN_CHIEFLY,
  'sea-datu-lineages': SEA_DATU,
  'sea-court-nobility': SEA_COURT,
  'sea-colonial-and-after': SEA_GOVERNING,
};

export function eliteNameStyleFor(stratumId: string | undefined): EliteNameStyle | undefined {
  return stratumId ? ELITE_NAME_STYLES[stratumId] : undefined;
}
