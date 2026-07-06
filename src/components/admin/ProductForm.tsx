'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, Loader2, DollarSign, Package, Tag, Layers, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MediaUpload } from './MediaUpload'
import { produtoSchema, type ProdutoSchema } from '@/lib/validations'
import { slugify, formatCurrency, calcLucroPotencial } from '@/lib/utils'
import { Categoria, Marca, Produto } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TAMANHOS = ['PP','P','M','G','GG','EGG','34','36','38','40','42','44']

interface Props { produto?: Produto }

export function ProductForm({ produto }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas,     setMarcas]     = useState<Marca[]>([])
  const [imgUrls,    setImgUrls]    = useState<string[]>([])
  const [vidUrls,    setVidUrls]    = useState<string[]>([])
  const router  = useRouter()
  const supabase = createClient()
  const isEdit   = !!produto

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProdutoSchema>({
    resolver: zodResolver(produtoSchema),
    defaultValues: produto ? {
      nome: produto.nome, descricao: produto.descricao || '', descricao_curta: produto.descricao_curta || '',
      preco_compra: produto.preco_compra, preco_venda: produto.preco_venda,
      preco_promocional: produto.preco_promocional ?? undefined,
      estoque: produto.estoque, sku: produto.sku || '',
      categoria_id: produto.categoria_id ?? undefined, marca_id: produto.marca_id ?? undefined,
      em_destaque: produto.em_destaque, em_promocao: produto.em_promocao, ativo: produto.ativo,
    } : { nome:'', descricao:'', descricao_curta:'', preco_compra:0, preco_venda:0, estoque:0, em_destaque:false, em_promocao:false, ativo:true },
  })

  const wNome    = watch('nome')
  const wCompra  = watch('preco_compra') || 0
  const wVenda   = watch('preco_venda')  || 0
  const wEstoque = watch('estoque')      || 0
  const lucro    = calcLucroPotencial(wCompra, wVenda, wEstoque)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: mrcs }] = await Promise.all([
        supabase.from('categorias').select('*').eq('ativa', true).order('ordem'),
        supabase.from('marcas').select('*').eq('ativa', true).order('nome'),
      ])
      setCategorias(cats || [])
      setMarcas(mrcs || [])
    }
    load()
    if (produto) {
      // Load existing media
      supabase.from('product_images').select('url').eq('produto_id', produto.id).order('ordem')
        .then(({ data }) => setImgUrls(data?.map(d => d.url) || []))
      supabase.from('product_videos').select('url').eq('produto_id', produto.id).order('ordem')
        .then(({ data }) => setVidUrls(data?.map(d => d.url) || []))
    }
  }, [produto?.id])

  const onSubmit = async (data: ProdutoSchema) => {
    try {
      const slug   = slugify(data.nome)
      const payload = {
        ...data,
        slug,
        preco_promocional: data.preco_promocional || null,
        categoria_id: data.categoria_id || null,
        marca_id: data.marca_id || null,
      }

      let produtoId = produto?.id

      if (isEdit) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', produto!.id)
        if (error) throw error
      } else {
        const { data: novo, error } = await supabase.from('produtos').insert([payload]).select().single()
        if (error) throw error
        produtoId = novo.id
      }

      // Sync images
      if (produtoId) {
        await supabase.from('product_images').delete().eq('produto_id', produtoId)
        if (imgUrls.length) {
          await supabase.from('product_images').insert(
            imgUrls.map((url, i) => ({ produto_id: produtoId!, url, ordem: i, is_principal: i === 0 }))
          )
        }
        await supabase.from('product_videos').delete().eq('produto_id', produtoId)
        if (vidUrls.length) {
          await supabase.from('product_videos').insert(
            vidUrls.map((url, i) => ({ produto_id: produtoId!, url, ordem: i }))
          )
        }
      }

      toast.success(isEdit ? 'Produto atualizado!' : 'Produto cadastrado!')
      router.push('/admin/produtos')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar produto.')
    }
  }

  const Section = ({ icon: Icon, title, children }: any) => (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h2 className="font-display text-foreground text-lg tracking-widest flex items-center gap-2">
        <Icon size={16} className="text-[var(--brand-primary)]" />{title}
      </h2>
      {children}
    </div>
  )

  const Input = ({ name, label, type = 'text', placeholder = '', step }: any) => (
    <div>
      <label className="form-label">{label}</label>
      <input {...register(name, type === 'number' ? { valueAsNumber: true } : {})}
        type={type} step={step} placeholder={placeholder} className="form-input" />
      {(errors as any)[name] && <p className="form-error">{(errors as any)[name]?.message}</p>}
    </div>
  )

  const Toggle = ({ name, label, desc }: any) => (
    <Controller control={control} name={name} render={({ field }) => (
      <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer">
        <button type="button" onClick={() => field.onChange(!field.value)}
          className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${field.value ? 'bg-[var(--brand-primary)]' : 'bg-muted border border-border'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${field.value ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
        <div>
          <div className="font-body text-foreground text-sm font-semibold">{label}</div>
          {desc && <div className="font-body text-muted-foreground text-xs">{desc}</div>}
        </div>
      </label>
    )} />
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/produtos" className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-foreground text-2xl md:text-3xl tracking-widest">
            {isEdit ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}
          </h1>
          {isEdit && <p className="font-body text-[var(--brand-primary)] text-sm truncate">{produto?.nome}</p>}
        </div>
      </div>

      {/* Basic info */}
      <Section icon={Tag} title="INFORMAÇÕES">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Nome do Produto *</label>
            <input {...register('nome')} placeholder="Ex: Whey Protein Growth 900g" className="form-input" />
            {errors.nome && <p className="form-error">{errors.nome.message}</p>}
            {wNome && <p className="font-mono text-muted-foreground text-xs mt-1">slug: /produto/{slugify(wNome)}</p>}
          </div>
          <div>
            <label className="form-label">Categoria</label>
            <select {...register('categoria_id')} className="form-input">
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Marca</label>
            <select {...register('marca_id')} className="form-input">
              <option value="">Sem marca</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">SKU / Código</label>
            <input {...register('sku')} placeholder="Ex: WP-GROWTH-900" className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Descrição Curta</label>
            <input {...register('descricao_curta')} placeholder="Ex: 25g de proteína por dose, sabor Baunilha" className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Descrição Completa</label>
            <textarea {...register('descricao')} rows={4} placeholder="Detalhes completos do produto..." className="form-input resize-none" />
          </div>
        </div>
      </Section>

      {/* Pricing + Stock */}
      <Section icon={DollarSign} title="PREÇO E ESTOQUE">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Preço de Compra *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)] text-sm font-bold">R$</span>
              <input {...register('preco_compra', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0,00" className="form-input pl-9" />
            </div>
            {errors.preco_compra && <p className="form-error">{errors.preco_compra.message}</p>}
          </div>
          <div>
            <label className="form-label">Preço de Venda *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)] text-sm font-bold">R$</span>
              <input {...register('preco_venda', { valueAsNumber: true })} type="number" step="0.01" min="0.01" placeholder="0,00" className="form-input pl-9" />
            </div>
            {errors.preco_venda && <p className="form-error">{errors.preco_venda.message}</p>}
          </div>
          <div>
            <label className="form-label">Preço Promocional</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-sm font-bold">R$</span>
              <input {...register('preco_promocional', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0,00" className="form-input pl-9" />
            </div>
          </div>
          <div>
            <label className="form-label">Estoque *</label>
            <input {...register('estoque', { valueAsNumber: true })} type="number" min="0" placeholder="0" className="form-input" />
            {errors.estoque && <p className="form-error">{errors.estoque.message}</p>}
          </div>
        </div>

        {/* Profit preview */}
        {wVenda > 0 && wCompra >= 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 p-4 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded-xl mt-2">
            <div className="text-center">
              <div className="font-body text-muted-foreground text-xs uppercase tracking-wider">Lucro/unid.</div>
              <div className={`font-display text-lg mt-0.5 ${lucro.lucroUnitario >= 0 ? 'text-[var(--brand-primary)]' : 'text-red-500'}`}>
                {formatCurrency(lucro.lucroUnitario)}
              </div>
            </div>
            <div className="text-center">
              <div className="font-body text-muted-foreground text-xs uppercase tracking-wider">Margem</div>
              <div className={`font-display text-lg mt-0.5 ${lucro.margemPercent >= 0 ? 'text-[var(--brand-primary)]' : 'text-red-500'}`}>
                {lucro.margemPercent.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="font-body text-muted-foreground text-xs uppercase tracking-wider">Lucro total</div>
              <div className={`font-display text-lg mt-0.5 ${lucro.lucroTotal >= 0 ? 'text-[var(--brand-primary)]' : 'text-red-500'}`}>
                {formatCurrency(lucro.lucroTotal)}
              </div>
            </div>
          </motion.div>
        )}
      </Section>

      {/* Media */}
      <Section icon={Package} title="FOTOS E VÍDEOS">
        <MediaUpload
          images={imgUrls} videos={vidUrls}
          onImagesChange={setImgUrls} onVideosChange={setVidUrls}
        />
      </Section>

      {/* Settings */}
      <Section icon={Layers} title="CONFIGURAÇÕES">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Toggle name="ativo"      label="Produto Ativo"  desc="Visível na loja" />
          <Toggle name="em_destaque" label="Em Destaque"   desc="Aparece na home" />
          <Toggle name="em_promocao" label="Em Promoção"   desc="Usa preço promocional" />
        </div>
      </Section>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[var(--brand-button)] text-black font-display text-lg tracking-widest rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-neon-sm">
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {isSubmitting ? 'SALVANDO...' : isEdit ? 'ATUALIZAR' : 'CADASTRAR'}
        </button>
        <Link href="/admin/produtos"
          className="px-6 py-4 bg-muted border border-border text-foreground font-display tracking-widest rounded-xl hover:border-border/50 transition-all text-center">
          CANCELAR
        </Link>
      </div>
    </form>
  )
}
