'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
  label?: string
  height?: number
}

export default function SignaturePad({
  onSave,
  onClear,
  label = 'Firma aquí',
  height = 220,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasStroke = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }, [])

  // Ajusta el canvas a la resolución del dispositivo (evita trazos borrosos)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1C1F26'
    }
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx()
    if (!ctx) return
    drawing.current = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    hasStroke.current = true
    setIsEmpty(false)
  }

  const end = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasStroke.current = false
    setIsEmpty(true)
    onClear?.()
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="w-full">
      <p className="text-sm text-neutral-500 mb-2">{label}</p>
      <div className="relative border-2 border-dashed border-neutral-300 rounded-lg bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height, touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="rounded-lg cursor-crosshair"
        />
        {isEmpty && (
          <span className="absolute inset-0 flex items-center justify-center text-neutral-300 text-sm pointer-events-none">
            Firma con el dedo o el ratón
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 text-sm rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="px-4 py-2 text-sm rounded-md bg-[#164394] text-white disabled:opacity-40 hover:bg-[#2E7DD1]"
        >
          Confirmar firma
        </button>
      </div>
    </div>
  )
}
