// Serviço para buscar dados estruturais com cache
// Produtos, portes, módulos, configurações, etc.

import { api } from './api'
import { structuralCache, CacheKeys } from './cache'

interface Modulo {
  id: string
  nome: string
}

interface ConfiguracaoCampo {
  id: string
  nome: string
}

interface DadoDinamico {
  id: string
  valor: string
  ativo: boolean
}

interface ProdutoOuPorte {
  id: string
  valor: string
}

/**
 * Busca módulos com cache
 */
export async function fetchModulos(): Promise<Modulo[]> {
  let modulos = structuralCache.get<Modulo[]>(CacheKeys.MODULOS)
  
  if (!modulos) {
    const response = await api.get('/modulos')
    modulos = response.data.data || []
    structuralCache.set(CacheKeys.MODULOS, modulos, 10 * 60 * 1000) // Cache de 10 minutos
  }
  
  return modulos
}

/**
 * Busca configurações de um módulo com cache
 */
export async function fetchConfiguracoes(moduloId: string): Promise<ConfiguracaoCampo[]> {
  const cacheKey = `${CacheKeys.CONFIGURACOES_APOLICE}_${moduloId}`
  let configs = structuralCache.get<ConfiguracaoCampo[]>(cacheKey)
  
  if (!configs) {
    const response = await api.get(`/configuracoes-campos?moduloId=${moduloId}`)
    configs = response.data.data || []
    structuralCache.set(cacheKey, configs, 10 * 60 * 1000) // Cache de 10 minutos
  }
  
  return configs
}

/**
 * Busca dados dinâmicos de uma configuração com cache
 */
export async function fetchDadosDinamicos(configuracaoCampoId: string): Promise<DadoDinamico[]> {
  const cacheKey = CacheKeys.DADOS_DINAMICOS(configuracaoCampoId)
  let dados = structuralCache.get<DadoDinamico[]>(cacheKey)
  
  if (!dados) {
    const response = await api.get(`/dados-dinamicos?configuracaoCampoId=${configuracaoCampoId}`)
    dados = response.data.data || []
    structuralCache.set(cacheKey, dados, 5 * 60 * 1000) // Cache de 5 minutos
  }
  
  return dados
}

/**
 * Busca produtos (dados estruturais) com cache
 */
export async function fetchProdutos(): Promise<ProdutoOuPorte[]> {
  // Verificar cache primeiro
  const cached = structuralCache.get<ProdutoOuPorte[]>(CacheKeys.PRODUTOS)
  if (cached) {
    return cached
  }

  try {
    const modulos = await fetchModulos()
    const moduloApolice = modulos.find((m) => 
      m.nome.toLowerCase() === 'apolice' || m.nome.toLowerCase() === 'apólice'
    )

    if (!moduloApolice) {
      return []
    }

    const configs = await fetchConfiguracoes(moduloApolice.id)
    const configProduto = configs.find((c) => c.nome.toLowerCase() === 'produto')

    if (!configProduto) {
      return []
    }

    const dados = await fetchDadosDinamicos(configProduto.id)
    const produtosFormatados = dados
      .filter((d) => d.ativo !== false)
      .map((d) => ({ id: d.id, valor: d.valor }))

    // Cachear produtos formatados
    structuralCache.set(CacheKeys.PRODUTOS, produtosFormatados, 5 * 60 * 1000)
    return produtosFormatados
  } catch (err) {
    console.error('Erro ao carregar produtos:', err)
    return []
  }
}

/**
 * Busca portes (dados estruturais) com cache
 */
export async function fetchPortes(): Promise<ProdutoOuPorte[]> {
  // Verificar cache primeiro
  const cached = structuralCache.get<ProdutoOuPorte[]>(CacheKeys.PORTES)
  if (cached) {
    return cached
  }

  try {
    const modulos = await fetchModulos()
    const moduloApolice = modulos.find((m) => 
      m.nome.toLowerCase() === 'apolice' || m.nome.toLowerCase() === 'apólice'
    )

    if (!moduloApolice) {
      return []
    }

    const configs = await fetchConfiguracoes(moduloApolice.id)
    const configPorte = configs.find((c) => c.nome.toLowerCase() === 'porte')

    if (!configPorte) {
      return []
    }

    const dados = await fetchDadosDinamicos(configPorte.id)
    const portesFormatados = dados
      .filter((d) => d.ativo !== false)
      .map((d) => ({ id: d.id, valor: d.valor }))

    // Cachear portes formatados
    structuralCache.set(CacheKeys.PORTES, portesFormatados, 5 * 60 * 1000)
    return portesFormatados
  } catch (err) {
    console.error('Erro ao carregar portes:', err)
    return []
  }
}

/**
 * Limpa o cache de produtos e portes (útil quando dados são atualizados)
 */
export function clearStructuralCache(): void {
  structuralCache.delete(CacheKeys.PRODUTOS)
  structuralCache.delete(CacheKeys.PORTES)
  structuralCache.delete(CacheKeys.MODULOS)
  // Limpar todas as configurações e dados dinâmicos também
  structuralCache.cleanup()
}

