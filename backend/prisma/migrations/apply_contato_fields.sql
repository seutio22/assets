-- Migration: Adicionar campos dataNascimento e ativo na tabela contatos
-- Execute este script no PostgreSQL do Railway

-- Adicionar coluna dataNascimento se não existir
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;

-- Adicionar coluna ativo se não existir
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;

-- Atualizar registros existentes para ter ativo = true por padrão
UPDATE "contatos" 
SET "ativo" = true 
WHERE "ativo" IS NULL;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contatos'
AND column_name IN ('dataNascimento', 'ativo');
