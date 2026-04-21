import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Database, CheckCircle, XCircle } from 'lucide-react'

export default function TestConnection() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const testConnection = async () => {
    setStatus('idle')
    setMessage('')

    // Тест 1: Проверка подключения
    const { error: healthError } = await supabase.from('profiles').select('count').limit(1)
    
    if (healthError) {
      setStatus('error')
      setMessage(`Ошибка подключения: ${healthError.message}`)
      return
    }

    // Тест 2: Проверка таблиц
    const tables = ['profiles', 'classes', 'class_members', 'tests', 'questions', 'results']
    const results: { table: string; exists: boolean }[] = []

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
        results.push({ table, exists: !error })
      } catch {
        results.push({ table, exists: false })
      }
    }

    const allExist = results.every(r => r.exists)
    
    if (allExist) {
      setStatus('success')
      setMessage('Все таблицы подключены и доступны! ✅')
    } else {
      const missing = results.filter(r => !r.exists).map(r => r.table).join(', ')
      setStatus('error')
      setMessage(`Отсутствуют таблицы: ${missing}`)
    }
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-card border border-border rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="h-8 w-8 text-accent" />
          </div>
          
          <h2 className="text-2xl font-display font-semibold text-text-primary mb-2">
            Проверка подключения к Supabase
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Нажмите кнопку для тестирования подключения к базе данных
          </p>

          <Button
            variant="cta"
            size="lg"
            onClick={testConnection}
            disabled={status === 'success'}
            className="w-full"
          >
            {status === 'success' ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Подключено
              </>
            ) : (
              'Проверить подключение'
            )}
          </Button>

          {message && (
            <div className={`mt-6 p-4 rounded-lg border ${
              status === 'success' 
                ? 'bg-success/5 border-success/20 text-success' 
                : 'bg-error/5 border-error/20 text-error'
            }`}>
              <div className="flex items-center gap-2 justify-center">
                {status === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Таблицы:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['profiles', 'classes', 'class_members', 'tests', 'questions', 'results'].map(table => (
                <div key={table} className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <span className="text-text-tertiary">{table}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
