import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { ShoppingCart, Smartphone, Store } from "lucide-react";

export function RegisterSaleModal({ products }: { products: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
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

      toast({ title: "Venda registrada!", description: "O lucro foi contabilizado no financeiro." });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-primary hover:bg-primary/90 text-white gap-2">
          <ShoppingCart className="w-4 h-4" /> Registrar Venda
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-xl border-magenta-100">
        <DialogHeader>
          <DialogTitle className="text-primary">Nova Venda Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select onValueChange={handleProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select onValueChange={v => setFormData({...formData, canal_venda: v})} defaultValue="WhatsApp">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> WhatsApp</div></SelectItem>
                  <SelectItem value="Loja Física"><div className="flex items-center gap-2"><Store className="w-4 h-4" /> Loja Física</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço de Venda (Un)</Label>
              <Input type="number" step="0.01" value={formData.valor_venda} onChange={e => setFormData({...formData, valor_venda: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Custo (Un)</Label>
              <Input type="number" step="0.01" value={formData.valor_custo} onChange={e => setFormData({...formData, valor_custo: Number(e.target.value)})} />
            </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? "Processando..." : "Confirmar Venda"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
