'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Copy, Search, Share2, X, Check, Clock, Tag, History, Loader2, ArrowRight, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ScanResultModalProps {
  isOpen: boolean
  result: {
    text: string
    format: string
    timestamp: string | Date
  } | null
  onClose: () => void
  onCopy: () => void
  isCopied: boolean
  onShare?: () => Promise<void>
}

export function ScanResultModal({
  isOpen,
  result,
  onClose,
  onCopy,
  isCopied,
  onShare,
}: ScanResultModalProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleShare = async () => {
    if (!result) return
    setIsSharing(true)

    try {
      if (onShare) {
        await onShare()
      } else if (navigator.share) {
        await navigator.share({
          title: 'Scanned QR Code',
          text: result.text,
          url: result.text.startsWith('http') ? result.text : undefined
        })
        toast.success('Shared successfully')
      } else {
        onCopy()
        toast.info('Share not supported, copied to clipboard instead')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Could not share')
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleGoogleSearch = async () => {
    if (!result) return
    setIsSearching(true)

    await new Promise(r => setTimeout(r, 600))

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(result.text)}`
      window.open(searchUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsSearching(false)
    }
  }

  const handleGoToHistory = () => {
    onClose()
    router.push('/history')
  }

  const parseWifi = (text: string) => {
    if (!text.startsWith('WIFI:')) return null
    const ssidMatch = text.match(/S:([^;]+);/i)
    const passMatch = text.match(/P:([^;]+);/i)
    const typeMatch = text.match(/T:([^;]+);/i)
    return {
      ssid: ssidMatch ? ssidMatch[1] : 'Unknown',
      password: passMatch ? passMatch[1] : '',
      type: typeMatch ? typeMatch[1] : 'WPA'
    }
  }

  const wifiInfo = result ? parseWifi(result.text) : null

  const handleConnectWifi = () => {
    if (!result) return
    window.location.href = result.text
    toast.success('Attempting to connect to ' + wifiInfo?.ssid)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-lg bg-card border border-border/50 sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl pb-10 sm:pb-8 h-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Grab Bar for mobile */}
            <div className="w-full flex justify-center py-4 sm:hidden">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            <div className="px-6 space-y-6 pt-2">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {wifiInfo ? 'WiFi Configuration' : 'Decoded Code'}
                  </h2>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                      <Tag className="w-2.5 h-2.5" />
                      {wifiInfo ? 'WIFI' : result?.format || 'UNKNOWN'}
                    </span>
                    <span className="flex items-center gap-1 opacity-70">
                      <Clock className="w-2.5 h-2.5" />
                      JUST NOW
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-10 h-10 hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Result Code Display */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors rounded-3xl" />
                <div className="relative bg-secondary/30 border border-primary/10 rounded-3xl p-6 shadow-inner space-y-4">
                  {wifiInfo ? (
                    <div className="space-y-4 w-full">
                      <div className="bg-background/40 p-4 rounded-2xl space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Network Name (SSID)</p>
                        <p className="text-lg font-bold text-foreground">{wifiInfo.ssid}</p>
                      </div>
                      {wifiInfo.password && (
                        <div className="bg-background/40 p-4 rounded-2xl space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Password</p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-mono text-foreground">{wifiInfo.password}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(wifiInfo.password)
                                toast.success('Password copied')
                              }}
                              className="h-8 w-8 hover:bg-primary/10 text-primary"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={handleConnectWifi}
                        className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-2xl gap-2 font-bold shadow-lg shadow-green-500/20"
                      >
                        <Zap className="w-5 h-5" />
                        Connect to WiFi
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xl font-mono text-center break-all select-all leading-relaxed tracking-tight text-foreground/90 py-2">
                      {result?.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={onCopy} variant="outline" className={`h-16 rounded-2xl gap-3 text-sm font-bold border-border/40 hover:bg-primary/5 transition-all active:scale-95 ${isCopied ? 'text-green-500 border-green-500/30' : ''}`}>
                  {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5 opacity-70" />}
                  {isCopied ? 'Copy Text' : 'Copy Result'}
                </Button>

                <Button onClick={handleGoogleSearch} disabled={isSearching} variant="outline" className="h-16 rounded-2xl gap-3 text-sm font-bold border-border/40 hover:bg-primary/5 transition-all active:scale-95">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Search className="w-5 h-5 opacity-70" />}
                  Web Search
                </Button>

                <Button onClick={handleShare} disabled={isSharing} variant="outline" className="h-16 rounded-2xl gap-3 text-sm font-bold border-border/40 hover:bg-primary/5 transition-all active:scale-95">
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Share2 className="w-5 h-5 opacity-70" />}
                  Share Result
                </Button>

                <Button onClick={handleGoToHistory} variant="outline" className="h-16 rounded-2xl gap-3 text-sm font-bold border-border/40 hover:bg-primary/5 transition-all active:scale-95">
                  <History className="w-5 h-5 opacity-70" />
                  View History
                </Button>

                <Button onClick={onClose} variant="default" className="col-span-2 h-16 rounded-2xl gap-3 text-base font-bold shadow-2xl shadow-primary/30 mt-2 active:scale-[0.98] transition-all">
                  Dismiss
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
