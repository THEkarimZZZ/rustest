import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  role?: 'teacher' | 'student'
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { profile, loading } = useAuth()
  const location = useLocation()

  // Пока загружается — показываем лоадер
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Не авторизован — редирект на логин
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Неправильная роль — редирект в свой кабинет
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'teacher' ? '/teacher' : '/student'} replace />
  }

  // Рендерим вложенные маршруты
  return <Outlet />
}
