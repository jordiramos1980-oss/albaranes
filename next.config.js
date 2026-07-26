'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import SignaturePad from '@/components/SignaturePad'

interface AlbaranPublic {
  id: string
  numero: string
  fecha: string
  client_name_snapshot: string
  estado: string
  company_name: string
  company_logo_url: string | null
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png'
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export default function FirmarAlbaranPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [albaran, setAlbaran] = useState<AlbaranPublic | null>(null)
  const [signerName, setSignerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('albaran_public_view')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError('No se ha encontrado el albarán.')
        else setAlbaran(data as AlbaranPublic)
        setLoading(false)
      })
  }, [id])

  const handleSign = async (dataUrl: string) => {
    if (!signerName.trim()) {
      setError('Escribe el nombre de quien firma.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const blob = dataUrlToBlob(dataUrl)
      const path = `${id}/client-signature-${Date.now()}.png`
      const { error: upErr } = await supabase.storage.from('signatures').upload(path, blob)
      if (upErr) throw upErr
      const signature_url = supabase.storage.from('signatures').getPublicUrl(path).data.publicUrl

      const { error: rpcErr } = await supabase.rpc('sign_albaran', {
        p_albaran_id: id,
        p_signature_url: signature_url,
        p_signer_name: signerName.trim(),
      })
      if (rpcErr) throw rpcErr
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la firma.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-neutral-400">Cargando…</div>
  if (!albaran) return <div className="p-10 text-center text-red-500">{error || 'Albarán no encontrado'}</div>

  if (done || albaran.estado === 'firmado') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-xl font-semibold text-[#1C1F26]">Albarán firmado</h1>
        <p className="text-neutral-500 mt-2">Gracias, la entrega ha quedado registrada correctamente.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-6">
        {albaran.company_logo_url && (
          <img src={albaran.company_logo_url} alt="Logo" className="h-10" />
        )}
        <div>
          <p className="font-medium text-[#1C1F26]">{albaran.company_name}</p>
          <p className="text-sm text-neutral-500">Albarán nº {albaran.numero} · {albaran.fecha}</p>
        </div>
      </div>

      <p className="text-neutral-600 mb-4">
        Entrega para <strong>{albaran.client_name_snapshot}</strong>. Confirma con tu firma que
        la mercancía/servicio se ha recibido conforme.
      </p>

      <input
        placeholder="Nombre de quien firma (cliente o encargado)"
        value={signerName}
        onChange={(e) => setSignerName(e.target.value)}
        className="w-full border rounded-md px-3 py-2 mb-4"
      />

      <SignaturePad label="Firma del cliente / encargado" onSave={handleSign} />

      {submitting && <p className="text-sm text-neutral-500 mt-3">Guardando firma…</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}
