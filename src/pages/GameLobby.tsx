import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import bgDesktop from "@/assets/wood_background_desktop.jpg"
import bgMobile from "@/assets/wood_background_mobile.jpg"

// Mock data - replace with Firebase calls
interface Game {
  id: string
  name: string
  players: number
  maxPlayers: number
  bet: string
  createdBy: string
}

const GameLobby = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [bgImage, setBgImage] = useState(
    window.innerWidth < 768 ? bgMobile : bgDesktop
  )

  // Handle responsive background
  useEffect(() => {
    const handleResize = () => {
      setBgImage(window.innerWidth < 768 ? bgMobile : bgDesktop)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Mock data loading - replace with Firebase
  useEffect(() => {
    const loadGames = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setGames([
        { id: '1', name: "Brendan's Bonanza", players: 4, maxPlayers: 6, bet: "5 Gold", createdBy: "Brendan" },
        { id: '2', name: "The Salty Spitoon", players: 2, maxPlayers: 4, bet: "10 Gold", createdBy: "Sarah" },
        { id: '3', name: "Dicey Endeavors", players: 3, maxPlayers: 6, bet: "2 Gold", createdBy: "Mike" },
        { id: '4', name: "The Last Stand", players: 3, maxPlayers: 5, bet: "5 Gold", createdBy: "Emma" }
      ])
      setLoading(false)
    }
    
    loadGames()
  }, [])

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameName.trim()) return

    // TODO: Create game in Firebase
    console.log('Creating game:', newGameName)
    
    // For now, just add to local state
    const newGame: Game = {
      id: Date.now().toString(),
      name: newGameName,
      players: 1,
      maxPlayers: 6,
      bet: "5 Gold",
      createdBy: user?.email || "Unknown"
    }
    
    setGames(prev => [newGame, ...prev])
    setNewGameName('')
    setShowCreateModal(false)
    
    // Navigate to game
    // navigate(`/game/${newGame.id}`)
  }

  const handleJoinGame = (gameId: string) => {
    // TODO: Join game in Firebase and navigate to game screen
    console.log('Joining game:', gameId)
    // navigate(`/game/${gameId}`)
  }

  const handleViewHistory = () => {
    // TODO: Navigate to game history page
    console.log('View game history')
    // navigate('/history')
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

  const getProfileInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <span className="text-2xl">🎲</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 drop-shadow-lg font-serif">
            Perudo
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-yellow-100 text-sm hidden md:inline">
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold hover:bg-yellow-300 transition-colors"
            title="Profile / Logout"
          >
            {getProfileInitial()}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Left Panel - Play Perudo */}
        <Card className="bg-green-800/80 border-2 border-green-600 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-yellow-100 font-serif">
              Play Perudo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 text-lg transition-colors"
            >
              Create New Game
            </Button>
            
            <Button
              onClick={handleViewHistory}
              variant="outline"
              className="w-full border-2 border-yellow-400 text-yellow-500 hover:bg-yellow-400/20 hover:text-yellow-100 py-3 text-lg transition-colors"
            >
              View Game History
            </Button>
            
            <div className="text-center text-yellow-100/80 italic text-sm mt-6">
              "The game of liars and cheats. Good luck."
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Active Games */}
        <Card className="bg-green-800/80 border-2 border-green-600 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-yellow-100 font-serif">
              Active Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-green-700/50 rounded-lg p-4 h-16"></div>
                  </div>
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className="text-center text-yellow-100/60 py-8">
                No active games. Create one to get started!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-green-700/50 rounded-lg p-4 flex justify-between items-center hover:bg-green-700/70 transition-colors group"
                  >
                    <div>
                      <h3 className="font-bold text-yellow-100 text-lg">
                        {game.name}
                      </h3>
                      <p className="text-green-200 text-sm">
                        Players: {game.players}/{game.maxPlayers} | Bet: {game.bet}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleJoinGame(game.id)}
                      className="bg-green-600 hover:bg-green-500 text-white px-6 transition-colors group-hover:scale-105 transform"
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-green-800 border-2 border-green-600 text-white w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-center text-yellow-100">
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gameName" className="text-yellow-100">
                    Game Name
                  </Label>
                  <Input
                    id="gameName"
                    type="text"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="Enter a fun game name..."
                    className="bg-green-700 border-green-600 text-white placeholder-green-300"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                  >
                    Create Game
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GameLobby