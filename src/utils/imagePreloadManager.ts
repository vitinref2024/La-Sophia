/**
 * Gerenciador Inteligente de Pré-carregamento de Imagens em Segundo Plano (Tier 3)
 * 
 * Regras:
 * 1. Não concorre com o LCP nem com a primeira tela (aguarda idle após carregamento inicial).
 * 2. Processa em lotes controlados (2 imagens por vez) com pausa cooperativa entre lotes.
 * 3. Respeita o modo de economia de dados do usuário (navigator.connection.saveData).
 * 4. Não repete imagens já carregadas.
 */

const preloadedUrls = new Set<string>();
let isPreloadScheduled = false;

interface NetworkInfo {
  saveData?: boolean;
  effectiveType?: string;
}

export function startBackgroundCatalogPreload(imageUrls: string[]): void {
  if (typeof window === 'undefined' || isPreloadScheduled) return;
  isPreloadScheduled = true;

  // 1. Respeitar data-saver e conexões extremamente lentas (2G)
  const nav = navigator as Navigator & { connection?: NetworkInfo };
  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g') {
    return;
  }

  // 2. Filtrar URLs válidas e únicas
  const queue = imageUrls
    .map((url) => (url ? url.trim() : ''))
    .filter((url) => url.length > 0 && !preloadedUrls.has(url));

  if (queue.length === 0) return;

  // 3. Aguardar o carregamento da primeira tela + folga para medições de desempenho/LCP limpo
  let started = false;
  const triggerWorker = () => {
    if (started) return;
    started = true;
    window.removeEventListener('scroll', triggerWorker);
    window.removeEventListener('touchstart', triggerWorker);
    runBatchWorker(queue);
  };

  const scheduleStart = () => {
    // Escuta primeira rolagem/toque do usuário para carregar antecipadamente sob demanda
    window.addEventListener('scroll', triggerWorker, { passive: true, once: true });
    window.addEventListener('touchstart', triggerWorker, { passive: true, once: true });

    // Ou inicia cooperativamente após 5 segundos de ociosidade
    setTimeout(triggerWorker, 5000);
  };

  if (document.readyState === 'complete') {
    scheduleStart();
  } else {
    window.addEventListener('load', scheduleStart, { once: true });
  }
}

/**
 * Processador cooperativo em lotes de 2 imagens
 */
function runBatchWorker(queue: string[]): void {
  if (queue.length === 0) return;

  const runNext = () => {
    if (queue.length === 0) return;

    // Retira 2 URLs da fila
    const batch = queue.splice(0, 2);

    const promises = batch.map((url) => {
      if (preloadedUrls.has(url)) return Promise.resolve();
      preloadedUrls.add(url);

      return new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        let resolved = false;

        const done = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        img.onload = done;
        img.onerror = done;
        img.src = url;

        // Timeout de segurança para não travar a fila em caso de rede lenta
        setTimeout(done, 2500);
      });
    });

    Promise.all(promises).then(() => {
      // Pausa cooperativa de 150ms entre lotes para manter a CPU e a rede livres
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(
          () => {
            setTimeout(runNext, 120);
          },
          { timeout: 1000 }
        );
      } else {
        setTimeout(runNext, 180);
      }
    });
  };

  runNext();
}
