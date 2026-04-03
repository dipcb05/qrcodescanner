'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Volume2, Smartphone, Download, RotateCcw, FolderOpen, Clipboard, Repeat } from 'lucide-react'
import { ScanSettings } from '@/hooks/useScanSettings'

interface SettingsTabProps {
  settings: ScanSettings
  onUpdateSetting: <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => void
  onResetSettings: () => void
  isInstallable: boolean
  onInstall: () => void
  isFolderConnected: boolean
  folderName: string | null
  onConnectFolder: () => void
}

export function SettingsTab({
  settings,
  onUpdateSetting,
  onResetSettings,
  isInstallable,
  onInstall,
  isFolderConnected,
  folderName,
  onConnectFolder,
}: SettingsTabProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-y-scroll">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 p-4 space-y-4 pb-24"
      >
        {/* Sound Settings */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sound Notifications</h3>
                <p className="text-xs text-muted-foreground">Play sound on successful scan</p>
              </div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                onUpdateSetting('soundEnabled', checked)
              }
              aria-label="Toggle sound notifications"
            />
          </div>
        </motion.div>

        {/* Vibration Settings */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Vibration Feedback</h3>
                <p className="text-xs text-muted-foreground">
                  Vibrate device on successful scan
                </p>
              </div>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) =>
                onUpdateSetting('vibrationEnabled', checked)
              }
              aria-label="Toggle vibration feedback"
            />
          </div>
        </motion.div>

        {/* Auto-Copy Settings */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clipboard className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Auto-Copy to Clipboard</h3>
                <p className="text-xs text-muted-foreground">Automatically copy text after scan</p>
              </div>
            </div>
            <Switch
              checked={settings.autoCopyToClipboard}
              onCheckedChange={(checked) =>
                onUpdateSetting('autoCopyToClipboard', checked)
              }
              aria-label="Toggle auto-copy"
            />
          </div>
        </motion.div>

        {/* Continuous Scan Mode */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Continuous Scanning</h3>
                <p className="text-xs text-muted-foreground">Keep scanning without pausing</p>
              </div>
            </div>
            <Switch
              checked={settings.continuousScan}
              onCheckedChange={(checked) =>
                onUpdateSetting('continuousScan', checked)
              }
              aria-label="Toggle continuous scan"
            />
          </div>
        </motion.div>

        {/* Install PWA */}
        {isInstallable && (
          <motion.div
            variants={item}
            className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Install App</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add Quick QR to your home screen for quick access
                  </p>
                </div>
              </div>
              <Button
                onClick={onInstall}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                aria-label="Install app"
              >
                Install
              </Button>
            </div>
          </motion.div>
        )}

        {/* Local Storage Connection */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isFolderConnected ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                <FolderOpen className={`w-5 h-5 ${isFolderConnected ? 'text-green-500' : 'text-primary'}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  {folderName ? 'Local Folder Path' : 'Local Folder Storage'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {folderName ? `Connected: ${folderName}` : 'Offline - Connect for auto-save'}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant={folderName ? "ghost" : "default"}
              onClick={onConnectFolder}
              className={`rounded-full h-8 px-4 text-xs font-semibold ${!folderName ? 'bg-primary hover:bg-primary/90' : ''}`}
            >
              {folderName ? 'Change' : 'Connect'}
            </Button>
          </div>
        </motion.div>

        {/* Reset Settings */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Reset Settings</h3>
                <p className="text-xs text-muted-foreground">Restore default settings</p>
              </div>
            </div>
            <Button
              onClick={onResetSettings}
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              aria-label="Reset all settings"
            >
              Reset
            </Button>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          variants={item}
          className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm mt-auto pb-4"
        >
          <div className="space-y-1 text-center">
            <h3 className="font-semibold text-sm text-foreground">Quick QR</h3>
            <p className="text-[10px] text-muted-foreground">
              Version 2.2.0 • Routing System Active
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
