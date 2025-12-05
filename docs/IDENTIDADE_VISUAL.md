# Guia de Identidade Visual

## Paleta de Cores

### Cores Principais

```css
/* Cores Primárias */
--color-primary: #a42340;        /* Vermelho Borgonha - Ações principais */
--color-secondary: #3d9b8e;      /* Verde-água - Ações secundárias */
--color-dark: #00225f;           /* Azul Escuro - Headers, navegação */
--color-white: #ffffff;           /* Branco - Backgrounds */

/* Cores de Suporte */
--color-gray-light: #f5f5f5;     /* Backgrounds alternativos */
--color-gray-medium: #e0e0e0;    /* Bordas, divisores */
--color-gray-dark: #666666;      /* Textos secundários */
--color-text: #333333;           /* Textos principais */

/* Estados */
--color-success: #3d9b8e;         /* Sucesso */
--color-warning: #ff9800;        /* Avisos */
--color-error: #a42340;          /* Erros */
--color-info: #00225f;           /* Informações */
```

## Tipografia

### Família de Fontes
- **Principal**: Inter (Google Fonts)
- **Secundária**: Roboto (fallback)

### Hierarquia Tipográfica

```css
/* Títulos */
h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

h2 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

/* Textos */
body {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.6;
}
```

## Componentes UI

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #8a1d35;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(164, 35, 64, 0.3);
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #2d7a6e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(61, 155, 142, 0.3);
}
```

### Cards

```css
.card {
  background: var(--color-white);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--color-gray-medium);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(164, 35, 64, 0.1);
}
```

## Layout

### Espaçamentos
- **Base**: 8px
- **Pequeno**: 8px, 16px
- **Médio**: 24px, 32px
- **Grande**: 48px, 64px

### Grid System
- Container máximo: 1200px
- Colunas: 12 colunas
- Gutter: 24px

## Princípios de Design

1. **Clareza**: Interface limpa e intuitiva
2. **Espaçamento**: Uso generoso de espaços brancos
3. **Consistência**: Componentes reutilizáveis e padronizados
4. **Acessibilidade**: Contraste adequado e navegação clara
5. **Profissionalismo**: Design que transmite confiabilidade e cuidado

