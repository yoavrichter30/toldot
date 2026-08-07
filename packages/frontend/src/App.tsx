import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './components/HomeScreen';
import { EraSelector } from './components/EraSelector';
import { GameScreen } from './components/GameScreen';

function AppContent() {
  const { state } = useGame();
  switch (state.screen) {
    case 'home': return <HomeScreen />;
    case 'new-game': return <EraSelector />;
    case 'playing':
    case 'game-over':
      return <GameScreen />;
    default: return <HomeScreen />;
  }
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;