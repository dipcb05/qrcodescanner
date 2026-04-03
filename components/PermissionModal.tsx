'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Camera, Shield, CheckCircle2 } from 'lucide-react'

interface PermissionModalProps {
  isOpen: boolean
  onAccept: () => void
  onClose?: () => void
}

export function PermissionModal({ isOpen, onAccept, onClose }: PermissionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Camera Access</h2>
              <p className="text-sm text-muted-foreground">
                Quick QR needs camera permission to scan barcodes and QR codes locally on your device.
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <Button onClick={onAccept} className="w-full rounded-full h-12 text-base font-semibold shadow-lg shadow-primary/20">
                Grant Permission
              </Button>
              {onClose && (
                <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
                  Not now
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3 text-green-500" />
              <span>Private & Secure • Works Offline</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
