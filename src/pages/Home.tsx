import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import {
  BookOpen, Users, BarChart3, Shield, Zap, Target,
  ClipboardList, Check, Sparkles, Rocket,
  CheckCircle2, Layers, Clock
} from 'lucide-react'

/* ============================================
   Scroll Reveal Wrapper — cool in/out animation
   ============================================ */
function Reveal({ children, className = '', delay = 0, direction = 'up' }: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}) {
  const { ref, isVisible } = useScrollReveal(0.1)

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(60px)'
        case 'left': return 'translateX(-40px)'
        case 'right': return 'translateX(40px)'
        case 'scale': return 'scale(0.9)'
      }
    }
    return 'translateY(0) translateX(0) scale(1)'
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* ============================================
   Data
   ============================================ */
const features = [
  { icon: ClipboardList, title: 'Конструктор тестов', desc: 'Создавайте тесты с вопросами разных типов: одиночный и множественный выбор, текстовый ответ, информационные блоки', bg: 'from-blue-50 to-indigo-50', iconBg: 'bg-blue-100', iconColor: 'text-blue' },
  { icon: Users, title: 'Управление классами', desc: 'Создавайте классы, генерируйте инвайт-коды и управляйте списком учеников в одном месте', bg: 'from-emerald-50 to-teal-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: BarChart3, title: 'Аналитика и отчёты', desc: 'Отслеживайте прогресс учеников, анализируйте качество знаний и экспортируйте результаты в Excel', bg: 'from-purple-50 to-pink-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { icon: Shield, title: 'Безопасность данных', desc: 'Защита персональных данных, согласие на обработку ПД при регистрации, безопасное хранение', bg: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { icon: Zap, title: 'Анти-фрод система', desc: 'Детектирование потери фокуса, rate limiting и защита от списывания во время тестирования', bg: 'from-rose-50 to-red-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { icon: Layers, title: 'Гибкие оценки', desc: 'Настраиваемая шкала оценивания с автоматическим переводом баллов в оценки от 2 до 5', bg: 'from-cyan-50 to-blue-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
]

const stats = [
  { value: '5', label: 'Типов вопросов' },
  { value: '100%', label: 'Адаптивность' },
  { value: '24/7', label: 'Доступность' },
  { value: 'Excel', label: 'Экспорт данных' },
]

/* ============================================
   HOME PAGE
   ============================================ */
function HomePage() {
  const heroRef = useScrollReveal(0)

  return (
    <div className="bg-white overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue via-blue/95 to-blue-muted" ref={heroRef.ref}>
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/5 blur-3xl" style={{ animation: 'blob 12s ease-in-out infinite' }} />
          <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] bg-white/5 blur-3xl" style={{ animation: 'blob 10s ease-in-out infinite 2s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-white/3 blur-3xl" style={{ animation: 'blob 14s ease-in-out infinite 4s' }} />
        </div>

        <div className="container-app relative py-20 md:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left */}
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroRef.isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium mb-6">
                  <Sparkles className="h-3.5 w-3.5" />
                  Образовательная платформа
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                  Создавайте тесты.<br />
                  <span className="text-white/60">Управляйте знаниями.</span>
                </h1>

                <p className="text-lg text-white/50 mb-10 max-w-lg leading-relaxed">
                  Платформа для проведения тестирования, управления классами и глубокой аналитики успеваемости
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/register">
                    <button className="px-8 py-4 bg-white text-blue text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl min-w-[180px]">
                      Начать бесплатно
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="px-8 py-4 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/15 min-w-[180px]">
                      Войти
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Right — floating cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={heroRef.isVisible ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex flex-shrink-0"
            >
              <div className="relative w-72 h-72">
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-4 left-8 bg-white/15 backdrop-blur-md rounded-2xl p-5 w-56 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">Тест #127</div>
                      <div className="text-white/50 text-xs">Математика</div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5 w-[78%]" />
                  </div>
                  <div className="text-white/60 text-xs mt-2">78% — Оценка: 4</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-8 right-0 bg-white/15 backdrop-blur-md rounded-2xl p-5 w-48 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-400/30 rounded-lg flex items-center justify-center">
                      <Check className="h-4 w-4 text-emerald-300" />
                    </div>
                    <span className="text-white text-sm font-medium">Сдано</span>
                  </div>
                  <div className="text-white/50 text-xs">12 из 15 учеников</div>
                </motion.div>

                <div className="absolute top-0 right-0 w-3 h-3 bg-white/20 rounded-full" />
                <div className="absolute bottom-20 left-0 w-2 h-2 bg-white/15 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 40V80H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-10 border-b border-gray-100">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue tracking-tight mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Возможности платформы
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Всё необходимое для эффективного тестирования и управления обучением
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 80}>
                <div className={`bg-gradient-to-br ${feature.bg} rounded-xl p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 group h-full cursor-default`}>
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container-app">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Как это работает
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Три простых шага от создания класса до аналитики результатов
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              { icon: Users, title: 'Создайте класс', desc: 'Добавьте учеников по инвайт-коду или вручную за пару кликов', step: '01' },
              { icon: BookOpen, title: 'Создайте тест', desc: 'Добавьте вопросы разных типов и настройте шкалу оценок', step: '02' },
              { icon: BarChart3, title: 'Получите аналитику', desc: 'Отслеживайте результаты и экспортируйте отчёты в Excel', step: '03' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 150} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}>
                <div className="text-center group">
                  <div className="relative inline-block mb-6">
                    <div className="w-16 h-16 bg-blue-light rounded-2xl flex items-center justify-center mx-auto group-hover:bg-blue group-hover:scale-110 transition-all duration-300">
                      <item.icon className="h-7 w-7 text-blue group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-blue text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Почему выбирают нас
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {[
              { icon: Target, title: 'Гибкая система оценок', items: ['Настраиваемая шкала', 'Автоподсчёт баллов', 'Оценки 2–5'] },
              { icon: Clock, title: 'Мобильная доступность', items: ['Адаптивный дизайн', 'Управление одной рукой', 'Все устройства'] },
              { icon: Shield, title: 'Защита от списывания', items: ['Детект потери фокуса', 'Rate limiting', 'Анти-фрод'] },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 120}>
                <div className="text-center group">
                  <div className="w-14 h-14 bg-blue-light rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-blue group-hover:scale-110 transition-all duration-300">
                    <b.icon className="h-6 w-6 text-blue group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{b.title}</h3>
                  <ul className="space-y-2.5">
                    {b.items.map((item) => (
                      <li key={item} className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <Reveal direction="scale">
            <div className="relative bg-gradient-to-r from-blue to-blue-deep rounded-2xl p-8 md:p-14 overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" style={{ animation: 'blob 15s ease-in-out infinite' }} />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" style={{ animation: 'blob 12s ease-in-out infinite 3s' }} />

              <div className="relative flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-white/70 text-xs font-medium mb-5">
                    <Rocket className="h-3.5 w-3.5" />
                    Начните бесплатно
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                    Начните создавать тесты прямо сейчас
                  </h2>
                  <p className="text-white/50 text-sm md:text-base mb-8 max-w-lg">
                    Зарегистрируйтесь бесплатно и получите доступ ко всем функциям платформы
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link to="/register">
                      <button className="px-8 py-3.5 bg-white text-blue text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl min-w-[180px]">
                        Зарегистрироваться
                      </button>
                    </Link>
                    <Link to="/login">
                      <button className="px-8 py-3.5 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/15 min-w-[180px]">
                        Войти
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="flex-shrink-0 space-y-3">
                  {[
                    { icon: Shield, text: 'Безопасность данных' },
                    { icon: Zap, text: 'Быстрый старт' },
                    { icon: Target, text: 'Гибкие настройки' },
                  ].map((item) => (
                    <motion.div key={item.text} whileHover={{ x: 4 }} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3.5 border border-white/10">
                      <item.icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                      <span className="text-sm text-white font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}

export default HomePage
