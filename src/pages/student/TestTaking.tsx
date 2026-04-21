import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useAntiFraud } from '@/hooks/useAntiFraud'
import {
  Clock, ArrowRight, ArrowLeft, Check, AlertTriangle, Shield, ShieldOff,
  Sparkles, Trophy, RotateCcw, Home, Eye, EyeOff,
  AlertCircle, BookOpen, ListChecks, Info
} from 'lucide-react'

/* ============================================
   Types
   ============================================ */
interface Question {
  id: string
  type: 'choice' | 'multi' | 'text' | 'info_block'
  content: string
  options: string[]
  correct_answer: any
  points: number
  order_index: number
  hint?: string
}

interface TestSettings {
  time_limit: number | null
  shuffle_questions: boolean
  show_results_immediately: boolean
  show_correct_answers: boolean
  max_attempts: number | null
  anti_fraud_settings: {
    max_focus_loss: number
    min_answer_time: number
    block_copy: boolean
    block_right_click: boolean
    detect_devtools: boolean
    auto_submit_on_violation: boolean
  } | null
}

interface TestInfo {
  id: string
  title: string
  description: string | null
  grading_scale: any
  settings: TestSettings
}

/* ============================================
   Helpers
   ============================================ */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/* ============================================
   MAIN: Test Taking
   ============================================ */
