import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isCameraActive: boolean
  isPaused: boolean
  cameraFacingMode: 'user' | 'environment'
  error: string | null
  startCamera: (mode?: 'user' | 'environment') => Promise<void>
  stopCamera: () => void
  pauseCamera: () => void
  resumeCamera: () => void
  toggleCamera: () => Promise<void>
  hasMultipleCameras: boolean
  zoom: number
  setZoom: (value: number) => void
  zoomRange: { min: number; max: number } | null
  streamRef: React.RefObject<MediaStream | null>
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [zoom, setZoomValue] = useState(1)
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null)
  const operatingRef = useRef(false)

  const applyZoom = useCallback(async (value: number) => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    try {
      const capabilities = track.getCapabilities() as any
      if (capabilities.zoom) {
        const min = capabilities.zoom.min || 1
        const max = capabilities.zoom.max || 1
        const zoomValue = Math.max(min, Math.min(max, value))
        await track.applyConstraints({ advanced: [{ zoom: zoomValue }] as any[] })
        setZoomValue(zoomValue)
      } else {
        const zoomValue = Math.max(1, Math.min(5, value))
        if (videoRef.current) {
          videoRef.current.style.transform = `scale(${zoomValue})`
          videoRef.current.style.transformOrigin = 'center'
        }
        setZoomValue(zoomValue)
      }
    } catch (err) {
      console.error('Error applying zoom:', err)
    }
  }, [])

  const setZoom = useCallback((value: number) => {
    applyZoom(value)
  }, [applyZoom])

  const checkMultipleCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      setHasMultipleCameras(videoDevices.length > 1)
    } catch { }
  }, [])

  const startCamera = useCallback(async (mode?: 'user' | 'environment') => {
    if (operatingRef.current) return
    operatingRef.current = true
    try {
      setError(null)
      const targetMode = mode || cameraFacingMode

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported on this device')
        return
      }

      await checkMultipleCameras()

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: targetMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => { })
        }
      }

      setIsCameraActive(true)
      setIsPaused(false)

      const track = stream.getVideoTracks()[0]
      if (track) {
        const capabilities = track.getCapabilities() as any
        if (capabilities.zoom) {
          setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max })
          setZoomValue(capabilities.zoom.min || 1)
        } else {
          setZoomRange({ min: 1, max: 5 })
          setZoomValue(1)
        }
      }
    } catch (err) {
      let errorMsg = 'Failed to access camera'
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') errorMsg = 'Camera permission denied'
        else if (err.name === 'NotFoundError') errorMsg = 'No camera device found'
      }
      setError(errorMsg)
      setIsCameraActive(false)
    } finally {
      operatingRef.current = false
    }
  }, [cameraFacingMode, checkMultipleCameras])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsCameraActive(false)
    setIsPaused(false)
  }, [])

  const pauseCamera = useCallback(() => {
    if (videoRef.current) videoRef.current.pause()
    setIsPaused(true)
  }, [])

  const resumeCamera = useCallback(() => {
    if (videoRef.current) videoRef.current.play().catch(() => { })
    setIsPaused(false)
  }, [])

  const toggleCamera = useCallback(async () => {
    if (operatingRef.current) return
    const newMode = cameraFacingMode === 'environment' ? 'user' : 'environment'
    setCameraFacingMode(newMode)
    stopCamera()
    await new Promise(r => setTimeout(r, 400))
    await startCamera(newMode)
  }, [cameraFacingMode, stopCamera, startCamera])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return useMemo(() => ({
    videoRef, isCameraActive, isPaused, cameraFacingMode, error,
    startCamera, stopCamera, pauseCamera, resumeCamera, toggleCamera,
    hasMultipleCameras, zoom, setZoom, zoomRange, streamRef
  }), [isCameraActive, isPaused, cameraFacingMode, error, startCamera, stopCamera, pauseCamera, resumeCamera, toggleCamera, hasMultipleCameras, zoom, setZoom, zoomRange])
}
