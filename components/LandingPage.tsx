'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Scan, Shield, Zap, Database, Smartphone, Download, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'

export function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    if (isStandalone) {
      setIsInstallable(false)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS && !isStandalone) {
      setIsInstallable(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
        toast.success('Thank you for installing Quick QR!')
      }
    } else {
      toast.info('Tap the Share icon and select "Add to Home Screen" to install.', {
        id: 'ios-install',
        duration: 8000,
        position: 'top-center',
        description: 'Enjoy fast, ad-free scanning directly from your device.'
      })
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  }

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100svh] px-6 text-center space-y-10 pb-20 pt-8 overflow-hidden">
      <div className="fixed top-6 right-6 z-[120]">
        <ThemeToggle />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-md mx-auto"
      >
        <motion.div variants={item} className="flex justify-center">
          <div className="w-24 h-24 p-1 rounded-[2rem] bg-card/40 border border-border flex items-center justify-center shadow-2xl shadow-primary/20 backdrop-blur-sm overflow-hidden">
            <img
              src="/logo.png"
              alt="Quick QR Logo"
              className="w-full h-full object-contain rounded-3xl"
            />
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-4 px-2">
          <p className="text-base font-bold text-foreground/80 italic">
            Just scan. That’s it.
          </p>
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-4 pt-2">
          <Link href="/scan" className="w-full">
            <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-2xl shadow-primary/30 h-14 w-full bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]">
              Launch Scanner
            </Button>
          </Link>

          <AnimatePresence>
            {isInstallable && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Button
                  onClick={handleInstallClick}
                  variant="outline"
                  size="default"
                  className="rounded-full px-6 text-sm font-bold h-12 w-full border-primary/20 bg-muted/20 hover:bg-muted/40 text-primary gap-2 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-4 w-full max-w-md"
      >
        <div className="p-4 rounded-2xl bg-card/60 border border-border shadow-sm space-y-2 text-left backdrop-blur-sm">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Ad-Free</h3>
        </div>
        <div className="p-4 rounded-2xl bg-card/60 border border-border shadow-sm space-y-2 text-left backdrop-blur-sm">
          <Shield className="w-4 h-4 text-green-500" />
          <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Private</h3>
        </div>
        <div className="p-4 rounded-2xl bg-card/60 border border-border shadow-sm space-y-2 text-left backdrop-blur-sm">
          <Database className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">History</h3>
        </div>
        <div className="p-4 rounded-2xl bg-card/60 border border-border shadow-sm space-y-2 text-left backdrop-blur-sm">
          <Smartphone className="w-4 h-4 text-purple-500" />
          <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80">Offline</h3>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className="fixed bottom-6 right-6 z-[100]"
      >
        <a
          href="https://buymeacoffee.com/dipcb05"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            className="rounded-full shadow-2xl bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 transition-all hover:scale-105 active:scale-95 group border-2 border-black/10 px-6 h-14 flex items-center gap-3"
            aria-label="Buy me a coffee"
          >
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center transition-transform group-hover:rotate-12">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Buy me a coffee</span>
          </Button>
        </a>
      </motion.div>
    </div>
  )
}
