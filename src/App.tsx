import PersonaGenerator from './components/PersonaGeneratorSimple';
import PortraitGallery from './components/portraits/PortraitGallery';
import './App.css';

function App() {
  const showPortraitGallery =
    window.location.hash === '#portrait-gallery' ||
    new URLSearchParams(window.location.search).has('portraitGallery');

  return (
    <div className="app">
      {showPortraitGallery ? <PortraitGallery /> : <PersonaGenerator />}
    </div>
  );
}

export default App;
