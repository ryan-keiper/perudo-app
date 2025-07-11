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
import bgMobile from "@/assets/login_bg_mobile.jpg";

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
      className="min-h-screen bg-cover bg-center flex flex-col items-center px-4 pt-12 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Optional dark overlay */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* App Title */}
      <div className="text-center mb-12 z-10">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">Perudo</h1>
        <p className="text-lg text-gray-200 mt-2 drop-shadow-sm">
          Now with 20% more deception!
        </p>
      </div>

      {/* Card Container */}
      <div className="flex-1 w-full flex items-start justify-center z-10">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader>
            <CardTitle className="text-center">
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