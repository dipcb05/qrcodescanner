'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { HistoryTab } from '@/components/HistoryTab'
import { useScanHistory } from '@/hooks/useScanHistory'
import { useFolderStorage } from '@/hooks/useFolderStorage'
import { toast } from 'sonner'

export default function HistoryPage() {
  const router = useRouter()
  const { history, deleteFromHistory, clearHistory, exportToCSV, incrementCopyCount } = useScanHistory()
  const { isFolderConnected, isPermissionRequired, folderName, connectFolder, reconnectFolder, saveScanToFolder } = useFolderStorage()

  const handleReconnect = useCallback(async () => {
    const success = await reconnectFolder()
    if (success && history.length > 0) {
      toast.loading('Syncing data to local folder...', { id: 'history-sync' })
      let savedCount = 0
      for (const item of history) {
        const saved = await saveScanToFolder({
          id: item.id,
          text: item.text,
          format: item.format,
          timestamp: item.timestamp,
        })
        if (saved) savedCount++
      }

      if (savedCount > 0) {
        toast.success(`Synced ${savedCount} records to your local folder`, { id: 'history-sync' })
      } else {
        toast.dismiss('history-sync')
      }
    }
  }, [reconnectFolder, history, saveScanToFolder])

  const handleCopy = useCallback((text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      incrementCopyCount(text)
      toast.success('Copied to clipboard', { id: 'history-copy' })
    }
  }, [incrementCopyCount])

  const handleShare = useCallback(async (text: string, format: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Scanned Barcode',
          text: `Barcode: ${text}\nFormat: ${format}`,
          url: window.location.origin,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        toast.info('Copied! (Native share not supported)')
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Share error:', err)
    }
  }, [])

  return (
    <div className="h-full bg-background">
      <HistoryTab
        history={history}
        onDelete={(id) => { deleteFromHistory(id); toast.success('Scan deleted', { id: 'history-delete' }) }}
        onClear={clearHistory}
        onExport={exportToCSV}
        onCopy={handleCopy}
        onShare={handleShare}
        onViewSettings={() => router.push('/settings')}
        isPermissionRequired={isPermissionRequired}
        onReconnectFolder={handleReconnect}
      />
    </div>
  )
}
