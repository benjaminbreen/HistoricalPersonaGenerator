# Historical Persona Generator

A standalone web application that generates authentic historical characters with procedurally generated portraits. Extracted from the Universal History Simulator project.

## Features

- **Procedural Portrait Generation**: Unique, pixel-art style portraits with detailed facial features, clothing, and accessories
- **Cultural Authenticity**: 9 cultural zones with historically accurate names, professions, and clothing
- **Era-Specific Details**: 6 historical eras from Prehistory to Modern Era (10,000 BCE - 2000 CE)
- **Rich Character Data**: Complete backstories, stats, appearance details, and cultural context
- **Flexible Generation**: Generate completely random personas or set specific parameters (era, culture, gender, age, social class, year)

## Supported Cultural Zones

- European
- East Asian
- South Asian
- Middle East & North Africa
- Sub-Saharan African
- Oceania
- North American (Pre-Columbian)
- North American (Colonial)
- South American

## Historical Eras

- Prehistory (Before 3000 BCE)
- Antiquity (3000 BCE - 500 CE)
- Medieval (500 - 1450)
- Renaissance & Early Modern (1450 - 1750)
- Industrial Era (1750 - 1900)
- Modern Era (1900 - 2000)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How It Works

The generator uses a sophisticated procedural system that:

1. Selects or generates appropriate cultural and temporal parameters
2. Generates historically accurate names based on region and era
3. Assigns era-appropriate professions and religions
4. Creates detailed character stats and personality traits
5. Generates appearance features (skin color, hair, eyes, build, etc.)
6. Assigns culturally appropriate clothing and accessories
7. Renders a unique procedural portrait using canvas-based rendering
8. Creates a contextual backstory

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Canvas API** - Procedural portrait rendering

## Credits

Created by Benjamin Breen (UCSC)

Extracted from the Universal History Simulator, an educational history simulation game.

## License

MIT
