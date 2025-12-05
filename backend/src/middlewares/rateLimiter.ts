import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requisições por IP (aumentado para desenvolvimento)
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // Desabilitar validação de X-Forwarded-For já que trust proxy está configurado
  validate: {
    trustProxy: false, // Não validar, confiar no Express trust proxy
  },
  skip: (req) => {
    // Pular rate limit para requisições de health check
    return req.path === '/health' || req.path === '/health/db'
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 1000, // 5 em produção, 1000 em desenvolvimento
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

