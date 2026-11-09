'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ProdutoPublico } from '@/types'
import { orderMessage, trackAndOpenWhatsApp } from '@/lib/utils/whatsapp'

interface Props {
  produto: ProdutoPublico
  initialUrl?: string
  disabled: boolean
  className: string
  children: ReactNode
}

export function PhotoPurchaseButton({ produto, initialUrl, disabled, className, children }: Props) {
  const [open, setOpen] = useState(false)
  const photos = (produto.imagens || []).filter(photo => photo.url).sort((a, b) => a.ordem - b.ordem)
  return <>
    <button type="button" disabled={disabled} className={className} onClick={() => {
      if (photos.length) setOpen(true)
      else trackAndOpenWhatsApp(produto)
    }}>{children}</button>
    {open && !disabled && photos.length > 0 && <PhotoPicker produto={produto} urls={photos.map(photo => photo.url)}
      initialIndex={Math.max(0, photos.findIndex(photo => photo.url === initialUrl))} onClose={() => setOpen(false)} />}
  </>
}

function PhotoPicker({ produto, urls, initialIndex, onClose }: {
  produto: ProdutoPublico; urls: string[]; initialIndex: number; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, select] = useState(initialIndex)
  const [attachment, setAttachment] = useState<{url: string; file: File | null} | null>(null)
  const [shareError, setShareError] = useState('')
  const url = new URL(urls[index], window.location.origin).href
  const photo = { url, numero: index + 1 }
  const caption = orderMessage(produto) + `\n\nEscolhi a foto ${index + 1}.`
  const canPrepare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
  const preparing = canPrepare && attachment?.url !== url
  const file = attachment?.url === url ? attachment.file : null

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => { element.close() }
  }, [])

  useEffect(() => {
    setAttachment(null)
    setShareError('')
    if (!canPrepare) return
    const controller = new AbortController()
    async function prepare() {
      const response = await fetch(url, {signal: controller.signal})
      if (!response.ok) throw new Error('Imagem indisponível')
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('Formato indisponível')
      const ext = blob.type.split('/')[1].split('+')[0]
      const file = new File([blob], `${produto.slug}-foto-${index+1}.${ext}`, {type: blob.type})
      if (!controller.signal.aborted) setAttachment({url, file: navigator.canShare({files: [file], text: caption}) ? file : null})
    }
    prepare().catch(() => { if (!controller.signal.aborted) setAttachment({url, file: null}) })
    return () => controller.abort()
  }, [url, index, produto.slug, caption, canPrepare])

  return <dialog ref={dialog} onCancel={onClose} aria-label="Escolher foto para o pedido"
    className="m-auto max-h-[92dvh] w-[min(92vw,26rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl backdrop:bg-black/60">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><h2 className="font-display text-lg">Escolha a foto</h2><p className="text-sm">{produto.nome}</p></div>
      <button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-2"><X size={20}/></button>
    </div>
    <div className="relative flex h-[min(38dvh,18rem)] items-center justify-center rounded-xl bg-muted">
      <img src={url} alt={`${produto.nome}, foto ${index + 1}`} className="h-full w-full rounded-xl object-contain"/>
      {urls.length > 1 && <>
        <button type="button" aria-label="Foto anterior" onClick={() => select((index + urls.length - 1) % urls.length)} className="absolute left-2 rounded-full bg-black/65 p-2 text-white"><ChevronLeft/></button>
        <button type="button" aria-label="Próxima foto" onClick={() => select((index + 1) % urls.length)} className="absolute right-2 rounded-full bg-black/65 p-2 text-white"><ChevronRight/></button>
      </>}
    </div>
    <p aria-live="polite" className="my-2 text-center text-sm">Foto {index + 1} de {urls.length}</p>
    {urls.length > 1 && <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {urls.map((src,i) => <button key={i} type="button" aria-label={`Escolher foto ${i+1}`} aria-pressed={index===i}
        onClick={() => select(i)} className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 ${index===i?'border-[var(--brand-primary)]':'border-transparent'}`}>
        <img src={src} loading="lazy" alt="" className="h-full w-full object-cover"/>
      </button>)}
    </div>}
    {(preparing || file) && <div className="mb-2 text-center">
      <button type="button" disabled={!file} className="w-full rounded-xl bg-[#25D366] px-3 py-3 font-semibold text-black disabled:opacity-60" onClick={async () => {
        if (!file) return
        setShareError('')
        try { await navigator.share({files:[file], text:caption}) }
        catch(error) { if (!(error instanceof DOMException && error.name==='AbortError')) setShareError('Não foi possível compartilhar a foto. Tente novamente ou envie o link abaixo.') }
      }}>{preparing ? 'Preparando a foto…' : 'Enviar foto com mensagem'}</button>
      <p className="mt-2 text-xs text-muted-foreground">Selecione o WhatsApp e depois a VIBE FITNESS, (98) 98591-6645.</p>
      {file && navigator.clipboard && <button type="button" className="p-2 text-xs underline" onClick={async () => {
        try { await navigator.clipboard.writeText(caption); setShareError('Mensagem copiada para colar na legenda.') }
        catch { setShareError(caption) }
      }}>Copiar mensagem</button>}
    </div>}
    <button type="button" className={file || preparing ? 'w-full rounded-xl border border-border p-2 text-sm' : 'w-full rounded-xl bg-[#25D366] px-3 py-3 font-semibold text-black'}
      onClick={() => { trackAndOpenWhatsApp(produto, photo); onClose() }}>Enviar link da foto para a loja</button>
    {shareError && <p role="status" className="mt-2 text-sm">{shareError}</p>}
  </dialog>
}
