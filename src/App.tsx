import { createHashRouter, RouterProvider } from 'react-router-dom'
import { supabase } from './lib/supabase'

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white p-8 text-slate-900 dark:bg-slate-900 dark:text-white">
      <h1 className="text-3xl font-bold">web-app-template</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {supabase ? 'Supabase client initialized' : 'Supabase client missing'}
      </p>
    </main>
  )
}

const router = createHashRouter([{ path: '/', element: <Home /> }])

function App() {
  return <RouterProvider router={router} />
}

export default App
