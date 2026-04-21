import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface ScoreHistogramProps {
  results: Array<{ percentage: number }>
}

export function ScoreHistogram({ results }: ScoreHistogramProps) {
  // Создаём диапазоны: 0-9, 10-19, ..., 90-100
  const ranges = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    label: `${i * 10}-${i * 10 + 9}`,
    min: i * 10,
    max: i * 10 + 9,
    count: 0,
  }))

  // Последний диапазон — 90-100 (включая 100)
  ranges[9].range = '90-100'
  ranges[9].label = '90-100'
  ranges[9].max = 100

  // Подсчёт результатов в каждом диапазоне
  results.forEach(r => {
    const index = Math.min(Math.floor(r.percentage / 10), 9)
    ranges[index].count++
  })

  // Цвета для разных диапазонов
  const getBarColor = (min: number) => {
    if (min >= 90) return '#10b981' // emerald
    if (min >= 75) return '#1f50e8' // blue
    if (min >= 50) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const data = ranges.filter(r => r.count > 0 || r.min % 25 === 0) // Показываем ключевые диапазоны

  if (results.length === 0) {
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
              tick={{ fontSize: 10, fill: '#6b7280' }}
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
                      <p className="text-sm font-semibold text-gray-900">Диапазон: {data.range}%</p>
                      <p className="text-xs text-gray-500">
                        {data.count} {data.count === 1 ? 'ученик' : data.count < 5 ? 'ученика' : 'учеников'}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={800}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.min)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>0-49% (Неуд.)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>50-74% (Удовл.)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue" />
          <span>75-89% (Хорошо)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>90-100% (Отлично)</span>
        </div>
      </div>
    </div>
  )
}
