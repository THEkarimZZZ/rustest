import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface QualityIndicatorProps {
  results: Array<{ percentage: number }>
}

export function QualityIndicator({ results }: QualityIndicatorProps) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Нет данных для отображения
      </div>
    )
  }

  const total = results.length
  const passed = results.filter(r => r.percentage >= 50).length
  const failed = total - passed

  // Качество знаний (% сдавших)
  const qualityPercent = Math.round((passed / total) * 100)

  // Средний балл
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / total)

  // Успеваемость (% 3, 4, 5)
  const grades345 = results.filter(r => r.percentage >= 50).length
  const successRate = Math.round((grades345 / total) * 100)

  // Отличники (% 5)
  const excellent = results.filter(r => r.percentage >= 90).length
  const excellentRate = Math.round((excellent / total) * 100)

  const data = [
    { name: 'Сдали', value: passed, color: '#10b981' },
    { name: 'Не сдали', value: failed, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload
                  const percent = Math.round((data.value / total) * 100)
                  return (
                    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">{data.name}</p>
                      <p className="text-xs text-gray-500">{data.value} учеников ({percent}%)</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600">{qualityPercent}%</div>
          <div className="text-xs text-emerald-700 mt-1">Качество знаний</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue">{avgScore}%</div>
          <div className="text-xs text-blue mt-1">Средний балл</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
          <div className="text-xs text-purple-700 mt-1">Успеваемость</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-600">{excellentRate}%</div>
          <div className="text-xs text-amber-700 mt-1">Отличники</div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
        <p className="font-semibold text-gray-700">Метрики:</p>
        <p>• <span className="font-medium">Качество знаний</span> — % учеников, набравших ≥50%</p>
        <p>• <span className="font-medium">Средний балл</span> — средний % всех результатов</p>
        <p>• <span className="font-medium">Успеваемость</span> — % получивших оценку 3, 4 или 5</p>
        <p>• <span className="font-medium">Отличники</span> — % получивших оценку 5 (≥90%)</p>
      </div>
    </div>
  )
}
