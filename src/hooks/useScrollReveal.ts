import { useEffect, useRef, useState } from 'react'

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'above' | 'visible' | 'below'>('above')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('visible')
        } else {
          // Если элемент был видим и теперь не виден — определяем направление
          setState(prev => prev === 'visible' ? 'below' : prev)
        }
      },
      { threshold, rootMargin: '-10% 0px -10% 0px' }
    )

    const el = ref.current
    if (el) observer.observe(el)

    return () => { if (el) observer.unobserve(el) }
  }, [threshold])

  return { ref, isVisible: state === 'visible' }
}
