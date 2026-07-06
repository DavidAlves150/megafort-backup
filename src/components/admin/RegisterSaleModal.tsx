import React, { useState } from 'react';






import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { ShoppingCart, Smartphone, Store } from "lucide-react";

export function RegisterSaleModal({ products }: { products: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: 1,
    valor_venda: 0,
    valor_custo: 0,
    canal_venda: 'WhatsApp'
  });

  const handleProductChange = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData({
        ...formData,
        produto_id: id,
        valor_venda: product.preco || 0,
        valor_custo: product.preco_compra || 0
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const lucro_real = (formData.valor_venda - formData.valor_custo) * formData.quantidade;

    try {
      const { error } = await supabase.from('vendas').insert([{
        ...formData,
        lucro_real,
        data_venda: new Date().toISOString()
      }]);

      if (error) throw error;

      alert("Venda registrada!");
      setOpen(false);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    {open && (
      
        <button className="bg-primary hover:bg-primary/90 text-white gap-2">
          <ShoppingCart className="w-4 h-4" /> Registrar Venda
        </button>
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 relative">
        <div className="mb-6">
          <h2 className="text-xl font-display tracking-widest">NOVA VENDA</h2><button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Produto</label>
            <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" onChange={(e) => handleProductChange(e.target.value)}>
              
                <option value="">Selecione o produto</option>
              
              
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Quantidade</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" type="number" min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Canal</label>
              <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" onChange={(e) => setFormData({...formData, canal_venda: e.target.value})} defaultValue="WhatsApp">
                
                  <SelectValue />
                
                
                  <option value="WhatsApp"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> WhatsApp</div></SelectItem>
                  <option value="Loja Física"><div className="flex items-center gap-2"><Store className="w-4 h-4" /> Loja Física</div></SelectItem>
                
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Preço de Venda (Un)</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" type="number" step="0.01" value={formData.valor_venda} onChange={e => setFormData({...formData, valor_venda: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Custo (Un)</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm" type="number" step="0.01" value={formData.valor_custo} onChange={e => setFormData({...formData, valor_custo: Number(e.target.value)})} />
            </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? "Processando..." : "Confirmar Venda"}
          </button>
        </form>
      </div></div>
    )} 
 <button onClick={() => setOpen(true)} className="bg-[var(--brand-button)] text-black px-4 py-2 rounded-xl flex items-center gap-2 font-display text-xs tracking-widest hover:opacity-90 transition-all"><ShoppingCart size={14} /> REGISTRAR VENDA</button>
  );
}
