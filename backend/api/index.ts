// Handler Vercel - CORS usando abordagem direta e testada
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Headers CORS - APLICAR SEMPRE PRIMEIRO
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // OPTIONS (preflight) - RETORNAR IMEDIATAMENTE
  if (req.method === 'OPTIONS') {
    console.log('[CORS] OPTIONS preflight - Origin:', req.headers.origin);
    res.status(200).end();
    return;
  }

  // Verificar DATABASE_URL
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: 'DATABASE_URL not configured' 
    });
  }

  try {
    // Importar Express app
    const expressApp = await import('../src/server');
    const app = expressApp.default;
    
    if (!app) {
      return res.status(500).json({ 
        error: 'Internal server error', 
        details: 'Express app not exported' 
      });
    }
    
    // Ajustar caminho
    let originalUrl = req.url || '/';
    
    if (req.query && typeof req.query.path === 'string') {
      originalUrl = `/${req.query.path}`;
    }
    
    if (originalUrl === '/' || originalUrl === '') {
      return res.json({ 
        status: 'ok', 
        message: 'Atlas Backend API',
        timestamp: new Date().toISOString()
      });
    }
    
    // Normalizar caminho
    let adjustedUrl = originalUrl.split('?')[0];
    
    if (adjustedUrl.startsWith('/api/v1/')) {
      // OK
    } else if (adjustedUrl.startsWith('/v1/')) {
      adjustedUrl = `/api${adjustedUrl}`;
    } else if (!adjustedUrl.startsWith('/api')) {
      adjustedUrl = `/api${adjustedUrl}`;
    }
    
    // Criar requisição para Express
    const adjustedReq = {
      ...req,
      url: adjustedUrl,
      originalUrl: adjustedUrl,
      path: adjustedUrl.split('?')[0],
      pathname: adjustedUrl.split('?')[0],
      baseUrl: '',
      route: null
    } as any;
    
    // Executar Express
    return new Promise<void>((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved && !res.headersSent) {
          resolved = true;
          res.status(504).json({ error: 'Request timeout' });
          resolve();
        }
      }, 30000);
      
      app(adjustedReq, res as any, (err?: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
        }
        
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Internal server error', details: err.message });
        }
        resolve();
      });
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error?.message || String(error)
    });
  }
}
