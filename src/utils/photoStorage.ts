/**
 * Utilitário de persistência e sincronização de fotos do cardápio usando
 * IndexedDB (local no navegador) + Sincronização Permanente com Servidor (/api/photos e /imagens/custom/).
 * 
 * Permite que:
 * 1. O admin suba fotos com redimensionamento (máx 600px, JPEG 0.7).
 * 2. As fotos sejam sincronizadas e gravadas fisicamente no servidor em disco.
 * 3. Qualquer cliente ou dispositivo novo carregue automaticamente as fotos permanentes do servidor.
 */

const DB_NAME = 'lasophia_menu_photos_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

// Cache síncrono em memória para resposta instantânea nos componentes
const memoryCache = new Map<string, string>();
let isInitialized = false;

// Inicializa o banco IndexedDB local
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Erro ao abrir IndexedDB'));
    };
  });
}

/**
 * Inicializa o storage:
 * 1. Carrega fotos salvas do IndexedDB e localStorage locais.
 * 2. Busca o manifesto de fotos salvas no servidor (/api/photos) e adiciona ao cache.
 * 3. Se houver fotos locais em base64, sincroniza automaticamente com o servidor!
 */
export async function initPhotoStorage(): Promise<void> {
  if (isInitialized) return;

  // 1. Carrega fotos do localStorage se houver
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('custom_photo_')) {
          const id = key.replace('custom_photo_', '');
          const val = localStorage.getItem(key);
          if (val) memoryCache.set(id, val);
        }
      }
      const legacyEscarola = localStorage.getItem('custom_pizza_image_24');
      if (legacyEscarola && !memoryCache.has('pizza-24')) {
        memoryCache.set('pizza-24', legacyEscarola);
      }
    }
  } catch (e) {
    console.warn('Aviso ao ler localStorage inicial:', e);
  }

  // 2. Carrega fotos do IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          if (cursor.value && cursor.value.id && cursor.value.dataUrl) {
            memoryCache.set(cursor.value.id, cursor.value.dataUrl);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      cursorRequest.onerror = () => {
        resolve();
      };
    });
  } catch (err) {
    console.warn('IndexedDB inacessível:', err);
  }

  // 3. Carrega fotos públicas oficiais permanentes do servidor
  try {
    const res = await fetch('/api/photos?t=' + Date.now());
    if (res.ok) {
      const serverManifest: Record<string, string> = await res.json();
      for (const [id, url] of Object.entries(serverManifest)) {
        // Se o cliente não tiver uma versão base64 mais recente em edição, usa a foto oficial do servidor
        if (!memoryCache.has(id)) {
          memoryCache.set(id, url);
        }
      }
    }
  } catch (e) {
    console.warn('Não foi possível sincronizar fotos do servidor inicial:', e);
  }

  isInitialized = true;

  // 4. Sincroniza em segundo plano quaisquer fotos que ainda estejam apenas no IndexedDB local
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      syncAllPhotosToServer().catch(() => {});
    }, 1000);
  }
}

// Inicializa imediatamente
if (typeof window !== 'undefined') {
  initPhotoStorage().catch((err) => console.warn('Erro ao inicializar storage de fotos:', err));
}

/**
 * Retorna a foto personalizada de um produto pelo seu ID, se houver
 */
export function getCustomProductImage(productId: string): string | null {
  if (!productId) return null;

  // 1. Checa cache em memória
  if (memoryCache.has(productId)) {
    return memoryCache.get(productId) || null;
  }

  // 2. Fallback de localStorage
  try {
    const val = localStorage.getItem(`custom_photo_${productId}`);
    if (val) {
      memoryCache.set(productId, val);
      return val;
    }
    if (productId === 'pizza-24' || productId === '24') {
      const legacy = localStorage.getItem('custom_pizza_image_24');
      if (legacy) {
        memoryCache.set(productId, legacy);
        return legacy;
      }
    }
  } catch {
    // Ignora
  }

  return null;
}

/**
 * Sincroniza TODAS as fotos salvas no IndexedDB com o servidor para torná-las permanentes para todos os clientes
 */
