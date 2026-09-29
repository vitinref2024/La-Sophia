/**
 * Utilitário para gerenciamento de imagem personalizada do sabor 24 (Escarola)
 * Permite leitura de arquivos pelo FileReader, redimensionamento via Canvas (máx 800px em JPEG 0.8),
 * persistência no localStorage com detecção de QuotaExceededError e atualização em tempo real.
 */

export const ESCAROLA_STORAGE_KEY = 'custom_pizza_image_24';

export function getCustomEscarolaImage(): string | null {
  try {
    return localStorage.getItem(ESCAROLA_STORAGE_KEY) || localStorage.getItem('custom_image_escarola') || null;
  } catch (err) {
    console.warn('Não foi possível ler imagem personalizada do localStorage:', err);
    return null;
  }
}

export function saveCustomEscarolaImage(dataUrl: string): { success: boolean; error?: string } {
  try {
    localStorage.setItem(ESCAROLA_STORAGE_KEY, dataUrl);
    // Notifica outros componentes da aplicação sobre a nova imagem imediatamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('custom-pizza-image-updated', {
          detail: { code: '24', dataUrl },
        })
      );
    }
    return { success: true };
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (err?.message && String(err.message).toLowerCase().includes('quota'));

    if (isQuota) {
      return {
        success: false,
        error: 'Limite de armazenamento do navegador atingido. Não foi possível salvar.',
      };
    }
    return {
      success: false,
      error: 'Não foi possível carregar a imagem no armazenamento do navegador.',
    };
  }
}

/**
 * Lê o arquivo com FileReader e converte para data URL.
 * Se a imagem for grande, reduz para no máximo 800px de largura usando canvas
 * e salva em JPEG com qualidade 0.8.
 */
export function processImageFile(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo selecionado'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error('Não foi possível ler o arquivo'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Arquivo de imagem inválido'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Não foi possível processar a imagem'));
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Se a imagem for grande, reduza para no máximo 800px de largura
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fundo branco para garantir que transparências de PNG fiquem limpas em JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);
          const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegDataUrl);
        } catch (canvasErr) {
          console.warn('Erro ao redimensionar no canvas, fallback para data URL original', canvasErr);
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
