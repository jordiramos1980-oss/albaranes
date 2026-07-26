'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QrCodeProps {
  value: string
  size?: number
}

export default function QrCode({ value, size = 180 }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#1C1F26', light: '#FFFFFF' },
    })
  }, [value, size])

  return <canvas ref={canvasRef} className="rounded-md border" />
}
