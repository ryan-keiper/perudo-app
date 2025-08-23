import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'
import bgDesktop from "@/assets/wood_background_desktop.jpg"
import bgMobile from "@/assets/wood_background_mobile.jpg"

// Game types
interface Player {
  id: string
  name: string
  nickname?: string
  diceCount: number
  dice: number[]
  calzaCount: number
  status: 'alive' | 'ghost' | 'zombie' | 'dead'
}

interface Wager {
  playerId: string
  count: number
  value: number
}

interface GameState {
  id: string
  name: string
  players: Player[]
  currentPlayerId: string
  round: number
  phase: 'rolling' | 'wagering' | 'revealing'
  isPalifico: boolean
  palificopPlayerId?: string
  currentWager?: Wager
  totalDiceOnBoard: number
  direction: 'clockwise' | 'counterclockwise'
  roundDice: { [playerId: string]: number[] }
}

const PerudoGame = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExpectedValues, setShowExpectedValues] = useState(false)
  const [wagerCount, setWagerCount] = useState(1)
  const [wagerValue, setWagerValue] = useState(1)
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

  // Listen to game state updates
  useEffect(() => {
    if (!gameId || !user) return

    const gameRef = doc(db, 'games', gameId)
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        
        // Transform Firebase data to our GameState interface
        if (data.gameState) {
          const transformedGameState: GameState = {
            id: doc.id,
            name: data.name,
            players: Object.entries(data.gameState.players).map(([id, playerData]: [string, any]) => ({
              id,
              name: playerData.name,
              nickname: playerData.nickname,
              diceCount: playerData.diceCount,
              dice: playerData.currentDice || [],
              calzaCount: playerData.calzaCount,
              status: playerData.status
            })),
            currentPlayerId: data.gameState.currentPlayerId,
            round: data.gameState.currentRound,
            phase: data.gameState.phase,
            isPalifico: data.gameState.isPalifico,
            palificopPlayerId: data.gameState.palificopPlayerId,
            currentWager: data.gameState.currentWager,
            totalDiceOnBoard: Object.values(data.gameState.players).reduce((total: number, player: any) => total + player.diceCount, 0),
            direction: data.gameState.direction,
            roundDice: data.gameState.currentRoundDice || {}
          }
          
          setGameState(transformedGameState)
        }
        setLoading(false)
      } else {
        navigate('/gamelobby') // Game doesn't exist, go back to lobby
      }
    }, (error) => {
      console.error('Error fetching game:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [gameId, user, navigate])

  // Get current player
  const getCurrentPlayer = (): Player | null => {
    if (!gameState || !user) return null
    return gameState.players.find(p => p.id === (user.email || user.uid)) || null
  }

  // Get dice component
  const getDiceComponent = (value: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8', 
      lg: 'w-12 h-12'
    }
    
    const DiceComponents = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
    const DiceComponent = DiceComponents[value - 1]
    
    return <DiceComponent className={`${sizeClasses[size]} text-black`} />
  }

  // Calculate expected values
  const calculateExpectedValue = (diceValue: number): number => {
    if (!gameState) return 0
    const totalDice = gameState.totalDiceOnBoard
    if (gameState.isPalifico) {
      return totalDice / 6 // No wilds in palifico
    }
    return diceValue === 1 ? totalDice / 6 : totalDice / 3 // 1s are wild for other numbers
  }

  // Handle wagering
  const handleWager = async () => {
    if (!gameState || !user) return
    
    const newWager: Wager = {
      playerId: user.email || user.uid,
      count: wagerCount,
      value: wagerValue
    }

    try {
      await updateDoc(doc(db, 'games', gameId!), {
        currentWager: newWager,
        // TODO: Update current player, game logic
      })
    } catch (error) {
      console.error('Error making wager:', error)
    }
  }

  const handleDudo = async () => {
    // TODO: Implement Dudo logic
    console.log('Dudo called!')
  }

  const handleCalza = async () => {
    // TODO: Implement Calza logic
    console.log('Calza called!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Game not found</div>
      </div>
    )
  }

  const currentPlayer = getCurrentPlayer()

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Mobile Layout */}
      <div className="lg:hidden p-4 space-y-4">
        {/* Header - Keep Green Felt */}
        <Card className="bg-green-800/90 border-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-yellow-100">{gameState.name}</h1>
              <p className="text-sm text-green-200">
                Round {gameState.round} • {gameState.totalDiceOnBoard} dice on board
                {gameState.isPalifico && <span className="text-red-400"> • PALIFICO</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3D Dice Roll Area - Keep Green Felt */}
        {gameState.phase === 'rolling' && (
          <Card className="bg-green-900/80 border-green-600">
            <CardContent className="p-8 text-center">
              <div className="text-white text-lg">🎲 Rolling dice... 🎲</div>
              <div className="text-green-300 text-sm mt-2">3D animation will go here</div>
            </CardContent>
          </Card>
        )}

        {/* Your Player Tablet - Chalkboard */}
        {currentPlayer && (
          <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
            <CardHeader className="border-b border-gray-600">
              <CardTitle className="text-lg text-white font-mono tracking-wide">Your Dice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center">
                {currentPlayer.dice.map((die, index) => (
                  <div key={index} className="bg-white rounded p-2 border border-gray-400">
                    {getDiceComponent(die, 'lg')}
                  </div>
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-gray-300 font-mono">
                {currentPlayer.diceCount} dice • {currentPlayer.calzaCount} calzas
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Wager - Keep Green Felt */}
        <Card className="bg-yellow-600/90 border-yellow-500 text-black">
          <CardContent className="p-4 text-center">
            {gameState.currentWager ? (
              <div>
                <div className="text-lg font-bold">
                  Current Wager: {gameState.currentWager.count} {getDiceComponent(gameState.currentWager.value, 'md')}s
                </div>
                <div className="text-sm">
                  by {gameState.players.find(p => p.id === gameState.currentWager?.playerId)?.nickname ||
                      gameState.players.find(p => p.id === gameState.currentWager?.playerId)?.name}
                </div>
              </div>
            ) : (
              <div className="text-lg">Waiting for first wager...</div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons - Chalkboard */}
        {gameState.phase === 'wagering' && (
          <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1 font-mono">Count</label>
                  <Input
                    type="number"
                    min="1"
                    value={wagerCount}
                    onChange={(e) => setWagerCount(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border-gray-600 text-white font-mono rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1 font-mono">Value</label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={wagerValue}
                    onChange={(e) => setWagerValue(parseInt(e.target.value) || 1)}
                    className="bg-gray-800 border-gray-600 text-white font-mono rounded-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={handleWager} className="bg-blue-700 hover:bg-blue-600 rounded-none font-mono text-xs">
                  Wager
                </Button>
                <Button onClick={handleDudo} className="bg-red-700 hover:bg-red-600 rounded-none font-mono text-xs">
                  Dudo
                </Button>
                <Button onClick={handleCalza} className="bg-green-700 hover:bg-green-600 rounded-none font-mono text-xs">
                  Calza
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players Board - Chalkboard */}
        <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
          <CardHeader className="border-b border-gray-600">
            <CardTitle className="text-lg text-white font-mono tracking-wide">Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <div key={player.id} className="flex justify-between items-center p-2 bg-gray-800 border border-gray-600 rounded-none">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{player.nickname || player.name}</span>
                    <span className="text-lg">
                      {player.status === 'ghost' && '👻'}
                      {player.status === 'zombie' && '🧟'}
                      {player.status === 'dead' && '💀'}
                    </span>
                  </div>
                  <div className="text-sm font-mono">
                    {player.diceCount} dice • {player.calzaCount} calzas
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expected Values (Collapsible) - Chalkboard */}
        <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
          <CardHeader className="border-b border-gray-600">
            <button
              onClick={() => setShowExpectedValues(!showExpectedValues)}
              className="w-full flex justify-between items-center"
            >
              <CardTitle className="text-lg text-white font-mono tracking-wide">Expected Values</CardTitle>
              {showExpectedValues ? <ChevronUp className="text-white" /> : <ChevronDown className="text-white" />}
            </button>
          </CardHeader>
          {showExpectedValues && (
            <CardContent>
              <div className="grid grid-cols-6 gap-2 text-center text-sm">
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <div key={value} className="bg-gray-800 border border-gray-600 p-2 rounded-none">
                    <div>{getDiceComponent(value, 'sm')}</div>
                    <div className="mt-1 font-mono">{calculateExpectedValue(value).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:p-6 lg:h-screen">
        {/* Left Panel - All Chalkboard */}
        <div className="space-y-4">
          {/* Your Player Tablet - Chalkboard */}
          {currentPlayer && (
            <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
              <CardHeader className="border-b border-gray-600">
                <CardTitle className="text-xl text-white font-mono tracking-wide">Your Dice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  {currentPlayer.dice.map((die, index) => (
                    <div key={index} className="bg-white rounded p-3 border border-gray-400">
                      {getDiceComponent(die, 'lg')}
                    </div>
                  ))}
                </div>
                <div className="text-center text-gray-300 font-mono">
                  {currentPlayer.diceCount} dice • {currentPlayer.calzaCount} calzas
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expected Values - Chalkboard */}
          <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
            <CardHeader className="border-b border-gray-600">
              <CardTitle className="text-lg text-white font-mono tracking-wide">Expected Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <div key={value} className="bg-gray-800 border border-gray-600 p-3 rounded-none">
                    <div className="mb-2">{getDiceComponent(value, 'md')}</div>
                    <div className="text-lg font-bold font-mono">{calculateExpectedValue(value).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Controls - Chalkboard */}
          {gameState.phase === 'wagering' && (
            <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
              <CardHeader className="border-b border-gray-600">
                <CardTitle className="text-lg text-white font-mono tracking-wide">Make Your Move</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1 font-mono">Count</label>
                    <Input
                      type="number"
                      min="1"
                      value={wagerCount}
                      onChange={(e) => setWagerCount(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border-gray-600 text-white font-mono rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1 font-mono">Value</label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={wagerValue}
                      onChange={(e) => setWagerValue(parseInt(e.target.value) || 1)}
                      className="bg-gray-800 border-gray-600 text-white font-mono rounded-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={handleWager} className="w-full bg-blue-700 hover:bg-blue-600 rounded-none font-mono">
                    Make Wager ({wagerCount} {getDiceComponent(wagerValue, 'sm')}s)
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleDudo} className="bg-red-700 hover:bg-red-600 rounded-none font-mono">
                      Call Dudo
                    </Button>
                    <Button onClick={handleCalza} className="bg-green-700 hover:bg-green-600 rounded-none font-mono">
                      Call Calza
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Panel - Keep Green Felt */}
        <div className="space-y-4">
          {/* Header - Green Felt */}
          <Card className="bg-green-800/90 border-green-600 text-white">
            <CardContent className="p-4 text-center">
              <h1 className="text-2xl font-bold text-yellow-100">{gameState.name}</h1>
              <p className="text-green-200">
                Round {gameState.round} • {gameState.totalDiceOnBoard} dice on board
                {gameState.isPalifico && <span className="text-red-400"> • PALIFICO ROUND</span>}
              </p>
            </CardContent>
          </Card>

          {/* 3D Dice Roll Area - Green Felt */}
          {gameState.phase === 'rolling' && (
            <Card className="bg-green-900/80 border-green-600 flex-1">
              <CardContent className="p-12 text-center h-full flex items-center justify-center">
                <div>
                  <div className="text-white text-2xl mb-4">🎲 Rolling dice... 🎲</div>
                  <div className="text-green-300">3D dice animation will appear here</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Wager Display - Yellow/Orange */}
          <Card className="bg-yellow-600/90 border-yellow-500 text-black">
            <CardContent className="p-6 text-center">
              {gameState.currentWager ? (
                <div>
                  <div className="text-2xl font-bold mb-2">
                    Current Wager: {gameState.currentWager.count} {getDiceComponent(gameState.currentWager.value, 'lg')}s
                  </div>
                  <div className="text-lg">
                    by {gameState.players.find(p => p.id === gameState.currentWager?.playerId)?.nickname ||
                        gameState.players.find(p => p.id === gameState.currentWager?.playerId)?.name}
                  </div>
                </div>
              ) : (
                <div className="text-xl">Waiting for first wager of the round...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Chalkboard */}
        <div className="space-y-4">
          {/* Players Board - Chalkboard */}
          <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
            <CardHeader className="border-b border-gray-600">
              <CardTitle className="text-xl text-white font-mono tracking-wide">Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameState.players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center p-3 bg-gray-800 border border-gray-600 rounded-none">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium font-mono">{player.nickname || player.name}</span>
                      <span className="text-xl">
                        {player.status === 'ghost' && '👻'}
                        {player.status === 'zombie' && '🧟'}
                        {player.status === 'dead' && '💀'}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div>{player.diceCount} dice</div>
                      <div className="text-sm text-gray-400">{player.calzaCount} calzas</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Round Reveals - Chalkboard */}
          {gameState.phase === 'revealing' && (
            <Card className="bg-black border-4 border-amber-800 text-white rounded-none shadow-lg">
              <CardHeader className="border-b border-gray-600">
                <CardTitle className="text-lg text-white font-mono tracking-wide">Round Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-300 font-mono">
                  Dice reveal animations will appear here
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerudoGame