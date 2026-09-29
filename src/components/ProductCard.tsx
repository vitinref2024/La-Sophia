import React, { useState, useEffect } from 'react';
import { Plus, Utensils, Heart, Scale, Camera, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';
import {
  IMAGENS_VERSAO,
  EXTENSOES_IMAGEM,
  DEFAULT_FALLBACK_IMAGE,
  getExactFlavorName,
  buildProductImageUrl,
  safeImageUrl,
} from '../utils/imageUrl';

export { IMAGENS_VERSAO, EXTENSOES_IMAGEM, DEFAULT_FALLBACK_IMAGE, getExactFlavorName };

export function getCleanFlavorName(name: string): string {
  return getExactFlavorName(name);
}

/**
 * Resolução da imagem de um produto para uso fora do card (ex: modais):
 * Prioridade:
 * 1. Foto enviada pelo usuário APENAS neste aparelho (localStorage)
 * 2. Imagem oficial em /images/NOME DO SABOR.ext?v=IMAGENS_VERSAO
 */
export function resolveCardImage(product: Product, extIndex = 0): string {
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`local_device_photo_${product.id}`);
      if (local) return local;
    }
  } catch {
    // fallback
  }

  return buildProductImageUrl(product.name, extIndex);
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
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isCompared = false,
  onToggleCompare,
  isFavorite = false,
  onToggleFavorite,
  style,
}) => {
  // Índice da extensão atual testada na ordem: .jpg (0), .png (1), .jpeg (2), .webp (3)
  const [extIndex, setExtIndex] = useState(0);
  const [failedAll, setFailedAll] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  // Foto enviada pelo botão de subir imagem (válida APENAS neste aparelho)
  const [localPhoto, setLocalPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`local_device_photo_${product.id}`) || null;
    } catch {
      return null;
    }
  });

  // Reseta estado quando o produto mudar
  useEffect(() => {
    setExtIndex(0);
    setFailedAll(false);
    setFailedFallback(false);
    try {
      setLocalPhoto(localStorage.getItem(`local_device_photo_${product.id}`) || null);
    } catch {
      setLocalPhoto(null);
    }
  }, [product.id, product.name]);

  const isPizza = product.isPizza || product.isSweetPizza;
  const isEsfiha = product.isEsfiha;
  const isBeverage = product.category === 'bebidas' || product.category === 'cervejas';

  const getActionText = () => {
    if (product.uninformedPrice) return 'Consultar';
    if (isPizza) return 'Montar';
    if (isEsfiha) return 'Pedir';
    return 'Adicionar';
  };

  // Trata erro ao carregar imagem: tenta a próxima extensão na ordem .jpg, .png, .jpeg, .webp
  const handleImageError = () => {
    if (localPhoto) {
      setLocalPhoto(null);
      setExtIndex(0);
      return;
    }

    if (extIndex < EXTENSOES_IMAGEM.length - 1) {
      setExtIndex((prev) => prev + 1);
    } else {
      setFailedAll(true);
    }
  };

  // Upload de foto pelo usuário (salva somente neste aparelho)
  const handleUploadLocalPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          localStorage.setItem(`local_device_photo_${product.id}`, dataUrl);
        } catch (err) {
          console.warn('Aviso ao salvar foto local no aparelho:', err);
        }
        setLocalPhoto(dataUrl);
        setFailedAll(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove a foto local deste aparelho e volta a usar /images/
  const handleRemoveLocalPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(`local_device_photo_${product.id}`);
    } catch {}
    setLocalPhoto(null);
    setExtIndex(0);
    setFailedAll(false);
  };

  // Determina a URL atual da imagem
  const currentImageSrc = localPhoto || buildProductImageUrl(product.name, extIndex);

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
      {/* 1. Imagem do produto: carregada da pasta /images/ com ordem de extensão ou fallback */}
      <div className={`relative w-full aspect-[16/9] overflow-hidden rounded-t-xl shrink-0 flex items-center justify-center ${
        isBeverage ? 'bg-white' : 'bg-[#F0EAE1]'
      }`}>
        {!failedAll ? (
          <img
            key={`${product.id}_${extIndex}_${localPhoto ? 'local' : 'folder'}`}
            src={currentImageSrc}
            alt={getCleanFlavorName(product.name)}
            onError={handleImageError}
            className={`w-full h-full group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none ${
              isBeverage ? 'object-contain p-2' : 'object-cover object-center'
            }`}
            loading="lazy"
            decoding="async"
            width="400"
            height="225"
          />
        ) : !failedFallback ? (
          <img
            src={isBeverage && product.image ? safeImageUrl(product.image) : DEFAULT_FALLBACK_IMAGE}
            alt={getCleanFlavorName(product.name)}
            onError={() => setFailedFallback(true)}
            className={`w-full h-full group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none ${
              isBeverage ? 'object-contain p-2' : 'object-cover object-center'
            }`}
            loading="lazy"
            decoding="async"
            width="400"
            height="225"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-[#F0EAE1] text-[#8C827A]">
            <Utensils className="w-6 h-6 text-[#A89F95] mb-1" />
            <span className="text-[11px] font-medium text-[#736B63]">{getCleanFlavorName(product.name)}</span>
          </div>
        )}

        {/* 2. Tag do número do produto (ex: "Nº 14") sobreposta no canto superior esquerdo */}
        {product.code && (
          <span className="absolute top-3 left-3 text-[11px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#E4171E] text-white shadow-md z-10 tracking-tight">
            Nº {product.code}
          </span>
        )}

        {/* 3. Ações no canto superior direito: Tag de destaque + Botão de Subir Imagem (neste aparelho) */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {product.tag && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/80 text-white border border-white/20 backdrop-blur-xs shadow-md">
              {product.tag}
            </span>
          )}

          {localPhoto && (
            <button
              type="button"
              onClick={handleRemoveLocalPhoto}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-red-700 text-white text-xs shadow-md transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Restaurar foto padrão de /images/"
              aria-label="Restaurar foto padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <label
            className="p-2 rounded-lg bg-black/60 hover:bg-black/85 text-white text-xs shadow-md backdrop-blur-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Subir imagem para este item (neste aparelho)"
            aria-label="Subir imagem para este item"
          >
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadLocalPhoto(file);
                }
              }}
            />
          </label>
        </div>

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
                className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
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
              className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              aria-label={`${getActionText()} ${product.name}`}
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

export const ProductCard = React.memo(ProductCardComponent);
