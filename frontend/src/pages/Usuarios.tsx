import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import Modal from '../components/Modal'
import './Usuarios.css'

interface Usuario {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

interface Role {
  id: string
  codigo: string
  nome: string
  descricao?: string
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showRolesModal, setShowRolesModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERADOR'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const usuariosRes = await api.get('/usuarios')
      setUsuarios(usuariosRes.data.data || [])
      
      // Tentar carregar perfis, mas não falhar se não existirem
      try {
        const rolesRes = await api.get('/permissions/roles')
        setRoles(rolesRes.data.data || [])
      } catch (rolesError: any) {
        console.warn('Perfis não disponíveis:', rolesError)
        setRoles([])
        // Não mostrar erro se for apenas porque as tabelas não existem
        if (rolesError.response?.status !== 500) {
          console.error('Erro ao carregar perfis:', rolesError)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRoles = async (userId: string) => {
    try {
      const response = await api.get(`/permissions/users/${userId}/roles`)
      const userRolesData = response.data.data || []
      setUserRoles(userRolesData.map((r: Role) => r.id))
    } catch (error) {
      console.error('Erro ao carregar perfis do usuário:', error)
    }
  }

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingId(usuario.id)
      setFormData({
        name: usuario.name,
        email: usuario.email,
        password: '',
        role: usuario.role
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'OPERADOR'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'OPERADOR'
    })
  }

  const handleOpenRolesModal = async (userId: string) => {
    setSelectedUserId(userId)
    await fetchUserRoles(userId)
    setShowRolesModal(true)
  }

  const handleCloseRolesModal = () => {
    setShowRolesModal(false)
    setSelectedUserId(null)
    setUserRoles([])
  }

  const handleSaveUserRoles = async () => {
    if (!selectedUserId) return

    try {
      // Buscar perfis atuais
      const currentRes = await api.get(`/permissions/users/${selectedUserId}/roles`)
      const currentRoles = currentRes.data.data || []

      // Remover perfis que não estão mais selecionados
      for (const role of currentRoles) {
        if (!userRoles.includes(role.id)) {
          await api.delete(`/permissions/users/${selectedUserId}/roles/${role.id}`)
        }
      }

      // Adicionar novos perfis
      for (const roleId of userRoles) {
        const exists = currentRoles.some((r: Role) => r.id === roleId)
        if (!exists) {
          await api.post(`/permissions/users/${selectedUserId}/roles`, {
            roleId: roleId
          })
        }
      }

      alert('Perfis atualizados com sucesso!')
      handleCloseRolesModal()
      fetchData()
    } catch (error: any) {
      console.error('Erro ao salvar perfis:', error)
      const errorMessage = error.response?.data?.error || error.message
      alert(`Erro ao salvar perfis: ${errorMessage}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Atualizar
        await api.put(`/usuarios/${editingId}`, {
          name: formData.name,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
          role: formData.role
        })
        alert('Usuário atualizado com sucesso!')
      } else {
        // Criar
        if (!formData.password) {
          alert('Senha é obrigatória para novos usuários')
          return
        }
        
        await api.post('/usuarios', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
        alert('Usuário criado com sucesso!')
      }
      
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message
      alert(`Erro ao salvar: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      await api.delete(`/usuarios/${id}`)
      alert('Usuário excluído com sucesso!')
      fetchData()
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      const errorMessage = error.response?.data?.error || error.message
      alert(`Erro ao excluir: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="usuarios-page">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h1>Usuários</h1>
        <button 
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.name}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className="role-badge">{usuario.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${usuario.active ? 'status-active' : 'status-inactive'}`}>
                      {usuario.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        onClick={() => handleOpenRolesModal(usuario.id)}
                        title="Gerenciar Perfis"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => handleOpenModal(usuario)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(usuario.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Senha {!editingId && '*'}
              {editingId && <span style={{ fontSize: '12px', color: '#666' }}> (deixe em branco para não alterar)</span>}
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingId}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Papel *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="OPERADOR">Operador</option>
              <option value="GESTOR">Gestor</option>
              <option value="ANALISTA">Analista</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Criar'} Usuário
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Gerenciar Perfis */}
      <Modal
        isOpen={showRolesModal}
        onClose={handleCloseRolesModal}
        title="Gerenciar Perfis do Usuário"
        size="medium"
      >
        {selectedUserId && (
          <div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Selecione os perfis que este usuário terá acesso:
            </p>

            <div className="roles-list">
              {roles.map((role) => (
                <label key={role.id} className="role-checkbox">
                  <input
                    type="checkbox"
                    checked={userRoles.includes(role.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUserRoles([...userRoles, role.id])
                      } else {
                        setUserRoles(userRoles.filter(id => id !== role.id))
                      }
                    }}
                  />
                  <div>
                    <strong>{role.nome}</strong>
                    <small>{role.codigo}</small>
                    {role.descricao && (
                      <small style={{ display: 'block', marginTop: '4px' }}>
                        {role.descricao}
                      </small>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleCloseRolesModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveUserRoles}>
                Salvar Perfis
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Usuarios

