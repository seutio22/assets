import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role
  };
  // @ts-ignore - jsonwebtoken types issue with string secret
  return jwt.sign(tokenPayload, String(JWT_SECRET), {
    expiresIn: String(JWT_EXPIRES_IN)
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

