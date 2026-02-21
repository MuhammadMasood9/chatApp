import { supabaseBrowser } from '@/lib/supabase/browser'

export type StorageUploadResult = {
  path: string
  publicUrl: string
  contentType?: string
  size?: number
}

const BUCKET = 'message_uploads'

const getFileExt = (name: string) => {
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return parts[parts.length - 1].toLowerCase()
}

const buildPath = (payload: {
  userId: string
  roomId: string
  ext?: string
}) => {
  const safeExt = payload.ext ? `.${payload.ext}` : ''
  return `${payload.roomId}/${payload.userId}/${Date.now()}${safeExt}`
}

export const storageService = {
  uploadMessageFile: async (payload: {
    file: File
    userId: string
    roomId: string
  }): Promise<StorageUploadResult> => {
    const ext = getFileExt(payload.file.name) || payload.file.type.split('/')[1] || ''
    const path = buildPath({ userId: payload.userId, roomId: payload.roomId, ext })

    const { error } = await supabaseBrowser()
      .storage
      .from(BUCKET)
      .upload(path, payload.file, {
        upsert: false,
        contentType: payload.file.type || undefined,
      })

    if (error) throw error

    const { data } = supabaseBrowser().storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = data.publicUrl

    if (!publicUrl) {
      throw new Error('Failed to create public URL')
    }

    return {
      path,
      publicUrl,
      contentType: payload.file.type || undefined,
      size: payload.file.size,
    }
  },
}
