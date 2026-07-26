'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (err) {
      setError('Email o contraseña incorrectos.')
      return
    }
    router.push(searchParams.get('next') || '/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-4">
      <h1 className="text-2xl font-semibold text-[#1C1F26] mb-1">Iniciar sesión</h1>
      <p className="text-neutral-500 mb-8">Accede a tus albaranes.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-md bg-[#164394] text-white font-medium disabled:opacity-40"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-6 text-center">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-[#164394] font-medium">Regístrate</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
