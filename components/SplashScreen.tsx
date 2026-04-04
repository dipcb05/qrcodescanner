'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Scan, Sparkles } from 'lucide-react'

interface SplashScreenProps {
  onStartClick: () => void
  isInstallable: boolean
  onInstall: () => void
}

export function SplashScreen({ onStartClick, isInstallable, onInstall }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Background Decorative Elements - Simplified for Performance */}
      <motion.div
        className="absolute w-96 h-96 bg-primary/5 rounded-full -top-20 -left-20"
        initial={{ opacity: 0.5 }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-secondary/10 rounded-full -bottom-20 -right-20"
        initial={{ opacity: 0.5 }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-12 max-w-sm">
        {/* Animated App Icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary to-primary/80 shadow-xl flex items-center justify-center text-primary-foreground transform group-hover:scale-105 transition-transform duration-300">
            <Scan className="w-16 h-16" strokeWidth={2.5} />
          </div>

          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg border-2 border-background"
            initial={{ y: 0 }}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Title and Tagline */}
        <div className="space-y-4">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl"
          >
            Quick <span className="text-primary italic">QR</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground font-medium"
          >
            Instant, secure, and smart scanning at your fingertips.
          </motion.p>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
          className="w-full flex items-center justify-center"
        >
          <Button
            onClick={onStartClick}
            size="lg"
            className="h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold shadow-2xl shadow-primary/30 gap-4 group ring-offset-background"
          >
            Start Scanning
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Scan className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </motion.div>
          </Button>
        </motion.div>

        {/* Install Button */}
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="outline"
              onClick={onInstall}
              className="rounded-full border-primary/20 hover:bg-primary/5 text-primary tracking-wide font-semibold px-8"
            >
              Install the App
            </Button>
          </motion.div>
        )}

        {/* Optional: Small footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-50"
        >
          v0.1.0
        </motion.div>
      </div>
    </motion.div>
  )
}
