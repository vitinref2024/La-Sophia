import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { calculateDrivingDistanceWithGoogle } from './src/server/googleMapsService.ts';

try {
  process.loadEnvFile?.();
} catch {
  // .env file optional
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper para salvar manifest de fotos customizadas
  const getPhotosManifest = (): Record<string, string> => {
    const jsonPath = path.resolve(__dirname, 'public/data/custom-photos.json');
    if (fs.existsSync(jsonPath)) {
      try {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      } catch {
        return {};
      }
    }
    return {};
  };

  const savePhotosManifest = (manifest: Record<string, string>) => {
    const content = JSON.stringify(manifest, null, 2);
    const pubPath = path.resolve(__dirname, 'public/data/custom-photos.json');
    const distPath = path.resolve(__dirname, 'dist/data/custom-photos.json');
    fs.mkdirSync(path.dirname(pubPath), { recursive: true });
    fs.writeFileSync(pubPath, content);
    if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
      fs.mkdirSync(path.dirname(distPath), { recursive: true });
      fs.writeFileSync(distPath, content);
    }
  };

  // Helper para salvar foto permanentemente em disco (tanto em public/images pelo nome do sabor quanto por ID)
  const saveImageToDisk = (base64Data: string, productId?: string, flavorName?: string) => {
    try {
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      const targetPaths: string[] = [];

      if (flavorName) {
        // Salva com nome exato do sabor para a cascata /images/
        targetPaths.push(path.resolve(__dirname, `public/images/${flavorName}.png`));
        targetPaths.push(path.resolve(__dirname, `public/images/${flavorName}.jpg`));
        targetPaths.push(path.resolve(__dirname, `public/imagens/${flavorName}.png`));
        targetPaths.push(path.resolve(__dirname, `public/imagens/${flavorName}.jpg`));
        if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
          targetPaths.push(path.resolve(__dirname, `dist/images/${flavorName}.png`));
          targetPaths.push(path.resolve(__dirname, `dist/images/${flavorName}.jpg`));
        }
      }

      if (productId) {
        targetPaths.push(path.resolve(__dirname, `public/imagens/custom/${productId}.jpg`));
        targetPaths.push(path.resolve(__dirname, `public/images/${productId}.jpg`));
        if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
          targetPaths.push(path.resolve(__dirname, `dist/imagens/custom/${productId}.jpg`));
          targetPaths.push(path.resolve(__dirname, `dist/images/${productId}.jpg`));
        }
      }

      for (const filePath of targetPaths) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, buffer);
      }
      return true;
    } catch (e) {
      console.warn('Erro ao gravar arquivo de imagem no disco:', e);
      return false;
    }
  };

  // Endpoint para listar todas as fotos personalizadas salvas no servidor
  app.get('/api/photos', (_req, res) => {
    try {
      const manifest = getPhotosManifest();
      res.json(manifest);
    } catch (err: any) {
      res.json({});
    }
  });

  // Endpoint para salvar todas as fotos enviadas pelo cliente de forma permanente
  app.post('/api/save-all-photos', (req, res) => {
    try {
      const { photos, flavorNames } = req.body || {};
      if (!photos || typeof photos !== 'object') {
        return res.status(400).json({ success: false, error: 'Objeto de fotos inválido' });
      }

      const manifest = getPhotosManifest();
      let count = 0;
      const now = Date.now();

      for (const [productId, dataUrl] of Object.entries(photos)) {
        if (!productId || typeof dataUrl !== 'string' || !dataUrl.includes('base64,')) {
          continue;
        }

        const flavor = flavorNames && typeof flavorNames === 'object' ? flavorNames[productId] : undefined;
        saveImageToDisk(dataUrl, productId, flavor);

        const filename = `${productId}.jpg`;
        manifest[productId] = `/imagens/custom/${filename}?v=${now}`;
        if (flavor) {
          manifest[flavor] = `/images/${encodeURI(flavor)}.png?v=${now}`;
        }
        count++;
      }

      savePhotosManifest(manifest);
      console.log(`[API] ${count} fotos sincronizadas e salvas permanentemente no servidor!`);
      res.json({ success: true, count, manifest });
    } catch (err: any) {
      console.error('Erro em /api/save-all-photos:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint para salvar uma foto individual no servidor
  app.post('/api/upload-product-photo', (req, res) => {
    try {
      const { productId, base64Data, flavorName } = req.body || {};
      if (!productId || !base64Data) {
        return res.status(400).json({ success: false, error: 'productId ou base64Data ausentes' });
      }

      saveImageToDisk(base64Data, productId, flavorName);

      const manifest = getPhotosManifest();
      const relativePath = flavorName
        ? `/images/${encodeURI(flavorName)}.png?v=${Date.now()}`
        : `/imagens/custom/${productId}.jpg?v=${Date.now()}`;

      manifest[productId] = relativePath;
      if (flavorName) {
        manifest[flavorName] = relativePath;
      }
      savePhotosManifest(manifest);

      res.json({ success: true, productId, flavorName, path: relativePath });
    } catch (err: any) {
      console.error('Erro em /api/upload-product-photo:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint para deletar foto personalizada no servidor
  app.delete('/api/delete-product-photo/:id', (req, res) => {
    try {
      const productId = req.params.id;
      const filename = `${productId}.jpg`;
      const pubFile = path.resolve(__dirname, 'public/imagens/custom', filename);
      const distFile = path.resolve(__dirname, 'dist/imagens/custom', filename);

      if (fs.existsSync(pubFile)) fs.unlinkSync(pubFile);
      if (fs.existsSync(distFile)) fs.unlinkSync(distFile);

      const manifest = getPhotosManifest();
      delete manifest[productId];
      savePhotosManifest(manifest);

      res.json({ success: true, productId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint legado para salvar imagens diretamente na pasta public/imagens/pizzas
  app.post('/api/upload-pizza-image', (req, res) => {
    try {
      const { filename, base64Data } = req.body || {};
      if (!filename || !base64Data) {
        return res.status(400).json({ success: false, error: 'Arquivo ou dados ausentes' });
      }
      const cleanName = path.basename(filename);
      const publicDir = path.resolve(__dirname, 'public/imagens/pizzas');
      const distDir = path.resolve(__dirname, 'dist/imagens/pizzas');
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');

      fs.writeFileSync(path.join(publicDir, cleanName), buffer);
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, cleanName), buffer);
      }

      console.log(`Imagem salva com sucesso: ${cleanName} (${buffer.length} bytes)`);
      res.json({ success: true, size: buffer.length, filename: cleanName, path: `/imagens/pizzas/${cleanName}` });
    } catch (err: any) {
      console.error('Erro no upload de imagem:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API oficial para cálculo de distância com Google Maps
  app.post('/api/calculate-distance', async (req, res) => {
    try {
      const result = await calculateDrivingDistanceWithGoogle(req.body || {});
      res.json(result);
    } catch (error: any) {
      console.error('Erro em /api/calculate-distance:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao calcular a distância rodoviária.',
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'La Sophia Delivery Distance API' });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  const distExists = fs.existsSync(distPath);

  // 1. Servir explicitamente /imagens com Content-Type correto antes de qualquer middleware de SPA
  const publicImagensPath = path.resolve(__dirname, 'public/imagens');
  app.use('/imagens', express.static(publicImagensPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  }));

  // Bloqueio para /imagens: se não encontrou o arquivo, NUNCA cai no index.html do SPA
  app.use('/imagens', (_req, res) => {
    res.status(404).type('text/plain').send('Imagem não encontrada');
  });

  // Servir arquivos gerais da pasta public
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (distExists && (isProduction || process.env.NODE_ENV !== 'development')) {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Modo desenvolvimento com Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server rodando na porta ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor graciosamente...');
    server.close(() => {
      console.log('Servidor encerrado.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidor...');
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();
