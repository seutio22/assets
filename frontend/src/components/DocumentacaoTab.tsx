import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Upload, Download, Edit2, Trash2, Eye, EyeOff, FileText } from 'lucide-react'
import Modal from './Modal'

interface Documento {
  id: string
  nomeArquivo: string
  nomeExibicao: string
  tipoArquivo?: string
  tamanho?: number
  visivel: boolean
  createdAt: string
}

interface DocumentacaoTabProps {
  apoliceId: string
}

const DocumentacaoTab = ({ apoliceId }: DocumentacaoTabProps) => {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [documentosVisiveis, setDocumentosVisiveis] = useState<Documento[]>([])
  const [documentosInternos, setDocumentosInternos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null)
  const [newNomeExibicao, setNewNomeExibicao] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadNomeExibicao, setUploadNomeExibicao] = useState('')
  const [uploadVisivel, setUploadVisivel] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (apoliceId) {
      fetchDocumentos()
    }
  }, [apoliceId])

  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/documentos-apolice?apoliceId=${apoliceId}`)
      const docs = response.data.data || []
      setDocumentos(docs)
      setDocumentosVisiveis(docs.filter((d: Documento) => d.visivel))
      setDocumentosInternos(docs.filter((d: Documento) => !d.visivel))
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Selecione um arquivo para upload')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('arquivo', uploadFile)
      formData.append('apoliceId', apoliceId)
      formData.append('nomeExibicao', uploadNomeExibicao || uploadFile.name)
      formData.append('visivel', uploadVisivel.toString())

      await api.post('/documentos-apolice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowUploadModal(false)
      setUploadFile(null)
      setUploadNomeExibicao('')
      setUploadVisivel(false)
      fetchDocumentos()
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      alert(error.response?.data?.error || 'Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleRename = async () => {
    if (!editingDoc || !newNomeExibicao.trim()) {
      alert('Digite um nome válido')
      return
    }

    try {
      await api.put(`/documentos-apolice/${editingDoc.id}`, {
        nomeExibicao: newNomeExibicao.trim()
      })
      setShowRenameModal(false)
      setEditingDoc(null)
      setNewNomeExibicao('')
      fetchDocumentos()
    } catch (error: any) {
      console.error('Erro ao renomear:', error)
      alert(error.response?.data?.error || 'Erro ao renomear arquivo')
    }
  }

  const handleToggleVisibilidade = async (doc: Documento) => {
    try {
      await api.put(`/documentos-apolice/${doc.id}`, {
        visivel: !doc.visivel
      })
      fetchDocumentos()
    } catch (error: any) {
      console.error('Erro ao alterar visibilidade:', error)
      alert(error.response?.data?.error || 'Erro ao alterar visibilidade')
    }
  }

  const handleDownload = async (doc: Documento) => {
    try {
      const response = await api.get(`/documentos-apolice/${doc.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.nomeExibicao)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Erro ao fazer download:', error)
      alert(error.response?.data?.error || 'Erro ao fazer download do arquivo')
    }
  }

  const handleDelete = async (doc: Documento) => {
    if (!window.confirm(`Tem certeza que deseja excluir o documento "${doc.nomeExibicao}"?`)) {
      return
    }

    try {
      await api.delete(`/documentos-apolice/${doc.id}`)
      fetchDocumentos()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      alert(error.response?.data?.error || 'Erro ao excluir documento')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openRenameModal = (doc: Documento) => {
    setEditingDoc(doc)
    setNewNomeExibicao(doc.nomeExibicao)
    setShowRenameModal(true)
  }

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div className="section-title">Documentação</div>
        <button
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload size={20} />
          Enviar Documento
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Documentos Visíveis */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              background: '#00225f', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Eye size={18} />
              Visíveis ao Cliente ({documentosVisiveis.length})
            </div>
            <div style={{ 
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '0 0 6px 6px'
            }}>

              {documentosVisiveis.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {documentosVisiveis.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9e9e9',
                        gap: '16px'
                      }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <FileText size={24} color="#00225f" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                          {doc.nomeExibicao}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {formatFileSize(doc.tamanho)} • {formatDate(doc.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openRenameModal(doc)}
                        title="Renomear"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggleVisibilidade(doc)}
                        title="Tornar Interno"
                      >
                        <EyeOff size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(doc)}
                        title="Excluir"
                        style={{ color: '#d32f2f' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  color: '#666'
                }}>
                  Nenhum documento visível ao cliente
                </div>
              )}
            </div>
          </div>

          {/* Documentos Internos */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              background: '#00225f', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <EyeOff size={18} />
              Internos ({documentosInternos.length})
            </div>
            <div style={{ 
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '0 0 6px 6px'
            }}>

              {documentosInternos.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {documentosInternos.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9e9e9',
                        gap: '16px'
                      }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <FileText size={24} color="#00225f" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                          {doc.nomeExibicao}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {formatFileSize(doc.tamanho)} • {formatDate(doc.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openRenameModal(doc)}
                        title="Renomear"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggleVisibilidade(doc)}
                        title="Tornar Visível"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(doc)}
                        title="Excluir"
                        style={{ color: '#d32f2f' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  color: '#666'
                }}>
                  Nenhum documento interno
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setUploadFile(null)
          setUploadNomeExibicao('')
          setUploadVisivel(false)
        }}
        title="Enviar Documento"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Arquivo *</label>
            <input
              type="file"
              className="input"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setUploadFile(file || null)
                if (file && !uploadNomeExibicao) {
                  setUploadNomeExibicao(file.name)
                }
              }}
              disabled={uploading}
            />
          </div>

          <div>
            <label className="label">Nome para Exibição</label>
            <input
              type="text"
              className="input"
              value={uploadNomeExibicao}
              onChange={(e) => setUploadNomeExibicao(e.target.value)}
              placeholder="Nome do arquivo (opcional)"
              disabled={uploading}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={uploadVisivel}
                onChange={(e) => setUploadVisivel(e.target.checked)}
                disabled={uploading}
              />
              <span>Visível ao cliente</span>
            </label>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Se marcado, o cliente terá acesso a este documento. Caso contrário, será apenas interno.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowUploadModal(false)
                setUploadFile(null)
                setUploadNomeExibicao('')
                setUploadVisivel(false)
              }}
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Renomear */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false)
          setEditingDoc(null)
          setNewNomeExibicao('')
        }}
        title="Renomear Documento"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Nome do Arquivo *</label>
            <input
              type="text"
              className="input"
              value={newNomeExibicao}
              onChange={(e) => setNewNomeExibicao(e.target.value)}
              placeholder="Digite o novo nome"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowRenameModal(false)
                setEditingDoc(null)
                setNewNomeExibicao('')
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRename}
              disabled={!newNomeExibicao.trim()}
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentacaoTab

