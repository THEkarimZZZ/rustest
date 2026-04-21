import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import HomePage from '@/pages/Home'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import TeacherDashboard from '@/pages/teacher/Dashboard'
import StudentDashboard from '@/pages/student/Dashboard'
import JoinClass from '@/pages/student/JoinClass'
import JoinTest from '@/pages/student/JoinTest'
import TestReview from '@/pages/student/TestReview'
import TestConstructor from '@/pages/teacher/TestConstructor'
import TestTaking from '@/pages/student/TestTaking'
import TestResults from '@/pages/teacher/TestResults'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsOfService from '@/pages/TermsOfService'
import TestConnection from '@/pages/TestConnection'

function App() {
  return (
    /* basename="/rustest" позволяет роутеру понимать, что сайт находится в подпапке */
    <BrowserRouter basename="/rustest">
      <AuthProvider>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="test-connection" element={<TestConnection />} />

            {/* Маршруты учителя (только teacher) */}
            <Route path="teacher" element={<ProtectedRoute role="teacher" />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="test-constructor" element={<TestConstructor />} />
              <Route path="test-constructor/:testId" element={<TestConstructor />} />
              <Route path="results/:testId" element={<TestResults />} />
            </Route>

            {/* Маршруты ученика (только student) */}
            <Route path="student" element={<ProtectedRoute role="student" />}>
              <Route index element={<StudentDashboard />} />
              <Route path="test/:testId" element={<TestTaking />} />
              <Route path="review/:testId" element={<TestReview />} />
              <Route path="join/:code" element={<JoinClass />} />
              <Route path="join-test/:token" element={<JoinTest />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
