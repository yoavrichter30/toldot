import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { HomeScreen } from './components/HomeScreen';
import { EraSelector } from './components/EraSelector';
import { GameScreen } from './components/GameScreen';

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/new-game" element={<EraSelector />} />
          <Route path="/game/:sessionId" element={<GameScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
