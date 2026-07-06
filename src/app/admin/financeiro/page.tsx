'use client';

import React, { useEffect, useState } from 'react';
import { PageTransition } from "@/components/ui/PageTransition";


import { RegisterSaleModal } from "@/components/admin/RegisterSaleModal";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { 
  TrendingUp, 
  DollarSign, 
  ArrowDownCircle, 
  Wallet,
  Calendar,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

export default function FinanceiroPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    faturamento: 0,
    lucroBruto: 0,
    despesas: 0,
    saldoLiquido: 0
  });

  useEffect(() => {
    async function fetchData() {
      const { data: productsData } = await supabase.from('produtos').select('*');
      const { data: salesData } = await supabase.from('vendas').select('*');
      
      if (productsData) setProducts(productsData);
      
      if (salesData) {
        const faturamento = salesData.reduce((acc, curr) => acc + (curr.valor_venda * curr.quantidade), 0);
        const lucroBruto = salesData.reduce((acc, curr) => acc + curr.lucro_real, 0);
        
        setStats({
          faturamento,
          lucroBruto,
          despesas: 0, // Mock por enquanto
          saldoLiquido: lucroBruto
        });
      }
    }
    fetchData();
  }, []);

  const metricCards = [
    { title: "Faturamento", value: stats.faturamento, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Lucro Bruto", value: stats.lucroBruto, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { title: "Despesas", value: stats.despesas, icon: ArrowDownCircle, color: "text-red-600", bg: "bg-red-50" },
    { title: "Saldo Líquido", value: stats.saldoLiquido, icon: Wallet, color: "text-primary", bg: "bg-magenta-50" },
  ];

  return (
    <PageTransition>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-gray-500">Gestão de lucros e fluxo de caixa real</p>
          </div>
          <div className="flex gap-3">
            <button  className="gap-2">
              <Calendar className="w-4 h-4" /> Este Mês
            </button>
            <RegisterSaleModal products={products} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-row items-center justify-between pb-2">
                  <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                  <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border-none shadow-sm">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Vendas Recentes
              </h3>
            </div>
            <div>
              <div className="text-center py-10 text-gray-400">
                Nenhuma venda registrada hoje.
              </div>
            </div>
          </div>

          <div className="border-none shadow-sm">
            <div>
              <h3 className="text-lg font-semibold">Resumo por Canal</h3>
            </div>
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium">WhatsApp</span>
                  <span className="text-green-600 font-bold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium">Loja Física</span>
                  <span className="text-blue-600 font-bold">R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
