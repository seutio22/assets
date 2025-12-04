/**
 * Helper para buscas no SQLite
 * SQLite não suporta contains diretamente, então usamos uma abordagem compatível
 */
export function createSearchFilter(fields: string[], searchTerm: string) {
  if (!searchTerm || searchTerm.trim() === '') {
    return undefined;
  }

  const search = searchTerm.trim();
  
  // Para SQLite, usamos OR com múltiplos campos
  // O Prisma converterá contains para LIKE automaticamente no SQLite
  return {
    OR: fields.map(field => ({
      [field]: { contains: search }
    }))
  };
}

/**
 * Adiciona filtro de busca ao where clause
 */
export function addSearchToWhere(where: any, fields: string[], searchTerm: string | undefined) {
  if (searchTerm && searchTerm.trim() !== '') {
    const searchFilter = createSearchFilter(fields, searchTerm);
    if (searchFilter) {
      // Se já existe OR, precisamos combinar
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchFilter
        ];
        delete where.OR;
      } else {
        Object.assign(where, searchFilter);
      }
    }
  }
  return where;
}

