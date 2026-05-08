import ProceduralPortrait from './ProceduralPortrait';
import './PortraitGallery.css';

type GalleryCharacter = {
  name: string;
  label: string;
  notes: string[];
  character: any;
};

const baseStats = {
  strength: 5,
  intelligence: 5,
  charisma: 5,
  constitution: 5,
};

const baseAppearance = {
  skinColor: '#c58f68',
  hairColor: '#4b2f21',
  eyeColor: '#4b3a2a',
  hairstyle: 'short straight',
  build: 'average',
  faceShape: 'oval',
  eyeShape: 'almond',
  noseShape: 'straight',
  cheekbones: 'average',
  jawline: 'soft',
  hairTexture: 'straight',
  hairLength: 'short',
  facialHair: false,
  skinTone: 'medium',
  skinTexture: 'smooth',
  eyebrowShape: 'straight',
  eyebrowThickness: 'medium',
  eyelashes: 'medium',
  lipShape: 'medium',
  height: 170,
  weight: 68,
  affect: 'neutral',
  garment: { name: 'simple tunic', material: 'linen' },
  headgear: { name: 'none', material: 'none' },
  footwear: { name: 'leather shoes', material: 'leather' },
  belt: { name: 'plain belt', material: 'leather' },
  accessory: { name: 'none', material: 'none' },
  palette: {
    primary: '#746B5B',
    secondary: '#8F8068',
    accent: '#A77F4F',
  },
};

const makeCharacter = (overrides: Partial<GalleryCharacter['character']>): any => ({
  age: 35,
  gender: 'Male',
  health: 90,
  maxHealth: 100,
  fatigue: 10,
  maxFatigue: 100,
  stats: baseStats,
  equippedItems: {},
  appearance: baseAppearance,
  wealthLevel: 'modest',
  class: 'Commoner',
  era: 'RENAISSANCE_EARLY_MODERN',
  culturalZone: 'EUROPEAN',
  portraitSeed: 1001,
  ...overrides,
  stats: {
    ...baseStats,
    ...overrides.stats,
  },
  appearance: {
    ...baseAppearance,
    ...overrides.appearance,
    palette: {
      ...baseAppearance.palette,
      ...overrides.appearance?.palette,
    },
  },
  equippedItems: {
    ...overrides.equippedItems,
  },
});

