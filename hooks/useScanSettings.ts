import { useState, useCallback, useEffect } from 'react'

export interface ScanSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  autoCopyToClipboard: boolean
  continuousScan: boolean
  cameraPermissionGranted: boolean
  showInstallPrompt: boolean
}

interface UseScanSettingsReturn {
  settings: ScanSettings
  updateSetting: <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => void
  resetSettings: () => void
}

const STORAGE_KEY = 'scan-settings'
const DEFAULT_SETTINGS: ScanSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  autoCopyToClipboard: false,
  continuousScan: false,
  cameraPermissionGranted: false,
  showInstallPrompt: true,
}

export const useScanSettings = (): UseScanSettingsReturn => {
  const [settings, setSettings] = useState<ScanSettings>(DEFAULT_SETTINGS)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (err) {
        console.error('Failed to save settings:', err)
      }
    }
  }, [settings, isMounted])

  const updateSetting = useCallback(
    <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { settings, updateSetting, resetSettings }
}
