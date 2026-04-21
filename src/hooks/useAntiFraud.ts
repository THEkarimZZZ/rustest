import { useState, useEffect, useCallback, useRef } from 'react'

interface AntiFraudSettings {
  max_focus_loss: number
  min_answer_time: number
  block_copy: boolean
  block_right_click: boolean
  detect_devtools: boolean
  auto_submit_on_violation: boolean
}

interface UseAntiFraudReturn {
  focusLossCount: number
  violationCount: number
  warnings: string[]
  isBlocked: boolean
  blockReason: string
  lastActionTime: number
  canAnswer: boolean
  recordViolation: (type: string, message: string) => void
  resetTimer: () => void
}

export function useAntiFraud(
  settings: AntiFraudSettings | null | undefined,
  onSubmit: () => void,
  isActive: boolean
): UseAntiFraudReturn {
  const focusLossRef = useRef(0)
  const violationRef = useRef(0)
  const warningsRef = useRef<string[]>([])
  const lastActionRef = useRef(0)
  const isBlockedRef = useRef(false)
  const blockReasonRef = useRef('')
  const devtoolsRef = useRef(false)
  const onSubmitRef = useRef(onSubmit)
  const [, forceUpdate] = useState(0)

  // Keep ref updated
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  const notify = useCallback(() => forceUpdate(n => n + 1), [])

  // Focus loss detection
  useEffect(() => {
    if (!isActive || !settings) return

    const handleVisibility = () => {
      if (document.hidden) {
        focusLossRef.current += 1
        const count = focusLossRef.current
        const max = settings.max_focus_loss || 3

        if (count >= max && settings.auto_submit_on_violation) {
          isBlockedRef.current = true
          blockReasonRef.current = `Тест завершён: превышен лимит потерь фокуса (${count}/${max})`
          notify()
          setTimeout(() => onSubmitRef.current(), 500)
        } else if (count >= max - 1) {
          warningsRef.current.push(`⚠️ Последнее предупреждение! Ещё одна потеря фокуса — тест будет завершён автоматически`)
          notify()
        } else {
          warningsRef.current.push(`⚠️ Потеря фокуса detected (${count}/${max})`)
          notify()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isActive, settings, notify])

  // Blur detection (window focus loss)
  useEffect(() => {
    if (!isActive || !settings) return

    const handleBlur = () => {
      // visibilitychange already handles this, but blur is additional signal
    }

    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [isActive, settings])

  // Copy-paste prevention
  useEffect(() => {
    if (!isActive || !settings?.block_copy) return

    const handlers = {
      copy: (e: Event) => { e.preventDefault(); recordViolation('copy', 'Попытка копирования') },
      cut: (e: Event) => { e.preventDefault(); recordViolation('cut', 'Попытка вырезания') },
      paste: (e: Event) => { e.preventDefault(); recordViolation('paste', 'Попытка вставки') },
      selectstart: (e: Event) => { e.preventDefault() },
      dragstart: (e: Event) => { e.preventDefault() },
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler as EventListener)
    })

    // CSS injection for user-select
    const style = document.createElement('style')
    style.id = 'anti-cheat-style'
    style.textContent = `
      body { -webkit-user-select: none !important; user-select: none !important; }
      input, textarea { -webkit-user-select: text !important; user-select: text !important; }
    `
    document.head.appendChild(style)

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler as EventListener)
      })
      const existing = document.getElementById('anti-cheat-style')
      if (existing) existing.remove()
    }
  }, [isActive, settings?.block_copy])

  // Right-click prevention
  useEffect(() => {
    if (!isActive || !settings?.block_right_click) return

    const handler = (e: MouseEvent) => {
      e.preventDefault()
      recordViolation('right_click', 'Попытка вызова контекстного меню')
    }

    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [isActive, settings?.block_right_click])

  // DevTools detection
  useEffect(() => {
    if (!isActive || !settings?.detect_devtools) return

    const threshold = 160
    let checkInterval: any

    const check = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      
      if (widthDiff || heightDiff) {
        if (!devtoolsRef.current) {
          devtoolsRef.current = true
          recordViolation('devtools', 'Открыты инструменты разработчика')
        }
      } else {
        devtoolsRef.current = false
      }
    }

    // Debugger-based detection
    const detectDebugger = () => {
      const start = performance.now()
      // @ts-ignore
      debugger
      const end = performance.now()
      if (end - start > 100) {
        recordViolation('devtools_debugger', 'Обнаружен debugger')
      }
    }

    checkInterval = setInterval(check, 1000)
    
    // Run debugger check periodically
    const debugInterval = setInterval(detectDebugger, 5000)

    return () => {
      clearInterval(checkInterval)
      clearInterval(debugInterval)
    }
  }, [isActive, settings?.detect_devtools])

  // Keyboard shortcuts prevention
  useEffect(() => {
    if (!isActive) return

    const handler = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+Shift+I, F12
      const blocked = [
        (e.ctrlKey && ['c', 'C', 'v', 'V', 'u', 'U', 's', 'S', 'p', 'P'].includes(e.key)),
        (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J'].includes(e.key)),
        (e.key === 'F12'),
        (e.key === 'PrintScreen'),
      ]

      if (blocked.some(Boolean)) {
        e.preventDefault()
        recordViolation('keyboard', `Заблокирована комбинация: ${e.key}`)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isActive])

  // Answer rate limiting
  const canAnswer = useCallback(() => {
    if (!settings) return true
    const minTime = (settings.min_answer_time || 2) * 1000
    const now = Date.now()
    return now - lastActionRef.current >= minTime
  }, [settings])

  const resetTimer = useCallback(() => {
    lastActionRef.current = Date.now()
  }, [])

  const recordViolation = useCallback((type: string, message: string) => {
    violationRef.current += 1
    warningsRef.current.push(`🚨 ${message}`)
    notify()
    console.warn(`[AntiFraud] ${type}: ${message}`)
  }, [notify])

  return {
    focusLossCount: focusLossRef.current,
    violationCount: violationRef.current,
    warnings: [...warningsRef.current],
    isBlocked: isBlockedRef.current,
    blockReason: blockReasonRef.current,
    lastActionTime: lastActionRef.current,
    canAnswer: canAnswer(),
    recordViolation,
    resetTimer,
  }
}
