'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, ZapOff, RotateCw, Pause, Play, ImageIcon, Home, X, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { ScanResult } from '@/hooks/useBarcodeScannerEngine'

interface CameraScannerProps {
  isScanning: boolean
  isPaused: boolean
  onScanSuccess: (result: ScanResult) => void
  onStartScan: () => void
  onStopScan: () => void
  onToggleCamera: () => Promise<void>
  isFlashlightOn: boolean
  onToggleFlashlight: () => void
  flashlightSupported: boolean
  cameraError: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  hasMultipleCameras: boolean
  onFileSelect: () => void
  zoom: number
  onZoomChange: (value: number) => void
  zoomRange: { min: number; max: number } | null
  rightAction?: ReactNode
}

type EngineTier = 'native' | 'html5-qrcode' | 'jsqr'

export function CameraScanner({
  isScanning,
  isPaused,
  onScanSuccess,
  onStartScan,
  onStopScan,
  onToggleCamera,
  isFlashlightOn,
  onToggleFlashlight,
  flashlightSupported,
  cameraError,
  videoRef,
  hasMultipleCameras,
  onFileSelect,
  zoom,
  onZoomChange,
  zoomRange,
  rightAction,
}: CameraScannerProps) {
  const [activeTier, setActiveTier] = useState<EngineTier | null>(null)

  const onScanSuccessRef = useRef(onScanSuccess)
  useEffect(() => { onScanSuccessRef.current = onScanSuccess }, [onScanSuccess])
  const isPausedRef = useRef(isPaused)
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  useEffect(() => {
    if (!isScanning || isPaused) return
    const video = videoRef.current
    if (!video) return

    let running = true
    let processing = false

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    const emitResult = (text: string, format: string) => {
      if (text.trim().length > 0 && running && !isPausedRef.current) {
        onScanSuccessRef.current({
          text,
          format,
          timestamp: new Date(),
        })
      }
    }

    const captureFrame = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (vw <= 0 || vh <= 0) return false
      canvas.width = 640
      canvas.height = Math.round((vh / vw) * 640)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return true
    }

    const tryNativeDetector = async (): Promise<boolean> => {
      if (typeof (window as any).BarcodeDetector !== 'function') return false
      try {
        const formats = await (window as any).BarcodeDetector.getSupportedFormats()
        if (!formats || formats.length === 0) return false

        const detector = new (window as any).BarcodeDetector({
          formats: formats.filter((f: string) =>
            ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'codabar', 'itf', 'data_matrix', 'aztec', 'pdf417'].includes(f)
          ),
        })
        setActiveTier('native')

        const loop = async () => {
          if (!running) return
          if (!processing && video.readyState >= 2 && !isPausedRef.current) {
            processing = true
            try {
              const results = await detector.detect(video)
              if (results.length > 0) {
                emitResult(results[0].rawValue, results[0].format || 'QR_CODE')
              }
            } catch { }
            processing = false
          }
          if (running) setTimeout(loop, 120)
        }
        loop()
        return true
      } catch {
        return false
      }
    }

    const tryHtml5Qrcode = async (): Promise<boolean> => {
      try {
        const containerId = '__qr_decode_engine'
        let container = document.getElementById(containerId)
        if (!container) {
          container = document.createElement('div')
          container.id = containerId
          container.style.display = 'none'
          document.body.appendChild(container)
        }

        const html5Qr = new Html5Qrcode(containerId)
        setActiveTier('html5-qrcode')

        const loop = async () => {
          if (!running) { html5Qr.clear(); return }
          if (!processing && video.readyState >= 2 && !isPausedRef.current) {
            processing = true
            try {
              if (captureFrame()) {
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
                if (blob && running && !isPausedRef.current) {
                  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })
                  try {
                    const decoded = await html5Qr.scanFile(file, false)
                    emitResult(decoded, 'QR_CODE')
                  } catch { }
                }
              }
            } catch { }
            processing = false
          }
          if (running) setTimeout(loop, 200)
        }
        loop()
        return true
      } catch {
        return false
      }
    }

    const tryJsQR = async (): Promise<boolean> => {
      try {
        const jsQRModule = (await import('jsqr')).default
        setActiveTier('jsqr')
        const loop = () => {
          if (!running) return
          if (!processing && video.readyState >= 2 && !isPausedRef.current) {
            processing = true
            try {
              if (captureFrame()) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQRModule(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'attemptBoth',
                })
                if (code) emitResult(code.data, 'QR_CODE')
              }
            } catch { }
            processing = false
          }
          if (running) setTimeout(loop, 150)
        }
        loop()
        return true
      } catch {
        return false
      }
    }

    const initEngine = async () => {
      if (await tryNativeDetector()) return
      if (await tryHtml5Qrcode()) return
      if (await tryJsQR()) return
    }

    initEngine()

    return () => {
      running = false
    }
  }, [isScanning, isPaused, videoRef])

  if (cameraError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/95 px-8 pt-24 pb-32">
        <div className="space-y-4 max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <X className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white">Camera Unavailable</h2>
          <p className="text-sm text-white/50">{cameraError}</p>
          <Link href="/">
            <Button variant="outline" className="rounded-full px-10 h-12 mt-4 text-white border-white/20 hover:bg-white/10 font-bold">Return Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute top-10 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
        <Link href="/" className="pointer-events-auto">
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl hover:bg-white/20">
            <Home className="w-6 h-6" />
          </Button>
        </Link>
        <div className="pointer-events-auto">{rightAction}</div>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-10">
        <div className="relative w-full max-w-[280px] aspect-square">
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-[0_0_15px_rgba(102,169,255,0.4)]" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-[0_0_15px_rgba(102,169,255,0.4)]" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-[0_0_15px_rgba(102,169,255,0.4)]" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-[0_0_15px_rgba(102,169,255,0.4)]" />
          {isScanning && !isPaused && (
            <motion.div
              className="absolute left-6 right-6 h-0.5 bg-primary/80 blur-[1px] shadow-[0_0_20px_rgba(102,169,255,1)] z-40"
              animate={{ top: ['15%', '85%', '15%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-5 pointer-events-none">
        <div className="w-full px-8 flex justify-between items-center">
          <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl hover:bg-white/20 pointer-events-auto" onClick={onFileSelect}>
            <ImageIcon className="w-6 h-6" />
          </Button>
          <Button onClick={isPaused ? onStartScan : onStopScan} className={`w-20 h-20 rounded-full shadow-2xl border-4 border-black/40 pointer-events-auto active:scale-95 transition-transform ${isPaused ? 'bg-amber-500' : 'bg-primary'}`}>
            {isPaused ? <Play className="w-10 h-10 fill-current ml-1" /> : <Pause className="w-10 h-10 fill-current" />}
          </Button>
          {hasMultipleCameras ? (
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl hover:bg-white/20 pointer-events-auto" onClick={onToggleCamera}>
              <RotateCw className="w-6 h-6" />
            </Button>
          ) : <div className="w-14 h-14" />}
        </div>

        {zoomRange && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-[85%] max-w-[320px] h-14 px-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-4 pointer-events-auto shadow-2xl">
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-white/70 hover:text-white" onClick={() => onZoomChange(zoom - 0.5)}><Minus className="w-4 h-4" /></Button>
            <Slider value={[zoom]} onValueChange={(v) => onZoomChange(v[0])} min={zoomRange.min} max={zoomRange.max} step={0.1} className="flex-1" />
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-white/70 hover:text-white" onClick={() => onZoomChange(zoom + 0.5)}><Plus className="w-4 h-4" /></Button>
            <span className="text-[10px] font-mono text-white/40 min-w-[25px]">{zoom.toFixed(1)}x</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
