'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Award, Loader2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Marca } from '@/types'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

const empty = { nome:'', slug:'', descricao:'', site_url:'', logo_url:'', ativa:true }

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Marca|null>(null)
  const [form, setForm] = useState(empty)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const { data } = await supabase.from('marcas').select('*').order('nome')
    setMarcas((data||[]) as Marca[]); setLoading(false)
  }

  function openNew() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(m:Marca) {
    setEditing(m)
    setForm({ nome:m.nome, slug:m.slug, descricao:m.descricao||'', site_url:m.site_url||'', logo_url:m.logo_url||'', ativa:m.ativa })
    setOpen(true)
  }

  async function save() {
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.nome), site_url: form.site_url||null, logo_url: form.logo_url||null }
    if (editing) {
      const {error} = await supabase.from('marcas').update(payload).eq('id', editing.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Atualizada!')
    } else {
      const {error} = await supabase.from('marcas').insert([payload])
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Criada!')
    }
    setOpen(false); load(); setSaving(false)
  }

  async function remove(m:Marca) {
    if (!confirm(`Excluir "${m.nome}"?`)) return
    await supabase.from('marcas').delete().eq('id', m.id)
    toast.success('Excluída!'); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">MARCAS</h1>
          <p className="font-body text-muted-foreground text-sm">{marcas.length} marca(s)</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 transition-all">
          <Plus size={15}/> NOVA
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-32"><Loader2 size={24} className="text-[var(--brand-primary)] animate-spin"/></div>
        : marcas.length===0 ? <div className="py-12 text-center"><Award size={32} className="text-muted-foreground/30 mx-auto mb-2"/><p className="font-body text-muted-foreground text-sm">Nenhuma marca.</p></div>
        : (
          <div className="divide-y divide-border">
            {marcas.map((m,i)=>(
              <motion.div key={m.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {m.logo_url ? <img src={m.logo_url} alt={m.nome} className="w-full h-full object-contain p-1"/>
                    : <Award size={18} className="text-[var(--brand-primary)]"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body font-semibold text-foreground text-sm">{m.nome}</p>
                    {!m.ativa && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded font-body">INATIVA</span>}
                  </div>
                  {m.site_url && <a href={m.site_url} target="_blank" rel="noopener" className="font-mono text-muted-foreground text-xs hover:text-[var(--brand-primary)] flex items-center gap-1 transition-colors"><ExternalLink size={9}/>{m.site_url.replace(/https?:\/\//,'').slice(0,30)}</a>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>openEdit(m)} className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-[var(--brand-primary)] transition-colors"><Edit size={12}/></button>
                  <button onClick={()=>remove(m)} className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} onClick={e=>e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-foreground text-xl tracking-widest">{editing?'EDITAR':'NOVA'} MARCA</h2>
            {[
              {k:'nome',l:'Nome *',p:'Ex: Growth Supplements'},
              {k:'slug',l:'Slug',p:'ex: growth'},
              {k:'descricao',l:'Descrição',p:'Descrição breve...'},
              {k:'site_url',l:'Site (URL)',p:'https://...'},
              {k:'logo_url',l:'Logo (URL)',p:'https://...'},
            ].map(f=>(
              <div key={f.k}>
                <label className="form-label">{f.l}</label>
                <input value={(form as any)[f.k]} placeholder={f.p} className="form-input"
                  onChange={e=>{ const v=e.target.value; setForm({...form,[f.k]:v,...(f.k==='nome'&&!editing?{slug:slugify(v)}:{})}) }}/>
              </div>
            ))}
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
