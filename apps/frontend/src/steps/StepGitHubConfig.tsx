import { useState } from 'react'

type Item = { key: string; value: string }

type Props = {
  owner: string
  repo: string
  hasAuth: boolean
  onSubmit: (secrets: Item[], variables: Item[]) => void
  onBack: () => void
  onSkip: () => void
  isLoading: boolean
}

const emptyItem = (): Item => ({ key: '', value: '' })

const inputStyle = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '7px',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.82rem',
}

const sectionLabel = (icon: string, title: string, desc: string) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
      {icon} {title}
    </div>
    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{desc}</div>
  </div>
)

export default function StepGitHubConfig({
  owner, repo, hasAuth, onSubmit, onBack, onSkip, isLoading
}: Props) {
  const [secrets,   setSecrets]   = useState<Item[]>([emptyItem()])
  const [variables, setVariables] = useState<Item[]>([emptyItem()])

  const updateItem = (
    list: Item[], setList: (l: Item[]) => void,
    index: number, field: keyof Item, value: string
  ) => setList(list.map((item, i) => i === index ? { ...item, [field]: value } : item))

  const addItem    = (list: Item[], setList: (l: Item[]) => void) =>
    setList([...list, emptyItem()])

  const removeItem = (list: Item[], setList: (l: Item[]) => void, index: number) =>
    setList(list.filter((_, i) => i !== index))

  const handleSubmit = () => {
    // Filter out rows where the key is empty — those are skipped
    const filledSecrets   = secrets.filter(s => s.key.trim() !== '')
    const filledVariables = variables.filter(v => v.key.trim() !== '')

    // Secrets must have a value if a key is provided
    const invalidSecret = filledSecrets.find(s => s.value.trim() === '')
    if (invalidSecret) {
      alert(`O secret "${invalidSecret.key}" precisa ter um valor.`)
      return
    }

    onSubmit(filledSecrets, filledVariables)
  }

  // User skipped the connect step
  if (!hasAuth) {
    return (
      <div>
        <h2 className="step-title">Configuração do GitHub Actions</h2>
        <p className="step-subtitle">
          Você pulou a etapa de conexão com o GitHub, então os secrets e variáveis não podem
          ser enviados automaticamente. Seu arquivo YAML está pronto para download.
        </p>
        <div className="stage-item" style={{ marginBottom: '20px', borderColor: 'var(--accent-border)' }}>
          <div className="stage-item-left">
            <strong>Só precisa do YAML?</strong>
            <span>
              Baixe seu arquivo de pipeline e configure os secrets e variáveis manualmente
              no seu repositório GitHub em Settings → Secrets and variables → Actions.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onBack}>Voltar</button>
          <button className="btn btn-primary" onClick={onSkip}>Baixar YAML</button>
        </div>
      </div>
    )
  }

  const renderList = (
    list: Item[],
    setList: (l: Item[]) => void,
    isSecret: boolean
  ) => (
    <div className="stage-list" style={{ marginBottom: '8px' }}>
      {list.map((item, i) => (
        <div
          key={i}
          className="stage-item"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder={isSecret ? 'CHAVE_DO_SECRET' : 'NOME_DA_VARIAVEL'}
              value={item.key}
              onChange={e => updateItem(list, setList, i, 'key', e.target.value.toUpperCase())}
            />
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder={isSecret ? 'valor do secret' : 'valor'}
              type={isSecret ? 'password' : 'text'}
              value={item.value}
              onChange={e => updateItem(list, setList, i, 'value', e.target.value)}
            />
            {list.length > 1 && (
              <button
                className="btn btn-ghost"
                style={{ padding: '8px 12px', color: 'var(--text-muted)' }}
                onClick={() => removeItem(list, setList, i)}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <h2 className="step-title">Configuração do GitHub Actions</h2>
      <p className="step-subtitle">
        Envie secrets e variáveis para{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{owner}/{repo}</strong>.
        Deixe uma seção vazia para pulá-la.
      </p>

      {/* Secrets section */}
      {sectionLabel('🔒', 'Secrets', 'Criptografados e ocultos nos logs — use para senhas, tokens e chaves de API')}
      {renderList(secrets, setSecrets, true)}
      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '20px' }}
        onClick={() => addItem(secrets, setSecrets)}
      >
        + Adicionar secret
      </button>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0 20px' }} />

      {/* Variables section */}
      {sectionLabel('📋', 'Variáveis', 'Texto puro e visíveis nos logs — use para nomes de ambiente e valores de configuração')}
      {renderList(variables, setVariables, false)}
      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '20px' }}
        onClick={() => addItem(variables, setVariables)}
      >
        + Adicionar variável
      </button>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onBack}>Voltar</button>
        <button className="btn btn-ghost" onClick={onSkip}>Pular, apenas baixar</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar tudo'}
        </button>
      </div>
    </div>
  )
}