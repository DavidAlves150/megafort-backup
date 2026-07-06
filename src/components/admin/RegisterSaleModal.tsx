'use client';

import React, { useState } from 'react';
import { ShoppingCart, Smartphone, Store } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_compra?: number;
}

interface RegisterSaleModalProps {
  products: Product[];
}

export default function RegisterSaleModal({ products }: RegisterSaleModalProps) {
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
    if (!formData.produto_id) {
      alert("Selecione um produto");
      return;
    }
    
    setLoading(true);
    const lucro_real = (formData.valor_venda - formData.valor_custo) * formData.quantidade;
    
    try {
      const { error } = await supabase.from('vendas').insert([{
        produto_id: formData.produto_id,
        quantidade: formData.quantidade,
        valor_venda: formData.valor_venda,
        valor_custo: formData.valor_custo,
        canal_venda: formData.canal_venda,
        lucro_real,
        data_venda: new Date().toISOString()
      }]);

      if (error) throw error;
      
      alert("Venda registrada com sucesso!");
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert("Erro ao registrar venda: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="bg-[#CCFF00] text-black px-4 py-2 rounded-xl flex items-center gap-2 font-display text-[10px] tracking-widest hover:opacity-90 transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)]"
      >
        <ShoppingCart size={14} /> REGISTRAR VENDA
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#CCFF00]/20 w-full max-w-md rounded-2xl p-6 relative shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-[#CCFF00] text-xl font-display tracking-widest">NOVA VENDA</h2>
              <button 
                onClick={() => setOpen(false)} 
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-display text-white/50 uppercase tracking-widest">Produto</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#CCFF00]/50 transition-all"
                  onChange={(e) => handleProductChange(e.target.value)}
                  value={formData.produto_id}
                >
                  <option value="" className="bg-[#0A0A0A]">Selecione o produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0A0A0A]">{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-white/50 uppercase tracking-widest">Quantidade</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#CCFF00]/50 transition-all"
                    type="number" 
                    min="1" 
                    value={formData.quantidade} 
                    onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-white/50 uppercase tracking-widest">Canal</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#CCFF00]/50 transition-all"
                    onChange={(e) => setFormData({...formData, canal_venda: e.target.value})} 
                    value={formData.canal_venda}
                  >
                    <option value="WhatsApp" className="bg-[#0A0A0A]">WhatsApp</option>
                    <option value="Loja Física" className="bg-[#0A0A0A]">Loja Física</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-white/50 uppercase tracking-widest">Preço Venda (Un)</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#CCFF00]/50 transition-all"
                    type="number" 
                    step="0.01" 
                    value={formData.valor_venda} 
                    onChange={e => setFormData({...formData, valor_venda: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-white/50 uppercase tracking-widest">Custo (Un)</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#CCFF00]/50 transition-all"
                    type="number" 
                    step="0.01" 
                    value={formData.valor_custo} 
                    onChange={e => setFormData({...formData, valor_custo: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#CCFF00] text-black font-display text-xs tracking-widest py-4 rounded-xl mt-4 hover:opacity-90 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "PROCESSANDO..." : "CONFIRMAR VENDA"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
