import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, Check, X, AlertCircle, ListChecks, Type, Info } from 'lucide-react'

interface Question {
  id: string
  type: string
  content: string
  options: string[]
  correct_answer: any
  points: number
}

function TestReview() {
  const { testId } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!testId || !profile) return
    fetchData()
  }, [testId, profile?.id])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const { data: testData } = await supabase.from('tests').select('*').eq('id', testId).single()
      if (!testData) throw new Error('Тест не найден')
      setTest(testData)

      if (!testData.settings?.show_correct_answers) {
        setError('Преподаватель не включил просмотр ответов для этого теста')
        setLoading(false)
        return
      }

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_index', { ascending: true })
      setQuestions(questionsData || [])

      const { data: resultData } = await supabase
        .from('results')
        .select('*')
        .eq('test_id', testId)
        .eq('student_id', profile!.id)
        .single()
      setResult(resultData)
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const getStudentAnswer = (question: Question) => {
    const answers = result?.answers || {}
    const answer = answers[question.id]
    if (answer == null || answer === '') return null
    return answer
  }

  const isCorrect = (question: Question) => {
    const answer = getStudentAnswer(question)
    if (answer == null) return null
    if (question.type === 'info_block') return true
    if (question.type === 'choice') return answer === question.correct_answer
    if (question.type === 'multi') {
      const correct = new Set(question.correct_answer || [])
      const given = new Set(answer || [])
      return correct.size === given.size && [...correct].every((c: any) => given.has(c))
    }
    if (question.type === 'text' && question.correct_answer) {
      return String(answer).toLowerCase().trim() === String(question.correct_answer).toLowerCase().trim()
    }
    return null
  }

  const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          <Link to="/student" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Назад к тестам
          </Link>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Просмотр ответов недоступен</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link to="/student"><button className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">На главную</button></Link>
          </div>
        </div>
      </div>
    )
  }

  const totalPossible = questions.reduce((s, q) => s + (q.type !== 'info_block' ? q.points : 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-app flex items-center gap-3 h-14">
          <Link to="/student" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{test?.title}</h1>
            <p className="text-xs text-gray-400">Просмотр ответов</p>
          </div>
        </div>
      </div>

      <div className="container-app py-6">
        {/* Score summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${
              result.percentage >= 90 ? 'bg-emerald-500' :
              result.percentage >= 75 ? 'bg-blue' :
              result.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {result.final_grade || '?'}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{result.percentage}%</div>
              <div className="text-sm text-gray-500">{result.raw_score} из {totalPossible} баллов</div>
            </div>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => {
            const studentAnswer = getStudentAnswer(q)
            const correct = isCorrect(q)

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden"
              >
                {/* Question Header */}
                <div className={`px-5 py-3 border-b flex items-center gap-3 ${
                  q.type === 'info_block' ? 'bg-blue-light/50 border-blue/10' :
                  correct === true ? 'bg-emerald-50 border-emerald-100' :
                  correct === false ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    q.type === 'info_block' ? 'bg-blue' :
                    correct === true ? 'bg-emerald-500' :
                    correct === false ? 'bg-red-500' : 'bg-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  {q.type === 'choice' ? <ListChecks className="h-4 w-4 text-gray-400 flex-shrink-0" /> :
                   q.type === 'multi' ? <ListChecks className="h-4 w-4 text-gray-400 flex-shrink-0" /> :
                   q.type === 'text' ? <Type className="h-4 w-4 text-gray-400 flex-shrink-0" /> :
                   <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">{q.content || '(без текста)'}</span>
                  {q.type !== 'info_block' && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{q.points} балл{q.points > 1 ? 'а' : ''}</span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {/* Choice/Multi options */}
                  {(q.type === 'choice' || q.type === 'multi') && q.options.map((opt, idx) => {
                    const isSelected = q.type === 'multi'
                      ? (studentAnswer || []).includes(idx.toString())
                      : studentAnswer === idx.toString()
                    const isCorrectOption = q.type === 'multi'
                      ? (q.correct_answer || []).includes(idx.toString())
                      : q.correct_answer === idx.toString()

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                          isCorrectOption
                            ? 'border-emerald-300 bg-emerald-50'
                            : isSelected && !isCorrectOption
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-100'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isCorrectOption
                            ? 'border-emerald-500 bg-emerald-500'
                            : isSelected && !isCorrectOption
                            ? 'border-red-400 bg-red-400'
                            : 'border-gray-300'
                        }`}>
                          {(isCorrectOption || (isSelected && !isCorrectOption)) && (
                            isCorrectOption
                              ? <Check className="h-3.5 w-3.5 text-white" />
                              : <X className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400">{getOptionLabel(idx)}</span>
                            <span className={`text-sm ${isCorrectOption ? 'text-emerald-800 font-medium' : isSelected && !isCorrectOption ? 'text-red-700' : 'text-gray-700'}`}>
                              {opt || `(вариант ${idx + 1})`}
                            </span>
                          </div>
                          {isCorrectOption && (
                            <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 block">✓ Правильный ответ</span>
                          )}
                          {isSelected && !isCorrectOption && (
                            <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">✗ Ваш ответ</span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Text answer */}
                  {q.type === 'text' && (
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ваш ответ</span>
                        <div className={`mt-1 p-3 rounded-lg border ${
                          correct === true ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <p className={`text-sm ${correct === true ? 'text-emerald-800' : 'text-red-700'}`}>
                            {studentAnswer || '(не отвечено)'}
                          </p>
                        </div>
                      </div>
                      {q.correct_answer && (
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Правильный ответ</span>
                          <div className="mt-1 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                            <p className="text-sm text-emerald-800">{q.correct_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info block */}
                  {q.type === 'info_block' && (
                    <div className="p-4 bg-blue-light/50 border border-blue/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{q.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TestReview
