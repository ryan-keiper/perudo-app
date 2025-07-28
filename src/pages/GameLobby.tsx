import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase/firebase'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import bgDesktop from "@/assets/login_bg_desktop.jpg"
import bgMobile from "@/assets/login_bg_mobile_2.jpg"

interface Game {
  id: string
  name: string
  createdBy: string
  createdAt: any
  players: string[]
  status: 'waiting' | 'active' | 'completed'
  winner?: string // for completed games
}

const GameLobby = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [joiningGameId, setJoiningGameId] = useState<string>('')
  const [nickname, setNickname] = useState('')
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

  // Real-time games listener
  useEffect(() => {
    if (!user) return

    const gameStatus = showHistory ? 'completed' : 'waiting'
    const gamesQuery = query(
      collection(db, 'games'),
      where('status', '==', gameStatus),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(gamesQuery, (snapshot) => {
      const gamesList: Game[] = []
      snapshot.forEach((doc) => {
        gamesList.push({
          id: doc.id,
          ...doc.data()
        } as Game)
      })
      setGames(gamesList)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching games:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, showHistory])

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameName.trim() || !user) return

    try {
      const gameData = {
        name: newGameName.trim(),
        createdBy: user.email || user.uid,
        createdAt: serverTimestamp(),
        players: [user.email || user.uid],
        status: 'waiting' as const
      }

      await addDoc(collection(db, 'games'), gameData)
      
      setNewGameName('')
      setShowCreateModal(false)
      
      // Game will automatically appear in the active games list via real-time listener
    } catch (error) {
      console.error('Error creating game:', error)
      // TODO: Add error toast/notification
    }
  }

  const handleJoinGame = (gameId: string) => {
    setJoiningGameId(gameId)
    setShowNicknameModal(true)
  }

  const handleJoinWithNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !nickname.trim() || !joiningGameId) return

    try {
      const gameRef = doc(db, 'games', joiningGameId)
      const gameDoc = await getDoc(gameRef)
      
      if (!gameDoc.exists()) {
        console.error('Game not found')
        return
      }

      const gameData = gameDoc.data()
      const playerId = user.email || user.uid

      // Initialize game state if this is the first player joining
      if (!gameData.gameState) {
        const initialGameState = {
          players: {
            [playerId]: {
              name: user.displayName || user.email || 'Unknown',
              email: user.email || '',
              nickname: nickname.trim(),
              diceCount: 5,
              currentDice: [],
              calzaCount: 0,
              status: 'alive',
              joinedAt: serverTimestamp()
            }
          },
          currentRound: 1,
          currentPlayerId: playerId,
          playerOrder: [playerId],
          direction: 'clockwise',
          phase: 'waiting',
          isPalifico: false,
          currentRoundDice: {}
        }

        await updateDoc(gameRef, {
          gameState: initialGameState,
          status: 'active'
        })
      } else {
        // Add player to existing game
        const updatedPlayers = {
          ...gameData.gameState.players,
          [playerId]: {
            name: user.displayName || user.email || 'Unknown',
            email: user.email || '',
            nickname: nickname.trim(),
            diceCount: 5,
            currentDice: [],
            calzaCount: 0,
            status: 'alive',
            joinedAt: serverTimestamp()
          }
        }

        const updatedPlayerOrder = [...gameData.gameState.playerOrder, playerId]

        await updateDoc(gameRef, {
          'gameState.players': updatedPlayers,
          'gameState.playerOrder': updatedPlayerOrder
        })
      }

      // Clear modal and navigate to game
      setNickname('')
      setShowNicknameModal(false)
      setJoiningGameId('')
      navigate(`/game/${joiningGameId}`)
      
    } catch (error) {
      console.error('Error joining game:', error)
      // TODO: Add error toast/notification
    }
  }

  const handleViewHistory = () => {
    setShowHistory(!showHistory)
    setLoading(true) // Show loading while switching views
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
              className="w-full border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-100 py-3 text-lg transition-colors"
            >
              {showHistory ? 'View Active Games' : 'View Game History'}
            </Button>
            
            <div className="text-center text-yellow-100/80 italic text-sm mt-6">
              "The game of liars and cheats. Good luck."
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Active Games / Game History */}
        <Card className="bg-green-800/80 border-2 border-green-600 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-yellow-100 font-serif">
              {showHistory ? 'Game History' : 'Active Games'}
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
                {showHistory 
                  ? "No completed games yet. Start playing to build your history!"
                  : "No active games. Create one to get started!"
                }
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
                        {showHistory ? (
                          <>
                            Players: {game.players.length} | Host: {game.createdBy}
                            {game.winner && (
                              <span className="text-yellow-300"> | Winner: {game.winner}</span>
                            )}
                          </>
                        ) : (
                          <>
                            Players: {game.players.length} | Created by: {game.createdBy}
                          </>
                        )}
                      </p>
                    </div>
                    {!showHistory && (
                      <Button
                        onClick={() => handleJoinGame(game.id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 transition-colors group-hover:scale-105 transform"
                      >
                        Join
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-green-800 border-2 border-green-600 text-white w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-center text-yellow-100">
                Choose Your Nickname
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinWithNickname} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-yellow-100">
                    What should other players call you?
                  </Label>
                  <Input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter your nickname..."
                    className="bg-green-700 border-green-600 text-white placeholder-green-300"
                    maxLength={20}
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowNicknameModal(false)
                      setNickname('')
                      setJoiningGameId('')
                    }}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                  >
                    Join Game
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
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