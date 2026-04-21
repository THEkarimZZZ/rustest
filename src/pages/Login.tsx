import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, AlertCircle, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { motion } from 'motion/react'

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  // Check for redirect targets
  const testToken = searchParams.get('test')
  const joinCode = searchParams.get('join')

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && profile) {
      if (testToken) {
        navigate(`/student/join-test/${testToken}`)
      } else if (joinCode) {
        navigate(`/student/join/${joinCode}`)
      } else if (profile.role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    }
  }, [profile, authLoading, testToken, joinCode, navigate])

  // Check if just registered
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setRegistered(true)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Redirect based on URL params or role
      if (testToken) {
        navigate(`/student/join-test/${testToken}`)
      } else if (joinCode) {
        navigate(`/student/join/${joinCode}`)
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (userProfile?.role === 'teacher') {
            navigate('/teacher')
          } else {
            navigate('/student')
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-16 px-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>

          <div className="w-14 h-14 bg-blue rounded-xl flex items-center justify-center mb-6">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>

          {registered ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Регистрация успешна!</h2>
              <p className="text-sm text-gray-500">Теперь войдите в свой аккаунт</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Вход в систему</h2>
              <p className="text-sm text-gray-500 mb-8">
                Нет аккаунта?{' '}
                <Link to="/register" className="text-blue hover:text-blue-deep font-medium transition-colors">
                  Зарегистрируйтесь
                </Link>
              </p>
            </>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              icon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />

            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              icon={<Lock className="h-4 w-4" />}
              required
              autoComplete="current-password"
            />

            <Button type="submit" variant="cta" size="lg" disabled={loading} className="w-full mt-6">
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
