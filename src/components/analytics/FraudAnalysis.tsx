import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Shield, AlertTriangle } from 'lucide-react'

interface FraudAnalysisProps {
  results: Array<{
    student_name: string
    focus_loss_count: number
    violations?: any[]
  }>
}

export function FraudAnalysis({ results }: FraudAnalysisProps) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Нет данных для отображения
      </div>
    )
  }

  // Статистика нарушений
  const studentsWithViolations = results.filter(r => r.focus_loss_count > 0).length
  const totalViolations = results.reduce((sum, r) => sum + (r.focus_loss_count || 0), 0)

  // Максимальное количество нарушений у одного ученика
  const maxViolations = Math.max(...results.map(r => r.focus_loss_count || 0), 0)

  // Распределение по количеству нарушений
  const distribution = [
    { label: '0', count: results.filter(r => r.focus_loss_count === 0).length, color: '#10b981' },
    { label: '1-2', count: results.filter(r => r.focus_loss_count >= 1 && r.focus_loss_count <= 2).length, color: '#f59e0b' },
    { label: '3-5', count: results.filter(r => r.focus_loss_count >= 3 && r.focus_loss_count <= 5).length, color: '#f97316' },
    { label: '6+', count: results.filter(r => r.focus_loss_count >= 6).length, color: '#ef4444' },
  ]

  // Top нарушители
  const topViolators = [...results]
    .filter(r => r.focus_loss_count > 0)
    .sort((a, b) => (b.focus_loss_count || 0) - (a.focus_loss_count || 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-gray-500">Без нарушений</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {results.length - studentsWithViolations}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-gray-500">С нарушениями</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{studentsWithViolations}</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Всего потерь</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{totalViolations}</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Максимум</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{maxViolations}</div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Распределение нарушений</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">{data.label} потерь фокуса</p>
                        <p className="text-xs text-gray-500">{data.count} учеников</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={800}>
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Violators */}
      {topViolators.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Топ нарушителей</h4>
          <div className="space-y-2">
            {topViolators.map((r, i) => {
              const severity = r.focus_loss_count >= 6 ? 'high' : r.focus_loss_count >= 3 ? 'medium' : 'low'
              const bgColor = severity === 'high' ? 'bg-red-50 border-red-200' : severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              const textColor = severity === 'high' ? 'text-red-700' : severity === 'medium' ? 'text-amber-700' : 'text-gray-700'

              return (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${bgColor}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      severity === 'high' ? 'bg-red-200 text-red-800' : severity === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{r.student_name}</span>
                  </div>
                  <span className={`text-sm font-bold ${textColor}`}>
                    {r.focus_loss_count} потерь
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
