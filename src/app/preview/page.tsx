import Link from 'next/link'
import Image from 'next/image'

export const metadata = { title: 'Prévia administrativa — VIBE FITNESS', robots: { index: false, follow: false } }

export default function AdminPreview() {
  return <div className="min-h-screen bg-[#fff8fb] text-[#321d28]">
    <div className="bg-[#8b1846] px-5 py-3 text-center text-sm text-white">Prévia visual · dados ilustrativos · nenhuma operação no banco</div>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className="hidden min-h-screen w-64 shrink-0 border-r border-pink-100 bg-white p-6 lg:block">
        <Image src="/logo-vibe-fitness.jpeg" alt="VIBE FITNESS" width={150} height={150} className="mx-auto rounded-2xl" />
        <p className="mb-8 mt-4 text-center text-xs uppercase tracking-widest text-[#8b1846]">Seu espaço de gestão</p>
        <nav aria-label="Seções da prévia" className="space-y-2">{['Visão geral', 'Produtos', 'Estoque', 'Vendas', 'Financeiro', 'Configurações'].map((name,i)=><div key={name} className={`rounded-xl px-4 py-3 text-sm ${i===0?'bg-pink-50 font-bold text-[#8b1846]':'text-gray-600'}`}>{name}</div>)}</nav>
        <Link href="/" className="mt-10 block rounded-xl border border-pink-200 px-4 py-3 text-center text-sm">Visitar loja ↗</Link>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-10">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[#8b1846]">VIBE FITNESS · ADMINISTRAÇÃO</p><h1 className="text-3xl font-bold tracking-tight">Seu negócio, em um só lugar.</h1><p className="mt-3 text-sm text-gray-600">Acompanhe o catálogo, as vendas registradas e o resultado da loja.</p></div><Link href="/admin/login" className="rounded-xl bg-[#FF1493] px-5 py-3 font-semibold text-black">Acessar painel</Link></header>
        <section aria-label="Indicadores ilustrativos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Vendas registradas','R$ 2.450,00','Receita informada'],['Custo das mercadorias','R$ 1.300,00','Custos dos itens vendidos'],['Despesas','R$ 450,00','Lançamentos do período'],['Resultado operacional','R$ 700,00','Receita − custos − despesas']].map(([name,value,hint])=><article key={name} className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm"><p className="text-sm text-gray-600">{name}</p><p className="my-4 text-2xl font-bold text-[#8b1846]">{value}</p><p className="text-xs text-gray-500">{hint} · exemplo</p></article>)}</section>
        <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]"><article className="rounded-2xl border border-pink-100 bg-white p-6"><h2 className="text-lg font-bold">Uma gestão mais clara</h2><p className="mt-2 text-sm leading-6 text-gray-600">Vendas e despesas separadas, indicadores com período definido e estoque acompanhado sem confundir lucro potencial com resultado realizado.</p><div className="mt-6 divide-y divide-pink-100">{[['Catálogo','Roupas, calçados e suplementos'],['Vendas','Registros completos, sem corte nas últimas 20 vendas'],['Financeiro','Totais do período e falhas de carregamento identificadas'],['Identidade','Logo oficial e Instagram @vibefit_oficial1']].map(([title,description])=><div key={title} className="py-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-gray-600">{description}</p></div>)}</div></article><article className="rounded-2xl bg-[#ffe8f0] p-7"><p className="text-xs uppercase tracking-widest text-[#8b1846]">Antes de publicar</p><h2 className="mt-3 text-2xl font-bold">Conferência com dados reais</h2><p className="mt-4 text-sm leading-7">Esta tela demonstra a direção visual. Os números são exemplos e não representam o faturamento do cliente. As permissões do banco, o estoque e os resultados reais ainda precisam de homologação.</p><Link href="/admin/login" className="mt-6 inline-block font-semibold text-[#8b1846] underline">Abrir login administrativo</Link></article></section>
      </main>
    </div>
  </div>
}
