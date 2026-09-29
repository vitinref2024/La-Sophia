import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { Product } from '../types';
import {
  IMAGENS_VERSAO,
  EXTENSOES_IMAGEM,
  DEFAULT_FALLBACK_IMAGE,
  getExactFlavorName,
  buildProductImageUrl,
  safeImageUrl,
} from '../utils/imageUrl';

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
 * Componente unificado e otimizado para carregar imagens do cardápio com:
 * 1. Prioridade para foto enviada neste aparelho (localStorage)
 * 2. Cascata oficial de extensões em /images/NOME DO SABOR.EXTENSÃO (.jpg -> .png -> .jpeg -> .webp)
 * 3. Fallback automático para imagem padrão caso nenhuma extensão exista
 * 4. Preservação exata de maiúsculas, acentos e espaços via encodeURI
 * 5. Cache-busting ?v=IMAGENS_VERSAO
 * 6. Suporte a loading="lazy", decoding="async", width e height anti-CLS
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
  // Índice da extensão atual na ordem: .jpg (0), .png (1), .jpeg (2), .webp (3)
  const [extIndex, setExtIndex] = useState(0);
  const [failedAllExtensions, setFailedAllExtensions] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  // Foto enviada pelo botão de subir imagem (válida exclusivamente neste aparelho)
  const [localPhoto, setLocalPhoto] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`local_device_photo_${product.id}`) || null;
      }
    } catch {
      // Ignora erro de acesso a storage
    }
    return null;
  });

  // Reseta estado quando o produto mudar
  useEffect(() => {
    setExtIndex(0);
    setFailedAllExtensions(false);
    setFailedFallback(false);
    try {
      if (typeof window !== 'undefined') {
        setLocalPhoto(localStorage.getItem(`local_device_photo_${product.id}`) || null);
      }
    } catch {
      setLocalPhoto(null);
    }
  }, [product.id, product.name]);

  const cleanName = getExactFlavorName(product.name);
  const isBeverage = product.category === 'bebidas' || product.category === 'cervejas';

  const handleImageError = () => {
    // Se falhou com foto do aparelho, remove o snapshot corrompido e tenta a pasta oficial /images/
    if (localPhoto) {
      setLocalPhoto(null);
      setExtIndex(0);
      return;
    }

    // Tenta a próxima extensão na ordem: .jpg -> .png -> .jpeg -> .webp
    if (extIndex < EXTENSOES_IMAGEM.length - 1) {
      setExtIndex((prev) => prev + 1);
    } else {
      // Todas as 4 extensões falharam em /images/
      setFailedAllExtensions(true);
    }
  };

  const handleFallbackError = () => {
    setFailedFallback(true);
  };

  // Se até o fallback falhou ou showSolidFallback estiver ativo
  if (failedFallback) {
    if (!showSolidFallback) return null;
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center text-center p-2 bg-[#F0EAE1] text-[#8C827A] ${containerClassName || ''}`}>
        <Utensils className="w-5 h-5 text-[#A89F95] mb-1" />
        <span className="text-[10px] font-medium text-[#736B63] truncate max-w-full px-1">
          {cleanName}
        </span>
      </div>
    );
  }

  // 1. Imagem local ou cascata de extensões em /images/
  if (!failedAllExtensions) {
    const currentSrc = localPhoto || buildProductImageUrl(product.name, extIndex);
    return (
      <img
        key={`${product.id}_ext_${extIndex}_${localPhoto ? 'local' : 'folder'}`}
        src={currentSrc}
        alt={alt || cleanName}
        onError={handleImageError}
        className={className}
        loading={loading}
        decoding="async"
        width={width}
        height={height}
        // @ts-expect-error React types support fetchPriority in modern browsers
        fetchpriority={fetchPriority}
      />
    );
  }

  // 2. Se falharam todas as extensões, usa imagem padrão (fallback)
  // Para bebidas com imagem específica, tenta safeImageUrl(product.image); senão, DEFAULT_FALLBACK_IMAGE
  const fallbackSrc =
    isBeverage && product.image ? safeImageUrl(product.image) : DEFAULT_FALLBACK_IMAGE;

  return (
    <img
      src={fallbackSrc}
      alt={alt || cleanName}
      onError={handleFallbackError}
      className={className}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
    />
  );
};
