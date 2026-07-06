'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Loader2, ToggleRight, ToggleLeft, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Banner } from '@/types'
import toast from 'react-hot-toast'

const empty = { titulo:'', subtitulo:'', imagem_url:'', imagem_mobile_url:'', link_url:'', botao_texto:'', ordem:0, ativo:true }

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Banner|null>(null)
  const [form, setForm] = useState(empty)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const { data } = await supabase.from('banners').select('*').order('ordem')
    setBanners((data||[]) as Banner[]); setLoading(false)
  }

  function openNew() { setEditing(null); setForm({...empty,ordem:banners.length}); setOpen(true) }
  function openEdit(b:Banner) {
    setEditing(b)
    setForm({ titulo:b.titulo||'', subtitulo:b.subtitulo||'', imagem_url:b.imagem_url, imagem_mobile_url:b.imagem_mobile_url||'', link_url:b.link_url||'', botao_texto:b.botao_texto||'', ordem:b.ordem, ativo:b.ativo })
    setOpen(true)
  }

  async function uploadImg(file:File) {
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens'); return }
    setUploading(true)
    const name = `banner-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('banners').upload(name, file, { contentType: file.type })
    if (error) { toast.error('Erro no upload'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(name)
    setForm(f=>({...f, imagem_url: publicUrl}))
    setUploading(false)
  }

  async function save() {
    if (!form.imagem_url) { toast.error('Imagem obrigatória'); return }
    setSaving(true)
    if (editing) {
      await supabase.from('banners').update(form).eq('id', editing.id)
      toast.success('Atualizado!')
    } else {
      await supabase.from('banners').insert([form])
      toast.success('Criado!')
    }
    setOpen(false); load(); setSaving(false)
  }

  async function toggle(b:Banner) {
    await supabase.from('banners').update({ ativo:!b.ativo }).eq('id', b.id)
    load()
  }

  async function remove(b:Banner) {
    if (!confirm('Excluir banner?')) return
    await supabase.from('banners').delete().eq('id', b.id)
    toast.success('Excluído!'); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">BANNERS</h1>
          <p className="font-body text-muted-foreground text-sm">{banners.length} banner(s)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 transition-all">
          <Plus size={15}/> NOVO
        </button>
      </div>

      {loading ? <div className="flex items-center justify-center h-32"><Loader2 size={24} className="text-[var(--brand-primary)] animate-spin"/></div>
      : banners.length===0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center">
          <ImageIcon size={40} className="text-muted-foreground/30 mx-auto mb-3"/>
          <p className="font-body text-muted-foreground">Nenhum banner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map(b=>(
            <div key={b.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="relative aspect-video">
                <img src={b.imagem_url} alt={b.titulo||'Banner'} className="w-full h-full object-cover"/>
                {!b.ativo && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="font-body text-white text-sm bg-black/80 px-3 py-1 rounded-full">INATIVO</span></div>}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-foreground text-sm font-semibold">{b.titulo||'Sem título'}</p>
                  <p className="font-mono text-muted-foreground text-xs">Ordem: {b.ordem}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toggle(b)} className="text-muted-foreground hover:text-[var(--brand-primary)] transition-colors">
                    {b.ativo ? <ToggleRight size={22} className="text-[var(--brand-primary)]"/> : <ToggleLeft size={22}/>}
                  </button>
                  <button onClick={()=>openEdit(b)} className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors"><Edit size={13}/></button>
                  <button onClick={()=>remove(b)} className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} onClick={e=>e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-foreground text-xl tracking-widest">{editing?'EDITAR':'NOVO'} BANNER</h2>

            <div>
              <label className="form-label">Imagem *</label>
              {form.imagem_url && <img src={form.imagem_url} className="w-full aspect-video object-cover rounded-xl mb-2 border border-border"/>}
              <div className="flex gap-2">
                <input value={form.imagem_url} onChange={e=>setForm({...form,imagem_url:e.target.value})} placeholder="URL da imagem..." className="form-input flex-1"/>
                <label className="flex items-center justify-center w-11 h-11 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 rounded-xl cursor-pointer hover:bg-[var(--brand-primary)]/20 transition-colors flex-shrink-0">
                  {uploading ? <Loader2 size={16} className="text-[var(--brand-primary)] animate-spin"/> : <ImageIcon size={16} className="text-[var(--brand-primary)]"/>}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&uploadImg(e.target.files[0])}/>
                </label>
              </div>
            </div>

            {[{k:'titulo',l:'Título',p:'Ex: Nova Coleção'},{k:'subtitulo',l:'Subtítulo',p:'Descrição do banner'},{k:'botao_texto',l:'Texto do Botão',p:'Ver promoções'},{k:'link_url',l:'Link (URL)',p:'/catalogo'}].map(f=>(
              <div key={f.k}>
                <label className="form-label">{f.l}</label>
                <input value={(form as any)[f.k]} placeholder={f.p} className="form-input" onChange={e=>setForm({...form,[f.k]:e.target.value})}/>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Ordem</label><input type="number" value={form.ordem} onChange={e=>setForm({...form,ordem:Number(e.target.value)})} className="form-input"/></div>
              <div className="flex items-end pb-2 gap-3"><label className="form-label mb-0">Ativo</label>
                <button type="button" onClick={()=>setForm({...form,ativo:!form.ativo})}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.ativo?'bg-[var(--brand-primary)]':'bg-muted border border-border'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${form.ativo?'translate-x-5':'translate-x-0.5'}`}/>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--brand-button)] text-black font-display tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all">
                {saving&&<Loader2 size={14} className="animate-spin"/>} SALVAR
              </button>
              <button onClick={()=>setOpen(false)} className="px-5 py-3 bg-muted border border-border text-foreground font-display tracking-widest rounded-xl">CANCELAR</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
