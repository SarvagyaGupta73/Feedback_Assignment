import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Forms } from './pages/Forms'
import { Responses } from './pages/Responses'
import { CreateForm } from './pages/CreateForm'
import { PublicForm } from './pages/PublicForm'
import { FormResponses } from './pages/FormResponses'
import { EditForm } from './pages/EditForm'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background transition-colors duration-500">
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms"
                element={
                  <ProtectedRoute>
                    <Forms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms/new"
                element={
                  <ProtectedRoute>
                    <CreateForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/responses"
                element={
                  <ProtectedRoute>
                    <Responses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms/:formId/responses"
                element={
                  <ProtectedRoute>
                    <FormResponses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms/:formId/edit"
                element={
                  <ProtectedRoute>
                    <EditForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/form/:formId" element={<PublicForm />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App