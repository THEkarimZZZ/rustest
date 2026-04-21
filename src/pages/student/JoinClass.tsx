import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, CheckCircle2, Users, Shield, AlertCircle } from 'lucide-react'

function JoinClass() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const [className, setClassName] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [studentsCount, setStudentsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  // Auto-join if already logged in
  useEffect(() => {
    if (!authLoading && profile && className && !joined && !error) {
      handleJoin()
    }
  }, [profile, authLoading, className])

  useEffect(() => {
    if (!code) return
    fetchClassInfo()
  }, [code])

  async function fetchClassInfo() {
    setLoading(true)
    setError('')

    try {
      const { data: cls, error: clsError } = await supabase
        .from('classes')
        .select('id, name, teacher_id')
        .eq('invite_code', code?.toUpperCase())
        .single()

      if (clsError || !cls) throw new Error('Класс не найден')

      const { data: teacher } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', cls.teacher_id)
        .single()

      const { count } = await supabase
        .from('class_members')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id)

      setClassName(cls.name)
      setTeacherName(teacher?.full_name || 'Преподаватель')
      setStudentsCount(count || 0)

      // Check if already member
      if (profile?.id) {
        const { data: member } = await supabase
          .from('class_members')
          .select('id')
          .eq('class_id', cls.id)
          .eq('student_id', profile.id)
          .single()

        if (member) {
          setJoined(true)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки класса')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!profile?.id) {
      navigate(`/login?join=${code}`)
      return
    }

    setJoining(true)
    setError('')

    try {
      const { data: cls } = await supabase
        .from('classes')
        .select('id')
        .eq('invite_code', code?.toUpperCase())
        .single()

      if (!cls) throw new Error('Класс не найден')

      // Check if already member
      const { data: existing } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', cls.id)
        .eq('student_id', profile.id)
        .single()

      if (existing) {
        setJoined(true)
        return
      }

      const { error: insertError } = await supabase.from('class_members').insert({
        class_id: cls.id,
        student_id: profile.id,
      })

      if (insertError) throw insertError
      setJoined(true)
      setStudentsCount((prev) => prev + 1)
      // Redirect to student dashboard after 1.5s
      setTimeout(() => navigate('/student'), 1500)
    } catch (err: any) {
      setError(err.message || 'Ошибка вступления в класс')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к тестам
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Success State */}
            {joined ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Вы в классе!</h2>
                <p className="text-gray-500 mb-2">{className}</p>
                <p className="text-sm text-gray-400 mb-6">Преподаватель: {teacherName}</p>
                <Link to="/student">
                  <button className="px-8 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all">
                    Перейти к тестам
                  </button>
                </Link>
              </motion.div>
            ) : loading ? (
              <div className="p-12 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full"
                />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
                <p className="text-sm text-gray-500 mb-6">{error}</p>
                <Link to="/student">
                  <button className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    На главную
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-gradient-to-br from-blue to-blue-deep p-8 text-center">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Users className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-1">Приглашение в класс</h2>
                  <p className="text-sm text-white/60">Код: <span className="font-mono font-bold">{code?.toUpperCase()}</span></p>
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Класс</span>
                    <span className="text-sm font-semibold text-gray-900">{className}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Преподаватель</span>
                    <span className="text-sm font-semibold text-gray-900">{teacherName}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Учеников</span>
                    <span className="text-sm font-semibold text-gray-900">{studentsCount}</span>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Вступление...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Присоединиться к классу
                      </>
                    )}
                  </button>

                  {!profile && (
                    <p className="text-xs text-center text-gray-400">
                      Необходимо <Link to="/login" className="text-blue hover:underline">войти</Link> или <Link to="/register" className="text-blue hover:underline">зарегистрироваться</Link>
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

export default JoinClass
