import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Eye, Download } from 'lucide-react'
import './MatrizPermissoes.css'

interface Role {
  id: string
  codigo: string
  nome: string
  permissions?: RolePermission[]
}

interface RolePermission {
  id: string
  permission: {
    codigo: string
    nome: string
  }
  resource?: {
    codigo: string
    nome: string
    modulo?: string
  }
}

interface Resource {
  id: string
  codigo: string
  nome: string
  modulo?: string
}

interface Permission {
  id: string
  codigo: string
  nome: string
}

const MatrizPermissoes = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<string>('TODOS')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolesRes, resourcesRes, permissionsRes] = await Promise.all([
        api.get('/permissions/roles').catch(() => ({ data: { data: [] } })),
        api.get('/permissions/resources').catch(() => ({ data: { data: [] } })),
        api.get('/permissions/permissions').catch(() => ({ data: { data: [] } }))
      ])
      
      setRoles(rolesRes.data.data || [])
      setResources(resourcesRes.data.data || [])
      setPermissions(permissionsRes.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (role: Role, resourceCodigo: string, permissionCodigo: string): boolean => {
    if (!role.permissions) return false
    
    return role.permissions.some(rp => 
      rp.permission.codigo === permissionCodigo &&
      (rp.resource?.codigo || 'GLOBAL') === resourceCodigo
    )
  }

  const modules = Array.from(new Set(resources.map(r => r.modulo || 'OUTROS')))
  const filteredResources = selectedModule === 'TODOS' 
    ? resources 
    : resources.filter(r => (r.modulo || 'OUTROS') === selectedModule)

  const crudPermissions = permissions.filter(p => ['CREATE', 'READ', 'UPDATE', 'DELETE'].includes(p.codigo))
  const workflowPermissions = permissions.filter(p => ['APPROVE', 'REJECT'].includes(p.codigo))
  const adminPermissions = permissions.filter(p => ['MANAGE', 'EXPORT', 'IMPORT'].includes(p.codigo))

  if (loading) {
    return (
      <div className="matriz-page">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="matriz-page">
      <div className="page-header">
        <div>
          <h1>Matriz de Permissões</h1>
          <p className="page-subtitle">Visualize todas as permissões de todos os perfis em uma única matriz</p>
        </div>
        <div className="header-actions">
          <select 
            className="module-filter"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="TODOS">Todos os Módulos</option>
            {modules.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
          <button className="btn btn-outline">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      <div className="matriz-container">
        <div className="matriz-table-wrapper">
          <table className="matriz-table">
            <thead>
              <tr>
                <th className="sticky-col">Recurso / Perfil</th>
                {roles.map(role => (
                  <th key={role.id} className="role-header">
                    <div className="role-header-content">
                      <strong>{role.nome}</strong>
                      <small>{role.codigo}</small>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => (
                <React.Fragment key={resource.id}>
                  {/* Operações Básicas */}
                  <tr className="resource-group-header">
                    <td colSpan={roles.length + 1} className="resource-name-cell">
                      <strong>{resource.nome}</strong>
                      {resource.modulo && (
                        <span className="module-badge">{resource.modulo}</span>
                      )}
                    </td>
                  </tr>
                  
                  {crudPermissions.map(permission => (
                    <tr key={`${resource.id}-${permission.id}`} className="permission-row">
                      <td className="permission-name-cell">
                        <span className="permission-icon">
                          {permission.codigo === 'CREATE' && '➕'}
                          {permission.codigo === 'READ' && '👁️'}
                          {permission.codigo === 'UPDATE' && '✏️'}
                          {permission.codigo === 'DELETE' && '🗑️'}
                        </span>
                        {permission.nome}
                      </td>
                      {roles.map(role => (
                        <td key={role.id} className="permission-cell">
                          {hasPermission(role, resource.codigo, permission.codigo) ? (
                            <span className="permission-badge has-permission">✓</span>
                          ) : (
                            <span className="permission-badge no-permission">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Fluxo de Trabalho */}
                  {workflowPermissions.length > 0 && workflowPermissions.some(p => 
                    roles.some(role => hasPermission(role, resource.codigo, p.codigo))
                  ) && (
                    <>
                      {workflowPermissions.map(permission => (
                        <tr key={`${resource.id}-${permission.id}`} className="permission-row workflow">
                          <td className="permission-name-cell">
                            <span className="permission-icon">
                              {permission.codigo === 'APPROVE' && '✅'}
                              {permission.codigo === 'REJECT' && '❌'}
                            </span>
                            {permission.nome}
                          </td>
                          {roles.map(role => (
                            <td key={role.id} className="permission-cell">
                              {hasPermission(role, resource.codigo, permission.codigo) ? (
                                <span className="permission-badge has-permission">✓</span>
                              ) : (
                                <span className="permission-badge no-permission">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Administração */}
                  {adminPermissions.some(p => 
                    roles.some(role => hasPermission(role, resource.codigo, p.codigo))
                  ) && (
                    <>
                      {adminPermissions.map(permission => (
                        <tr key={`${resource.id}-${permission.id}`} className="permission-row admin">
                          <td className="permission-name-cell">
                            <span className="permission-icon">
                              {permission.codigo === 'MANAGE' && '⚙️'}
                              {permission.codigo === 'EXPORT' && '📤'}
                              {permission.codigo === 'IMPORT' && '📥'}
                            </span>
                            {permission.nome}
                          </td>
                          {roles.map(role => (
                            <td key={role.id} className="permission-cell">
                              {hasPermission(role, resource.codigo, permission.codigo) ? (
                                <span className="permission-badge has-permission">✓</span>
                              ) : (
                                <span className="permission-badge no-permission">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="matriz-legend">
        <div className="legend-item">
          <span className="permission-badge has-permission">✓</span>
          <span>Permissão Ativa</span>
        </div>
        <div className="legend-item">
          <span className="permission-badge no-permission">—</span>
          <span>Sem Permissão</span>
        </div>
      </div>
    </div>
  )
}

export default MatrizPermissoes