export async function syncAllPhotosToServer(): Promise<{ success: boolean; count: number; error?: string }> {
  await initPhotoStorage();

  const photosToSync: Record<string, string> = {};
  memoryCache.forEach((value, key) => {
    // Apenas imagens que tenham base64 ou dados customizados precisam ser sincronizadas
    if (value && (value.startsWith('data:image/') || value.length > 500)) {
      photosToSync[key] = value;
    }
  });

  const count = Object.keys(photosToSync).length;
  if (count === 0) {
    return { success: true, count: 0 };
  }

  try {
    const response = await fetch('/api/save-all-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: photosToSync }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, count: 0, error: errData.error || 'Erro ao sincronizar com o servidor' };
    }

    const data = await response.json();
    if (data.manifest && typeof data.manifest === 'object') {
      // Atualiza o cache local com os caminhos dos arquivos permanentes no servidor
      for (const [id, url] of Object.entries(data.manifest as Record<string, string>)) {
        memoryCache.set(id, url);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('custom-product-image-updated', {
            detail: { all: true },
          })
        );
      }
    }

    return { success: true, count: data.count || count };
  } catch (err: any) {
    console.error('Erro na sincronização de fotos com o servidor:', err);
    return { success: false, count: 0, error: err?.message || 'Falha na conexão' };
  }
}

/**
 * Salva uma foto customizada no IndexedDB e sincroniza imediatamente com o servidor
 */
export async function saveCustomProductImage(
  productId: string,
  dataUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!productId || !dataUrl) {
    return { success: false, error: 'Dados inválidos para salvar a foto' };
  }

  // Atualiza cache em memória imediatamente
  memoryCache.set(productId, dataUrl);

  let idbSaved = false;

  // 1. Salva no IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: productId, dataUrl, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    idbSaved = true;
  } catch (err) {
    console.warn('Falha ao salvar no IndexedDB, tentando localStorage:', err);
  }

  // 2. Tenta também no localStorage como backup
  try {
    localStorage.setItem(`custom_photo_${productId}`, dataUrl);
  } catch {
    // ignora se atingir limite
  }

  // 3. Salva de forma permanente no servidor em segundo plano
  fetch('/api/upload-product-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, base64Data: dataUrl }),
  })
    .then((res) => res.json())
    .then((resData) => {
      if (resData.path) {
        memoryCache.set(productId, resData.path);
      }
    })
    .catch((err) => {
      console.warn('Aviso: falha temporária ao sincronizar foto com o servidor:', err);
    });

  // Notifica todos os cards sobre a alteração
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('custom-product-image-updated', {
        detail: { id: productId, dataUrl },
      })
    );
  }

  return { success: true };
}

/**
 * Remove a foto customizada de um produto e restaura o padrão no cliente e no servidor
 */
export async function removeCustomProductImage(productId: string): Promise<boolean> {
  if (!productId) return false;

  memoryCache.delete(productId);

  // Remove do IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(productId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Erro ao deletar do IndexedDB:', err);
  }

  // Remove do localStorage
  try {
    localStorage.removeItem(`custom_photo_${productId}`);
    if (productId === 'pizza-24') {
      localStorage.removeItem('custom_pizza_image_24');
    }
  } catch {
    // ignore
  }

  // Remove do servidor
  fetch(`/api/delete-product-photo/${productId}`, { method: 'DELETE' }).catch(() => {});

  // Notifica cards
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('custom-product-image-updated', {
        detail: { id: productId, dataUrl: null },
      })
    );
  }

  return true;
}

/**
 * Exporta todas as fotos cadastradas como objeto JSON { [productId]: dataUrl }
 */
export async function exportAllPhotos(): Promise<Record<string, string>> {
  await initPhotoStorage();
  const result: Record<string, string> = {};

  memoryCache.forEach((value, key) => {
    if (value) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Importa fotos a partir de um JSON ou objeto e salva permanentemente no servidor
 */
export async function importPhotos(
  jsonData: string | Record<string, string>
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let parsed: Record<string, string>;
    if (typeof jsonData === 'string') {
      parsed = JSON.parse(jsonData);
    } else {
      parsed = jsonData;
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, count: 0, error: 'Arquivo JSON inválido ou vazio.' };
    }

    let count = 0;
    const entries = Object.entries(parsed);

    for (const [id, dataUrl] of entries) {
      if (id && typeof dataUrl === 'string' && (dataUrl.startsWith('data:image/') || dataUrl.startsWith('/imagens/'))) {
        await saveCustomProductImage(id, dataUrl);
        count++;
      }
    }

    // Sincroniza em lote com o servidor
    await syncAllPhotosToServer();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('custom-product-image-updated', {
          detail: { all: true },
        })
      );
    }

    return { success: true, count };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: `Erro ao importar arquivo: ${err?.message || 'formato inválido'}`,
    };
  }
}

/**
 * Lê o arquivo com FileReader e reduz para no máximo 600px de largura usando Canvas,
 * salvando em JPEG com qualidade 0.7.
 */
export function processImageFile(file: File, maxWidth = 600, quality = 0.7): Promise<string> {
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
        reject(new Error('Não foi possível carregar a imagem'));
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

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

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Erro ao redimensionar via canvas:', canvasErr);
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
