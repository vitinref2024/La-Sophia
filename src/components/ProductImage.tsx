import React from 'react';
import { Utensils } from 'lucide-react';
import { Product } from '../types';
import { getExactFlavorName } from '../utils/imageUrl';

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
 * - Renderiza diretamente a imagem real do produto (<img src={product.image} alt={product.name} />)
 * - Não possui onError ou fallback que esconda ou substitua a foto real
 * - Se o produto não possuir arquivo de foto cadastrado, exibe o marcador padrão com ícone e nome
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
  const cleanName = getExactFlavorName(product.name);

  // Se o produto possui imagem física associada, renderiza diretamente com WebP de alta performance
  if (product.image && product.image.trim()) {
    const rawUrl = product.image.trim();
    const cleanUrl = rawUrl.split('?')[0];
    const query = rawUrl.includes('?') ? '?' + rawUrl.split('?')[1] : '';
    const webpUrl = cleanUrl.endsWith('.webp') ? rawUrl : cleanUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp') + query;
    const fallbackUrl = cleanUrl.endsWith('.webp') ? cleanUrl.replace(/\.webp$/i, '.png') + query : rawUrl;

    return (
      <picture className="w-full h-full block">
        <source type="image/webp" srcSet={webpUrl} />
        <img
          src={fallbackUrl}
          alt={alt || cleanName || product.name}
          className={className}
          loading={loading}
          decoding="async"
          width={width}
          height={height}
          fetchPriority={fetchPriority}
        />
      </picture>
    );
  }

  // Se o produto não possui foto física cadastrada, exibe o marcador limpo
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
};
