import { useState } from 'react'
import { Lock, X } from 'lucide-react'

interface LoginModalProps {
  title: string
  description: string
  onSubmit: (password: string) => boolean
  onClose?: () => void
  showClose?: boolean
}

export function LoginModal({ title, description, onSubmit, onClose, showClose = false }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    setTimeout(() => {
      const success = onSubmit(password)
      if (!success) {
        setError('Incorrect password')
        setPassword('')
      }
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-slide-down">
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center">{title}</h2>
          <p className="text-gray-600 text-center mt-2">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-lg border-2 
                ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                transition-colors
              `}
              placeholder="Enter password"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className={`
              w-full py-3 px-4 rounded-lg font-bold text-white
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-600 hover:to-purple-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              shadow-lg hover:shadow-xl
            `}
          >
            {isLoading ? 'Verifying...' : 'Access'}
          </button>
        </form>
      </div>
    </div>
  )
}
