import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft, Plus, Trash2, Eye, Save,
  Check, X, Type, ListChecks, ListTodo, Info,
  Settings, ChevronDown, ChevronUp, Copy, AlertCircle,
  Sparkles, Clock, Shuffle, BookOpen, GraduationCap, Target,
  Share2, Users, Shield
} from 'lucide-react'

/* ============================================
   Types
   ============================================ */
type QuestionType = 'choice' | 'multi' | 'text' | 'info_block'

interface Question {
  id: string
  type: QuestionType
  content: string
  options: string[]
  correct_answer: string | string[] | null
  points: number
  order_index: number
  hint?: string
}

interface GradingScale {
  '5': number
  '4': number
  '3': number
  '2': number
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

/* ============================================
   Question Type Config
   ============================================ */
const QUESTION_TYPES: { type: QuestionType; label: string; icon: any; desc: string }[] = [
  { type: 'choice', label: 'Один ответ', icon: ListChecks, desc: 'Выбор одного правильного варианта' },
  { type: 'multi', label: 'Несколько ответов', icon: ListTodo, desc: 'Выбор нескольких правильных вариантов' },
  { type: 'text', label: 'Текстовый ответ', icon: Type, desc: 'Свободный текстовый ответ' },
  { type: 'info_block', label: 'Информационный блок', icon: Info, desc: 'Текст или подсказка без оценки' },
]

/* ============================================
   Helpers
   ============================================ */
function generateId() {
  return crypto.randomUUID()
}

function createQuestion(type: QuestionType, order: number): Question {
  return {
    id: generateId(),
    type,
    content: '',
    options: type === 'choice' || type === 'multi' ? ['', '', ''] : [],
    correct_answer: null,
    points: type === 'info_block' ? 0 : 1,
    order_index: order,
    hint: '',
  }
}

/* ============================================
   Question Type Selector Modal
   ============================================ */
function QuestionTypeSelector({ onSelect, onClose }: { onSelect: (type: QuestionType) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">Добавить вопрос</h3>
        <p className="text-sm text-gray-500 mb-5">Выберите тип вопроса</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUESTION_TYPES.map((qt) => (
            <button
              key={qt.type}
              onClick={() => onSelect(qt.type)}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue hover:bg-blue-light/50 transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue group-hover:text-white text-gray-500 transition-all duration-200 flex-shrink-0">
                <qt.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue transition-colors">{qt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{qt.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          Отмена
        </button>
      </motion.div>
    </div>
  )
}

/* ============================================
   Question Editor
   ============================================ */
function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMove,
  onDuplicate,
}: {
  question: Question
  index: number
  total: number
  onChange: (q: Question) => void
  onDelete: () => void
  onMove: (dir: 'up' | 'down') => void
  onDuplicate: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type)!

  const updateField = (field: keyof Question, value: any) => {
    onChange({ ...question, [field]: value })
  }

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...question.options]
    newOptions[idx] = value
    updateField('options', newOptions)
  }

  const addOption = () => {
    updateField('options', [...question.options, ''])
  }

  const removeOption = (idx: number) => {
    if (question.options.length <= 2) return
    const newOptions = question.options.filter((_, i) => i !== idx)
    updateField('options', newOptions)
    if (Array.isArray(question.correct_answer)) {
      updateField('correct_answer', question.correct_answer.filter((a: any) => a !== idx.toString()))
    } else if (question.correct_answer === idx.toString()) {
      updateField('correct_answer', null)
    }
  }

  const toggleCorrect = (idx: number) => {
    if (question.type === 'choice') {
      updateField('correct_answer', idx.toString())
    } else if (question.type === 'multi') {
      const current = question.correct_answer as string[] | null
      const arr = current || []
      const idxStr = idx.toString()
      updateField('correct_answer', arr.includes(idxStr) ? arr.filter((a: string) => a !== idxStr) : [...arr, idxStr])
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      {/* Question Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 bg-blue rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <typeConfig.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">{typeConfig.label}</span>
          </div>
          {question.type !== 'info_block' && (
            <span className="text-xs text-gray-400 flex-shrink-0">• {question.points} {question.points === 1 ? 'балл' : question.points < 5 ? 'балла' : 'баллов'}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onMove('up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={onDuplicate} className="p-1.5 text-gray-400 hover:text-blue transition-colors" title="Дублировать">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Текст вопроса</label>
                <textarea
                  value={question.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="Введите текст вопроса..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue resize-none transition-all"
                />
              </div>

              {/* Options (for choice/multi) */}
              {(question.type === 'choice' || question.type === 'multi') && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Варианты ответов{' '}
                    <span className="text-gray-400 font-normal">
                      ({question.type === 'choice' ? 'отметьте правильный' : 'отметьте правильные'})
                    </span>
                  </label>
                  <div className="space-y-2">
                    {question.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCorrect(idx)}
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            question.type === 'choice'
                              ? `rounded-full border-2 ${
                                  question.correct_answer === idx.toString()
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-emerald-400'
                                }`
                              : `rounded border-2 ${
                                  (question.correct_answer as string[])?.includes(idx.toString())
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-emerald-400'
                                }`
                          }`}
                        >
                          {((question.type === 'choice' && question.correct_answer === idx.toString()) ||
                            (question.type === 'multi' && (question.correct_answer as string[])?.includes(idx.toString()))) && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          placeholder={`Вариант ${idx + 1}`}
                          className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
                        />
                        {question.options.length > 2 && (
                          <button onClick={() => removeOption(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addOption}
                    className="mt-2 flex items-center gap-1.5 text-xs text-blue hover:text-blue-deep font-medium transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить вариант
                  </button>
                </div>
              )}

              {/* Text answer note */}
              {question.type === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Правильный ответ (необязательно)
                  </label>
                  <input
                    value={(question.correct_answer as string) || ''}
                    onChange={(e) => updateField('correct_answer', e.target.value || null)}
                    placeholder="Эталонный ответ для автопроверки"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Если не заполнено, проверка будет ручной</p>
                </div>
              )}

              {/* Info block note */}
              {question.type === 'info_block' && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Информационный блок</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Этот блок не оценивается. Используйте его для подсказок, теории или инструкций.
                    </p>
                  </div>
                </div>
              )}

              {/* Points */}
              {question.type !== 'info_block' && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-500">Баллы:</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 5].map((p) => (
                      <button
                        key={p}
                        onClick={() => updateField('points', p)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          question.points === p
                            ? 'bg-blue text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Подсказка (необязательно)</label>
                <textarea
                  value={question.hint || ''}
                  onChange={(e) => updateField('hint', e.target.value)}
                  placeholder="Подсказка для ученика..."
                  rows={1}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================
   Grading Scale Editor
   ============================================ */
function GradingScaleEditor({ scale, onChange }: { scale: GradingScale; onChange: (s: GradingScale) => void }) {
  const grades = [
    { grade: '5', label: 'Отлично', color: 'bg-emerald-500', lightColor: 'bg-emerald-50' },
    { grade: '4', label: 'Хорошо', color: 'bg-blue-500', lightColor: 'bg-blue-50' },
    { grade: '3', label: 'Удовл.', color: 'bg-amber-500', lightColor: 'bg-amber-50' },
    { grade: '2', label: 'Неудовл.', color: 'bg-red-500', lightColor: 'bg-red-50' },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Минимальный процент для каждой оценки</p>
      {grades.map((g) => (
        <div key={g.grade} className={`flex items-center gap-3 p-3 rounded-lg ${g.lightColor}`}>
          <div className={`w-8 h-8 ${g.color} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {g.grade}
          </div>
          <span className="text-xs text-gray-600 flex-1">{g.label}</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={scale[g.grade as keyof GradingScale]}
              onChange={(e) => onChange({ ...scale, [g.grade]: Math.min(100, Math.max(0, Number(e.target.value))) })}
              className="w-16 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
              min={0}
              max={100}
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================================
   Test Settings Panel
   ============================================ */
function TestSettingsPanel({ settings, onChange }: { settings: TestSettings; onChange: (s: TestSettings) => void }) {
  return (
    <div className="space-y-4">
      {/* Time limit */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Лимит времени
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={settings.time_limit || ''}
            onChange={(e) => onChange({ ...settings, time_limit: e.target.value ? Number(e.target.value) : null })}
            placeholder="Без лимита"
            className="w-24 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
            min={1}
          />
          <span className="text-xs text-gray-500">минут</span>
        </div>
      </div>

      {/* Shuffle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={settings.shuffle_questions}
            onChange={(e) => onChange({ ...settings, shuffle_questions: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
        </div>
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">Перемешивать вопросы</span>
        </div>
      </label>

      {/* Show results */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={settings.show_results_immediately}
            onChange={(e) => onChange({ ...settings, show_results_immediately: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
        </div>
        <span className="text-sm text-gray-700">Показывать результат сразу</span>
      </label>

      {/* Show correct answers */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={settings.show_correct_answers}
            onChange={(e) => onChange({ ...settings, show_correct_answers: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
        </div>
        <span className="text-sm text-gray-700">Показывать правильные ответы</span>
      </label>

      {/* Max attempts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Максимум попыток
        </label>
        <select
          value={settings.max_attempts || 0}
          onChange={(e) => onChange({ ...settings, max_attempts: Number(e.target.value) || null })}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
        >
          <option value={0}>Без ограничений</option>
          <option value={1}>1 попытка</option>
          <option value={2}>2 попытки</option>
          <option value={3}>3 попытки</option>
          <option value={5}>5 попыток</option>
        </select>
      </div>

      {/* Anti-Fraud Settings */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-red-500" />
          <h4 className="text-sm font-semibold text-gray-700">Защита от списывания</h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.anti_fraud_settings?.block_copy || false}
                  onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, block_copy: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
              </div>
              <span className="text-sm text-gray-700">Блокировать копирование</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.anti_fraud_settings?.block_right_click || false}
                  onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, block_right_click: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
              </div>
              <span className="text-sm text-gray-700">Блокировать правый клик</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.anti_fraud_settings?.detect_devtools || false}
                  onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, detect_devtools: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
              </div>
              <span className="text-sm text-gray-700">Детект DevTools</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.anti_fraud_settings?.auto_submit_on_violation || false}
                  onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, auto_submit_on_violation: e.target.checked } as any })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue transition-colors duration-200" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200" />
              </div>
              <span className="text-sm text-gray-700">Автозавершение при нарушении</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Макс. потерь фокуса</label>
              <input
                type="number"
                value={settings.anti_fraud_settings?.max_focus_loss || 3}
                onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, max_focus_loss: Number(e.target.value) } as any })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Мин. время на ответ (сек)</label>
              <input
                type="number"
                value={settings.anti_fraud_settings?.min_answer_time || 2}
                onChange={(e) => onChange({ ...settings, anti_fraud_settings: { ...settings.anti_fraud_settings, min_answer_time: Number(e.target.value) } as any })}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
                min={0}
                max={30}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================
   Preview Mode
   ============================================ */
function TestPreview({ title, description, questions }: { title: string; description: string; questions: Question[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title || 'Без названия'}</h2>
        {description && <p className="text-gray-500">{description}</p>}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span>{questions.length} вопросов</span>
          <span>•</span>
          <span>{questions.reduce((sum, q) => sum + q.points, 0)} баллов</span>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => {
          const typeConfig = QUESTION_TYPES.find((t) => t.type === q.type)!
          return (
            <div key={q.id} className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-7 h-7 bg-blue rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.content || '(без текста)'}</p>
                  {q.type !== 'info_block' && <span className="text-xs text-gray-400">{q.points} балл{q.points > 1 ? 'а' : ''}</span>}
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-500">{typeConfig.label}</span>
              </div>

              {q.type === 'choice' && (
                <div className="space-y-2 ml-10">
                  {q.options.filter(Boolean).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'multi' && (
                <div className="space-y-2 ml-10">
                  {q.options.filter(Boolean).map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <div className="ml-10">
                  <div className="border-b-2 border-gray-200 py-2 text-gray-300 text-sm">Ответ ученика...</div>
                </div>
              )}

              {q.type === 'info_block' && q.hint && (
                <div className="ml-10 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{q.hint}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================
   MAIN: Test Constructor
   ============================================ */
function TestConstructor() {
  const navigate = useNavigate()
  const { testId } = useParams()
  const { profile } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [gradingScale, setGradingScale] = useState<GradingScale>({ '5': 90, '4': 75, '3': 50, '2': 0 })
  const [settings, setSettings] = useState<TestSettings>({ time_limit: null, shuffle_questions: false, show_results_immediately: true, show_correct_answers: false, max_attempts: null, anti_fraud_settings: { max_focus_loss: 3, min_answer_time: 2, block_copy: true, block_right_click: true, detect_devtools: true, auto_submit_on_violation: true } })
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Class assignments
  const [userClasses, setUserClasses] = useState<any[]>([])
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([])
  const [shareToken, setShareToken] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Load existing test + classes
  useEffect(() => {
    if (profile?.id) {
      fetchUserClasses()
      if (testId) fetchTest()
    }
  }, [profile?.id, testId])

  async function fetchUserClasses() {
    const { data } = await supabase.from('classes').select('id, name').eq('teacher_id', profile!.id).order('name')
    if (data) setUserClasses(data)
  }

  async function fetchTest() {
    const { data: test } = await supabase.from('tests').select('*').eq('id', testId).single()
    if (test) {
      setTitle(test.title || '')
      setDescription(test.description || '')
      setGradingScale(test.grading_scale || { '5': 90, '4': 75, '3': 50, '2': 0 })
      setSettings(test.settings || { time_limit: null, shuffle_questions: false, show_results_immediately: true, max_attempts: null })
      setShareToken(test.share_token || '')

      // Load assigned classes
      const { data: assignments } = await supabase.from('test_assignments').select('class_id').eq('test_id', testId)
      if (assignments) setAssignedClassIds(assignments.map((a: any) => a.class_id))

      // Load questions
      const { data: questionsData } = await supabase.from('questions').select('*').eq('test_id', testId).order('order_index')
      if (questionsData) setQuestions(questionsData)
    }
  }

  const addQuestion = useCallback((type: QuestionType) => {
    setQuestions((prev) => [...prev, createQuestion(type, prev.length)])
    setShowTypeSelector(false)
  }, [])

  const updateQuestion = useCallback((id: string, updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)))
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id)
      return filtered.map((q, i) => ({ ...q, order_index: i }))
    })
  }, [])

  const moveQuestion = useCallback((index: number, dir: 'up' | 'down') => {
    setQuestions((prev) => {
      const newArr = [...prev]
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= newArr.length) return prev
      ;[newArr[index], newArr[target]] = [newArr[target], newArr[index]]
      return newArr.map((q, i) => ({ ...q, order_index: i }))
    })
  }, [])

  const duplicateQuestion = useCallback((index: number) => {
    setQuestions((prev) => {
      const q = { ...prev[index], id: generateId(), order_index: prev.length }
      return [...prev.slice(0, index + 1), q, ...prev.slice(index + 1)].map((item, i) => ({ ...item, order_index: i }))
    })
  }, [])

  const totalPoints = questions.filter((q) => q.type !== 'info_block').reduce((sum, q) => sum + q.points, 0)

  const handleSave = async () => {
    if (!title.trim()) return
    if (!profile?.id) {
      setSaveError('Необходимо войти в систему')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      let testIdToUse = testId

      if (testId) {
        const { error } = await supabase
          .from('tests')
          .update({ title, description, grading_scale: gradingScale, settings, is_published: false })
          .eq('id', testId)
        if (error) throw new Error(`Ошибка обновления: ${error.message}`)

        // Update class assignments
        await supabase.from('test_assignments').delete().eq('test_id', testId)
        if (assignedClassIds.length > 0) {
          await supabase.from('test_assignments').insert(assignedClassIds.map(cid => ({ test_id: testId, class_id: cid })))
        }
      } else {
        // Generate share token
        const token = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 8)

        const { data: test, error: testError } = await supabase
          .from('tests')
          .insert({
            teacher_id: profile.id,
            title,
            description,
            grading_scale: gradingScale,
            settings,
            is_published: false,
            share_token: token,
          })
          .select('id')
          .single()

        if (testError) throw new Error(`Ошибка создания: ${testError.message}`)
        testIdToUse = test.id
        setShareToken(token)

        // Insert questions
        if (questions.length > 0) {
          await supabase.from('questions').insert(
            questions.map((q) => ({
              test_id: testIdToUse,
              type: q.type,
              content: q.content || '',
              options: q.options,
              correct_answer: q.correct_answer,
              points: q.points,
              order_index: q.order_index,
            }))
          )
        }

        // Insert class assignments
        if (assignedClassIds.length > 0) {
          await supabase.from('test_assignments').insert(assignedClassIds.map(cid => ({ test_id: testIdToUse, class_id: cid })))
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setSaveError(err.message || 'Произошла ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const toggleClassAssignment = (classId: string) => {
    setAssignedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    )
  }

  const copyShareLink = async () => {
    if (!shareToken) return
    const link = `${window.location.origin}/student/join-test/${shareToken}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {}
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="container-app flex items-center justify-between h-14">
            <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Назад к редактированию
            </button>
            <span className="text-sm font-medium text-gray-500">Предпросмотр</span>
          </div>
        </div>
        <div className="container-app py-8">
          <TestPreview title={title} description={description} questions={questions} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-app flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/teacher')} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название теста..."
                className="text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent w-64 md:w-80"
              />
              {questions.length > 0 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {questions.length} вопросов • {totalPoints} баллов
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-sm text-red-500 hidden md:inline">{saveError}</span>
            )}
            <button
              onClick={() => setPreviewMode(true)}
              disabled={questions.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-blue hover:bg-blue-light/50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Предпросмотр</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue text-white hover:bg-blue-deep shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Сохранено
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container-app py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main: Questions */}
          <div className="flex-1 min-w-0">
            {/* Description */}
            <div className="mb-6">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание теста (необязательно)..."
                rows={2}
                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue resize-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={i}
                    total={questions.length}
                    onChange={(updated) => updateQuestion(q.id, updated)}
                    onDelete={() => deleteQuestion(q.id)}
                    onMove={(dir) => moveQuestion(i, dir)}
                    onDuplicate={() => duplicateQuestion(i)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add Question Button */}
            <button
              onClick={() => setShowTypeSelector(true)}
              className="mt-4 w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:text-blue hover:border-blue hover:bg-blue-light/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Добавить вопрос
            </button>

            {questions.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-1">Тест пока пуст</h3>
                <p className="text-sm text-gray-400 mb-6">Добавьте первый вопрос, чтобы начать</p>
                <button
                  onClick={() => setShowTypeSelector(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all duration-200 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Добавить вопрос
                </button>
              </div>
            )}
          </div>

          {/* Sidebar: Settings */}
          <div className="lg:w-80 space-y-6">
            {/* Grading Scale */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-blue" />
                <h3 className="text-sm font-bold text-gray-900">Шкала оценок</h3>
              </div>
              <GradingScaleEditor scale={gradingScale} onChange={setGradingScale} />
            </div>

            {/* Test Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue" />
                <h3 className="text-sm font-bold text-gray-900">Настройки</h3>
              </div>
              <TestSettingsPanel settings={settings} onChange={setSettings} />
            </div>

            {/* Class Assignments */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue" />
                <h3 className="text-sm font-bold text-gray-900">Классы</h3>
              </div>
              {userClasses.length === 0 ? (
                <p className="text-xs text-gray-400">Нет классов. <Link to="/teacher" className="text-blue hover:underline">Создайте класс</Link></p>
              ) : (
                <div className="space-y-2">
                  {userClasses.map(cls => (
                    <label key={cls.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={assignedClassIds.includes(cls.id)}
                          onChange={() => toggleClassAssignment(cls.id)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 bg-gray-200 rounded border border-gray-300 peer-checked:bg-blue peer-checked:border-blue transition-all duration-200 flex items-center justify-center">
                          {assignedClassIds.includes(cls.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{cls.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {assignedClassIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">Назначено на {assignedClassIds.length} {assignedClassIds.length === 1 ? 'класс' : assignedClassIds.length < 5 ? 'класса' : 'классов'}</p>
              )}
            </div>

            {/* Share Link */}
            {shareToken && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-5 w-5 text-blue" />
                  <h3 className="text-sm font-bold text-gray-900">Поделиться</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 truncate border border-gray-200">
                    {window.location.origin}/student/join-test/{shareToken}
                  </div>
                  <button
                    onClick={copyShareLink}
                    className={`p-2 rounded-lg transition-all ${copiedLink ? 'bg-emerald-100 text-emerald-600' : 'bg-blue text-white hover:bg-blue-deep'}`}
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Ссылка для прямого доступа к тесту</p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-blue" />
                <h3 className="text-sm font-bold text-gray-900">Итого</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Вопросов</span>
                  <span className="font-semibold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Баллов</span>
                  <span className="font-semibold text-gray-900">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Лимит времени</span>
                  <span className="font-semibold text-gray-900">{settings.time_limit ? `${settings.time_limit} мин` : 'Без лимита'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Type Selector Modal */}
      <AnimatePresence>
        {showTypeSelector && <QuestionTypeSelector onSelect={addQuestion} onClose={() => setShowTypeSelector(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default TestConstructor
