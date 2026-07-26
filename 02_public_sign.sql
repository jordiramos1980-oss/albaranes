'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    // Si la confirmación de email está activada, no hay sesión todavía
    if (!data.session) {
      setCheckEmail(true)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  if (checkEmail) {
    return (
      <div className="max-w-sm mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-xl font-semibold text-[#1C1F26]">Revisa tu email</h1>
        <p className="text-neutral-500 mt-2">
          Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
          Ábrelo para activar tu cuenta y continuar configurando tu empresa.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto py-16 px-4">
      <h1 className="text-2xl font-semibold text-[#1C1F26] mb-1">Crear cuenta</h1>
      <p className="text-neutral-500 mb-8">
        Después de registrarte configurarás los datos de tu empresa y tu firma.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        <input
          type="password" required minLength={6} placeholder="Contraseña (mínimo 6 caracteres)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-md bg-[#164394] text-white font-medium disabled:opacity-40"
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-6 text-center">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#164394] font-medium">Inicia sesión</Link>
      </p>
    </div>
  )
}
