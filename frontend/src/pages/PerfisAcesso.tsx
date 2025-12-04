import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Shield, Users, Key, Table2 } from 'lucide-react'
import Modal from '../components/Modal'
import './PerfisAcesso.css'

interface Role {
  id: string
  codigo: string
  nome: string
  descricao?: string
  isSystem: boolean
  ativo: boolean
  tenantId?: string
  permissions?: RolePermission[]
  _count?: {
    userRoles: number
  }
}

interface RolePermission {
  id: string
  permission: {
    id: string
    codigo: string
    nome: string
    categoria: string
  }
  resource?: {
    id: string
    codigo: string
    nome: string
  }
}

interface Resource {
  id: string
  codigo: string
  nome: string
  descricao?: string
  modulo?: string
}

interface Permission {
  id: string
  codigo: string
  nome: string
  descricao?: string
  categoria: string
}

const PerfisAcesso = () => {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<Role[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    ativo: true
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Map<string, Set<string>>>(new Map())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolesRes, resourcesRes, permissionsRes] = await Promise.all([
        api.get('/permissions/roles').catch(err => ({ data: { data: [], message: err.response?.data?.message } })),
        api.get('/permissions/resources').catch(err => ({ data: { data: [], message: err.response?.data?.message } })),
        api.get('/permissions/permissions').catch(err => ({ data: { data: [], message: err.response?.data?.message } }))
      ])
      
      setRoles(rolesRes.data.data || [])
      setResources(resourcesRes.data.data || [])
      setPermissions(permissionsRes.data.data || [])
      
      // Mostrar mensagem se sistema não estiver inicializado
      if (rolesRes.data.message || resourcesRes.data.message || permissionsRes.data.message) {
        alert('⚠️ Sistema de permissões não inicializado!\n\nExecute no backend:\nnpm run prisma:migrate dev --name add_permissions_system\nnpm run prisma:seed')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados. Verifique se as tabelas de permissões foram criadas.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await api.get(`/permissions/roles/${roleId}/permissions`)
      const rolePermissions = response.data.data || []
      
      // Organizar permissões por recurso
      const permMap = new Map<string, Set<string>>()
      
      rolePermissions.forEach((rp: RolePermission) => {
        const resourceCodigo = rp.resource?.codigo || 'GLOBAL'
        if (!permMap.has(resourceCodigo)) {
          permMap.set(resourceCodigo, new Set())
        }
        permMap.get(resourceCodigo)!.add(rp.permission.codigo)
      })
      
      setSelectedPermissions(permMap)
    } catch (error) {
      console.error('Erro ao carregar permissões do perfil:', error)
    }
  }

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingId(role.id)
      setFormData({
        codigo: role.codigo,
        nome: role.nome,
        descricao: role.descricao || '',
        ativo: role.ativo
      })
    } else {
      setEditingId(null)
      setFormData({
        codigo: '',
        nome: '',
        descricao: '',
        ativo: true
      })
    }
    setShowModal(true)
  }

  const handleOpenPermissionsModal = async (role: Role) => {
    setSelectedRole(role)
    await fetchRolePermissions(role.id)
    setShowPermissionsModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      ativo: true
    })
  }

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false)
    setSelectedRole(null)
    setSelectedPermissions(new Map())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        await api.put(`/permissions/roles/${editingId}`, formData)
        alert('Perfil atualizado com sucesso!')
      } else {
        await api.post('/permissions/roles', formData)
        alert('Perfil criado com sucesso!')
      }
      
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message
      alert(`Erro ao salvar: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este perfil?')) {
      return
    }

    try {
      await api.delete(`/permissions/roles/${id}`)
      alert('Perfil excluído com sucesso!')
      fetchData()
    } catch (error: any) {
      console.error('Erro ao excluir perfil:', error)
      const errorMessage = error.response?.data?.error || error.message
      alert(`Erro ao excluir: ${errorMessage}`)
    }
  }

  const togglePermission = (resourceCodigo: string, permissionCodigo: string) => {
    const newMap = new Map(selectedPermissions)
    if (!newMap.has(resourceCodigo)) {
      newMap.set(resourceCodigo, new Set())
    }
    
    const perms = newMap.get(resourceCodigo)!
    if (perms.has(permissionCodigo)) {
      perms.delete(permissionCodigo)
    } else {
      perms.add(permissionCodigo)
    }
    
    if (perms.size === 0) {
      newMap.delete(resourceCodigo)
    }
    
    setSelectedPermissions(newMap)
  }

  const hasPermission = (resourceCodigo: string, permissionCodigo: string): boolean => {
    const perms = selectedPermissions.get(resourceCodigo)
    return perms ? perms.has(permissionCodigo) : false
  }

  const handleSelectAllModule = (modulo: string, moduleResources: Resource[], permissionsToSelect: Permission[]) => {
    const newMap = new Map(selectedPermissions)
    
    moduleResources.forEach(resource => {
      if (!newMap.has(resource.codigo)) {
        newMap.set(resource.codigo, new Set())
      }
      
      const perms = newMap.get(resource.codigo)!
      permissionsToSelect.forEach(perm => {
        perms.add(perm.codigo)
      })
    })
    
    setSelectedPermissions(newMap)
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    try {
      // Buscar permissões atuais
      const currentRes = await api.get(`/permissions/roles/${selectedRole.id}/permissions`)
      const currentPermissions = currentRes.data.data || []

      // Remover permissões que não estão mais selecionadas
      for (const rp of currentPermissions) {
        const resourceCodigo = rp.resource?.codigo || 'GLOBAL'
        const permissionCodigo = rp.permission.codigo
        
        if (!hasPermission(resourceCodigo, permissionCodigo)) {
          await api.delete(`/permissions/roles/${selectedRole.id}/permissions/${rp.permission.id}`, {
            params: { resourceId: rp.resource?.id || '' }
          })
        }
      }

      // Adicionar novas permissões
      for (const [resourceCodigo, perms] of selectedPermissions.entries()) {
        const resource = resources.find(r => r.codigo === resourceCodigo)
        
        for (const permissionCodigo of perms) {
          const permission = permissions.find(p => p.codigo === permissionCodigo)
          
          if (!permission) continue
          
          // Verificar se já existe
          const exists = currentPermissions.some((rp: RolePermission) => 
            rp.permission.codigo === permissionCodigo &&
            (rp.resource?.codigo || 'GLOBAL') === resourceCodigo
          )
          
          if (!exists) {
            await api.post(`/permissions/roles/${selectedRole.id}/permissions`, {
              permissionId: permission.id,
              resourceId: resource?.id || null
            })
          }
        }
      }

      alert('Permissões atualizadas com sucesso!')
      handleClosePermissionsModal()
      fetchData()
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error)
      const errorMessage = error.response?.data?.error || error.message
      alert(`Erro ao salvar permissões: ${errorMessage}`)
    }
  }

  const permissionCategories = Array.from(new Set(permissions.map(p => p.categoria)))

  if (loading) {
    return (
      <div className="perfis-page">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="perfis-page">
      <div className="page-header">
        <div>
          <h1>Perfis de Acesso</h1>
          <p className="page-subtitle">Gerencie perfis e controle o acesso dos usuários ao sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/matriz-permissoes')}
          >
            <Table2 size={20} />
            Ver Matriz
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} />
            Novo Perfil
          </button>
        </div>
      </div>

      <div className="roles-grid">
        {roles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-card-header">
              <div className="role-icon">
                <Shield size={24} />
              </div>
              <div className="role-info">
                <h3>{role.nome}</h3>
                <span className="role-code">{role.codigo}</span>
              </div>
              {role.isSystem && (
                <span className="system-badge">Sistema</span>
              )}
            </div>
            
            {role.descricao && (
              <p className="role-description">{role.descricao}</p>
            )}
            
            <div className="role-stats">
              <div className="stat-item">
                <Users size={16} />
                <span>{role._count?.userRoles || 0} usuário(s)</span>
              </div>
              <div className="stat-item">
                <Key size={16} />
                <span>{role.permissions?.length || 0} permissão(ões)</span>
              </div>
            </div>

            {/* Resumo de permissões por módulo */}
            {role.permissions && role.permissions.length > 0 && (
              <div className="role-permissions-summary">
                <strong>Permissões Ativas:</strong>
                <div className="permissions-summary-list">
                  {(() => {
                    const permsByResource = new Map<string, string[]>()
                    role.permissions?.forEach((rp: RolePermission) => {
                      const resourceName = rp.resource?.nome || 'Global'
                      if (!permsByResource.has(resourceName)) {
                        permsByResource.set(resourceName, [])
                      }
                      permsByResource.get(resourceName)!.push(rp.permission.nome)
                    })
                    
                    return Array.from(permsByResource.entries()).slice(0, 3).map(([resource, perms]) => (
                      <div key={resource} className="summary-item">
                        <span className="summary-resource">{resource}:</span>
                        <span className="summary-perms">{perms.join(', ')}</span>
                      </div>
                    ))
                  })()}
                  {(() => {
                    const totalResources = new Set(role.permissions?.map((rp: RolePermission) => rp.resource?.nome || 'Global')).size
                    if (totalResources > 3) {
                      return <div className="summary-more">+{totalResources - 3} mais...</div>
                    }
                  })()}
                </div>
              </div>
            )}

            <div className="role-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenPermissionsModal(role)}
              >
                <Key size={16} />
                Gerenciar Permissões
              </button>
              {!role.isSystem && (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleOpenModal(role)}
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    className="btn btn-outline btn-sm btn-danger"
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criar/Editar Perfil */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Perfil' : 'Novo Perfil'}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              type="text"
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              required
              disabled={!!editingId}
              placeholder="Ex: GESTOR_RH"
            />
            <small>Use apenas letras, números e underscore. Será convertido para maiúsculas.</small>
          </div>

          <div className="form-group">
            <label htmlFor="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Ex: Gestor de RH"
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              placeholder="Descreva as responsabilidades deste perfil..."
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              />
              {' '}Perfil ativo
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Criar'} Perfil
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Gerenciar Permissões - Matriz Detalhada */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={handleClosePermissionsModal}
        title={`Gerenciar Permissões - ${selectedRole?.nome}`}
        size="xlarge"
      >
        {selectedRole && (
          <div className="permissions-manager">
            <div className="permissions-header">
              <p>Configure as permissões detalhadas para cada módulo e recurso do sistema:</p>
            </div>

            <div className="permissions-content">
              {/* Agrupar recursos por módulo */}
              {(() => {
                const modules = Array.from(new Set(resources.map(r => r.modulo || 'OUTROS')))
                const crudPermissions = permissions.filter(p => ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(p.codigo))
                const workflowPermissions = permissions.filter(p => ['APPROVE', 'REJECT'].includes(p.codigo))
                const adminPermissions = permissions.filter(p => ['MANAGE', 'EXPORT', 'IMPORT'].includes(p.codigo))

                return modules.map((modulo) => {
                  const moduleResources = resources.filter(r => (r.modulo || 'OUTROS') === modulo)
                  
                  return (
                    <div key={modulo} className="module-section">
                      <div className="module-header">
                        <h3>{modulo === 'OUTROS' ? 'Outros Recursos' : modulo}</h3>
                        <button
                          type="button"
                          className="btn-select-all"
                          onClick={() => handleSelectAllModule(modulo, moduleResources, crudPermissions)}
                        >
                          Selecionar Tudo
                        </button>
                      </div>

                      {moduleResources.map((resource) => (
                        <div key={resource.id} className="resource-permissions-table">
                          <div className="resource-header">
                            <h4>{resource.nome}</h4>
                            {resource.descricao && (
                              <span className="resource-desc">{resource.descricao}</span>
                            )}
                          </div>

                          <div className="permissions-matrix">
                            {/* CRUD Permissions */}
                            {crudPermissions.length > 0 && (
                              <div className="permission-category">
                                <span className="category-label">Operações Básicas</span>
                                <div className="permission-row">
                                  {crudPermissions.map((permission) => (
                                    <label key={permission.id} className="permission-cell">
                                      <input
                                        type="checkbox"
                                        checked={hasPermission(resource.codigo, permission.codigo)}
                                        onChange={() => togglePermission(resource.codigo, permission.codigo)}
                                      />
                                      <div className="permission-icon">
                                        {permission.codigo === 'CREATE' && '➕'}
                                        {permission.codigo === 'READ' && '👁️'}
                                        {permission.codigo === 'UPDATE' && '✏️'}
                                        {permission.codigo === 'DELETE' && '🗑️'}
                                      </div>
                                      <span className="permission-name">{permission.nome}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Workflow Permissions */}
                            {workflowPermissions.length > 0 && (
                              <div className="permission-category">
                                <span className="category-label">Fluxo de Trabalho</span>
                                <div className="permission-row">
                                  {workflowPermissions.map((permission) => (
                                    <label key={permission.id} className="permission-cell">
                                      <input
                                        type="checkbox"
                                        checked={hasPermission(resource.codigo, permission.codigo)}
                                        onChange={() => togglePermission(resource.codigo, permission.codigo)}
                                      />
                                      <div className="permission-icon">
                                        {permission.codigo === 'APPROVE' && '✅'}
                                        {permission.codigo === 'REJECT' && '❌'}
                                      </div>
                                      <span className="permission-name">{permission.nome}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Admin Permissions */}
                            {adminPermissions.length > 0 && (
                              <div className="permission-category">
                                <span className="category-label">Administração</span>
                                <div className="permission-row">
                                  {adminPermissions.map((permission) => (
                                    <label key={permission.id} className="permission-cell">
                                      <input
                                        type="checkbox"
                                        checked={hasPermission(resource.codigo, permission.codigo)}
                                        onChange={() => togglePermission(resource.codigo, permission.codigo)}
                                      />
                                      <div className="permission-icon">
                                        {permission.codigo === 'MANAGE' && '⚙️'}
                                        {permission.codigo === 'EXPORT' && '📤'}
                                        {permission.codigo === 'IMPORT' && '📥'}
                                      </div>
                                      <span className="permission-name">{permission.nome}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Acesso Total */}
                            <div className="permission-category">
                              <label className="permission-cell full-access">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(resource.codigo, 'MANAGE')}
                                  onChange={() => {
                                    if (hasPermission(resource.codigo, 'MANAGE')) {
                                      // Desmarcar MANAGE
                                      togglePermission(resource.codigo, 'MANAGE')
                                    } else {
                                      // Marcar todas as permissões deste recurso
                                      const allPerms = [...crudPermissions, ...workflowPermissions, ...adminPermissions]
                                      allPerms.forEach(perm => {
                                        if (!hasPermission(resource.codigo, perm.codigo)) {
                                          togglePermission(resource.codigo, perm.codigo)
                                        }
                                      })
                                    }
                                  }}
                                />
                                <div className="permission-icon">🔓</div>
                                <span className="permission-name">Acesso Total</span>
                                <small>Marca todas as permissões</small>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              })()}

              {/* Permissões Globais */}
              <div className="module-section">
                <div className="module-header">
                  <h3>Permissões Globais</h3>
                  <small>Permissões que se aplicam a todo o sistema</small>
                </div>
                <div className="permissions-matrix">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="permission-cell">
                      <input
                        type="checkbox"
                        checked={hasPermission('GLOBAL', permission.codigo)}
                        onChange={() => togglePermission('GLOBAL', permission.codigo)}
                      />
                      <div className="permission-icon">🌐</div>
                      <span className="permission-name">{permission.nome}</span>
                      {permission.descricao && (
                        <small>{permission.descricao}</small>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleClosePermissionsModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePermissions}>
                Salvar Permissões
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PerfisAcesso

