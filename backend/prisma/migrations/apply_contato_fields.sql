-- Migration para adicionar campos dataNascimento e ativo na tabela contatos
-- Esta migration é segura e não perde dados existentes

-- Adicionar coluna dataNascimento (opcional)
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;

-- Adicionar coluna ativo (opcional, com valor padrão TRUE)
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;

-- Atualizar registros existentes para ter ativo = true
UPDATE "contatos" 
SET "ativo" = true 
WHERE "ativo" IS NULL;

