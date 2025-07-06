import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Game from './pages/Game';
import ProtectedRoute from './routes/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
      path="/game"
      element={
        <ProtectedRoute>
          <Game />
        </ProtectedRoute>
      }
    />
    </Routes>
  );
};

export default App;