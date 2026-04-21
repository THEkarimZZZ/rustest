import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, User, AlertCircle, GraduationCap, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'

function RegisterPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && profile) {
      navigate(profile.role === 'teacher' ? '/teacher' : '/student')
    }
  }, [profile, authLoading, navigate])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!privacyAccepted || !termsAccepted) {
      setError('Необходимо принять оба соглашения')
      return
    }
    if (password.length < 8) {
      setError('Пароль — минимум 8 символов')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      })
      if (authError) throw authError
      if (authData.user) navigate('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Ошибка при регистрации')
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
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>

          <div className="w-14 h-14 bg-blue rounded-xl flex items-center justify-center mb-6">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Регистрация</h2>
          <p className="text-sm text-gray-500 mb-8">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-blue hover:text-blue-deep font-medium transition-colors">
              Войдите
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
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
              label="ФИО"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              icon={<User className="h-4 w-4" />}
              required
            />

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
              placeholder="Минимум 8 символов"
              icon={<Lock className="h-4 w-4" />}
              required
              minLength={8}
              autoComplete="new-password"
            />

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">Роль</label>
              <div className="grid grid-cols-2 gap-3">
                {(['teacher', 'student'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      role === r
                        ? 'border-blue bg-blue-light text-blue'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5 mx-auto mb-1.5" />
                    {r === 'teacher' ? 'Преподаватель' : 'Ученик'}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue focus:ring-offset-0"
                />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Принимаю{' '}
                  <Link to="/privacy-policy" className="text-blue hover:text-blue-deep font-medium underline underline-offset-2">
                    политику конфиденциальности
                  </Link>
                  {' '}и согласие на обработку данных
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue focus:ring-offset-0"
                />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                  Принимаю{' '}
                  <Link to="/terms" className="text-blue hover:text-blue-deep font-medium underline underline-offset-2">
                    пользовательское соглашение
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" variant="cta" size="lg" disabled={loading} className="w-full mt-2">
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage
