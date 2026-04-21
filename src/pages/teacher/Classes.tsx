import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  Plus, Trash2, Users, Copy, Check,
  UserMinus, QrCode, Sparkles, BookOpen,
  GraduationCap
} from 'lucide-react'

/* ============================================
   Types
   ============================================ */
interface ClassItem {
  id: string
  name: string
  teacher_id: string
  invite_code: string
  created_at: string
  students_count: number
  tests_count: number
}

interface StudentMember {
  student_id: string
  full_name: string
  joined_at: string
}

/* ============================================
   Helpers
   ============================================ */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ============================================
   Create Class Modal
   ============================================ */
function CreateClassModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { profile } = useAuth()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Введите название класса')
      return
    }
    setCreating(true)
    setError('')

    try {
      const inviteCode = generateInviteCode()

      const { error: insertError } = await supabase.from('classes').insert({
        name: name.trim(),
        teacher_id: profile?.id,
        invite_code: inviteCode,
      })

      if (insertError) throw insertError
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Ошибка создания класса')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">Новый класс</h3>
        <p className="text-sm text-gray-500 mb-5">Придумайте название и получите инвайт-код</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Название класса</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Например: 9А — Математика"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Создать
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ============================================
   MAIN: Classes Page (Teacher)
   ============================================ */
function TeacherClasses() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [profile?.id])

  async function fetchClasses() {
    if (!profile?.id) return
    setLoading(true)

    try {
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get student and test counts
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (cls) => {
          const [{ count: studentsCount }, { count: testsCount }] = await Promise.all([
            supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', cls.id),
            supabase.from('tests').select('*', { count: 'exact', head: true }).eq('class_id', cls.id),
          ])
          return {
            ...cls,
            students_count: studentsCount || 0,
            tests_count: testsCount || 0,
          }
        })
      )

      setClasses(classesWithCounts)
    } catch (err) {
      console.error('Fetch classes error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteClass(classId: string) {
    if (!confirm('Удалить класс? Все данные будут потеряны.')) return
    try {
      await supabase.from('class_members').delete().eq('class_id', classId)
      await supabase.from('classes').delete().eq('id', classId)
      setClasses((prev) => prev.filter((c) => c.id !== classId))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Мои классы
            </h1>
            <p className="text-gray-500 mt-1">
              Управляйте классами и приглашайте учеников
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Создать класс
          </button>
        </div>

        {/* Classes List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full"
            />
          </div>
        ) : classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-2xl p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-400 mb-1">Нет классов</h3>
            <p className="text-sm text-gray-400 mb-6">Создайте первый класс и пригласите учеников</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all"
            >
              <Plus className="h-4 w-4" />
              Создать класс
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls, i) => (
              <ClassCard
                key={cls.id}
                classItem={cls}
                index={i}
                onDelete={deleteClass}
                onRefresh={fetchClasses}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateClassModal
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              setShowCreate(false)
              fetchClasses()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================
   Class Card
   ============================================ */
function ClassCard({
  classItem,
  index,
  onDelete,
  onRefresh,
}: {
  classItem: ClassItem
  index: number
  onDelete: (id: string) => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(classItem.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-blue/5 transition-all duration-500">
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue transition-colors">
                {classItem.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Создан {formatDate(classItem.created_at)}
              </p>
            </div>
            <button
              onClick={() => onDelete(classItem.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all flex-shrink-0"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="h-4 w-4 text-blue" />
              {classItem.students_count} учеников
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              {classItem.tests_count} тестов
            </span>
          </div>

          {/* Invite Code */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Инвайт-код</div>
                  <div className="text-sm font-mono font-bold text-gray-900 tracking-wider">
                    {classItem.invite_code}
                  </div>
                </div>
              </div>
              <button
                onClick={copyCode}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue text-white hover:bg-blue-deep'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expand for students */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-blue hover:bg-gray-50 border-t border-gray-50 transition-colors"
        >
          <Users className="h-3.5 w-3.5" />
          {expanded ? 'Скрыть' : 'Ученики'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 border-t border-gray-50 pt-4">
                <ClassStudents classId={classItem.id} onRefresh={onRefresh} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ============================================
   Class Students List
   ============================================ */
function ClassStudents({ classId, onRefresh }: { classId: string; onRefresh: () => void }) {
  const [students, setStudents] = useState<StudentMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [classId])

  async function fetchStudents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select('student_id, joined_at, profiles!class_members_student_id_fkey(full_name)')
        .eq('class_id', classId)
        .order('joined_at', { ascending: false })

      if (error) throw error

      setStudents(
        (data || []).map((m: any) => ({
          student_id: m.student_id,
          full_name: m.profiles?.full_name || 'Неизвестный',
          joined_at: m.joined_at,
        }))
      )
    } catch (err) {
      console.error('Fetch students error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function removeStudent(studentId: string) {
    if (!confirm('Удалить ученика из класса?')) return
    try {
      await supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', studentId)
      setStudents((prev) => prev.filter((s) => s.student_id !== studentId))
      onRefresh()
    } catch (err) {
      console.error('Remove student error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">Пока нет учеников</p>
        <p className="text-xs text-gray-400 mt-1">Поделитесь инвайт-кодом</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {students.map((student, i) => (
        <motion.div
          key={student.student_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-light rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
              <p className="text-xs text-gray-400">{formatDate(student.joined_at)}</p>
            </div>
          </div>
          <button
            onClick={() => removeStudent(student.student_id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
            title="Удалить"
          >
            <UserMinus className="h-4 w-4" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}

export default TeacherClasses
