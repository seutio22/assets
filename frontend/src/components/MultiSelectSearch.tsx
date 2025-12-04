import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import './MultiSelectSearch.css'

interface Option {
  id: string
  label: string
  subtitle?: string
}

interface MultiSelectSearchProps {
  options: Option[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
  onSearch?: (searchTerm: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  label: string
}

const MultiSelectSearch = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  loading = false,
  onSearch,
  onLoadMore,
  hasMore = false,
  label
}: MultiSelectSearchProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [displayedOptions, setDisplayedOptions] = useState<Option[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Filtrar opções localmente
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setDisplayedOptions(filtered.slice(0, 50)) // Limitar a 50 para performance
  }, [options, searchTerm])

  useEffect(() => {
    // Chamar busca externa se fornecida
    if (onSearch && searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        onSearch(searchTerm)
      }, 300) // Debounce de 300ms
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, onSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focar no input de busca quando abrir
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    // Scroll infinito
    if (listRef.current && onLoadMore && hasMore && !loading) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current!
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          onLoadMore()
        }
      }

      listRef.current.addEventListener('scroll', handleScroll)
      return () => {
        listRef.current?.removeEventListener('scroll', handleScroll)
      }
    }
  }, [onLoadMore, hasMore, loading])

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeSelected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter(selectedId => selectedId !== id))
  }

  const getSelectedLabels = () => {
    return selectedIds
      .map(id => options.find(opt => opt.id === id))
      .filter(Boolean)
      .map(opt => opt!.label)
  }

  const selectedLabels = getSelectedLabels()

  return (
    <div className="multi-select-search" ref={containerRef}>
      <label className="multi-select-label">{label}</label>
      <div
        className={`multi-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="multi-select-value">
          {selectedIds.length === 0 ? (
            <span className="multi-select-placeholder">{placeholder}</span>
          ) : (
            <div className="multi-select-selected">
              {selectedLabels.slice(0, 2).map((label, idx) => {
                const id = selectedIds[idx]
                return (
                  <span key={id} className="multi-select-tag">
                    {label}
                    <button
                      type="button"
                      onClick={(e) => removeSelected(id, e)}
                      className="multi-select-remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              })}
              {selectedIds.length > 2 && (
                <span className="multi-select-more">+{selectedIds.length - 2} mais</span>
              )}
            </div>
          )}
        </div>
        <ChevronDown size={18} className={`multi-select-chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-search-box">
            <Search size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="multi-select-clear-search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="multi-select-info">
            {selectedIds.length > 0 && (
              <span className="multi-select-count">
                {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
              </span>
            )}
            {displayedOptions.length > 0 && (
              <span className="multi-select-total">
                {displayedOptions.length} resultado{displayedOptions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="multi-select-list" ref={listRef}>
            {loading && displayedOptions.length === 0 ? (
              <div className="multi-select-loading">Carregando...</div>
            ) : displayedOptions.length === 0 ? (
              <div className="multi-select-empty">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
              </div>
            ) : (
              <>
                {displayedOptions.map((option) => {
                  const isSelected = selectedIds.includes(option.id)
                  return (
                    <div
                      key={option.id}
                      className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleOption(option.id)}
                    >
                      <div className="multi-select-option-check">
                        {isSelected && <Check size={16} />}
                      </div>
                      <div className="multi-select-option-content">
                        <div className="multi-select-option-label">{option.label}</div>
                        {option.subtitle && (
                          <div className="multi-select-option-subtitle">{option.subtitle}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {loading && (
                  <div className="multi-select-loading">Carregando mais...</div>
                )}
                {hasMore && !loading && (
                  <div className="multi-select-load-more">Role para carregar mais</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelectSearch

