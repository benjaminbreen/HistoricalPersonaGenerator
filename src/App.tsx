import PersonaGenerator from './components/PersonaGeneratorSimple';
import PortraitLab from './components/portraitLab/PortraitLab';
import PortraitDevPanel from './components/portraitLab/devPanel/PortraitDevPanel';
import './App.css';

function App() {
  const params = new URLSearchParams(window.location.search);

  // The portrait bench, now a single-engine sheet rather than an A/B compare.
  const showPortraitLab =
    window.location.hash === '#portrait-lab' || params.has('portraitLab');

  return (
    <div className="app">
      {showPortraitLab ? <PortraitLab /> : <PersonaGenerator />}
      {/* Contact sheet overlay on ⇧`. Inert in production unless ?devPanel. */}
      <PortraitDevPanel />
    </div>
  );
}

export default App;
