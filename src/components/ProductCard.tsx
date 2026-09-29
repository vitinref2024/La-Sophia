import React, { useState, useEffect } from 'react';
import { Plus, Utensils, Heart, Scale } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';
import { safeImageUrl } from '../utils/imageUrl';
import escarolaImg from '../assets/pizzas/Escarola.png';
import { getCustomProductImage } from '../utils/photoStorage';

// Normalização e associação de imagens de pizzas salgadas pelo NOME DO SABOR
export function normalizeFlavorKey(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\d+\s*-\s*/, '') // Remove o número inicial se houver (ex: "01 - ")
    .replace(/[^a-z0-9]/g, '');
}

export function getCleanFlavorName(name: string): string {
  return (name || '').replace(/^\d+\s*-\s*/, '').trim();
}

// Mapeamento direto pelo NOME DO SABOR para os arquivos existentes em /imagens/pizzas/ com ?v=2
export const PIZZA_FLAVOR_TO_IMAGE: Record<string, string> = {
  'aespanhola': '/imagens/pizzas/A%20ESPANHOLA.jpg?v=2',
  'amodacarioca': '/imagens/pizzas/A%20moda%20Carioca.jpg?v=2',
  'amodapizzaiolo': '/imagens/pizzas/A%20moda%20Pizzaiolo.jpg?v=2',
  'alema': '/imagens/pizzas/Alem%C3%A3.jpg?v=2',
  'alho': '/imagens/pizzas/Alho.png?v=2',
  'aliche': '/imagens/pizzas/Aliche.png?v=2',
  'aspargofrancesa': '/imagens/pizzas/Aspargo%20Francesa.png?v=2',
  'bacon': '/imagens/pizzas/Bacon.png?v=2',
  'baiacatu': '/imagens/pizzas/Baiacatu.png?v=2',
  'baiana': '/imagens/pizzas/Baiana.png?v=2',
  'bauru': '/imagens/pizzas/Bauru.png?v=2',
  'belacatherine': '/imagens/pizzas/Bela%20Catherine.png?v=2',
  'beringela': '/imagens/pizzas/Beringela.png?v=2',
  'bolonhesa': '/imagens/pizzas/Bolonhesa.png?v=2',
  'brancadeneve': '/imagens/pizzas/Branca%20de%20neve.png?v=2',
  'brocolis': '/imagens/pizzas/Br%C3%B3colis.png?v=2',
  'calabresa': '/imagens/pizzas/Calabresa.png?v=2',
  'catupiry': '/imagens/pizzas/Catupiry.png?v=2',
  'requinte': '/imagens/pizzas/Requinte.png?v=2',
  'camareis': '/imagens/pizzas/Camareis.png?v=2',
  'carijo': '/imagens/pizzas/Carij%C3%B3.png?v=2',
  'cincoqueijos': '/imagens/pizzas/Cinco%20Queijos.png?v=2',
  'dahora': '/imagens/pizzas/Da%20Hora.png?v=2',
  'escarola': escarolaImg,
  'escalora': escarolaImg,
  'fiorentina': '/imagens/pizzas/Fiorentina.png?v=2',
  'firmeza': '/imagens/pizzas/Firmeza.png?v=2',
  'vilafatimai': '/imagens/pizzas/Vila%20F%C3%A1tima%20I.png?v=2',
  'laglazia': '/imagens/pizzas/La%20Glazia.png?v=2',
  'lombinho': '/imagens/pizzas/Lombinho.png?v=2',
  'jardineira': '/imagens/pizzas/Jardineira.png?v=2',
  'marguerita': '/imagens/pizzas/Marguerita.png?v=2',
  'milhoverde': '/imagens/pizzas/Milho%20Verde.png?v=2',
  'modinha': '/imagens/pizzas/Modinha.png?v=2',
  'mussarela': '/imagens/pizzas/Mussarela.png?v=2',
  'napolitana': '/imagens/pizzas/Napolitana.png?v=2',
  'otello': '/imagens/pizzas/Otello.png?v=2',
  'palma': '/imagens/pizzas/Palma.png?v=2',
  'palmito': '/imagens/pizzas/Palmito.png?v=2',
  'portuguesai': '/imagens/pizzas/Portuguesa%20I.png?v=2',
  'portuguesaii': '/imagens/pizzas/Portuguesa%20II.png?v=2',
  'primavera': '/imagens/pizzas/Primavera.png?v=2',
  'provolone': '/imagens/pizzas/Provolone.png?v=2',
  'quatroestacoes': '/imagens/pizzas/Quatro%20Esta%C3%A7%C3%B5es.png?v=2',
  'quatroqueijos': '/imagens/pizzas/Quatro%20Queijos.png?v=2',
  'roys': '/imagens/pizzas/Roys.png?v=2',
  'sertaneja': '/imagens/pizzas/Sertaneja.png?v=2',
  'siciliana': '/imagens/pizzas/Siciliana.png?v=2',
  'tamburello': '/imagens/pizzas/Tamburello.png?v=2',
  'toscana': '/imagens/pizzas/Toscana.png?v=2',
  'tropical': '/imagens/pizzas/Tropical.png?v=2',
  'vegetariana': '/imagens/pizzas/Vegetariana.png?v=2',
  'vilafatima': '/imagens/pizzas/Vila%20F%C3%A1tima.png?v=2',
  'ziarita': '/imagens/pizzas/Zia%20Rita.png?v=2',
};

