import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  BookOpen, Clock, CheckCircle2, Trophy, Star, TrendingUp,
  GraduationCap, ArrowRight, Users, QrCode, Plus, Check,
  ChevronDown, ChevronUp, User
} from 'lucide-react'

/* ============================================
   Helpers
   ============================================ */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

/* ============================================
   Animated Counter
   ============================================ */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let duration = 1500
    const startTime = performance.now()

    function update(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }, [value])

  return (
    <span>
      {display}
      {suffix}
    </span>
  )
}

/* ============================================
   Floating Particles Background
   ============================================ */
function ParticlesBg() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * -20,
    opacity: Math.random() * 0.15 + 0.03,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ============================================
   Test Card for Student
   ============================================ */
function TestCard({
  test,
  index,
  onTake,
}: {
  test: any
  index: number
  onTake: () => void
}) {
  const settings = test.settings || {}
  const questionCount = test._questions_count || 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-blue/5 hover:border-blue/20 transition-all duration-500 overflow-hidden">
        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(31,80,232,0.03), transparent)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>

        <div className="relative">
          {/* Top: title + badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue transition-colors duration-300">
                {test.title}
              </h3>
              {test.description && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 0.6, height: 'auto' }}
                  className="text-xs text-gray-500 mt-1 line-clamp-2 overflow-hidden"
                >
                  {test.description}
                </motion.p>
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              {questionCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-light rounded-full">
                  <BookOpen className="h-3 w-3 text-blue" />
                  <span className="text-[10px] font-semibold text-blue">{questionCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            {settings.time_limit && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {settings.time_limit} мин
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Trophy className="h-3 w-3" />
              {questionCount * 1} балл{questionCount > 1 ? 'а' : ''}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={onTake}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-blue text-gray-600 hover:text-white text-sm font-medium rounded-xl transition-all duration-300 group/btn"
          >
            <span>Начать тест</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ============================================
   Stat Card with animated icon
   ============================================ */
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  bg,
  delay,
}: {
  icon: any
  label: string
  value: number
  suffix?: string
  color: string
  bg: string
  delay: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-default"
    >
      <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500" style={{ background: bg }} />
      <div className="relative bg-white border border-gray-100 rounded-2xl p-5 group-hover:border-transparent transition-all duration-500">
        <motion.div
          animate={{ rotate: hovered ? 360 : 0, scale: hovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-3`}
        >
          <Icon className={`h-5 w-5 ${color}`} />
        </motion.div>
        <div className={`text-2xl md:text-3xl font-bold ${color} tracking-tight`}>
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </motion.div>
  )
}

/* ============================================
   Recent Result Row
   ============================================ */
function ResultRow({ result, index }: { result: any; index: number }) {
  const gradeColor = (g: string) => {
    switch (g) {
      case '5': return 'bg-emerald-100 text-emerald-700'
      case '4': return 'bg-blue-100 text-blue'
      case '3': return 'bg-amber-100 text-amber-700'
      default: return 'bg-red-100 text-red-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${gradeColor(result.final_grade || '2')}`}>
        {result.final_grade || '—'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{result.test_title}</p>
        <p className="text-xs text-gray-400">
          {new Date(result.finished_at).toLocaleDateString('ru-RU')}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">{result.percentage}%</p>
        <p className="text-xs text-gray-400">{result.raw_score}/{result.total_possible}</p>
        {result.show_correct_answers && (
          <Link to={`/student/review/${result.test_id}`} className="text-[10px] text-blue hover:text-blue-deep font-medium mt-0.5 inline-block">
            Посмотреть ответы →
          </Link>
        )}
      </div>
    </motion.div>
  )
}

/* ============================================
   Class Card for Student (with expandable students)
   ============================================ */
function ClassCardStudent({ classItem, index }: { classItem: any; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    if (expanded && students.length === 0) {
      fetchStudents()
    }
  }, [expanded])

  async function fetchStudents() {
    setLoadingStudents(true)
    const { data, error } = await supabase
      .from('class_members')
      .select('student_id, joined_at, profiles!class_members_student_id_fkey(full_name)')
      .eq('class_id', classItem.id)
      .order('joined_at', { ascending: false })

    if (!error && data) {
      setStudents(data.map((m: any) => ({
        full_name: m.profiles?.full_name || 'Неизвестный',
        joined_at: m.joined_at,
        is_me: m.student_id === classItem.current_student_id,
      })))
    }
    setLoadingStudents(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-blue/20 transition-all duration-300"
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{classItem.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{classItem.teacher_name}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-blue transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {classItem.students_count}
          </span>
          <span>{formatDate(classItem.joined_at)}</span>
        </div>
      </div>

      {/* Expandable Students List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-gray-50"
          >
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Одноклассники ({classItem.students_count})
              </p>
              {loadingStudents ? (
                <div className="flex justify-center py-3">
                  <div className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {students.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${
                        s.is_me ? 'bg-blue-light' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.is_me ? 'bg-blue text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <User className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${s.is_me ? 'text-blue' : 'text-gray-700'}`}>
                          {s.full_name}
                          {s.is_me && <span className="ml-1 text-[10px] opacity-60">(вы)</span>}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================
   MAIN: Student Dashboard
   ============================================ */
function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tests, setTests] = useState<any[]>([])
  const [myResults, setMyResults] = useState<any[]>([])
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'results'>('available')

  useEffect(() => {
    fetchData()
  }, [profile?.id])

  async function fetchData() {
    if (!profile?.id) return
    setLoading(true)

    try {
      // Get my classes
      const { data: memberships } = await supabase
        .from('class_members')
        .select('class_id, joined_at, classes!class_members_class_id_fkey(id, name, invite_code, teacher_id)')
        .eq('student_id', profile.id)

      if (memberships) {
        const classesWithDetails = await Promise.all(
          memberships.map(async (m: any) => {
            const { count } = await supabase
              .from('class_members')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', m.classes.id)
            const { data: teacher } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', m.classes.teacher_id)
              .single()
            return {
              ...m.classes,
              students_count: count || 0,
              teacher_name: teacher?.full_name || 'Преподаватель',
              joined_at: m.joined_at,
              current_student_id: profile!.id,
            }
          })
        )
        setMyClasses(classesWithDetails)
      }

      // Get available tests from test_assignments and class_id
      const classIds = memberships?.map((m: any) => m.classes.id) || []
      let availableTests: any[] = []

      if (classIds.length > 0) {
        // Get tests from test_assignments
        const { data: assignmentData } = await supabase
          .from('test_assignments')
          .select('test_id')
          .in('class_id', classIds)

        const assignedTestIds = assignmentData?.map((a: any) => a.test_id) || []

        // Get tests with direct class_id (legacy)
        const { data: directTests } = await supabase
          .from('tests')
          .select('*')
          .in('class_id', classIds)
          .eq('is_published', true)

        // Combine unique test IDs
        const directTestIds = directTests?.map((t: any) => t.id) || []
        const allTestIds = [...new Set([...assignedTestIds, ...directTestIds])]

        if (allTestIds.length > 0) {
          const { data: testsData } = await supabase
            .from('tests')
            .select('*')
            .in('id', allTestIds)
            .eq('is_published', true)
            .order('created_at', { ascending: false })

          if (testsData) {
            availableTests = await Promise.all(
              testsData.map(async (test) => {
                const { count } = await supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .eq('test_id', test.id)
                return { ...test, _questions_count: count || 0 }
              })
            )
          }
        }
      }

      setTests(availableTests)

      // Get my results
      const { data: resultsData } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', profile.id)
        .order('finished_at', { ascending: false })

      if (resultsData) {
        const enriched = await Promise.all(
          resultsData.map(async (result) => {
            const { data: testData } = await supabase
              .from('tests')
              .select('title, settings')
              .eq('id', result.test_id)
              .single()
            return { ...result, test_title: testData?.title || 'Тест', show_correct_answers: testData?.settings?.show_correct_answers || false }
          })
        )
        setMyResults(enriched)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalTests = tests.length
  const completedTests = myResults.length
  const avgScore = myResults.length > 0
    ? Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length)
    : 0

  const handleTakeTest = (testId: string) => {
    navigate(`/student/test/${testId}`)
  }

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      setJoinError('Введите код')
      return
    }
    if (!profile?.id) return

    setJoining(true)
    setJoinError('')
    setJoinSuccess('')

    try {
      const { data: cls } = await supabase
        .from('classes')
        .select('id, name')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single()

      if (!cls) throw new Error('Класс не найден')

      const { data: existing } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', cls.id)
        .eq('student_id', profile.id)
        .single()

      if (existing) {
        setJoinError('Вы уже в этом классе')
        setJoining(false)
        return
      }

      const { error } = await supabase.from('class_members').insert({
        class_id: cls.id,
        student_id: profile.id,
      })

      if (error) throw error

      setJoinSuccess(cls.name)
      setJoinCode('')
      fetchData()
      setTimeout(() => setJoinSuccess(''), 4000)
    } catch (err: any) {
      setJoinError(err.message || 'Ошибка')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Particles background */}
      <ParticlesBg />

      <div className="container-app relative py-8 md:py-12">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-12 h-12 bg-gradient-to-br from-blue to-blue-muted rounded-2xl flex items-center justify-center shadow-lg shadow-blue/20"
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Привет, {profile?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-sm text-gray-500">
                У тебя {totalTests} {totalTests === 1 ? 'доступный тест' : totalTests < 5 ? 'доступных теста' : 'доступных тестов'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={BookOpen} label="Доступно" value={totalTests} color="text-blue" bg="bg-blue-light/50" delay={0} />
          <StatCard icon={CheckCircle2} label="Пройдено" value={completedTests} color="text-emerald-600" bg="bg-emerald-50/50" delay={0.1} />
          <StatCard icon={TrendingUp} label="Средний балл" value={avgScore} suffix="%" color="text-purple-600" bg="bg-purple-50/50" delay={0.2} />
          <StatCard icon={Star} label="Лучшая оценка" value={myResults.length > 0 ? Math.max(...myResults.map((r: any) => Number(r.final_grade) || 0)) : 0} color="text-amber-600" bg="bg-amber-50/50" delay={0.3} />
        </div>

        {/* My Classes + Join */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Мои классы</h2>
            </div>

            {myClasses.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">У вас пока нет классов</p>
                    <p className="text-xs text-gray-400">Введите код приглашения, чтобы присоединиться</p>
                  </div>
                </div>

                {/* Join Form */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase())
                        setJoinError('')
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                      placeholder="Код: ABC123"
                      maxLength={6}
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
                    />
                  </div>
                  <button
                    onClick={handleJoinClass}
                    disabled={joining}
                    className="px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {joining ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Войти
                  </button>
                </div>

                {joinError && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-red-500">
                    {joinError}
                  </motion.p>
                )}
                {joinSuccess && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Вы присоединились к «{joinSuccess}»
                  </motion.p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myClasses.map((cls, i) => (
                  <ClassCardStudent key={cls.id} classItem={cls} index={i} />
                ))}

                {/* Add class card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: myClasses.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:border-blue/40 hover:bg-blue-light/30 transition-all min-h-[100px]"
                  onClick={() => {
                    const input = document.getElementById('join-code-input')
                    input?.focus()
                  }}
                >
                  <div className="text-center">
                    <Plus className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Добавить класс</p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Hidden join input for the "add class" card */}
            {myClasses.length > 0 && (
              <div className="mt-3 flex gap-2">
                <div className="flex-1 relative">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="join-code-input"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase())
                      setJoinError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinClass()}
                    placeholder="Введите код приглашения"
                    maxLength={6}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
                  />
                </div>
                <button
                  onClick={handleJoinClass}
                  disabled={joining}
                  className="px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all disabled:opacity-50"
                >
                  {joining ? '...' : 'Войти'}
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit"
        >
          {[
            { id: 'available', label: 'Доступные тесты', icon: BookOpen },
            { id: 'results', label: 'Мои результаты', icon: Trophy },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue text-white shadow-md shadow-blue/20'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Available Tests */}
        <AnimatePresence mode="wait">
          {activeTab === 'available' && (
            <motion.div
              key="available"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full"
                  />
                </div>
              ) : tests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-100 rounded-2xl p-12 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет доступных тестов</h3>
                  <p className="text-sm text-gray-400">Попросите преподавателя добавить вас в класс</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tests.map((test, i) => (
                    <TestCard key={test.id} test={test} index={i} onTake={() => handleTakeTest(test.id)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {myResults.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Trophy className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">Пока нет результатов</h3>
                  <p className="text-sm text-gray-400">Пройдите тест, и результаты появятся здесь</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  {myResults.map((result, i) => (
                    <ResultRow key={result.id} result={result} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StudentDashboard
