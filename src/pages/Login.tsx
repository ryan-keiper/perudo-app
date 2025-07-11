import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import bgDesktop from "@/assets/login_bg_desktop.jpg";
import bgMobile from "@/assets/login_bg_mobile_2.jpg";

const Login = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const [bgImage, setBgImage] = useState(
    window.innerWidth < 768 ? bgMobile : bgDesktop
  );

  useEffect(() => {
    const handleResize = () => {
      setBgImage(window.innerWidth < 768 ? bgMobile : bgDesktop);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/game')
    }
  }, [loading, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isSigningUp) {
        const expectedCode = import.meta.env.VITE_INVITE_CODE
        if (inviteCode !== expectedCode) {
          throw new Error('Invalid invite code')
        }
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/game')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* App Title */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h1 className="text-6xl font-bold text-red-500 drop-shadow-lg tracking-wide font-serif">
          Perudo
        </h1>
        <p className="text-xl text-yellow-100 mt-2 font-medium drop-shadow">
          Now with 20% more deception!
        </p>
      </div>

      {/* Card Container */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-20">
        <Card className="w-full bg-black/50 border border-yellow-200/30 text-white shadow-lg rounded-xl p-6">
          <CardHeader>
            <CardTitle className="text-center text-yellow-100 text-2xl font-bold font-serif">
              {isSigningUp ? 'Sign Up' : 'Login'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isSigningUp && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                {isSigningUp ? 'Create Account' : 'Log In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:underline"
                  onClick={() => setIsSigningUp((prev) => !prev)}
                >
                  {isSigningUp
                    ? 'Already have an account? Log In'
                    : 'Need an account? Sign Up'}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center mt-2">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login