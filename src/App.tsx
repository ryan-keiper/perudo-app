import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import GameLobby from './pages/GameLobby';
import PerudoGame from './pages/PerudoGame';
import ProtectedRoute from './routes/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/gamelobby"
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