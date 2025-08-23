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
      navigate('/main-hub')
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
      navigate('/main-hub')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Header Wrapper */}
      <div className="w-full max-w-4xl text-center mb-6 md:mb-10 px-2">
        <h1 className="text-5xl md:text-7xl font-extrabold text-red-600 drop-shadow tracking-wide font-serif">
          Perudo
        </h1>
        <p className="text-lg md:text-2xl text-yellow-100 mt-2 font-medium drop-shadow">
          Now with 20% more deception!
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md px-4">
        <Card className="bg-black/40 border border-yellow-200/30 text-white shadow-lg rounded-xl p-6 card-overlay">
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
                  className="text-sm text-white hover:underline"
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