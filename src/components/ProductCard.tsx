import React from 'react';
import { Plus, Heart, Scale } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';
import {
  IMAGENS_VERSAO,
  EXTENSOES_IMAGEM,
  DEFAULT_FALLBACK_IMAGE,
  getExactFlavorName,
  safeImageUrl,
} from '../utils/imageUrl';
import { ProductImage } from './ProductImage';

export { IMAGENS_VERSAO, EXTENSOES_IMAGEM, DEFAULT_FALLBACK_IMAGE, getExactFlavorName };

export function getCleanFlavorName(name: string): string {
  return getExactFlavorName(name);
}

/**
 * Resolução da imagem de um produto para uso fora do card (ex: modais):
 * Utiliza estritamente a propriedade `image` definida em menuData.ts
 */
export function resolveCardImage(product: Product): string {
  return product.image || '';
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  viewMode?: 'compact' | 'grid';
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  style?: React.CSSProperties;
  priority?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isCompared = false,
  onToggleCompare,
  isFavorite = false,
  onToggleFavorite,
  style,
  priority = false,
}) => {
  const isPizza = product.isPizza || product.isSweetPizza;
  const isEsfiha = product.isEsfiha;
  const isBeverage = product.category === 'bebidas' || product.category === 'cervejas';

  const getActionText = () => {
    if (product.uninformedPrice) return 'Consultar';
    if (isPizza) return 'Montar';
    if (isEsfiha) return 'Pedir';
    return 'Adicionar';
  };

  return (
    <div
      style={style}
      className={`group relative bg-[#FBF9F6] hover:bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer w-full min-w-0 animate-fade-in-up overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] outline-none select-none ${
        isCompared
          ? 'border-[#E4171E] bg-[#FBE4E1]/30 ring-1 ring-[#E4171E]'
          : 'border-[#E8E0D5] hover:border-[#D8CEBF]'
      }`}
      onClick={() => onSelect(product)}
    >
      {/* 1. Imagem do produto: carregada estritamente via ProductImage a partir de menuData.ts */}
      <div
        className={`relative w-full aspect-[16/9] overflow-hidden rounded-t-xl shrink-0 flex items-center justify-center ${
          isBeverage ? 'bg-white' : 'bg-[#F0EAE1]'
        }`}
      >
        <ProductImage
          product={product}
          className={`w-full h-full group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none ${
            isBeverage ? 'object-contain p-2' : 'object-cover object-center'
          }`}
          width="400"
          height="225"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />

        {/* 2. Tag do número do produto (ex: "Nº 14") sobreposta no canto superior esquerdo */}
        {product.code && (
          <span className="absolute top-3 left-3 text-[11px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#E4171E] text-white shadow-md z-10 tracking-tight">
            Nº {product.code}
          </span>
        )}

        {/* 3. Tag de destaque no canto superior direito */}
        {product.tag && (
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/80 text-white border border-white/20 backdrop-blur-xs shadow-md">
              {product.tag}
            </span>
          </div>
        )}

        {/* Botão de comparar sabor se pizza */}
        {onToggleCompare && isPizza && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            className={`absolute bottom-2.5 left-2.5 p-2 rounded-lg border text-xs shadow-md backdrop-blur-sm transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center z-10 ${
              isCompared
                ? 'bg-[#E4171E] text-white border-[#E4171E]'
                : 'bg-black/60 border-neutral-700 text-neutral-200 hover:text-white'
            }`}
            title="Comparar sabor"
            aria-label="Comparar sabor"
          >
            <Scale className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Conteúdo Informativo */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-900 group-hover:text-[#E4171E] transition-colors line-clamp-1">
              {product.name}
            </h3>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product);
                }}
                className={`p-1 -mr-1 rounded-full transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isFavorite
                    ? 'text-[#E4171E] hover:text-[#c9141a]'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {product.description && (
            <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-[#EDE4D8] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-neutral-600 uppercase font-bold tracking-wider block">
              {product.uninformedPrice
                ? 'A consultar'
                : isPizza
                ? 'A partir de'
                : 'Preço'}
            </span>
            <span className="font-bold text-sm sm:text-base text-[#1C1C1C]">
              {product.uninformedPrice
                ? 'Sob Consulta'
                : formatBRL(product.price)}
            </span>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4171E] hover:bg-[#c9141a] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getActionText()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
