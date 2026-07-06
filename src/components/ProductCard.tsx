'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: any }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.imagem_url || '/placeholder.png'} 
          alt={product.nome}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button size="icon" className="bg-white text-black hover:bg-magenta-600 hover:text-white rounded-full">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="text-xs text-magenta-600 font-semibold uppercase tracking-wider">
          {product.categorias?.nome || 'Geral'}
        </div>
        <h3 className="font-bold text-gray-900 line-clamp-1">{product.nome}</h3>
        <div className="flex justify-between items-center pt-2">
          <span className="text-xl font-black text-magenta-700">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
          </span>
          <Button size="sm" className="bg-magenta-600 hover:bg-magenta-700 text-white rounded-full gap-2">
            <ShoppingCart className="w-4 h-4" /> Ver
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
