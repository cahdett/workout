import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RestTimerProvider } from './contexts/RestTimerContext'
import BottomNav from './components/BottomNav'
import RestTimer from './components/RestTimer'
import Login from './routes/Login'
import Home from './routes/Home'
import Routines from './routes/Routines'
import RoutineEditor from './routes/RoutineEditor'
import ActiveWorkout from './routes/ActiveWorkout'
import History from './routes/History'
import WorkoutDetail from './routes/WorkoutDetail'
import Exercises from './routes/Exercises'
import Progression from './routes/Progression'

// Lazy-loaded because it pulls in recharts, the heaviest dependency in the bundle.
const ExerciseDetail = lazy(() => import('./routes/ExerciseDetail'))

function AppShell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-full items-center justify-center text-zinc-500">Loading…</div>
  }

  if (!user) {
    return <Login />
  }

  const showNav = location.pathname !== '/workout/active'

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/routines/:id" element={<RoutineEditor />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<WorkoutDetail />} />
        <Route
          path="/exercise/:id"
          element={
            <Suspense fallback={<div className="p-4 text-zinc-500">Loading…</div>}>
              <ExerciseDetail />
            </Suspense>
          }
        />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/progress" element={<Progression />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <RestTimer />
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RestTimerProvider>
          <AppShell />
        </RestTimerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
