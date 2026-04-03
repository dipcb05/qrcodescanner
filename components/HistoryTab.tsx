'use client'
import React, { useState, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, Download, Copy, Search as SearchIcon, FolderOpen, Share2, Calendar, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { HistoryItem } from '@/hooks/useScanHistory'

interface HistoryTabProps {
  history: HistoryItem[]
  onDelete: (id: string) => void
  onClear: () => void
  onExport: () => void
  onCopy: (text: string, id: string) => void
  onShare: (text: string, format: string) => void
  onViewSettings: () => void
  isPermissionRequired: boolean
  onReconnectFolder: () => void
}

export function HistoryTab({
  history,
  onDelete,
  onClear,
  onExport,
  onCopy,
  onShare,
  onViewSettings,
  isPermissionRequired,
  onReconnectFolder,
}: HistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history

    const lowerQuery = searchQuery.toLowerCase()
    return history.filter(
      (item) =>
        item.text.toLowerCase().includes(lowerQuery) ||
        item.format.toLowerCase().includes(lowerQuery)
    )
  }, [history, searchQuery])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Scan History</h1>
          <div className="flex gap-1.5 items-center">
            {isPermissionRequired && (
              <Button
                size="sm"
                variant="outline"
                onClick={onReconnectFolder}
                className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 gap-2 h-9"
                aria-label="Sync with local folder"
              >
                <FolderOpen className="w-4 h-4 animate-pulse" />
                Sync
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onViewSettings}
              className="text-muted-foreground hover:text-foreground h-9 w-9"
              aria-label="Go to settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
            {history.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsExportModalOpen(true)}
                  className="border-primary/20 hover:bg-primary/10 gap-2 h-9"
                  aria-label="Export history to CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
                  aria-label="Clear all history"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-primary/20 placeholder:text-muted-foreground"
            aria-label="Search history"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 px-4">
              <div className="w-16 h-16 rounded-full bg-secondary/50 mx-auto flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {history.length === 0 ? 'No Scans Yet' : 'No Matches'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {history.length === 0
                  ? 'Scanned barcodes will appear here'
                  : 'Try a different search term'}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-4 space-y-2"
          >
            {filteredHistory.map((historyItem) => (
              <HistoryItemCard
                key={historyItem.id}
                item={historyItem}
                onShare={onShare}
                onCopy={onCopy}
                onDelete={setItemToDelete}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Individual Delete Confirmation Modal */}
      <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] max-w-[320px]">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Delete Scan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This item will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 rounded-full border-none bg-secondary hover:bg-secondary/80">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  onDelete(itemToDelete)
                  setItemToDelete(null)
                }
              }}
              className="flex-1 rounded-full bg-destructive hover:bg-destructive/90"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Modal */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="rounded-[2rem] max-w-[320px]">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl">Clear All History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all scanned records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 rounded-full border-none bg-secondary hover:bg-secondary/80">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClear()
                setShowClearConfirm(false)
              }}
              className="flex-1 rounded-full bg-red-500 hover:bg-red-600"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Date Range Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-sm rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Export History</DialogTitle>
            <DialogDescription className="text-center">
              Select a date range to filter your export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase px-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={() => {
                onExport()
                setIsExportModalOpen(false)
                toast.success('Generated CSV export')
              }}
              className="w-full rounded-full"
            >
              Download CSV
            </Button>
            <Button variant="ghost" onClick={() => setIsExportModalOpen(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const HistoryItemCard = memo(({ 
  item, 
  onShare, 
  onCopy, 
  onDelete 
}: { 
  item: HistoryItem, 
  onShare: (t: string, f: string) => void, 
  onCopy: (t: string, id: string) => void, 
  onDelete: (id: string) => void 
}) => {
  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const wifiInfo = useMemo(() => {
    if (!item.text.startsWith('WIFI:')) return null
    const ssidMatch = item.text.match(/S:([^;]+);/i)
    return ssidMatch ? ssidMatch[1] : null
  }, [item.text])

  return (
    <motion.div
      variants={itemAnim}
      className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm hover:bg-card/80 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase ${wifiInfo ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'} px-2 py-0.5 rounded-full border ${wifiInfo ? 'border-green-500/20' : 'border-primary/20'}`}>
              {wifiInfo ? 'WIFI' : item.format}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
              {new Date(item.timestamp).toLocaleTimeString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className={`text-sm break-all leading-relaxed ${wifiInfo ? 'font-bold text-foreground' : 'font-mono text-foreground/80'}`}>
            {wifiInfo ? `Network: ${wifiInfo}` : item.text}
          </p>
          {item.copyCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">
              Copied {item.copyCount} time{item.copyCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShare(item.text, item.format)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCopy(item.text, item.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
})

HistoryItemCard.displayName = 'HistoryItemCard'