export function resolveCardImage(product: Product): string {
  // 1. Prioridade máxima absoluta: imagem personalizada enviada pelo usuário por ID do produto
  const custom =
    getCustomProductImage(product.id) ||
    (product.code === '24' ? getCustomProductImage('pizza-24') : null);
  if (custom) {
    return custom;
  }

  // 2. Garantia direta para o sabor Escarola com import bundled caso não haja customizada
  if (product.code === '24' || (product.name && product.name.toLowerCase().includes('escarola'))) {
    return escarolaImg;
  }

  const isPizzaSalgada = product.category === 'pizzas' || (product.isPizza && !product.isSweetPizza && product.category !== 'pizzas-doces');

  // 3. Para pizzas salgadas: correspondência pelo NOME DO SABOR (ignorando maiúsculas/minúsculas, acentos e espaços)
  if (isPizzaSalgada && product.name) {
    const key = normalizeFlavorKey(product.name);
    if (PIZZA_FLAVOR_TO_IMAGE[key]) {
      return safeImageUrl(PIZZA_FLAVOR_TO_IMAGE[key]);
    }
  }

  // 4. Resolução direta pela imagem cadastrada no produto
  if (product.image) {
    return safeImageUrl(product.image);
  }

  return '';
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

  const [customPhoto, setCustomPhoto] = useState<string | null>(() => {
    return getCustomProductImage(product.id) || (product.code === '24' ? getCustomProductImage('pizza-24') : null);
  });

  // Atualização em tempo real quando qualquer foto for salva ou importada
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ id?: string; dataUrl?: string | null; all?: boolean }>;
      if (
        customEvt.detail?.all ||
        customEvt.detail?.id === product.id ||
        (product.code === '24' && customEvt.detail?.id === 'pizza-24')
      ) {
        const updated =
          getCustomProductImage(product.id) ||
          (product.code === '24' ? getCustomProductImage('pizza-24') : null);
        setCustomPhoto(updated);
        setImgError(false);
      }
    };
    window.addEventListener('custom-product-image-updated', handleUpdate);
    return () => {
      window.removeEventListener('custom-product-image-updated', handleUpdate);
    };
  }, [product.id, product.code]);

  const imageSrc = customPhoto || resolveCardImage(product);

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
      className={`group relative bg-[#FBF9F6] hover:bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer w-full min-w-0 animate-fade-in-up overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${
        isCompared
          ? 'border-[#E4171E] bg-[#FBE4E1]/30 ring-1 ring-[#E4171E]'
          : 'border-[#E8E0D5] hover:border-[#D8CEBF]'
      }`}
      onClick={() => onSelect(product)}
    >
      {/* 1. Imagem do produto: Obtida de foto personalizada ou foto real do cardápio */}
      <div className={`relative w-full aspect-[16/9] overflow-hidden rounded-t-xl shrink-0 flex items-center justify-center ${
        isBeverage ? 'bg-white' : 'bg-[#F0EAE1]'
      }`}>
        {!imgError ? (
          <img
            src={imageSrc}
            alt={getCleanFlavorName(product.name)}
            onError={() => {
              setImgError(true);
            }}
            className={`w-full h-full group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none ${
              isBeverage ? 'object-contain p-2' : 'object-cover object-center'
            }`}
            loading="lazy"
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
