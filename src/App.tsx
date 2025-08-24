import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import MainHub from './pages/MainHub';
import GameLobby from './pages/GameLobby';
import PerudoGame from './pages/PerudoGame';
import ComingSoon from './pages/ComingSoon';
import ProtectedRoute from './routes/ProtectedRoute';

const App = () => {
  // Check if Coming Soon mode is enabled via environment variable
  const isComingSoonEnabled = import.meta.env.VITE_COMING_SOON_ENABLED === 'true';

  // If Coming Soon is enabled, show only that page regardless of route
  if (isComingSoonEnabled) {
    return <ComingSoon />;
  }

  // Normal routing when Coming Soon is disabled
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/main-hub"
        element={
          <ProtectedRoute>
            <MainHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game-lobby/:gameId"
        element={
          <ProtectedRoute>
            <GameLobby />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:gameId"
        element={
          <ProtectedRoute>
            <PerudoGame />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;