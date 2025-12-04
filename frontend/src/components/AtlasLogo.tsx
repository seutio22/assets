import './AtlasLogo.css'

interface AtlasLogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

const AtlasLogo = ({ size = 40, variant = 'full', className = '' }: AtlasLogoProps) => {
  const iconSize = variant === 'full' ? size * 0.65 : size
  const textSize = variant === 'full' ? size * 0.5 : 0
  return (
    <div className={`atlas-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: iconSize, height: iconSize, flexShrink: 0 }}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="atlas-logo-svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Círculo externo representando o globo */}
          <circle cx="60" cy="60" r="55" fill="#00225f" />
          
          {/* Linhas de latitude */}
          <ellipse cx="60" cy="30" rx="25" ry="8" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          <ellipse cx="60" cy="60" rx="35" ry="12" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          <ellipse cx="60" cy="90" rx="25" ry="8" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          
          {/* Linhas de longitude */}
          <path d="M 35 30 Q 35 60 35 90" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          <path d="M 60 20 Q 60 60 60 100" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          <path d="M 85 30 Q 85 60 85 90" stroke="#3d9b8e" strokeWidth="2" fill="none" />
          
          {/* Ponto central representando o foco */}
          <circle cx="60" cy="60" r="4" fill="#a42340" />
          
          {/* Letra A estilizada no centro */}
          <path
            d="M 50 75 L 60 45 L 70 75 M 55 65 L 65 65"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {variant === 'full' && (
        <span className="atlas-logo-text" style={{ fontSize: textSize, whiteSpace: 'nowrap', fontWeight: 700 }}>
          ATLAS
        </span>
      )}
    </div>
  )
}

export default AtlasLogo
