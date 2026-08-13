import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './components/HomeScreen';
import { EraSelector } from './components/EraSelector';
import { GameScreen } from './components/GameScreen';
import { useEffect } from 'react';

function AppLayout() {
  const { state } = useGame();
  const navigate = useNavigate();

  // Sync routing with GameContext screen changes
  useEffect(() => {
    switch (state.screen) {
      case 'home':
        if (window.location.pathname !== '/') navigate('/', { replace: true });
        break;
      case 'new-game':
        if (window.location.pathname !== '/new-game') navigate('/new-game', { replace: true });
        break;
      case 'playing':
        if (state.sessionId && window.location.pathname !== `/game/${state.sessionId}`) {
          navigate(`/game/${state.sessionId}`, { replace: true });
        }
        break;
      case 'game-over':
        if (state.sessionId) {
          navigate(`/game/${state.sessionId}`, { replace: true });
        }
        break;
    }
  }, [state.screen, state.sessionId, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/new-game" element={<EraSelector />} />
      <Route path="/game/:sessionId" element={<GameScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <AppLayout />
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
