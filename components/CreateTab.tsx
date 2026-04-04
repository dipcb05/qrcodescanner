'use client'
import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Trash2, Download, Copy, Link, Type, Wifi,
  Mail, Phone, MessageSquare,
  Sparkles, Share2, Eye, EyeOff, X, Tag, Link2, Check, Image
} from 'lucide-react'
import { toast } from 'sonner'
import { useCreateHistory, QRType } from '@/hooks/useCreateHistory'
import { ThemeToggle } from '@/components/ThemeToggle'

const QR_TYPES: { value: QRType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'text', label: 'Text', icon: Type, color: 'from-violet-500 to-purple-600' },
  { value: 'url', label: 'URL', icon: Link, color: 'from-blue-500 to-cyan-500' },
  { value: 'wifi', label: 'WiFi', icon: Wifi, color: 'from-emerald-500 to-green-600' },
  { value: 'email', label: 'Email', icon: Mail, color: 'from-amber-500 to-orange-600' },
  { value: 'phone', label: 'Phone', icon: Phone, color: 'from-pink-500 to-rose-600' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'from-indigo-500 to-blue-600' },
]

function getTypeInfo(type: QRType) {
  return QR_TYPES.find((t) => t.value === type) || QR_TYPES[0]
}

function renderQRToCanvas(
  svgElement: SVGSVGElement,
  labelText?: string
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new window.Image()
    img.onload = () => {
      const scale = 4
      const qrSize = img.width * scale
      const padding = Math.round(qrSize * 0.18)
      const labelHeight = labelText ? Math.round(qrSize * 0.1) : 0
      const totalWidth = qrSize + padding * 2
      const totalHeight = qrSize + padding * 2 + labelHeight

      const canvas = document.createElement('canvas')
      canvas.width = totalWidth
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context failed'))

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, totalWidth, totalHeight)

      ctx.drawImage(img, padding, padding, qrSize, qrSize)

      if (labelText) {
        const fontSize = Math.max(16, Math.round(qrSize * 0.04))
        ctx.fillStyle = '#666666'
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const maxWidth = totalWidth - padding * 2
        const displayLabel = labelText.length > 60 ? labelText.slice(0, 57) + '...' : labelText
        ctx.fillText(displayLabel, totalWidth / 2, qrSize + padding + labelHeight / 2, maxWidth)
      }

      const brandSize = Math.max(10, Math.round(qrSize * 0.025))
      ctx.fillStyle = '#cccccc'
      ctx.font = `500 ${brandSize}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Quick QR', totalWidth / 2, totalHeight - brandSize * 0.8)

      resolve(canvas)
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}

export function CreateTab() {
  const [selectedType, setSelectedType] = useState<QRType>('text')
  const [customName, setCustomName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [urlContent, setUrlContent] = useState('')
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [wifiHidden, setWifiHidden] = useState(false)
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsNumber, setSmsNumber] = useState('')
  const [smsBody, setSmsBody] = useState('')

  const [activeQR, setActiveQR] = useState<{ content: string; type: QRType; label: string; slug: string; customName: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const { history, addToHistory, deleteFromHistory, clearHistory, isMounted } = useCreateHistory()
  const qrRef = useRef<HTMLDivElement>(null)

  const buildQRContent = useCallback((): { content: string; label: string } | null => {
    switch (selectedType) {
      case 'text':
        if (!textContent.trim()) return null
        return { content: textContent, label: textContent.slice(0, 50) }
      case 'url':
        if (!urlContent.trim()) return null
        const url = urlContent.startsWith('http') ? urlContent : `https://${urlContent}`
        return { content: url, label: urlContent }
      case 'wifi':
        if (!wifiSSID.trim()) return null
        const wifiStr = `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`
        return { content: wifiStr, label: `WiFi: ${wifiSSID}` }
      case 'email':
        if (!emailAddress.trim()) return null
        const emailStr = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
        return { content: emailStr, label: emailAddress }
      case 'phone':
        if (!phoneNumber.trim()) return null
        return { content: `tel:${phoneNumber}`, label: phoneNumber }
      case 'sms':
        if (!smsNumber.trim()) return null
        const smsStr = smsBody ? `smsto:${smsNumber}:${smsBody}` : `smsto:${smsNumber}`
        return { content: smsStr, label: smsNumber }
      default:
        return null
    }
  }, [selectedType, textContent, urlContent, wifiSSID, wifiPassword, wifiEncryption, wifiHidden, emailAddress, emailSubject, emailBody, phoneNumber, smsNumber, smsBody])

  const handleCreate = () => {
    const result = buildQRContent()
    if (!result) {
      toast.error('Please fill in the required fields')
      return
    }
    const name = customName.trim()
    const slug = addToHistory(result.content, selectedType, result.label, name)
    setActiveQR({ content: result.content, type: selectedType, label: result.label, slug, customName: name })
    toast.success('QR Code Generated!', {
      icon: <Sparkles className="w-4 h-4" />,
    })
  }

  const findSVG = useCallback((qrContent: string): SVGSVGElement | null => {
    const svgId = `qr-svg-${qrContent}`
    let svg = document.getElementById(svgId) as unknown as SVGSVGElement
    if (!svg) {
      svg = document.getElementById('qr-active-preview') as unknown as SVGSVGElement
    }
    return svg || null
  }, [])

  const handleDownload = useCallback(async (qrContent: string, labelText?: string) => {
    const svg = findSVG(qrContent)
    if (!svg) {
      toast.error('Could not find QR element')
      return
    }
    try {
      const canvas = await renderQRToCanvas(svg, labelText)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `quickqr-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
      toast.success('QR image downloaded!')
    } catch {
      toast.error('Failed to render QR image')
    }
  }, [findSVG])

  const handleCopyImage = useCallback(async (qrContent: string, labelText?: string) => {
    const svg = findSVG(qrContent)
    if (!svg) {
      toast.error('Could not find QR element')
      return
    }
    try {
      const canvas = await renderQRToCanvas(svg, labelText)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image')
          return
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ])
          toast.success('QR image copied to clipboard!', {
            icon: <Image className="w-4 h-4" />,
          })
        } catch {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `quickqr-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
          toast.success('Image downloaded (clipboard unavailable)')
        }
      }, 'image/png')
    } catch {
      toast.error('Failed to copy QR image')
    }
  }, [findSVG])

  const getDeepLink = useCallback((slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/qr/${slug}`
  }, [])

  const handleCopyLink = useCallback((slug: string) => {
    const link = getDeepLink(slug)
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    toast.success('Share link copied!')
    setTimeout(() => setCopiedLink(false), 2000)
  }, [getDeepLink])

  const handleShare = useCallback(async (slug: string, displayName: string) => {
    const link = getDeepLink(slug)
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName || 'Quick QR Code',
          text: `Check out this QR code: ${displayName}`,
          url: link,
        })
      } catch { }
    } else {
      navigator.clipboard.writeText(link)
      toast.success('Share link copied!')
    }
  }, [getDeepLink])

  const currentTypeInfo = getTypeInfo(selectedType)

  if (!isMounted) return <div className="w-full h-full bg-background" />

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Create QR</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
              {history.length} created
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {QR_TYPES.map((type) => {
            const isActive = selectedType === type.value
            return (
              <button
                key={type.value}
                onClick={() => { setSelectedType(type.value); setActiveQR(null) }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Label (optional)
            </label>
            <Input
              placeholder="Give this QR a name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="bg-secondary/30 border-primary/10 rounded-xl"
            />
          </div>

          {selectedType === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Text Content</label>
              <Textarea
                placeholder="Enter any text, note, or message..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[100px] bg-secondary/30 border-primary/10 rounded-2xl resize-none"
              />
            </div>
          )}

          {selectedType === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="example.com or https://..."
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="pl-10 bg-secondary/30 border-primary/10 rounded-xl"
                />
              </div>
            </div>
          )}

          {selectedType === 'wifi' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Network Name (SSID)</label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Your WiFi network name"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    className="pl-10 bg-secondary/30 border-primary/10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input
                    type={showWifiPassword ? 'text' : 'password'}
                    placeholder="WiFi password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="pr-10 bg-secondary/30 border-primary/10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWifiPassword(!showWifiPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                  <button
                    key={enc}
                    onClick={() => setWifiEncryption(enc)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${wifiEncryption === enc
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    {enc === 'nopass' ? 'Open' : enc}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifiHidden}
                  onChange={(e) => setWifiHidden(e.target.checked)}
                  className="rounded accent-primary"
                />
                Hidden network
              </label>
            </div>
          )}

          {selectedType === 'email' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="pl-10 bg-secondary/30 border-primary/10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject (optional)</label>
                <Input
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="bg-secondary/30 border-primary/10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Body (optional)</label>
                <Textarea
                  placeholder="Email body..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[80px] bg-secondary/30 border-primary/10 rounded-2xl resize-none"
                />
              </div>
            </div>
          )}

          {selectedType === 'phone' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="pl-10 bg-secondary/30 border-primary/10 rounded-xl"
                />
              </div>
            </div>
          )}

          {selectedType === 'sms' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={smsNumber}
                    onChange={(e) => setSmsNumber(e.target.value)}
                    className="pl-10 bg-secondary/30 border-primary/10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message (optional)</label>
                <Textarea
                  placeholder="Pre-filled SMS message..."
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="min-h-[80px] bg-secondary/30 border-primary/10 rounded-2xl resize-none"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleCreate}
            className={`w-full h-12 rounded-2xl text-sm font-bold bg-gradient-to-r ${currentTypeInfo.color} text-white border-0 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeQR && (
            <motion.div
              key={activeQR.content + activeQR.slug}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative flex flex-col items-center gap-5 py-8 px-4 bg-gradient-to-b from-card/60 to-card/20 border border-border/50 rounded-3xl backdrop-blur-sm"
            >
              <button
                onClick={() => setActiveQR(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {activeQR.customName && (
                <h3 className="text-lg font-bold text-foreground text-center px-8">{activeQR.customName}</h3>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${getTypeInfo(activeQR.type).color} text-white text-xs font-bold shadow-md`}>
                {React.createElement(getTypeInfo(activeQR.type).icon, { className: 'w-3 h-3' })}
                {getTypeInfo(activeQR.type).label}
              </div>

              <div ref={qrRef} className="p-5 bg-white rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30">
                <QRCodeSVG
                  id="qr-active-preview"
                  value={activeQR.content}
                  size={220}
                  level="H"
                  includeMargin={true}
                  style={{ display: 'block' }}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-[260px] break-all font-mono leading-relaxed bg-secondary/30 px-3 py-2 rounded-xl">
                {activeQR.label.length > 80 ? activeQR.label.slice(0, 80) + '...' : activeQR.label}
              </p>
              {activeQR.slug && (
                <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2 max-w-full">
                  <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    /qr/{activeQR.slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(activeQR.slug)}
                    className="shrink-0 p-1 rounded-lg hover:bg-primary/10 text-primary transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  onClick={() => handleDownload(activeQR.content, activeQR.customName || activeQR.label)}
                  variant="outline"
                  className="rounded-full gap-2 border-primary/20 bg-background/50 hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button
                  onClick={() => handleCopyImage(activeQR.content, activeQR.customName || activeQR.label)}
                  variant="outline"
                  className="rounded-full gap-2 border-primary/20 bg-background/50 hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <Image className="w-4 h-4" /> Copy Image
                </Button>
                <Button
                  onClick={() => handleShare(activeQR.slug, activeQR.customName || activeQR.label)}
                  variant="outline"
                  className="rounded-full gap-2 border-primary/20 bg-background/50 hover:bg-primary/10 hover:border-primary/40 transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share Link
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">
              Created QR Codes
            </h2>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive hover:bg-destructive/10 h-7 px-2.5 rounded-full text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-secondary/10 rounded-3xl border border-dashed border-border/50"
              >
                <div className="text-4xl mb-3 opacity-15">✨</div>
                <p className="text-sm text-muted-foreground/70 font-medium">No QR codes created yet</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Select a type above to get started</p>
              </motion.div>
            ) : (
              <div className="grid gap-2.5">
                {history.map((item, index) => {
                  const typeInfo = getTypeInfo(item.type || 'text')
                  const TypeIcon = typeInfo.icon
                  const displayName = item.customName || item.label || item.content
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group relative flex items-center gap-3 p-3 bg-card/30 border border-border/40 rounded-2xl backdrop-blur-sm hover:bg-card/50 hover:border-border/60 transition-all duration-200"
                    >
                      <div className="relative shrink-0">
                        <div className="p-1.5 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                          <QRCodeSVG
                            id={`qr-svg-${item.content}`}
                            value={item.content}
                            size={44}
                            level="M"
                          />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r ${typeInfo.color} flex items-center justify-center shadow-sm`}>
                          <TypeIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-20">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r ${typeInfo.color} text-white`}>
                            {typeInfo.label}
                          </span>
                          {item.slug && (
                            <span className="text-[10px] text-primary/60 font-mono truncate max-w-[100px]">
                              /{item.slug}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="absolute right-2 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setActiveQR({ content: item.content, type: item.type || 'text', label: item.label || item.content, slug: item.slug, customName: item.customName || '' })}
                          className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyImage(item.content, item.customName || item.label)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(item.content, item.customName || item.label)}
                          className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteFromHistory(item.id)}
                          className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
