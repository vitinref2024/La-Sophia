import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { Product } from '../types';
import { getExactFlavorName, safeImageUrl } from '../utils/imageUrl';

export interface ProductImageProps {
  product: Product;
  alt?: string;
  className?: string;
  containerClassName?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  showSolidFallback?: boolean;
}

/**
 * Componente oficial de imagem do catálogo:
 * - Utiliza ESTRITAMENTE a imagem definida em menuData.ts (product.image)
 * - Não faz fallback para outras pizzas ou Calabresa
 * - Não é sobrescrito por localStorage ou Unsplash
 * - Caso não tenha imagem ou haja erro, exibe o estado limpo "Sem Imagem" com ícone e nome do produto
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  alt,
  className = 'w-full h-full object-cover object-center',
  containerClassName,
  width = 400,
  height = 225,
  loading = 'lazy',
  fetchPriority,
  showSolidFallback = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanName = getExactFlavorName(product.name);

  // Reseta estado de erro quando o produto ou a imagem mudar
  useEffect(() => {
    setHasError(false);
  }, [product.id, product.image]);

  const rawSrc = product.image ? safeImageUrl(product.image) : '';

  // Se não tem imagem cadastrada ou falhou ao carregar
  if (!rawSrc || hasError) {
    if (!showSolidFallback) return null;
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center text-center p-2 bg-[#F0EAE1] text-[#8C827A] select-none ${
          containerClassName || ''
        }`}
      >
        <Utensils className="w-5 h-5 text-[#A89F95] mb-1" />
        <span className="text-[10px] font-medium text-[#736B63] truncate max-w-full px-1">
          {cleanName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={rawSrc}
      alt={alt || cleanName}
      onError={() => setHasError(true)}
      className={className}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      fetchPriority={fetchPriority}
    />
  );
};
