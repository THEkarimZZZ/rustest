import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 group">
              <div className="flex items-baseline">
                <span className="text-lg font-bold text-blue tracking-tight group-hover:text-blue-deep transition-colors">ПРО</span>
                <span className="text-lg font-bold text-red-500 tracking-tight group-hover:text-red-600 transition-colors">ВЕРЯЙ</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {profile ? (
                <Link
                  to={profile.role === 'teacher' ? '/teacher' : '/student'}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-blue font-medium rounded-lg hover:bg-blue-light/50 transition-all duration-200"
                >
                  Личный кабинет
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm text-gray-500 hover:text-blue font-medium rounded-lg hover:bg-blue-light/50 transition-all duration-200"
                  >
                    Тесты
                  </Link>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm text-gray-500 hover:text-blue font-medium rounded-lg hover:bg-blue-light/50 transition-all duration-200"
                  >
                    Классы
                  </Link>
                </>
              )}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              {profile ? (
                <>
                  <Link
                    to={profile.role === 'teacher' ? '/teacher' : '/student'}
                    className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-blue font-medium rounded-lg hover:bg-blue-light/50 transition-all duration-200"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{profile.full_name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <button className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue transition-all duration-200 group">
                      <span className="relative z-10">Войти</span>
                      <span className="absolute inset-0 bg-blue/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-deep transition-all duration-200 shadow-sm hover:shadow-md">
                      Регистрация
                    </button>
                  </Link>
                </>
              )}

              <button
                className="md:hidden p-2 text-gray-500 hover:text-blue transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-in">
              <nav className="flex flex-col gap-1">
                {profile ? (
                  <>
                    <Link
                      to={profile.role === 'teacher' ? '/teacher' : '/student'}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Личный кабинет
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full py-2.5 text-sm font-medium text-blue border border-blue rounded-xl">Войти</button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full py-2.5 text-sm font-semibold text-white bg-blue rounded-xl mt-2">Регистрация</button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container-app py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-baseline mb-4">
                <span className="text-xl font-bold text-white tracking-tight">ПРО</span>
                <span className="text-xl font-bold text-red-400 tracking-tight">ВЕРЯЙ</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Образовательная платформа для создания тестов, управления классами и аналитики
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Платформа</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to={profile ? (profile.role === 'teacher' ? '/teacher' : '/student') : '/login'} className="hover:text-white transition-colors">Личный кабинет</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Классы</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Документы</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Конфиденциальность</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Соглашение</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 Проверяй
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
