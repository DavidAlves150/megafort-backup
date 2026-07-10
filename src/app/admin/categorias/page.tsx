'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Grid3X3, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Categoria } from '@/types'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

const empty = { nome:'', slug:'', descricao:'', icone:'📦', cor:'#00FF41', ordem:0, ativa:true }

export default function CategoriasPage() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Categoria|null>(null)
  const [form, setForm] = useState(empty)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const { data } = await supabase.from('categorias').select('*').order('ordem')
    setCats((data||[]) as Categoria[]); setLoading(false)
  }

  function openNew() { setEditing(null); setForm({...empty, ordem:cats.length}); setOpen(true) }
  function openEdit(c:Categoria) { setEditing(c); setForm({ nome:c.nome,slug:c.slug,descricao:c.descricao||'',icone:c.icone,cor:c.cor,ordem:c.ordem,ativa:c.ativa, imagem_url: c.imagem_url || null }); setImageFile(null); setOpen(true) }

  async function save() {
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    let imageUrl = editing?.imagem_url || null
    if (imageFile) {
      const filePath = `categorias/${editing?.id || Date.now()}-${imageFile.name}`
      const { data, error: uploadError } = await supabase.storage.from("public").upload(filePath, imageFile, { cacheControl: "3600", upsert: true })
      if (uploadError) { toast.error(uploadError.message); setSaving(false); return }
      imageUrl = supabase.storage.from("public").getPublicUrl(filePath).data.publicUrl
    }
    const payload = { ...form, slug: form.slug || slugify(form.nome), imagem_url: imageUrl }
    if (editing) {
      const { error } = await supabase.from('categorias').update(payload).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Atualizada!')
    } else {
      const { error } = await supabase.from('categorias').insert([payload])
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Criada!')
    }
    setOpen(false); load(); setSaving(false)
  }

  async function remove(c:Categoria) {
    if (!confirm(`Excluir "${c.nome}"?`)) return
    await supabase.from('categorias').delete().eq('id', c.id)
    toast.success('Excluída!'); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">CATEGORIAS</h1>
          <p className="font-body text-muted-foreground text-sm">{cats.length} categoria(s)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 transition-all">
          <Plus size={15}/> NOVA
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-32"><Loader2 size={24} className="text-[var(--brand-primary)] animate-spin"/></div>
        : cats.length===0 ? <div className="py-12 text-center"><Grid3X3 size={32} className="text-muted-foreground/30 mx-auto mb-2"/><p className="font-body text-muted-foreground text-sm">Nenhuma categoria.</p></div>
        : (
          <div className="divide-y divide-border">
            {cats.map((c,i)=>(
              <motion.div key={c.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:`${c.cor}18`}}>
                  {c.imagem_url ? <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover rounded-xl" /> : c.icone}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body font-semibold text-foreground text-sm">{c.nome}</p>
                    {!c.ativa && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded font-body">INATIVA</span>}
                  </div>
                  <p className="font-mono text-muted-foreground text-xs">/categoria/{c.slug}</p>
                </div>
                <span className="font-mono text-muted-foreground text-xs hidden sm:block">#{c.ordem}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>openEdit(c)} className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors"><Edit size={12}/></button>
                  <button onClick={()=>remove(c)} className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} onClick={e=>e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-foreground text-xl tracking-widest">{editing?'EDITAR':'NOVA'} CATEGORIA</h2>
            {[
              {k:'nome',l:'Nome *',p:'Ex: Whey Protein'},
              {k:'slug',l:'Slug',p:'ex: whey-protein'},
              {k:'descricao',l:'Descrição',p:'Descrição breve...'},
            ].map(f=>(
              <div key={f.k}>
                <label className="form-label">{f.l}</label>
                <input value={(form as any)[f.k]} placeholder={f.p} className="form-input"
                  onChange={e=>{ const v=e.target.value; setForm({...form,[f.k]:v,...(f.k==='nome'&&!editing?{slug:slugify(v)}:{})}) }}/>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Ícone</label><input value={form.icone} onChange={e=>setForm({...form,icone:e.target.value})} className="form-input text-center text-xl"/></div>
              <div><label className="form-label">Cor</label><input type="color" value={form.cor} onChange={e=>setForm({...form,cor:e.target.value})} className="form-input h-11 p-1 cursor-pointer"/></div>
              <div><label className="form-label">Ordem</label><input type="number" value={form.ordem} onChange={e=>setForm({...form,ordem:Number(e.target.value)})} className="form-input"/></div>
            </div>
            <div>
              <label className="form-label">Imagem da Categoria</label>
              <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0] || null)} ref={fileInputRef} className="form-input"/>
              {editing?.imagem_url && !imageFile && (
                <p className="text-sm text-muted-foreground mt-2">Imagem atual: <a href={editing.imagem_url} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary)]">Ver Imagem</a></p>
              )}
              {imageFile && (
                <p className="text-sm text-muted-foreground mt-2">Nova imagem selecionada: {imageFile.name}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="form-label mb-0">Ativa</label>
              <button type="button" onClick={()=>setForm({...form,ativa:!form.ativa})}
                className={`w-11 h-6 rounded-full transition-all relative ${form.ativa?'bg-[var(--brand-primary)]':'bg-muted border border-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${form.ativa?'translate-x-5':'translate-x-0.5'}`}/>
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--brand-button)] text-black font-display tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all">
                {saving&&<Loader2 size={14} className="animate-spin"/>} SALVAR
              </button>
              <button onClick={()=>setOpen(false)} className="px-5 py-3 bg-muted border border-border text-foreground font-display tracking-widest rounded-xl hover:border-border/50 transition-all">CANCELAR</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
