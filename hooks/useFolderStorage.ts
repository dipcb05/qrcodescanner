import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

interface SaveScanParams {
  id: string
  text: string
  format: string
  timestamp: string
  imageBlob?: Blob | null
}

interface UseFolderStorageReturn {
  isFolderConnected: boolean
  isPermissionRequired: boolean
  folderName: string | null
  connectFolder: () => Promise<boolean>
  reconnectFolder: () => Promise<boolean>
  saveScanToFolder: (params: SaveScanParams) => Promise<boolean>
}

const DB_NAME = 'StorageHandlesDB'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'root-directory-handle'

export const useFolderStorage = (): UseFolderStorageReturn => {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [isFolderConnected, setIsFolderConnected] = useState(false)
  const [isPermissionRequired, setIsPermissionRequired] = useState(false)
  const [folderName, setFolderName] = useState<string | null>(null)

  useEffect(() => {
    const loadHandle = async () => {
      try {
        const idb = await openDB()
        const storedHandle = await getFromDB(idb, HANDLE_KEY)

        if (storedHandle) {
          setHandle(storedHandle)
          setFolderName(storedHandle.name)

          const status = await (storedHandle as any).queryPermission({ mode: 'readwrite' })
          if (status === 'granted') {
            setIsFolderConnected(true)
            setIsPermissionRequired(false)
          } else {
            setIsFolderConnected(false)
            setIsPermissionRequired(true)
          }
        }
      } catch (err) {
        console.error('Failed to load folder handle:', err)
      }
    }
    loadHandle()
  }, [])

  const connectFolder = useCallback(async () => {
    try {
      if (!(window as any).showDirectoryPicker) {
        toast.error('Local folder storage is not supported in this browser. Try Chrome or Edge.')
        return false
      }

      const newHandle = await (window as any).showDirectoryPicker({
        id: 'qrcodescanner-root',
        mode: 'readwrite',
        startIn: 'pictures'
      })

      setHandle(newHandle)
      setIsFolderConnected(true)
      setIsPermissionRequired(false)
      setFolderName(newHandle.name)

      const idb = await openDB()
      await saveToDB(idb, HANDLE_KEY, newHandle)

      toast.success(`Connected to folder: ${newHandle.name}`)
      return true
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to connect folder:', err)
        toast.error('Failed to connect folder')
      }
      return false
    }
  }, [])

  const reconnectFolder = useCallback(async () => {
    if (!handle) {
      await connectFolder()
      return false
    }

    try {
      const status = await (handle as any).requestPermission({ mode: 'readwrite' })
      if (status === 'granted') {
        setIsFolderConnected(true)
        setIsPermissionRequired(false)
        toast.success(`Storage re-activated: ${handle.name}`)
        return true
      } else {
        toast.error('Permission denied')
        return false
      }
    } catch (err) {
      console.error('Failed to reconnect folder:', err)
      await connectFolder()
      return false
    }
  }, [handle, connectFolder])

  const saveScanToFolder = useCallback(async ({ id, text, format, timestamp, imageBlob }: SaveScanParams) => {
    if (!handle) return false

    try {
      const status = await (handle as any).queryPermission({ mode: 'readwrite' })
      if (status !== 'granted') {
        setIsFolderConnected(false)
        setIsPermissionRequired(true)
        return false
      }

      const scansDir = await handle.getDirectoryHandle('Scans', { create: true })
      const baseFileName = `${timestamp.replace(/[:.]/g, '-')}-${id.slice(0, 4)}`

      const dataFileName = `${baseFileName}.json`
      const dataFileHandle = await scansDir.getFileHandle(dataFileName, { create: true })
      const dataWritable = await (dataFileHandle as any).createWritable()
      await dataWritable.write(JSON.stringify({ id, text, format, timestamp }, null, 2))
      await dataWritable.close()

      const txtFileName = `${baseFileName}.txt`
      const txtFileHandle = await scansDir.getFileHandle(txtFileName, { create: true })
      const txtWritable = await (txtFileHandle as any).createWritable()
      await txtWritable.write(text)
      await txtWritable.close()

      if (imageBlob) {
        const imageFileName = `${baseFileName}.jpg`
        const imageFileHandle = await scansDir.getFileHandle(imageFileName, { create: true })
        const imageWritable = await (imageFileHandle as any).createWritable()
        await imageWritable.write(imageBlob)
        await imageWritable.close()
      }

      return true
    } catch (err) {
      console.error('Failed to save to folder:', err)
      return false
    }
  }, [handle])

  return {
    isFolderConnected,
    isPermissionRequired,
    folderName,
    connectFolder,
    reconnectFolder,
    saveScanToFolder
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function saveToDB(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function getFromDB(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
