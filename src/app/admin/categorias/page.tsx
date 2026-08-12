'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Edit, Grid3X3, ImageOff, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Categoria } from '@/types'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const empty = {
  nome: '',
  slug: '',
  descricao: '',
  cor: '#00FF41',
  ordem: 0,
  ativa: true,
  imagem_url: null as string | null,
}

type CategoryForm = typeof empty

export default function CategoriasPage() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState<CategoryForm>(empty)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('categorias').select('*').order('ordem')
    setCats((data || []) as Categoria[])
    setLoading(false)
  }

  function resetSelectedImage() {
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openNew() {
    setEditing(null)
    setForm({ ...empty, ordem: cats.length })
    resetSelectedImage()
    setOpen(true)
  }

  function openEdit(category: Categoria) {
    setEditing(category)
    setForm({
      nome: category.nome,
      slug: category.slug,
      descricao: category.descricao || '',
      cor: category.cor,
      ordem: category.ordem,
      ativa: category.ativa,
      imagem_url: category.imagem_url || null,
    })
    resetSelectedImage()
    setOpen(true)
  }

  function selectImage(file: File | null) {
    if (!file) return

    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      toast.error('Use JPEG, PNG, WebP, GIF ou AVIF.')
      resetSelectedImage()
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('A imagem deve ter no máximo 10 MB.')
      resetSelectedImage()
      return
    }

    setImageFile(file)
  }

  async function uploadCategoryImage(file: File, categoryName: string, categoryId?: string) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'image'
    const filename = `${Date.now()}-${slugify(categoryName)}.${extension}`
    const filePath = `${categoryId || 'novas'}/${filename}`

    const { error } = await supabase.storage
      .from('categorias')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: true,
      })

    if (error) throw error

    return supabase.storage.from('categorias').getPublicUrl(filePath).data.publicUrl
  }

  async function save() {
    if (!form.nome.trim()) {
      toast.error('Nome obrigatório')
      return
    }

    if (!editing && !imageFile) {
      toast.error('Envie uma imagem para criar a categoria.')
      return
    }

    setSaving(true)

    try {
      let imageUrl = editing?.imagem_url || null
      if (imageFile) imageUrl = await uploadCategoryImage(imageFile, form.nome, editing?.id)

      const payload = {
        nome: form.nome.trim(),
        slug: form.slug || slugify(form.nome),
        descricao: form.descricao.trim() || null,
        cor: form.cor,
        ordem: form.ordem,
        ativa: form.ativa,
        imagem_url: imageUrl,
      }

      const { error } = editing
        ? await supabase.from('categorias').update(payload).eq('id', editing.id)
        : await supabase.from('categorias').insert([payload])

      if (error) throw error

      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!')
      setOpen(false)
      await load()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar a categoria.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(category: Categoria) {
    if (!confirm(`Excluir "${category.nome}"?`)) return
    const { error } = await supabase.from('categorias').delete().eq('id', category.id)
    if (error) return toast.error(error.message)
    toast.success('Categoria excluída!')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-foreground md:text-3xl">CATEGORIAS</h1>
          <p className="font-body text-sm text-muted-foreground">{cats.length} categoria(s)</p>
        </div>
        <button onClick={openNew} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-button)] px-4 py-2.5 font-display text-sm tracking-widest text-black transition-all hover:opacity-90">
          <Plus size={15} /> NOVA
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? <div className="flex h-32 items-center justify-center"><Loader2 size={24} className="animate-spin text-[var(--brand-primary)]" /></div>
          : cats.length === 0 ? <div className="py-12 text-center"><Grid3X3 size={32} className="mx-auto mb-2 text-muted-foreground/30" /><p className="font-body text-sm text-muted-foreground">Nenhuma categoria.</p></div>
            : (
              <div className="divide-y divide-border">
                {cats.map((category, index) => (
                  <motion.div key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}
                    className="flex min-w-0 items-center gap-3 p-4 transition-colors hover:bg-muted/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-sm" style={{ background: `${category.cor}18` }}>
                      {category.imagem_url
                        ? <img src={category.imagem_url} alt={category.nome} className="h-full w-full object-cover" loading="lazy" />
                        : <ImageOff size={18} className="text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-body text-sm font-semibold text-foreground">{category.nome}</p>
                        {!category.ativa && <span className="rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-body text-[10px] text-red-400">INATIVA</span>}
                      </div>
                      <p className="truncate font-mono text-xs text-muted-foreground">/categoria/{category.slug}</p>
                    </div>
                    <span className="hidden font-mono text-xs text-muted-foreground sm:block">#{category.ordem}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => openEdit(category)} aria-label={`Editar ${category.nome}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-[var(--brand-primary)]"><Edit size={16} /></button>
                      <button onClick={() => remove(category)} aria-label={`Excluir ${category.nome}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={event => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div>
              <h2 className="font-display text-xl tracking-widest text-foreground">{editing ? 'EDITAR' : 'NOVA'} CATEGORIA</h2>
              <p className="mt-1 font-body text-xs text-muted-foreground">A categoria é identificada por imagem; não há mais seleção de ícone.</p>
            </div>

            {[
              { key: 'nome', label: 'Nome *', placeholder: 'Ex.: Creatina' },
              { key: 'slug', label: 'Slug', placeholder: 'Ex.: creatina' },
              { key: 'descricao', label: 'Descrição', placeholder: 'Descrição breve...' },
            ].map(field => (
              <div key={field.key}>
                <label className="form-label">{field.label}</label>
                <input value={form[field.key as keyof Pick<CategoryForm, 'nome' | 'slug' | 'descricao'>]} placeholder={field.placeholder} className="form-input"
                  onChange={event => {
                    const value = event.target.value
                    setForm(current => ({ ...current, [field.key]: value, ...(field.key === 'nome' && !editing ? { slug: slugify(value) } : {}) }))
                  }} />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Cor de destaque</label><input type="color" value={form.cor} onChange={event => setForm({ ...form, cor: event.target.value })} className="form-input cursor-pointer p-1" /></div>
              <div><label className="form-label">Ordem</label><input type="number" min="0" value={form.ordem} onChange={event => setForm({ ...form, ordem: Number(event.target.value) })} className="form-input" /></div>
            </div>

            <div>
              <label className="form-label">Imagem da categoria {editing ? '(opcional para substituir)' : '*'}</label>
              <input ref={fileInputRef} id="category-image" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif" className="sr-only" onChange={event => selectImage(event.target.files?.[0] || null)} />
              <label htmlFor="category-image" className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 font-body text-sm font-semibold text-foreground transition-colors hover:border-[var(--brand-primary)]/60 hover:bg-[var(--brand-primary)]/5">
                <ImagePlus size={17} className="text-[var(--brand-primary)]" />
                {imageFile ? 'TROCAR IMAGEM' : 'SELECIONAR IMAGEM'}
              </label>
              <p className="mt-2 font-body text-xs text-muted-foreground">Aceita imagens PNG, JPEG, WebP, GIF e AVIF de até 10 MB.</p>
              {imageFile && <p className="mt-1 truncate font-body text-sm text-foreground">Selecionada: {imageFile.name}</p>}
              {editing?.imagem_url && !imageFile && <a href={editing.imagem_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex font-body text-sm text-[var(--brand-primary)] hover:underline">Ver imagem atual</a>}
            </div>

            <div className="flex items-center gap-3">
              <label className="form-label mb-0">Ativa</label>
              <button type="button" onClick={() => setForm({ ...form, ativa: !form.ativa })} aria-label="Alternar categoria ativa"
                className={`relative h-7 w-12 rounded-full transition-all ${form.ativa ? 'bg-[var(--brand-primary)]' : 'border border-border bg-muted'}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${form.ativa ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button onClick={() => setOpen(false)} className="min-h-11 px-5 py-3 font-display tracking-widest text-foreground transition-all hover:text-[var(--brand-primary)]">CANCELAR</button>
              <button onClick={save} disabled={saving} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-button)] px-5 py-3 font-display tracking-widest text-black transition-all hover:opacity-90 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />} SALVAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