function TestTaking() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [phase, setPhase] = useState<'loading' | 'confirm' | 'test' | 'results' | 'blocked'>('loading')
  const [test, setTest] = useState<TestInfo | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [maxTime, setMaxTime] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const timerRef = useRef<any>(null)

  // Load test
  useEffect(() => {
    if (!testId || !profile) return
    fetchTest()
  }, [testId, profile?.id])

  async function fetchTest() {
    try {
      const { data: testData } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()

      if (!testData) { navigate('/student'); return }
      setTest(testData)

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_index', { ascending: true })

      let qs = questionsData || []
      if (testData.settings?.shuffle_questions) qs = shuffleArray(qs)
      setQuestions(qs)

      if (testData.settings?.time_limit) {
        const seconds = testData.settings.time_limit * 60
        setTimeLeft(seconds)
        setMaxTime(seconds)
      }

      // Check existing result
      const { data: existing } = await supabase
        .from('results')
        .select('*')
        .eq('test_id', testId)
        .eq('student_id', profile!.id)
        .single()

      if (existing && existing.finished_at) {
        setPhase('results')
        setResult(existing)
      } else {
        setPhase('confirm')
      }
    } catch (err) {
      console.error(err)
      navigate('/student')
    }
  }

  // Timer
  useEffect(() => {
    if (phase !== 'test' || !maxTime || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, maxTime])

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'test') return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentQ < questions.length - 1) {
        setCurrentQ(p => p + 1)
        setShowHint(false)
      } else if (e.key === 'ArrowLeft' && currentQ > 0) {
        setCurrentQ(p => p - 1)
        setShowHint(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, currentQ, questions.length])

  const updateAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  // Anti-fraud hook — before handleSubmit, uses ref pattern
  const handleSubmitRef = useRef<(() => void) | undefined>(undefined)

  const antiFraud = useAntiFraud(
    test?.settings?.anti_fraud_settings,
    () => handleSubmitRef.current?.(),
    phase === 'test'
  )

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      // Server calculates raw_score, percentage, final_grade via trigger
      const resultData = {
        test_id: testId,
        student_id: profile!.id,
        answers,
        focus_loss_count: antiFraud.focusLossCount,
        violations: antiFraud.warnings,
        finished_at: new Date().toISOString(),
      }

      // Upsert result — server trigger calculates scores
      const { data: insertedData, error } = await supabase
        .from('results')
        .upsert(resultData, {
          onConflict: 'test_id,student_id',
        })
        .select()
        .single()

      if (error) throw error

      // Use server-calculated values
      setResult(insertedData)
      setPhase('results')
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }, [submitting, answers, antiFraud.focusLossCount, antiFraud.warnings, testId, profile])

  // Update ref for auto-submit
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  // Reset timer on answer
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      antiFraud.resetTimer()
    }
  }, [answers])

  // Handle auto-block from anti-fraud
  useEffect(() => {
    if (antiFraud.isBlocked && phase === 'test') {
      setPhase('blocked')
    }
  }, [antiFraud.isBlocked, phase])

  // ==================== LOADING ====================
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-2 border-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  // ==================== BLOCKED ====================
  if (phase === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldOff className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">Тест заблокирован</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">{antiFraud.blockReason}</p>
              {antiFraud.warnings.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Нарушения:</p>
                  {antiFraud.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-red-600 py-0.5">{w}</p>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mb-4">Результаты отправлены преподавателю</p>
              <Link to="/student"><button className="w-full py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all flex items-center justify-center gap-2"><Home className="h-4 w-4" />Вернуться к тестам</button></Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== CONFIRM ====================
  if (phase === 'confirm' && test) {
    const questionCount = questions.length
    const hasTimeLimit = !!test.settings?.time_limit

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue to-blue-deep p-8 text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">{test.title}</h2>
              {test.description && <p className="text-sm text-white/60">{test.description}</p>}
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <ListChecks className="h-5 w-5 text-blue mx-auto mb-2" />
                  <div className="text-xl font-bold text-gray-900">{questionCount}</div>
                  <div className="text-xs text-gray-500">вопросов</div>
                </div>
                {hasTimeLimit && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Clock className="h-5 w-5 text-blue mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{test.settings?.time_limit}</div>
                    <div className="text-xs text-gray-500">минут</div>
                  </div>
                )}
              </div>

              {test.settings?.shuffle_questions && (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-light/50 rounded-lg px-4 py-2.5">
                  <RotateCcw className="h-4 w-4 text-blue" />
                  Вопросы будут перемешаны
                </div>
              )}

              {/* Anti-fraud info */}
              {test.settings?.anti_fraud_settings && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <Shield className="h-4 w-4" />
                    Защита от списывания активна
                  </div>
                  <div className="text-xs text-red-600 space-y-1">
                    <p>• Максимум потерь фокуса: {test.settings.anti_fraud_settings.max_focus_loss || 3}</p>
                    <p>• Мин. время на ответ: {test.settings.anti_fraud_settings.min_answer_time || 2} сек</p>
                    {test.settings.anti_fraud_settings.block_copy && <p>• Копирование заблокировано</p>}
                    {test.settings.anti_fraud_settings.block_right_click && <p>• Правый клик заблокирован</p>}
                    {test.settings.anti_fraud_settings.detect_devtools && <p>• Детект DevTools</p>}
                    {test.settings.anti_fraud_settings.auto_submit_on_violation && <p>• Автозавершение при нарушении</p>}
                  </div>
                </div>
              )}

              {antiFraud.warnings.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2.5">
                  <AlertTriangle className="h-4 w-4" />
                  Зафиксировано {antiFraud.focusLossCount} потерь фокуса
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => navigate('/student')} className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200">
                  Отмена
                </button>
                <button
                  onClick={() => setPhase('test')}
                  className="flex-1 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Начать тест
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== RESULTS ====================
  if (phase === 'results' && result) {
    const totalPossible = result.total_possible || 1
    const isPass = result.percentage >= 50

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`p-8 text-center ${isPass ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                {isPass ? <Trophy className="h-10 w-10 text-white" /> : <AlertCircle className="h-10 w-10 text-white" />}
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {isPass ? 'Тест пройден!' : 'Тест не пройден'}
              </h2>
              <p className="text-sm text-white/70">{test?.title}</p>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold mb-2 ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm text-gray-500">Оценка:</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold text-white ${
                      result.final_grade === '5' ? 'bg-emerald-500' :
                      result.final_grade === '4' ? 'bg-blue' :
                      result.final_grade === '3' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  >
                    {result.final_grade}
                  </motion.span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.raw_score}/{totalPossible}</div>
                  <div className="text-xs text-gray-500">Баллы</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.focus_loss_count || 0}</div>
                  <div className="text-xs text-gray-500">Потерь фокуса</div>
                </div>
              </div>

              <div className="space-y-2">
                {test?.settings?.show_correct_answers && (
                  <Link to={`/student/review/${testId}`} className="block">
                    <button className="w-full py-3 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 border border-emerald-200">
                      <Eye className="h-4 w-4" />
                      Посмотреть ответы
                    </button>
                  </Link>
                )}
                <Link to="/student" className="block">
                  <button className="w-full py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all flex items-center justify-center gap-2">
                    <Home className="h-4 w-4" />
                    Вернуться к тестам
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ==================== TEST ====================
  if (phase !== 'test' || !test) return null

  const question = questions[currentQ]
  const totalQuestions = questions.filter(q => q.type !== 'info_block').length
  const answeredCount = questions.filter(q => q.type !== 'info_block' && answers[q.id] != null && (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id] !== '')).length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  const isLast = currentQ === questions.length - 1
  const isFirst = currentQ === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-app">
          <div className="flex items-center justify-between h-14">
            {/* Title */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">{test.title}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {currentQ + 1} / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Anti-fraud shield */}
              {test.settings?.anti_fraud_settings && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg text-xs text-red-600">
                  <Shield className="h-3 w-3" />
                  <span className="font-medium">Защита</span>
                </div>
              )}

              {/* Focus loss warning */}
              {antiFraud.focusLossCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg text-xs text-amber-700"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {antiFraud.focusLossCount}/{test.settings?.anti_fraud_settings?.max_focus_loss || 3}
                </motion.div>
              )}

              {/* Timer */}
              {maxTime > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold ${
                  timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>
              )}

              {/* Progress */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span>Отвечено: {answeredCount}/{totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full bg-blue"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 container-app py-6 md:py-10">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Question Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                {/* Question Type Badge + Number */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {currentQ + 1}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                    question.type === 'choice' ? 'bg-blue-light text-blue' :
                    question.type === 'multi' ? 'bg-purple-50 text-purple-600' :
                    question.type === 'text' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {question.type === 'choice' ? 'Один ответ' :
                     question.type === 'multi' ? 'Несколько' :
                     question.type === 'text' ? 'Текст' : 'Информация'}
                  </span>
                  {question.type !== 'info_block' && (
                    <span className="text-xs text-gray-400 ml-auto">{question.points} балл{question.points > 1 ? 'а' : ''}</span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-lg md:text-xl font-semibold text-gray-900 mb-6 leading-snug">
                  {question.content || '(без текста)'}
                </p>

                {/* Hint */}
                {question.hint && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      {showHint ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                    </button>
                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            {question.hint}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Answer Area */}
                <div className="space-y-3">
                  {/* Choice */}
                  {question.type === 'choice' && question.options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => updateAnswer(question.id, idx.toString())}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        answers[question.id] === idx.toString()
                          ? 'border-blue bg-blue-light shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        answers[question.id] === idx.toString()
                          ? 'border-blue bg-blue'
                          : 'border-gray-300'
                      }`}>
                        {answers[question.id] === idx.toString() && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className={`text-sm ${answers[question.id] === idx.toString() ? 'font-semibold text-blue' : 'text-gray-700'}`}>
                        {opt || `(вариант ${idx + 1})`}
                      </span>
                    </motion.button>
                  ))}

                  {/* Multi */}
                  {question.type === 'multi' && question.options.map((opt, idx) => {
                    const selected = (answers[question.id] || []).includes(idx.toString())
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          const current = answers[question.id] || []
                          const next = current.includes(idx.toString())
                            ? current.filter((a: string) => a !== idx.toString())
                            : [...current, idx.toString()]
                          updateAnswer(question.id, next)
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selected ? 'border-blue bg-blue-light shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-blue bg-blue' : 'border-gray-300'
                        }`}>
                          {selected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className={`text-sm ${selected ? 'font-semibold text-blue' : 'text-gray-700'}`}>
                          {opt || `(вариант ${idx + 1})`}
                        </span>
                      </motion.button>
                    )
                  })}

                  {/* Text */}
                  {question.type === 'text' && (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      placeholder="Введите ваш ответ..."
                      rows={4}
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue resize-none transition-all"
                    />
                  )}

                  {/* Info Block */}
                  {question.type === 'info_block' && (
                    <div className="p-4 bg-blue-light border border-blue/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {question.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setCurrentQ(p => p - 1); setShowHint(false) }}
                  disabled={isFirst}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Назад</span>
                </button>

                {/* Question dots */}
                <div className="flex items-center gap-1 order-first sm:order-none">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentQ(i); setShowHint(false) }}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        i === currentQ ? 'bg-blue scale-125' :
                        (questions[i].type === 'info_block' || answers[questions[i].id] != null) ? 'bg-emerald-400' :
                        'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {isLast ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
                  >
                    {submitting ? 'Отправка...' : 'Завершить'}
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => { setCurrentQ(p => p + 1); setShowHint(false) }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-xl hover:bg-blue-deep transition-all shadow-sm w-full sm:w-auto justify-center"
                  >
                    Далее
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default TestTaking
