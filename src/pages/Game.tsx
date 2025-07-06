import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Game = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900">Perudo</h1>
        <p className="text-lg text-gray-600 mt-2">Game screen coming soon...</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Welcome to the Game</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleLogout} variant="destructive">
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Game;