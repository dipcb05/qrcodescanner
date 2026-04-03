'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ScanResultModal } from '@/components/ScanResultModal'
import { PermissionModal } from '@/components/PermissionModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useCamera } from '@/hooks/useCamera'
import { useFlashlight } from '@/hooks/useFlashlight'
import { useVibration } from '@/hooks/useVibration'
import { useScanHistory } from '@/hooks/useScanHistory'
import { useScanSettings } from '@/hooks/useScanSettings'
import { useFolderStorage } from '@/hooks/useFolderStorage'
import { ScanResult } from '@/hooks/useBarcodeScannerEngine'
import { toast } from 'sonner'

const CameraScanner = dynamic(() => import('@/components/CameraScanner').then(mod => mod.CameraScanner), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold">Initializing Lens...</div>
})

export default function ScanPage() {
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    videoRef: cameraVideoRef,
    startCamera,
    stopCamera,
    pauseCamera,
    resumeCamera,
    toggleCamera,
    hasMultipleCameras,
    error: cameraError,
    isCameraActive,
    isPaused,
    zoom,
    setZoom,
    zoomRange,
    streamRef
  } = useCamera()

  const { isFlashlightOn, toggleFlashlight, isSupported: flashlightSupported } = useFlashlight(streamRef)
  const { vibrate } = useVibration()
  const { addToHistory, incrementCopyCount } = useScanHistory()
  const { settings } = useScanSettings()
  const { isFolderConnected, saveScanToFolder } = useFolderStorage()

  useEffect(() => {
    let mounted = true
    const init = async () => {
      await new Promise(r => setTimeout(r, 100))
      if (!mounted) return
      try {
        await startCamera()
      } catch {
        if (mounted) setIsPermissionModalOpen(true)
      }
    }
    init()
    return () => {
      mounted = false
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const captureFrame = useCallback((): Blob | null => {
    if (!cameraVideoRef.current) return null
    try {
      const canvas = document.createElement('canvas')
      canvas.width = cameraVideoRef.current.videoWidth
      canvas.height = cameraVideoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(cameraVideoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const byteString = atob(dataUrl.split(',')[1])
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      return new Blob([ab], { type: mimeString })
    } catch {
      return null
    }
  }, [cameraVideoRef])

  const handleScanSuccess = useCallback(async (result: ScanResult) => {
    if (settings.vibrationEnabled) vibrate(100)
    if (settings.soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2216/2216-preview.mp3')
      audio.play().catch(() => { })
    }

    if (settings.autoCopyToClipboard && navigator.clipboard) {
      navigator.clipboard.writeText(result.text)
      toast.success('Auto-copied to clipboard', { id: 'auto-copy' })
    }

    if (!settings.continuousScan) {
      pauseCamera()
      setCurrentScan(result)
      setIsResultModalOpen(true)
    }

    const imageBlob = captureFrame() || null
    const timestamp = new Date().toISOString()
    const historyId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    addToHistory({ text: result.text, format: result.format, timestamp })

    if (isFolderConnected) {
      const saved = await saveScanToFolder({
        id: historyId, text: result.text, format: result.format, timestamp, imageBlob
      })
      if (saved) toast.success('Saved to /Scans folder', { id: 'folder-save' })
    } else if (settings.continuousScan) {
      toast.success(`Scanned: ${result.text.slice(0, 30)}...`, { id: `scan-${historyId}`, duration: 2000 })
    }
  }, [settings, vibrate, pauseCamera, captureFrame, addToHistory, isFolderConnected, saveScanToFolder])

  const handleCopyToClipboard = useCallback(() => {
    if (currentScan && navigator.clipboard) {
      navigator.clipboard.writeText(currentScan.text)
      setIsCopied(true)
      incrementCopyCount(currentScan.text)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }, [currentScan, incrementCopyCount])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''

    toast.loading('Decoding image...', { id: 'file-decode' })

    try {
      const containerId = '__file_decode_container'
      let container = document.getElementById(containerId)
      if (!container) {
        container = document.createElement('div')
        container.id = containerId
        container.style.display = 'none'
        document.body.appendChild(container)
      }

      const { Html5Qrcode } = await import('html5-qrcode')
      const html5Qr = new Html5Qrcode(containerId)
      const decodedText = await html5Qr.scanFile(file, false)
      await html5Qr.clear()

      toast.success('Code detected!', { id: 'file-decode' })

      handleScanSuccess({
        text: decodedText,
        format: 'QR_CODE',
        timestamp: new Date(),
      })
    } catch {
      toast.error('No barcode found in this image.', { id: 'file-decode' })
    }
  }

  return (
    <div className="relative h-full flex flex-col bg-black overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      <div className="flex-1 min-h-0 relative">
        <CameraScanner
          onScanSuccess={handleScanSuccess}
          isScanning={!isPaused && isCameraActive}
          isPaused={isPaused}
          onStartScan={resumeCamera}
          onStopScan={pauseCamera}
          onToggleCamera={toggleCamera}
          isFlashlightOn={isFlashlightOn}
          onToggleFlashlight={toggleFlashlight}
          flashlightSupported={flashlightSupported}
          cameraError={cameraError}
          videoRef={cameraVideoRef}
          hasMultipleCameras={hasMultipleCameras}
          onFileSelect={() => fileInputRef.current?.click()}
          zoom={zoom}
          onZoomChange={setZoom}
          zoomRange={zoomRange}
          rightAction={<ThemeToggle />}
        />
      </div>

      <ScanResultModal
        isOpen={isResultModalOpen}
        onClose={() => { setIsResultModalOpen(false); resumeCamera() }}
        result={currentScan}
        isCopied={isCopied}
        onCopy={handleCopyToClipboard}
        onShare={async () => { }}
      />
      <PermissionModal
        isOpen={isPermissionModalOpen}
        onAccept={() => { setIsPermissionModalOpen(false); startCamera() }}
      />
    </div>
  )
}