const fixtures: GalleryCharacter[] = [
  {
    name: 'Medieval Laborer',
    label: 'Baseline poor working clothing',
    notes: ['Plain garment', 'Straw work hat', 'Weathered skin'],
    character: makeCharacter({
      age: 42,
      gender: 'Male',
      wealthLevel: 'poor',
      class: 'Peasant laborer',
      era: 'MEDIEVAL',
      portraitSeed: 1101,
      stats: { strength: 7, constitution: 6 },
      equippedItems: {
        torso: { name: 'patched wool tunic', material: 'wool', color: 'Brown' },
        head: { name: 'Work Hat', material: 'straw' },
      },
      appearance: {
        skinColor: '#b77f5b',
        hairColor: '#3a251a',
        hairstyle: 'short wavy',
        hairTexture: 'wavy',
        skinTexture: 'weathered',
        facialHair: true,
        facialHairStyle: 'stubble',
        palette: { primary: '#6F6656', secondary: '#8A7A61', accent: '#A08862' },
      },
    }),
  },
  {
    name: 'Early Modern Merchant',
    label: 'High status garment and cap',
    notes: ['Velvet palette', 'Brooch and chain', 'Sharper silhouette'],
    character: makeCharacter({
      age: 51,
      gender: 'Male',
      wealthLevel: 'wealthy',
      class: 'Merchant',
      portraitSeed: 1201,
      stats: { charisma: 8, intelligence: 7 },
      equippedItems: {
        torso: { name: 'velvet doublet', material: 'velvet', color: 'Burgundy' },
        head: { name: 'Velvet Cap', material: 'velvet' },
        necklace: { name: 'gold chain', material: 'gold' },
      },
      appearance: {
        skinColor: '#d2a27a',
        hairColor: '#5a3322',
        hairstyle: 'medium wavy',
        hairLength: 'medium',
        hairTexture: 'wavy',
        facialHair: true,
        facialHairStyle: 'mustache',
        jewelry: [{ type: 'brooch', material: 'gold', style: 'ornate', gems: ['#4169E1'] }],
        palette: { primary: '#6B2E3A', secondary: '#273F5F', accent: '#B88A3B' },
      },
    }),
  },
  {
    name: 'Ottoman Scholar',
    label: 'MENA scholar cap/turban behavior',
    notes: ['Turban coverage', 'Scholarly source cue', 'Subtle background'],
    character: makeCharacter({
      age: 44,
      gender: 'Male',
      class: 'Religious scholar',
      culturalZone: 'MENA',
      portraitSeed: 1301,
      stats: { intelligence: 9, charisma: 6 },
      equippedItems: {
        torso: { name: 'long scholar robe', material: 'wool', color: 'Gray' },
        head: { name: 'Turban', material: 'white cloth' },
      },
      appearance: {
        skinColor: '#a96f4f',
        hairColor: '#24160f',
        eyeColor: '#33271d',
        hairstyle: 'short curly',
        hairTexture: 'curly',
        facialHair: true,
        facialHairStyle: 'full_beard',
      },
      portraitVisualOverrides: {
        background: { base: '#B7A482', accent: '#8F8068', texture: 'subtle', vignette: true },
        notes: ['Fixture mirrors source-inferred scholar headgear.'],
      },
    }),
  },
  {
    name: 'Ming Clerk',
    label: 'East Asian official/scribe',
    notes: ['Cap occlusion', 'Long robe', 'Narrow palette'],
    character: makeCharacter({
      age: 32,
      gender: 'Male',
      class: 'Administrative clerk',
      culturalZone: 'EAST_ASIAN',
      era: 'RENAISSANCE_EARLY_MODERN',
      portraitSeed: 1401,
      stats: { intelligence: 8 },
      equippedItems: {
        torso: { name: 'dark scholar robe', material: 'cotton', color: 'Blue' },
        head: { name: 'Scholar Cap', material: 'cloth' },
      },
      appearance: {
        skinColor: '#c99a72',
        hairColor: '#1c1714',
        hairstyle: 'topknot straight',
        hairLength: 'long',
        hairTexture: 'straight',
        eyeColor: '#2f261f',
      },
    }),
  },
  {
    name: 'Source Probate Widow',
    label: 'Source-first clothing level, not garment replacement',
    notes: ['Palette override only', 'Veil inferred', 'Evidence note path'],
    character: makeCharacter({
      age: 58,
      gender: 'Female',
      wealthLevel: 'modest',
      class: 'Widow and household manager',
      portraitSeed: 1501,
      equippedItems: {
        torso: { name: 'wool gown', material: 'wool', color: 'Gray' },
      },
      appearance: {
        skinColor: '#d0a17b',
        hairColor: '#5d5d5d',
        hairstyle: 'medium straight',
        hairLength: 'medium',
        skinTexture: 'weathered',
      },
      portraitVisualOverrides: {
        headgear: { name: 'Veil', material: 'linen' },
        palette: { primary: '#6F6656', secondary: '#8A7A61', accent: '#A08862' },
        background: { base: '#A99B82', accent: '#8F836F', texture: 'grain', vignette: true },
        notes: ['Simulates adapter output from will_or_inventory.'],
      },
    }),
  },
  {
    name: 'Court Testimony Sailor',
    label: 'Source body condition and occupational cap',
    notes: ['Scar marking', 'Weathered skin', 'Work cap'],
    character: makeCharacter({
      age: 29,
      gender: 'Male',
      class: 'Sailor witness',
      culturalZone: 'NORTH_AMERICAN_COLONIAL',
      era: 'INDUSTRIAL_ERA',
      portraitSeed: 1601,
      stats: { strength: 6, constitution: 7 },
      equippedItems: {
        torso: { name: 'coarse sailor shirt', material: 'linen', color: 'White' },
        head: { name: 'Work Cap', material: 'wool' },
      },
      appearance: {
        skinColor: '#b77d58',
        hairColor: '#3b2a1e',
        hairstyle: 'short wavy',
        skinTexture: 'weathered',
        markings: [{ type: 'scar', location: 'cheek', color: '#8A5A4A', size: 'small', pattern: 'source_body_condition' }],
      },
      portraitVisualOverrides: {
        background: { base: '#839FAA', accent: '#6F8994', texture: 'subtle', vignette: true },
        notes: ['Simulates court testimony or ship log body-condition cues.'],
      },
    }),
  },
];

const PortraitGallery = () => (
  <main className="portrait-gallery">
    <header className="portrait-gallery__header">
      <div>
        <p className="portrait-gallery__eyebrow">Dev portrait QA</p>
        <h1>Procedural Portrait Gallery</h1>
      </div>
      <a href="/" className="portrait-gallery__back">Back to generator</a>
    </header>

    <section className="portrait-gallery__grid">
      {fixtures.map((fixture) => (
        <article className="portrait-gallery__card" key={fixture.name}>
          <div className="portrait-gallery__portrait">
            <ProceduralPortrait character={fixture.character} size={224} useEquippedItems />
          </div>
          <div className="portrait-gallery__body">
            <h2>{fixture.name}</h2>
            <p>{fixture.label}</p>
            <dl>
              <div>
                <dt>Seed</dt>
                <dd>{fixture.character.portraitSeed}</dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>{fixture.character.era} / {fixture.character.culturalZone}</dd>
              </div>
              <div>
                <dt>Headgear</dt>
                <dd>{fixture.character.equippedItems?.head?.name || fixture.character.portraitVisualOverrides?.headgear?.name || 'none'}</dd>
              </div>
              <div>
                <dt>Garment</dt>
                <dd>{fixture.character.equippedItems?.torso?.name || fixture.character.appearance.garment.name}</dd>
              </div>
            </dl>
            <ul>
              {fixture.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        </article>
      ))}
    </section>
  </main>
);

export default PortraitGallery;
