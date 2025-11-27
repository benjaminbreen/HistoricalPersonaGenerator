import { useState } from 'react';
import { generateHistoricalPersona, GenerationParams, HistoricalPersona } from '../services/personaGenerator';
import ProceduralPortrait from './portraits/ProceduralPortrait';
import { HistoricalEra, CulturalZone, Gender } from '../types';
import './PersonaGenerator.css';

const ERAS: { value: HistoricalEra; label: string }[] = [
  { value: 'PREHISTORY' as HistoricalEra, label: 'Neolithic Period (Before 3000 BCE)' },
  { value: 'ANTIQUITY' as HistoricalEra, label: 'Ancient World (3000 BCE - 500 CE)' },
  { value: 'MEDIEVAL' as HistoricalEra, label: 'Medieval Period (500 - 1450)' },
  { value: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra, label: 'Early Modern Period (1450 - 1750)' },
  { value: 'INDUSTRIAL_ERA' as HistoricalEra, label: 'Industrial Era (1750 - 1900)' },
  { value: 'MODERN_ERA' as HistoricalEra, label: 'Modern Era (1900 - 2000)' },
];

const CULTURAL_ZONES: { value: CulturalZone; label: string }[] = [
  { value: 'EUROPEAN', label: 'European' },
  { value: 'EAST_ASIAN', label: 'East Asian' },
  { value: 'SOUTH_ASIAN', label: 'South Asian' },
  { value: 'MENA', label: 'Middle East & North Africa' },
  { value: 'SUB_SAHARAN_AFRICAN', label: 'Sub-Saharan African' },
  { value: 'OCEANIA', label: 'Oceania' },
  { value: 'NORTH_AMERICAN_PRE_COLUMBIAN', label: 'North American (Pre-Columbian)' },
  { value: 'NORTH_AMERICAN_COLONIAL', label: 'North American (Colonial)' },
  { value: 'SOUTH_AMERICAN', label: 'South American' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
];

const SOCIAL_CLASSES = [
  { value: 'poor', label: 'Poor' },
  { value: 'modest', label: 'Modest' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'wealthy', label: 'Wealthy' },
  { value: 'noble', label: 'Noble' },
];

export default function PersonaGenerator() {
  const [persona, setPersona] = useState<HistoricalPersona | null>(null);
  const [params, setParams] = useState<Partial<GenerationParams>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const generateRandom = () => {
    const newPersona = generateHistoricalPersona(params);
    setPersona(newPersona);
  };

  const generateCompletelyRandom = () => {
    setParams({});
    const newPersona = generateHistoricalPersona({});
    setPersona(newPersona);
  };

  return (
    <div className="persona-generator">
      <header className="header">
        <h1>Historical Persona Generator</h1>
        <p className="subtitle">Generate authentic historical characters with procedural portraits</p>
      </header>

      <div className="controls">
        <div className="control-buttons">
          <button className="btn btn-primary" onClick={generateCompletelyRandom}>
            Generate Random Persona
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-controls">
            <div className="control-group">
              <label>Historical Era</label>
              <select
                value={params.era || ''}
                onChange={(e) => setParams({ ...params, era: e.target.value as HistoricalEra })}
              >
                <option value="">Any Era</option>
                {ERAS.map(era => (
                  <option key={era.value} value={era.value}>{era.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Cultural Zone</label>
              <select
                value={params.culturalZone || ''}
                onChange={(e) => setParams({ ...params, culturalZone: e.target.value as CulturalZone })}
              >
                <option value="">Any Culture</option>
                {CULTURAL_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Gender</label>
              <select
                value={params.gender || ''}
                onChange={(e) => setParams({ ...params, gender: e.target.value as Gender })}
              >
                <option value="">Any Gender</option>
                {GENDERS.map(gender => (
                  <option key={gender.value} value={gender.value}>{gender.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Social Class</label>
              <select
                value={params.wealthLevel || ''}
                onChange={(e) => setParams({ ...params, wealthLevel: e.target.value as any })}
              >
                <option value="">Any Class</option>
                {SOCIAL_CLASSES.map(sc => (
                  <option key={sc.value} value={sc.value}>{sc.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Age Range</label>
              <div className="age-range">
                <input
                  type="number"
                  placeholder="Min (e.g. 18)"
                  value={params.minAge || ''}
                  onChange={(e) => setParams({ ...params, minAge: parseInt(e.target.value) || undefined })}
                  min="1"
                  max="100"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max (e.g. 65)"
                  value={params.maxAge || ''}
                  onChange={(e) => setParams({ ...params, maxAge: parseInt(e.target.value) || undefined })}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="control-group">
              <label>Specific Year (optional)</label>
              <input
                type="number"
                placeholder="e.g. 1492"
                value={params.year || ''}
                onChange={(e) => setParams({ ...params, year: parseInt(e.target.value) || undefined })}
                min="-10000"
                max="2000"
              />
            </div>

            <button className="btn btn-primary" onClick={generateRandom}>
              Generate with These Parameters
            </button>
          </div>
        )}
      </div>

      {persona && (
        <div className="persona-display">
          <div className="portrait-section">
            <ProceduralPortrait character={persona.character} size={400} />
          </div>

          <div className="info-section">
            <h2>{persona.character.name}</h2>

            <div className="info-grid">
              <div className="info-item">
                <span className="label">Age:</span>
                <span className="value">{persona.character.age}</span>
              </div>

              <div className="info-item">
                <span className="label">Gender:</span>
                <span className="value">{persona.character.gender}</span>
              </div>

              <div className="info-item">
                <span className="label">Profession:</span>
                <span className="value">{persona.character.profession}</span>
              </div>

              <div className="info-item">
                <span className="label">Era:</span>
                <span className="value">{persona.era}</span>
              </div>

              <div className="info-item">
                <span className="label">Culture:</span>
                <span className="value">{persona.culturalZone}</span>
              </div>

              <div className="info-item">
                <span className="label">Location:</span>
                <span className="value">{persona.location}</span>
              </div>

              <div className="info-item">
                <span className="label">Year:</span>
                <span className="value">{persona.year}</span>
              </div>

              <div className="info-item">
                <span className="label">Religion:</span>
                <span className="value">{persona.character.religion}</span>
              </div>
            </div>

            <div className="backstory-section">
              <h3>Backstory</h3>
              <p>{persona.character.backstory}</p>
            </div>

            <div className="stats-section">
              <h3>Attributes</h3>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">Strength:</span>
                  <span className="stat-value">{persona.character.stats.strength}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Intelligence:</span>
                  <span className="stat-value">{persona.character.stats.intelligence}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Charisma:</span>
                  <span className="stat-value">{persona.character.stats.charisma}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Constitution:</span>
                  <span className="stat-value">{persona.character.stats.constitution}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Dexterity:</span>
                  <span className="stat-value">{persona.character.stats.dexterity}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Wisdom:</span>
                  <span className="stat-value">{persona.character.stats.wisdom}</span>
                </div>
              </div>
            </div>

            <div className="appearance-section">
              <h3>Appearance</h3>
              <div className="appearance-details">
                <p><strong>Build:</strong> {persona.character.appearance.build}</p>
                <p><strong>Hair:</strong> {persona.character.appearance.hairColor}, {persona.character.appearance.hairstyle}</p>
                <p><strong>Eyes:</strong> {persona.character.appearance.eyeColor}</p>
                <p><strong>Skin:</strong> {persona.character.appearance.skinColor}</p>
                {persona.character.appearance.facialHair && (
                  <p><strong>Facial Hair:</strong> {persona.character.appearance.facialHairStyle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!persona && (
        <div className="empty-state">
          <p>Click "Generate Random Persona" to create your first historical character!</p>
        </div>
      )}
    </div>
  );
}
