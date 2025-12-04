import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'MDS Brasil',
      domain: 'mdsbrasil'
    }
  });

  // ============================================
  // CRIAR RECURSOS DO SISTEMA
  // ============================================
  console.log('📦 Criando recursos do sistema...');
  
  const recursos = [
    { codigo: 'GRUPOS_ECONOMICOS', nome: 'Grupos Econômicos', modulo: 'GESTAO' },
    { codigo: 'EMPRESAS', nome: 'Empresas', modulo: 'GESTAO' },
    { codigo: 'FORNECEDORES', nome: 'Fornecedores', modulo: 'GESTAO' },
    { codigo: 'APOLICES', nome: 'Apólices', modulo: 'GESTAO' },
    { codigo: 'PLANOS', nome: 'Planos', modulo: 'GESTAO' },
    { codigo: 'SOLICITACOES', nome: 'Solicitações', modulo: 'SOLICITACOES' },
    { codigo: 'PLACEMENT', nome: 'Placement', modulo: 'PLACEMENT' },
    { codigo: 'IMPLANTACAO', nome: 'Implantação', modulo: 'IMPLANTACAO' },
    { codigo: 'USUARIOS', nome: 'Usuários', modulo: 'ADMINISTRACAO' },
    { codigo: 'PERFIS', nome: 'Perfis de Acesso', modulo: 'ADMINISTRACAO' },
    { codigo: 'CONFIGURACOES', nome: 'Configurações', modulo: 'ADMINISTRACAO' },
    { codigo: 'PORTAL_RH', nome: 'Portal RH', modulo: 'PORTAL' },
  ];

  // Verificar se o modelo Resource existe no Prisma Client
  if (!prisma.resource) {
    console.log('⚠️  Prisma Client não foi regenerado!');
    console.log('   Execute: npm run prisma:generate');
    console.log('   Depois: npx prisma migrate dev --name add_permissions_system');
    return;
  }

  // Verificar se a tabela Resource existe
  let recursosCriados: any[] = [];
  try {
    recursosCriados = await Promise.all(
      recursos.map(rec => 
        prisma.resource.upsert({
          where: { codigo: rec.codigo },
          update: rec,
          create: rec
        })
      )
    );
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.log('⚠️  Tabelas de permissões não existem ainda. Execute a migration primeiro.');
      console.log('   npx prisma migrate dev --name add_permissions_system');
      return;
    }
    throw error;
  }

  console.log(`✅ ${recursosCriados.length} recursos criados`);

  // ============================================
  // CRIAR PERMISSÕES DO SISTEMA
  // ============================================
  console.log('🔐 Criando permissões do sistema...');
  
  const permissoes = [
    { codigo: 'CREATE', nome: 'Criar', categoria: 'CRUD', descricao: 'Permite criar novos registros' },
    { codigo: 'READ', nome: 'Visualizar', categoria: 'CRUD', descricao: 'Permite visualizar registros' },
    { codigo: 'UPDATE', nome: 'Editar', categoria: 'CRUD', descricao: 'Permite editar registros' },
    { codigo: 'DELETE', nome: 'Excluir', categoria: 'CRUD', descricao: 'Permite excluir registros' },
    { codigo: 'APPROVE', nome: 'Aprovar', categoria: 'WORKFLOW', descricao: 'Permite aprovar processos' },
    { codigo: 'REJECT', nome: 'Rejeitar', categoria: 'WORKFLOW', descricao: 'Permite rejeitar processos' },
    { codigo: 'MANAGE', nome: 'Gerenciar', categoria: 'ADMIN', descricao: 'Acesso completo ao recurso' },
    { codigo: 'EXPORT', nome: 'Exportar', categoria: 'UTILITARIOS', descricao: 'Permite exportar dados' },
    { codigo: 'IMPORT', nome: 'Importar', categoria: 'UTILITARIOS', descricao: 'Permite importar dados' },
  ];

  if (!prisma.permission) {
    console.log('⚠️  Prisma Client não foi regenerado!');
    console.log('   Execute: npm run prisma:generate');
    return;
  }

  let permissoesCriadas: any[] = [];
  try {
    permissoesCriadas = await Promise.all(
      permissoes.map(perm => 
        prisma.permission.upsert({
          where: { codigo: perm.codigo },
          update: perm,
          create: perm
        })
      )
    );
    console.log(`✅ ${permissoesCriadas.length} permissões criadas`);
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.log('⚠️  Tabela de permissões não existe. Execute a migration primeiro.');
      return;
    }
    throw error;
  }

  // ============================================
  // CRIAR PERFIS PADRÃO
  // ============================================
  console.log('👥 Criando perfis padrão...');

  if (!prisma.role) {
    console.log('⚠️  Prisma Client não foi regenerado!');
    console.log('   Execute: npm run prisma:generate');
    return;
  }

  // Perfil ADMIN (global do sistema)
  let roleAdmin;
  try {
    roleAdmin = await prisma.role.findFirst({
      where: {
        codigo: 'ADMIN',
        tenantId: null
      }
    });

    if (!roleAdmin) {
      roleAdmin = await prisma.role.create({
        data: {
          codigo: 'ADMIN',
          nome: 'Administrador',
          descricao: 'Acesso total ao sistema',
          isSystem: true,
          tenantId: null
        }
      });
    }
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.log('⚠️  Tabela de roles não existe. Execute a migration primeiro.');
      return;
    }
    throw error;
  }

  // Perfil GESTOR (específico do tenant)
  const roleGestor = await prisma.role.upsert({
    where: {
      tenantId_codigo: {
        tenantId: tenant.id,
        codigo: 'GESTOR'
      }
    },
    update: {},
    create: {
      codigo: 'GESTOR',
      nome: 'Gestor',
      descricao: 'Gerencia processos e aprova solicitações',
      isSystem: false,
      tenantId: tenant.id
    }
  });

  // Perfil OPERADOR (específico do tenant)
  const roleOperador = await prisma.role.upsert({
    where: {
      tenantId_codigo: {
        tenantId: tenant.id,
        codigo: 'OPERADOR'
      }
    },
    update: {},
    create: {
      codigo: 'OPERADOR',
      nome: 'Operador',
      descricao: 'Acesso básico para operações do dia a dia',
      isSystem: false,
      tenantId: tenant.id
    }
  });

  // Perfil ANALISTA (específico do tenant)
  const roleAnalista = await prisma.role.upsert({
    where: {
      tenantId_codigo: {
        tenantId: tenant.id,
        codigo: 'ANALISTA'
      }
    },
    update: {},
    create: {
      codigo: 'ANALISTA',
      nome: 'Analista',
      descricao: 'Analisa e processa placements e implantações',
      isSystem: false,
      tenantId: tenant.id
    }
  });

  console.log('✅ Perfis criados');

  // ============================================
  // ATRIBUIR PERMISSÕES AO PERFIL ADMIN
  // ============================================
  console.log('🔗 Atribuindo permissões ao perfil ADMIN...');
  
  // ADMIN tem todas as permissões em todos os recursos
  const rolePermissionsAdmin = [];
  for (const recurso of recursosCriados) {
    for (const permissao of permissoesCriadas) {
      rolePermissionsAdmin.push({
        roleId: roleAdmin.id,
        permissionId: permissao.id,
        resourceId: recurso.id
      });
    }
  }

  // Remover duplicatas e criar
  // Remover duplicatas antes de criar
  const uniquePermissions = Array.from(
    new Map(rolePermissionsAdmin.map(rp => [`${rp.roleId}-${rp.permissionId}-${rp.resourceId}`, rp])).values()
  );
  
  await prisma.rolePermission.createMany({
    data: uniquePermissions,
    skipDuplicates: true
  });

  console.log(`✅ ${rolePermissionsAdmin.length} permissões atribuídas ao ADMIN`);

  // ============================================
  // ATRIBUIR PERMISSÕES AO PERFIL GESTOR
  // ============================================
  console.log('🔗 Atribuindo permissões ao perfil GESTOR...');
  
  const recursosGestor = recursosCriados.filter(r => 
    ['GRUPOS_ECONOMICOS', 'EMPRESAS', 'FORNECEDORES', 'APOLICES', 'PLANOS', 
     'SOLICITACOES', 'PLACEMENT', 'IMPLANTACAO'].includes(r.codigo)
  );
  
  const permissoesGestor = permissoesCriadas.filter(p => 
    ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'].includes(p.codigo)
  );

  const rolePermissionsGestor = [];
  for (const recurso of recursosGestor) {
    for (const permissao of permissoesGestor) {
      rolePermissionsGestor.push({
        roleId: roleGestor.id,
        permissionId: permissao.id,
        resourceId: recurso.id
      });
    }
  }

  const uniqueGestor = Array.from(
    new Map(rolePermissionsGestor.map(rp => [`${rp.roleId}-${rp.permissionId}-${rp.resourceId}`, rp])).values()
  );
  
  await prisma.rolePermission.createMany({
    data: uniqueGestor,
    skipDuplicates: true
  });

  console.log(`✅ ${rolePermissionsGestor.length} permissões atribuídas ao GESTOR`);

  // ============================================
  // ATRIBUIR PERMISSÕES AO PERFIL OPERADOR
  // ============================================
  console.log('🔗 Atribuindo permissões ao perfil OPERADOR...');
  
  const recursosOperador = recursosCriados.filter(r => 
    ['GRUPOS_ECONOMICOS', 'EMPRESAS', 'FORNECEDORES', 'APOLICES', 'PLANOS', 
     'SOLICITACOES'].includes(r.codigo)
  );
  
  const permissoesOperador = permissoesCriadas.filter(p => 
    ['CREATE', 'READ', 'UPDATE', 'EXPORT'].includes(p.codigo)
  );

  const rolePermissionsOperador = [];
  for (const recurso of recursosOperador) {
    for (const permissao of permissoesOperador) {
      rolePermissionsOperador.push({
        roleId: roleOperador.id,
        permissionId: permissao.id,
        resourceId: recurso.id
      });
    }
  }

  const uniqueOperador = Array.from(
    new Map(rolePermissionsOperador.map(rp => [`${rp.roleId}-${rp.permissionId}-${rp.resourceId}`, rp])).values()
  );
  
  await prisma.rolePermission.createMany({
    data: uniqueOperador,
    skipDuplicates: true
  });

  console.log(`✅ ${rolePermissionsOperador.length} permissões atribuídas ao OPERADOR`);

  // ============================================
  // CRIAR USUÁRIO ADMIN
  // ============================================
  console.log('👤 Criando usuário administrador...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@atlas.com'
      }
    },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@atlas.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      active: true
    }
  });

  // Atribuir perfil ADMIN ao usuário
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: roleAdmin.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: roleAdmin.id
    }
  });

  console.log('✅ Usuário administrador criado com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    admin@atlas.com');
  console.log('Senha:    admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

