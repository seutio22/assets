import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  onBeforeClose?: () => boolean | Promise<boolean>
  hasUnsavedData?: boolean
}

const Modal = ({ isOpen, onClose, title, children, size = 'medium', onBeforeClose, hasUnsavedData = false }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = async () => {
    if (hasUnsavedData || onBeforeClose) {
      let canClose = true
      
      if (onBeforeClose) {
        const result = await onBeforeClose()
        canClose = result !== false
      } else if (hasUnsavedData) {
        canClose = window.confirm('Você tem dados não salvos. Deseja realmente fechar? Todos os dados serão perdidos.')
      }
      
      if (!canClose) {
        return
      }
    }
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className={`modal-content modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

