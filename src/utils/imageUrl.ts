/**
 * Constante de versão para cache-busting das imagens do cardápio em /images/
 */
export const IMAGENS_VERSAO = 2;

/**
 * Ordem de extensões a tentar para cada sabor: .jpg, .png, .jpeg, .webp
 */
export const EXTENSOES_IMAGEM = ['.jpg', '.png', '.jpeg', '.webp'] as const;

/**
 * Imagem padrão de fallback quando o sabor não possui arquivo em /images/
 */
export const DEFAULT_FALLBACK_IMAGE = `/images/Calabresa.png?v=${IMAGENS_VERSAO}`;

/**
 * Retorna o nome exato do sabor do cardápio, removendo apenas o código numérico inicial (ex: "01 - ").
 * Mantém exatamente as maiúsculas, minúsculas, acentos e espaços do nome.
 */
export function getExactFlavorName(productName: string): string {
  if (!productName) return '';
  return productName.replace(/^\d+\s*-\s*/, '').trim();
}

/**
 * Constrói a URL para o sabor na pasta /images/ com a extensão solicitada e versão ?v=IMAGENS_VERSAO.
 * Utiliza encodeURI() para preservar espaços e caracteres acentuados.
 */
export function buildProductImageUrl(productName: string, extIndex = 0): string {
  const flavor = getExactFlavorName(productName);
  const ext = EXTENSOES_IMAGEM[extIndex] || '.jpg';
  return `/images/${encodeURI(flavor)}${ext}?v=${IMAGENS_VERSAO}`;
}

/**
 * Helper to safely encode image URLs that may contain spaces or accented characters.
 * Ensures compatibility across browsers, Vercel Edge CDN, and strict proxies,
 * and attaches a cache-busting version parameter (?v=IMAGENS_VERSAO) to local assets.
 */
export function safeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Keep external URLs and Vite internal module asset imports intact
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/@') ||
    url.includes('/@fs/') ||
    url.startsWith('/src/assets')
  ) {
    return url;
  }
  try {
    const [pathPart, queryPart] = url.split('?');
    const encodedPath = encodeURI(decodeURI(pathPart));
    const versionQuery = queryPart ? queryPart : `v=${IMAGENS_VERSAO}`;
    return `${encodedPath}?${versionQuery}`;
  } catch {
    const [pathPart, queryPart] = url.split('?');
    const versionQuery = queryPart ? queryPart : `v=${IMAGENS_VERSAO}`;
    return `${encodeURI(pathPart)}?${versionQuery}`;
  }
}
