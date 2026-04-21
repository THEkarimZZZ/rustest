import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Users, CheckCircle2, Clock, TrendingUp, Download,
  BarChart3, PieChart, Shield, Eye
} from 'lucide-react'
import { exportToExcel } from '@/lib/export'
import {
  GradeDistributionChart,
  ScoreHistogram,
  QualityIndicator,
  FraudAnalysis,
} from '@/components/analytics'

interface Result {
  id: string
  student_id: string
  raw_score: number
  total_possible: number
  percentage: number
  final_grade: string | null
  finished_at: string
  focus_loss_count: number
  student_name: string
}

interface TestInfo {
  id: string
  title: string
  is_published: boolean
}

function TestResults() {
  const { testId } = useParams()
  const [test, setTest] = useState<TestInfo | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table')

  useEffect(() => {
    fetchData()
  }, [testId])

  async function fetchData() {
    if (!testId) return
    setLoading(true)

    try {
      const [{ data: testData }, { data: resultsData }] = await Promise.all([
        supabase.from('tests').select('id, title, is_published').eq('id', testId).single(),
        supabase
          .from('results')
          .select('id, student_id, raw_score, total_possible, percentage, final_grade, finished_at, focus_loss_count')
          .eq('test_id', testId)
          .order('percentage', { ascending: false }),
      ])

      setTest(testData)

      // Enrich with student names
      if (resultsData) {
        const studentIds = [...new Set(resultsData.map((r) => r.student_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds)

        const enriched = resultsData.map((r) => ({
          ...r,
          student_name: profiles?.find((p) => p.id === r.student_id)?.full_name || 'Неизвестный',
        }))
        setResults(enriched)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0

  const passRate = results.length > 0
    ? Math.round((results.filter((r) => r.percentage >= 50).length / results.length) * 100)
    : 0

  const handleExport = () => {
    const data = results.map((r, i) => ({
      '№': i + 1,
      'Ученик': r.student_name,
      'Баллы': `${r.raw_score} / ${r.total_possible}`,
      'Процент': `${r.percentage}%`,
      'Оценка': r.final_grade || '—',
      'Дата': r.finished_at ? new Date(r.finished_at).toLocaleDateString('ru-RU') : '—',
      'Потери фокуса': r.focus_loss_count || 0,
    }))
    const filename = `${test?.title || 'тест'}_результаты`
    exportToExcel(data, filename)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-app flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/teacher" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{test?.title || 'Результаты'}</h1>
              <p className="text-xs text-gray-400">{results.length} результатов</p>
            </div>
          </div>
          {results.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт в Excel</span>
            </button>
          )}
        </div>
      </div>

      <div className="container-app py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: 'Всего', value: results.length, color: 'text-gray-900' },
            { icon: TrendingUp, label: 'Средний %', value: `${avgScore}%`, color: 'text-blue' },
            { icon: CheckCircle2, label: 'Сдали', value: `${passRate}%`, color: 'text-emerald-600' },
            { icon: Clock, label: 'Не сдали', value: `${100 - passRate}%`, color: 'text-red-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'table'
                ? 'bg-blue text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Eye className="h-4 w-4" />
            Таблица
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-blue text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Аналитика
          </button>
        </div>

        {/* Content */}
        {activeTab === 'table' ? (
          <ResultsTable results={results} />
        ) : (
          <AnalyticsDashboard results={results} />
        )}
      </div>
    </div>
  )
}

/* ============================================
   Results Table Component
   ============================================ */
function ResultsTable({ results }: { results: Result[] }) {
  if (results.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет результатов</h3>
          <p className="text-sm text-gray-400">Пока никто не прошёл этот тест</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ученик</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Баллы</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Оценка</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <motion.tr
                key={result.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{result.student_name}</td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {result.raw_score}/{result.total_possible}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${
                    result.percentage >= 90 ? 'text-emerald-600' :
                    result.percentage >= 75 ? 'text-blue' :
                    result.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {result.percentage}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                    result.final_grade === '5' ? 'bg-emerald-100 text-emerald-700' :
                    result.final_grade === '4' ? 'bg-blue-100 text-blue-700' :
                    result.final_grade === '3' ? 'bg-amber-100 text-amber-700' :
                    result.final_grade === '2' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {result.final_grade || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">
                  {result.finished_at ? new Date(result.finished_at).toLocaleDateString('ru-RU') : '—'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ============================================
   Analytics Dashboard Component
   ============================================ */
function AnalyticsDashboard({ results }: { results: Result[] }) {
  if (results.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет данных для аналитики</h3>
          <p className="text-sm text-gray-400">Результаты появятся после прохождения теста учениками</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Grade Distribution + Quality Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard
          icon={BarChart3}
          title="Распределение оценок"
          description="Количество учеников по итоговым оценкам"
          iconColor="text-blue"
          iconBg="bg-blue-light"
        >
          <GradeDistributionChart results={results} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={PieChart}
          title="Качество знаний"
          description="Процент сдавших и основные метрики"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        >
          <QualityIndicator results={results} />
        </AnalyticsCard>
      </div>

      {/* Row 2: Score Histogram */}
      <AnalyticsCard
        icon={TrendingUp}
        title="Распределение баллов"
        description="Гистограмма процентов результатов"
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
      >
        <ScoreHistogram results={results} />
      </AnalyticsCard>

      {/* Row 3: Fraud Analysis */}
      <AnalyticsCard
        icon={Shield}
        title="Анализ нарушений"
        description="Потери фокуса и подозрительные действия"
        iconColor="text-red-500"
        iconBg="bg-red-50"
      >
        <FraudAnalysis results={results} />
      </AnalyticsCard>
    </div>
  )
}

/* ============================================
   Analytics Card Wrapper
   ============================================ */
function AnalyticsCard({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
  children,
}: {
  icon: any
  title: string
  description: string
  iconColor: string
  iconBg: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-gray-100 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Content */}
      {children}
    </motion.div>
  )
}

export default TestResults
