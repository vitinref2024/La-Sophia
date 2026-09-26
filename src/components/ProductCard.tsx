import React, { useState } from 'react';
import { Plus, Utensils, Heart, Scale } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  viewMode?: 'compact' | 'grid';
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  style?: React.CSSProperties;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isCompared = false,
  onToggleCompare,
  isFavorite = false,
  onToggleFavorite,
  style,
}) => {
  const [imgError, setImgError] = useState(false);

  const isPizza = product.isPizza || product.isSweetPizza;
  const isEsfiha = product.isEsfiha;

  const getActionText = () => {
    if (product.uninformedPrice) return 'Consultar';
    if (isPizza) return 'Montar';
    if (isEsfiha) return 'Pedir';
    return 'Adicionar';
  };

  return (
    <div
      style={style}
      className={`group relative bg-[#FBF9F6] hover:bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer w-full min-w-0 animate-fade-in-up overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${
        isCompared
          ? 'border-[#E4171E] bg-[#FBE4E1]/30 ring-1 ring-[#E4171E]'
          : 'border-[#E8E0D5] hover:border-[#D8CEBF]'
      }`}
      onClick={() => onSelect(product)}
    >
      {/* 1. Imagem do produto: Full-width, formato 16:9, object-fit: cover, arredondada apenas no topo */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-[#F0EAE1] shrink-0">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B6B6B]">
            <Utensils className="w-8 h-8 text-[#E4171E]" />
          </div>
        )}

        {/* 2. Tag do número do produto (ex: "Nº 14") sobreposta no canto superior esquerdo com fundo vermelho sólido e texto branco */}
        {product.code && (
          <span className="absolute top-3 left-3 text-[11px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#E4171E] text-white shadow-md z-10 tracking-tight">
            Nº {product.code}
          </span>
        )}

        {/* Tag especial / destaque no canto superior direito se houver */}
        {product.tag && (
          <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/80 text-white border border-white/20 backdrop-blur-xs shadow-md z-10">
            {product.tag}
          </span>
        )}

        {/* Botão de comparar sabor se pizza */}
        {onToggleCompare && isPizza && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            className={`absolute bottom-2.5 left-2.5 p-1.5 rounded-lg border text-xs shadow-md backdrop-blur-sm transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center z-10 ${
              isCompared
                ? 'bg-[#E4171E] text-white border-[#E4171E]'
                : 'bg-black/60 border-neutral-700 text-neutral-200 hover:text-white'
            }`}
            title="Comparar sabor"
            aria-label="Comparar sabor"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Conteúdo abaixo da imagem com padding interno de 16px (p-4) */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 text-left">
        <div>
          {/* 3. Nome do produto com tamanho aumentado e peso 600/700 */}
          <h3 className="font-heading text-base sm:text-lg font-bold text-[#1C1C1C] group-hover:text-[#E4171E] transition-colors mb-1.5 leading-snug [overflow-wrap:anywhere]">
            {product.name}
          </h3>

          {/* 4. Descrição dos ingredientes */}
          <p className="text-xs sm:text-[13px] text-[#6B6B6B] leading-relaxed line-clamp-2 sm:line-clamp-3 [overflow-wrap:anywhere]">
            {product.description}
          </p>
        </div>

        {/* Linha inferior: Preços à esquerda e Ações (Favorito + Botão "+ Montar") à direita na mesma linha */}
        <div className="pt-3 border-t border-[#E8E0D5] flex items-end justify-between gap-2.5 mt-auto">
          {/* 5. Preço principal em destaque (vermelho, bold) e preço do broto abaixo, menor e mais discreto */}
          <div className="flex flex-col min-w-0">
            {product.uninformedPrice ? (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 w-fit">
                Preço a consultar
              </span>
            ) : product.pricesBySize ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-bold text-[#E4171E] tabular-nums">
                    {formatBRL(product.pricesBySize.pizza)}
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] font-medium">
                    (Pizza)
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-[#6B6B6B] tabular-nums">
                  Broto: <strong className="text-[#1C1C1C] font-semibold">{formatBRL(product.pricesBySize.broto)}</strong>
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-[#E4171E] tabular-nums">
                {formatBRL(product.price)}
              </span>
            )}
          </div>

          {/* 6. Botão "+ Montar" e ícone de favorito na mesma linha, alinhados à direita */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product);
                }}
                className={`min-h-[40px] min-w-[40px] p-2 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  isFavorite
                    ? 'bg-[#FBE4E1] text-[#E4171E] border-[#E4171E]/40 shadow-xs'
                    : 'bg-[#F0EAE1] border-[#E8E0D5] text-[#6B6B6B] hover:text-[#E4171E] hover:bg-[#FBE4E1]'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Salvar como favorito'}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar como favorito'}
              >
                <Heart
                  className={`w-4 h-4 transition-transform active:scale-125 ${
                    isFavorite ? 'fill-[#E4171E] text-[#E4171E]' : ''
                  }`}
                />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{getActionText()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
