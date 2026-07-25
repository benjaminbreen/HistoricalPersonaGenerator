import PersonaGenerator from './components/PersonaGeneratorSimple';
import PortraitGallery from './components/portraits/PortraitGallery';
import PortraitLab from './components/portraitLab/PortraitLab';
import { PortraitEngineProvider } from './components/portraitLab/usePortraitEngine';
import './App.css';

function App() {
  const params = new URLSearchParams(window.location.search);

  const showPortraitGallery =
    window.location.hash === '#portrait-gallery' || params.has('portraitGallery');

  // The A/B bench: both renderers on the same personas, side by side.
  const showPortraitLab =
    window.location.hash === '#portrait-lab' || params.has('portraitLab');

  return (
    <PortraitEngineProvider>
      <div className="app">
        {showPortraitLab ? (
          <PortraitLab />
        ) : showPortraitGallery ? (
          <PortraitGallery />
        ) : (
          <PersonaGenerator />
        )}
      </div>
    </PortraitEngineProvider>
  );
}

export default App;
