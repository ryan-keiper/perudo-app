import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import MainHub from './pages/MainHub';
import GameLobby from './pages/GameLobby';
import PerudoGame from './pages/PerudoGame';
import ProtectedRoute from './routes/ProtectedRoute';

const App = () => {
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