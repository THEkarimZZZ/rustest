import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, BookOpen, Clock, Users, Shield, ArrowRight, AlertCircle } from 'lucide-react'

function JoinTest() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && profile && test) {
      navigate(`/student/test/${test.id}`)
    }
  }, [profile, authLoading, test, navigate])

  useEffect(() => {
    if (!token) return
    fetchTest()
  }, [token])

  async function fetchTest() {
    setLoading(true)
    setError('')
    try {
      const { data, error: e } = await supabase
        .from('tests')
        .select('*, teacher:profiles!tests_teacher_id_fkey(full_name), questions(count)')
        .eq('share_token', token)
        .single()

      if (e || !data) throw new Error('Тест не найден')
      setTest(data)
    } catch (err: any) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (!profile?.id) {
      navigate(`/login?test=${token}`)
      return
    }
    navigate(`/student/test/${test.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link to="/student" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" /></div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Ошибка</h2>
                <p className="text-sm text-gray-500 mb-6">{error}</p>
                <Link to="/student"><button className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">На главную</button></Link>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue to-blue-deep p-8 text-center">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-1">{test.title}</h2>
                  {test.description && <p className="text-sm text-white/60">{test.description}</p>}
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <BookOpen className="h-5 w-5 text-blue mx-auto mb-2" />
                      <div className="text-xl font-bold text-gray-900">{test.questions?.[0]?.count || '?'}</div>
                      <div className="text-xs text-gray-500">вопросов</div>
                    </div>
                    {test.settings?.time_limit && (
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <Clock className="h-5 w-5 text-blue mx-auto mb-2" />
                        <div className="text-xl font-bold text-gray-900">{test.settings.time_limit}</div>
                        <div className="text-xs text-gray-500">минут</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
                    <Users className="h-4 w-4 text-blue" />
                    Преподаватель: {test.teacher?.full_name || '—'}
                  </div>

                  {test.settings?.shuffle_questions && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-light/50 rounded-lg px-4 py-2.5">
                      <Shield className="h-4 w-4 text-blue" />
                      Вопросы будут перемешаны
                    </div>
                  )}

                  <button onClick={handleStart} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all shadow-sm hover:shadow-md">
                    {profile ? (<>Начать тест<ArrowRight className="h-4 w-4" /></>) : 'Войти и начать'}
                  </button>

                  {!profile && (
                    <p className="text-xs text-center text-gray-400">
                      Необходимо <Link to="/login" className="text-blue hover:underline">войти</Link> для прохождения теста
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default JoinTest
