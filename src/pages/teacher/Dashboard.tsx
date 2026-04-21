import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  Plus, BookOpen, Users, BarChart3, Eye, Edit, Trash2,
  ClipboardList, CheckCircle2, AlertCircle, QrCode,
  Copy, Check, GraduationCap, UserMinus, Sparkles,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface Test {
  id: string
  title: string
  description: string | null
  is_published: boolean
  created_at: string
  _questions_count?: number
  _results_count?: number
}

interface ClassItem {
  id: string
  name: string
  invite_code: string
  created_at: string
  students_count: number
  tests_count: number
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ============================================
   MAIN DASHBOARD
   ============================================ */
function TeacherDashboard() {
  const { profile } = useAuth()
  const [tests, setTests] = useState<Test[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tests' | 'classes' | 'results'>('tests')

  useEffect(() => { fetchAll() }, [profile?.id])

  async function fetchAll() {
    if (!profile?.id) return
    setLoading(true)
    try { await Promise.all([fetchTests(), fetchClasses()]) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function fetchTests() {
    const { data, error } = await supabase.from('tests').select('*').eq('teacher_id', profile!.id).order('created_at', { ascending: false })
    if (error) throw error
    const withCounts = await Promise.all((data || []).map(async (t) => {
      const [{ count: qc }, { count: rc }] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('test_id', t.id),
        supabase.from('results').select('*', { count: 'exact', head: true }).eq('test_id', t.id),
      ])
      return { ...t, _questions_count: qc || 0, _results_count: rc || 0 }
    }))
    setTests(withCounts)
  }

  async function fetchClasses() {
    const { data, error } = await supabase.from('classes').select('*').eq('teacher_id', profile!.id).order('created_at', { ascending: false })
    if (error) throw error
    const withCounts = await Promise.all((data || []).map(async (c) => {
      const [{ count: sc }, { count: tc }] = await Promise.all([
        supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', c.id),
        supabase.from('tests').select('*', { count: 'exact', head: true }).eq('class_id', c.id),
      ])
      return { ...c, students_count: sc || 0, tests_count: tc || 0 }
    }))
    setClasses(withCounts)
  }

  async function deleteTest(id: string) {
    if (!confirm('Удалить тест?')) return
    await supabase.from('questions').delete().eq('test_id', id)
    await supabase.from('tests').delete().eq('id', id)
    setTests(p => p.filter(t => t.id !== id))
  }

  async function togglePublish(id: string, val: boolean) {
    await supabase.from('tests').update({ is_published: !val }).eq('id', id)
    setTests(p => p.map(t => t.id === id ? { ...t, is_published: !val } : t))
  }

  async function deleteClass(id: string) {
    if (!confirm('Удалить класс?')) return
    await supabase.from('class_members').delete().eq('class_id', id)
    await supabase.from('classes').delete().eq('id', id)
    setClasses(p => p.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Личный кабинет</h1>
            <p className="text-gray-500 mt-1">Добро пожаловать, {profile?.full_name?.split(' ')[0]}!</p>
          </div>
          <Link to="/teacher/test-constructor">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all shadow-sm hover:shadow-md">
              <Plus className="h-4 w-4" /> Создать тест
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Тестов', value: tests.length, color: 'text-blue', bg: 'bg-blue-light' },
            { icon: Users, label: 'Классов', value: classes.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: BarChart3, label: 'Результатов', value: tests.reduce((s, t) => s + (t._results_count || 0), 0), color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><div className="text-2xl font-bold text-gray-900">{s.value}</div><div className="text-sm text-gray-500">{s.label}</div></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          {[{ id: 'tests', label: 'Тесты', icon: BookOpen }, { id: 'classes', label: 'Классы', icon: Users }, { id: 'results', label: 'Результаты', icon: BarChart3 }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'bg-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'tests' && <TestsTab tests={tests} loading={loading} onDelete={deleteTest} onToggle={togglePublish} />}
        {activeTab === 'classes' && <ClassesTab classes={classes} loading={loading} onDelete={deleteClass} onRefresh={fetchClasses} teacherId={profile!.id} />}
        {activeTab === 'results' && <ResultsTab tests={tests} />}
      </div>
    </div>
  )
}

/* ============================================
   TESTS TAB
   ============================================ */
function TestsTab({ tests, loading, onDelete, onToggle }: any) {
  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" /></div>
  if (!tests.length) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
      <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет тестов</h3>
      <p className="text-sm text-gray-400 mb-6">Создайте первый тест</p>
      <Link to="/teacher/test-constructor"><button className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all"><Plus className="h-4 w-4" /> Создать тест</button></Link>
    </motion.div>
  )
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tests.map((t: any, i: number) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all group">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{t.title}</h3>
                {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
              </div>
              <div className={`ml-3 px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{t.is_published ? 'Опубликован' : 'Черновик'}</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{t._questions_count} вопр.</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t._results_count} рез.</span>
            </div>
            <div className="flex items-center gap-1 pt-3 border-t border-gray-50">
              <Link to={`/teacher/test-constructor/${t.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 hover:text-blue hover:bg-blue-light/50 rounded-lg transition-all"><Edit className="h-3.5 w-3.5" />Редактировать</Link>
              <Link to={`/teacher/results/${t.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 hover:text-blue hover:bg-blue-light/50 rounded-lg transition-all"><Eye className="h-3.5 w-3.5" />Результаты</Link>
              <button onClick={() => onToggle(t.id, t.is_published)} className={`px-3 py-2 text-xs rounded-lg transition-all ${t.is_published ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>{t.is_published ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</button>
              <button onClick={() => onDelete(t.id)} className="px-3 py-2 text-xs text-gray-400 hover:text-red-500 rounded-lg transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ============================================
   CLASSES TAB — FULLY INTEGRATED
   ============================================ */
function ClassesTab({ classes, loading, onDelete, onRefresh, teacherId }: { classes: ClassItem[]; loading: boolean; onDelete: (id: string) => void; onRefresh: () => void; teacherId: string }) {
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{classes.length} {classes.length === 1 ? 'класс' : classes.length < 5 ? 'класса' : 'классов'}</p>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all shadow-sm"><Plus className="h-4 w-4" /> Создать</button>
      </div>

      {classes.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет классов</h3>
          <p className="text-sm text-gray-400 mb-6">Создайте класс и пригласите учеников</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all"><Plus className="h-4 w-4" /> Создать класс</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c, i) => (
            <ClassCard key={c.id} cls={c} index={i} expanded={expandedId === c.id} onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} onDelete={() => onDelete(c.id)} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {showCreate && <CreateClassModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); onRefresh() }} teacherId={teacherId} />}
    </div>
  )
}

/* ============================================
   CLASS CARD
   ============================================ */
function ClassCard({ cls, index, expanded, onToggle, onDelete, onRefresh }: any) {
  const [copied, setCopied] = useState(false)
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(cls.invite_code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.08 }} whileHover={{ y: -3 }} className="group">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-blue/5 transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue transition-colors">{cls.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Создан {formatDate(cls.created_at)}</p>
            </div>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-500"><Users className="h-4 w-4 text-blue" />{cls.students_count} уч.</span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500"><BookOpen className="h-4 w-4 text-emerald-500" />{cls.tests_count} тестов</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center"><QrCode className="h-4 w-4 text-blue" /></div>
                <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Код</div><div className="text-sm font-mono font-bold text-gray-900 tracking-wider">{cls.invite_code}</div></div>
              </div>
              <button onClick={copyCode} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-blue text-white hover:bg-blue-deep'}`}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={onToggle} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-blue hover:bg-gray-50 border-t border-gray-50 transition-colors">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}Ученики
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="px-5 pb-4 border-t border-gray-50 pt-4"><StudentsList classId={cls.id} onRefresh={onRefresh} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ============================================
   STUDENTS LIST
   ============================================ */
function StudentsList({ classId, onRefresh }: { classId: string; onRefresh: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchStudents() }, [classId])
  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase.from('class_members').select('student_id, joined_at, profiles!class_members_student_id_fkey(full_name)').eq('class_id', classId).order('joined_at', { ascending: false })
    if (!error && data) setStudents(data.map((m: any) => ({ student_id: m.student_id, full_name: m.profiles?.full_name || 'Неизвестный', joined_at: m.joined_at })))
    setLoading(false)
  }
  async function removeStudent(sid: string) {
    if (!confirm('Удалить?')) return
    await supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', sid)
    setStudents(p => p.filter(s => s.student_id !== sid))
    onRefresh()
  }
  if (loading) return <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" /></div>
  if (!students.length) return <div className="text-center py-4"><p className="text-sm text-gray-400">Пока нет учеников</p></div>
  return (
    <div className="space-y-2">
      {students.map((s, i) => (
        <motion.div key={s.student_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center"><GraduationCap className="h-4 w-4 text-blue" /></div>
            <div><p className="text-sm font-medium text-gray-900">{s.full_name}</p><p className="text-xs text-gray-400">{formatDate(s.joined_at)}</p></div>
          </div>
          <button onClick={() => removeStudent(s.student_id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"><UserMinus className="h-4 w-4" /></button>
        </motion.div>
      ))}
    </div>
  )
}

/* ============================================
   CREATE CLASS MODAL
   ============================================ */
function CreateClassModal({ onClose, onSuccess, teacherId }: { onClose: () => void; onSuccess: () => void; teacherId: string }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const handleCreate = async () => {
    if (!name.trim()) { setError('Введите название'); return }
    setCreating(true); setError('')
    try {
      const { error: e } = await supabase.from('classes').insert({ name: name.trim(), teacher_id: teacherId, invite_code: generateInviteCode() })
      if (e) throw e
      onSuccess()
    } catch (err: any) { setError(err.message || 'Ошибка') }
    finally { setCreating(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Новый класс</h3>
        <p className="text-sm text-gray-500 mb-5">Придумайте название</p>
        <div className="space-y-4">
          <input value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Например: 9А — Математика" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue" onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Отмена</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <><Sparkles className="h-4 w-4 animate-spin" />Создание...</> : <><Plus className="h-4 w-4" />Создать</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ============================================
   RESULTS TAB
   ============================================ */
function ResultsTab({ tests }: { tests: Test[] }) {
  const withResults = tests.filter(t => (t._results_count || 0) > 0)
  if (!withResults.length) return (
    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
      <BarChart3 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет результатов</h3>
      <p className="text-sm text-gray-400">Откройте тест для просмотра результатов</p>
    </div>
  )
  return (
    <div className="space-y-3">
      {withResults.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0"><h3 className="text-base font-semibold text-gray-900 truncate">{t.title}</h3><p className="text-sm text-gray-500 mt-1">{t._results_count || 0} {(t._results_count || 0) === 1 ? 'результат' : (t._results_count || 0) < 5 ? 'результата' : 'результатов'}</p></div>
            <Link to={`/teacher/results/${t.id}`}><button className="flex items-center gap-1.5 px-4 py-2 bg-blue-light text-blue text-sm font-medium rounded-xl hover:bg-blue hover:text-white transition-all"><Eye className="h-4 w-4" /> Смотреть</button></Link>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default TeacherDashboard
