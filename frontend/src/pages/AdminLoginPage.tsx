/**
 * Admin login page — secret route, not linked anywhere in the UI.
 * URL: /mx
 * Not indexed by search engines (robots.txt).
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLoginPage() {
  const { loginToInventory, isInventoryAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [shake, setShake]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Already logged in — bounce straight to site
  if (isInventoryAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = loginToInventory(password)
    if (ok) {
      navigate('/', { replace: true })
    } else {
      setError(true)
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 600)
      inputRef.current?.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0c1844 0%, #1e3a8a 40%, #7c3aed 80%, #be185d 100%)',
      }}
    >
      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 w-full max-w-xs px-8 py-10 rounded-3xl flex flex-col gap-5 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/images/RarionLogoPlainnobg.png"
            alt=""
            className="h-14 w-auto opacity-90"
          />
        </div>

        <input
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          placeholder="••••••••"
          className="w-full h-12 px-4 rounded-xl text-white text-sm font-medium text-center tracking-widest focus:outline-none transition-all"
          style={{
            background: error ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            border: error ? '1.5px solid rgba(239,68,68,0.6)' : '1.5px solid rgba(255,255,255,0.14)',
          }}
          onFocus={e  => !error && (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.5)')}
          onBlur={e   => (e.currentTarget.style.boxShadow = 'none')}
        />

        <button
          type="submit"
          disabled={!password}
          className="w-full h-11 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #be185d)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          Enter
        </button>
      </form>

      {/* Shake keyframe injected inline */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
