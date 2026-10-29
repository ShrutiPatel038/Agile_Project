"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import api from "../services/api.js"

export default function LoginPage() {
  const { setAuthUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading,setLoading] = useState(false)

  const from = location.state?.from?.pathname || "/"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please enter email and password.")
      return
    }
    setLoading(true);
    try {
      const {data} = await api.post('/auth/login',{email,password});
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      setAuthUser(data);
      switch (data.role) {
        case 'super-admin':
          navigate('/super-admin'); // Correct: Sends Super Admin to their panel
          break;
        case 'station-master':
          navigate('/dashboard'); // Correct: Sends Station Master to their panel
          break;
        case 'user':
          default:
          navigate('/profile'); // Correct: Sends regular users to their profile
          break;
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md mt-16 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Log in to your EV-Go account to resume your journey.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 card p-8 shadow-sm bg-white dark:bg-gray-900 rounded-3xl">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="label">Email address</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button 
          className="w-full btn btn-primary mt-2 py-3"
          type="submit" 
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pt-2">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
