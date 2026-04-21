import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface GradeDistributionChartProps {
  results: Array<{ final_grade: string | null }>
}

const GRADE_COLORS: Record<string, string> = {
  '5': '#10b981', // emerald-500
  '4': '#1f50e8', // blue
  '3': '#f59e0b', // amber-500
  '2': '#ef4444', // red-500
}

export function GradeDistributionChart({ results }: GradeDistributionChartProps) {
  // Подсчёт распределения оценок
  const gradeCounts: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0 }
  results.forEach(r => {
    const grade = r.final_grade || '2'
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1
  })

  const data = [
    { grade: '5', label: 'Отлично (5)', count: gradeCounts['5'], color: GRADE_COLORS['5'] },
    { grade: '4', label: 'Хорошо (4)', count: gradeCounts['4'], color: GRADE_COLORS['4'] },
    { grade: '3', label: 'Удовл. (3)', count: gradeCounts['3'], color: GRADE_COLORS['3'] },
    { grade: '2', label: 'Неуд. (2)', count: gradeCounts['2'], color: GRADE_COLORS['2'] },
  ]

  const totalCount = results.length

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Нет данных для отображения
      </div>
    )
  }

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  const percentage = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0
                  return (
                    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">{data.label}</p>
                      <p className="text-xs text-gray-500">
                        {data.count} {data.count === 1 ? 'ученик' : data.count < 5 ? 'ученика' : 'учеников'} ({percentage}%)
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={800}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {data.map(item => (
          <div
            key={item.grade}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${item.color}10` }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-sm font-bold text-gray-900">{item.count}</div>
              <div className="text-[10px] text-gray-500 truncate">{item.label.split(' ')[0]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
