'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save, Settings, Phone, Clock, Palette, Building } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ConfiguracoesPage() {
  const [cfg, setCfg] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(()=>{ load() },[])

  async function load() {
    const { data } = await supabase.from('configuracoes').select('*')
    const map: Record<string,string> = {}
    data?.forEach(c=>{ map[c.chave]=c.valor||'' })
    setCfg(map); setLoading(false)
  }

  const set = (k:string,v:string) => setCfg(c=>({...c,[k]:v}))

  async function save() {
    setSaving(true)
    try {
      const rows = Object.entries(cfg).map(([chave,valor])=>({chave,valor}))
      const { error } = await supabase.from('configuracoes').upsert(rows,{onConflict:'chave'})
      if (error) throw error
      toast.success('Configurações salvas!')
    } catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const Section = ({icon:Icon,title,children}:any) => (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h2 className="font-display text-foreground text-lg tracking-widest flex items-center gap-2"><Icon size={16} className="text-[var(--brand-primary)]"/>{title}</h2>
      {children}
    </div>
  )

  const Field = ({k,label,placeholder,type='text'}:{k:string,label:string,placeholder?:string,type?:string}) => (
    <div>
      <label className="form-label">{label}</label>
      {type==='textarea'
        ? <textarea value={cfg[k]||''} onChange={e=>set(k,e.target.value)} placeholder={placeholder} rows={3} className="form-input resize-none"/>
        : <input type={type} value={cfg[k]||''} onChange={e=>set(k,e.target.value)} placeholder={placeholder} className={`form-input ${type==='color'?'h-11 p-1.5 cursor-pointer':''}`}/>
      }
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 size={28} className="text-[var(--brand-primary)] animate-spin"/></div>

  return (
    <div className="space-y-5 max-w-3xl pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">CONFIGURAÇÕES</h1>
          <p className="font-body text-muted-foreground text-sm">Dados da sua loja</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-button)] text-black font-display text-sm tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all">
          {saving?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>} SALVAR
        </button>
      </div>

      <Section icon={Building} title="DADOS DA LOJA">
        <Field k="nome_empresa" label="Nome da Empresa" placeholder="MegaFort Suplementos"/>
        <Field k="slogan" label="Slogan" placeholder="A melhor loja da região"/>
        <Field k="cidade" label="Cidade" placeholder="Santa Luzia do Paruá - MA"/>
        <div>
          <label className="form-label">Logo (URL)</label>
          <input value={cfg.logo_url||''} onChange={e=>set('logo_url',e.target.value)} placeholder="https://..." className="form-input"/>
          {cfg.logo_url && <img src={cfg.logo_url} alt="Logo" className="mt-2 h-12 rounded-lg object-contain border border-border"/>}
        </div>
      </Section>

      <Section icon={Phone} title="CONTATO">
        <Field k="whatsapp" label="WhatsApp (somente números)" placeholder="5598885916645"/>
        <p className="font-body text-muted-foreground text-xs -mt-2">Ex: 5598885916645 (DDI+DDD+número)</p>
        <Field k="instagram" label="Instagram (URL completa)" placeholder="https://www.instagram.com/megafort_suplementos"/>
        <Field k="instagram_user" label="Usuário do Instagram (@...)" placeholder="megafort_suplementos"/>
      </Section>

      <Section icon={Clock} title="HORÁRIO">
        <Field k="horario_semana" label="Segunda a Sexta" placeholder="Segunda a Sexta: 08h às 18h"/>
        <Field k="horario_sabado" label="Sábado" placeholder="Sábado: 08h às 11h30"/>
      </Section>

      <Section icon={Palette} title="CORES DA MARCA">
        <p className="font-body text-muted-foreground text-xs">As cores são aplicadas em todo o site automaticamente após salvar.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            {k:'cor_primaria',l:'Cor Primária'},
            {k:'cor_secundaria',l:'Cor Secundária'},
            {k:'cor_botao',l:'Cor dos Botões'},
          ].map(c=>(
            <div key={c.k}>
              <label className="form-label">{c.l}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={cfg[c.k]||'#00FF41'} onChange={e=>set(c.k,e.target.value)} className="w-11 h-11 p-1.5 rounded-xl border border-border cursor-pointer bg-card"/>
                <input value={cfg[c.k]||''} onChange={e=>set(c.k,e.target.value)} placeholder="#00FF41" className="form-input flex-1 font-mono text-sm"/>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Settings} title="SOBRE A LOJA">
        <Field k="sobre_historia" label="História" placeholder="Nossa história..." type="textarea"/>
        <Field k="sobre_missao" label="Missão" placeholder="Nossa missão..."/>
        <Field k="sobre_valores" label="Valores" placeholder="Nossos valores..."/>
      </Section>

      <Section icon={Settings} title="SEO">
        <Field k="meta_titulo" label="Título da Página Principal" placeholder="MegaFort Suplementos - ..."/>
        <Field k="meta_descricao" label="Descrição (Meta Description)" placeholder="Descrição para buscadores..." type="textarea"/>
      </Section>

      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--brand-button)] text-black font-display text-lg tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all">
        {saving?<Loader2 size={20} className="animate-spin"/>:<Save size={20}/>}
        SALVAR CONFIGURAÇÕES
      </button>
    </div>
  )
}
