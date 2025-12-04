import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Search, ChevronDown } from 'lucide-react'
import './SearchableSelect.css'

interface SearchableSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  endpoint: string
  searchParam?: string
  displayField: string | ((item: any) => string)
  valueField: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  filterParam?: { key: string; value: string }
  onSelect?: (item: any) => void
}

const SearchableSelect = ({
  id,
  label,
  value,
  onChange,
  endpoint,
  searchParam = 'search',
  displayField,
  valueField,
  placeholder = 'Digite para buscar...',
  required = false,
  disabled = false,
  filterParam,
  onSelect
}: SearchableSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Carregar item selecionado quando value mudar
  useEffect(() => {
    if (value && options.length === 0) {
      fetchItem(value)
    }
  }, [value])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getDisplayValue = (item: any): string => {
    if (typeof displayField === 'function') {
      return displayField(item)
    }
    return item[displayField] || ''
  }

  const fetchItem = async (itemId: string) => {
    try {
      const response = await api.get(`${endpoint}/${itemId}`)
      setSelectedItem(response.data)
      setSearchTerm(getDisplayValue(response.data))
    } catch (err) {
      console.error('Erro ao carregar item:', err)
    }
  }

  const searchItems = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append(searchParam, term)
      params.append('limit', '20')
      
      if (filterParam) {
        params.append(filterParam.key, filterParam.value)
      }

      const response = await api.get(`${endpoint}?${params.toString()}`)
      const items = response.data.data || response.data || []
      setOptions(items)
    } catch (err) {
      console.error('Erro ao buscar:', err)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    
    // Limpar seleção se o termo não corresponder ao item selecionado
    if (selectedItem && term !== getDisplayValue(selectedItem)) {
      setSelectedItem(null)
      onChange('')
    }

    // Debounce da busca
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (term.trim().length >= 2) {
        searchItems(term)
        setIsOpen(true)
      } else {
        setOptions([])
        setIsOpen(false)
      }
    }, 300)
  }

  const handleSelect = (item: any) => {
    setSelectedItem(item)
    setSearchTerm(getDisplayValue(item))
    onChange(item[valueField])
    setIsOpen(false)
    setOptions([])
    
    if (onSelect) {
      onSelect(item)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedItem(null)
    onChange('')
    setOptions([])
    setIsOpen(false)
  }

  const handleFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setIsOpen(true)
    }
  }

  return (
    <div className="form-group">
      <label htmlFor={id} className="label">
        {label} {required && '*'}
      </label>
      <div className="searchable-select-wrapper" ref={wrapperRef}>
        <div className="searchable-select-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            id={id}
            type="text"
            className="input searchable-select-input"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete="off"
          />
          {selectedItem && (
            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
              disabled={disabled}
              title="Limpar"
            >
              ×
            </button>
          )}
          <ChevronDown size={18} className="chevron-icon" />
        </div>
        
        {isOpen && (options.length > 0 || loading) && (
          <div className="searchable-select-dropdown">
            {loading ? (
              <div className="dropdown-loading">Buscando...</div>
            ) : options.length === 0 ? (
              <div className="dropdown-empty">Nenhum resultado encontrado</div>
            ) : (
              <ul className="dropdown-list">
                {options.map((item) => (
                  <li
                    key={item[valueField]}
                    className={`dropdown-item ${selectedItem?.[valueField] === item[valueField] ? 'selected' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    {getDisplayValue(item)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchableSelect

