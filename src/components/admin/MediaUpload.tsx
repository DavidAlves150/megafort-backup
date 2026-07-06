'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Loader2, Play, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface MediaUploadProps {
  images: string[]
  videos: string[]
  onImagesChange: (imgs: string[]) => void
  onVideosChange: (vids: string[]) => void
  maxImages?: number
  maxVideos?: number
}

export function MediaUpload({
  images, videos, onImagesChange, onVideosChange,
  maxImages = 10, maxVideos = 3,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const supabase = createClient()

  const upload = useCallback(async (file: File): Promise<string | null> => {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) { toast.error('Apenas imagens (JPG,PNG,WEBP) ou vídeos (MP4,MOV,WEBM).'); return null }
    if (file.size > 50 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 50MB.'); return null }

    const ext  = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from('produtos').upload(name, file, { contentType: file.type })
    if (error) { toast.error('Erro ao enviar arquivo.'); return null }

    const { data: { publicUrl } } = supabase.storage.from('produtos').getPublicUrl(name)
    return publicUrl
  }, [supabase])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const url = await upload(file)
      if (!url) continue
      if (file.type.startsWith('video/')) {
        if (videos.length < maxVideos) onVideosChange([...videos, url])
        else toast.error(`Máximo ${maxVideos} vídeos.`)
      } else {
        if (images.length < maxImages) onImagesChange([...images, url])
        else toast.error(`Máximo ${maxImages} imagens.`)
      }
    }
    toast.success('Mídia enviada!')
    setUploading(false)
  }, [images, videos, maxImages, maxVideos, upload, onImagesChange, onVideosChange])

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('media-input')?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-border hover:border-[var(--brand-primary)]/40'
        }`}
      >
        <input id="media-input" type="file" accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="text-[var(--brand-primary)] animate-spin" />
            <p className="font-body text-sm text-muted-foreground">Enviando...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-[var(--brand-primary)]" />
            <p className="font-body text-sm text-foreground font-semibold">Clique ou arraste aqui</p>
            <p className="font-body text-xs text-muted-foreground">Imagens: JPG, PNG, WEBP • Vídeos: MP4, MOV, WEBM • Máx 50MB</p>
          </div>
        )}
      </div>

      {/* Images preview */}
      {images.length > 0 && (
        <div>
          <p className="form-label flex items-center gap-1.5 mb-2"><ImageIcon size={12} />Imagens ({images.length}/{maxImages})</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            <AnimatePresence>
              {images.map((url, i) => (
                <motion.div key={url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square group">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-border" />
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-[var(--brand-primary)] text-black px-1.5 py-0.5 rounded font-display">CAPA</span>}
                  <button onClick={() => onImagesChange(images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} className="text-white" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Videos preview */}
      {videos.length > 0 && (
        <div>
          <p className="form-label flex items-center gap-1.5 mb-2"><Play size={12} />Vídeos ({videos.length}/{maxVideos})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {videos.map((url, i) => (
                <motion.div key={url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-video bg-muted rounded-xl border border-border group overflow-hidden">
                  <video src={url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={20} className="text-white/80 fill-white/80" />
                  </div>
                  <button onClick={() => onVideosChange(videos.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} className="text-white" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
