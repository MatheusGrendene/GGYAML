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
      alert(`Secret "${invalidSecret.key}" must have a value.`)
      return
    }

    onSubmit(filledSecrets, filledVariables)
  }

  // User skipped the connect step
  if (!hasAuth) {
    return (
      <div>
        <h2 className="step-title">GitHub Actions Configuration</h2>
        <p className="step-subtitle">
          You skipped the GitHub connect step, so secrets and variables cannot be
          pushed automatically. Your YAML file is ready to download.
        </p>
        <div className="stage-item" style={{ marginBottom: '20px', borderColor: 'var(--accent-border)' }}>
          <div className="stage-item-left">
            <strong>Just need the YAML?</strong>
            <span>
              Download your pipeline file and set up secrets and variables manually
              in your GitHub repository under Settings → Secrets and variables → Actions.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
          <button className="btn btn-primary" onClick={onSkip}>Download YAML</button>
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
              placeholder={isSecret ? 'SECRET_KEY' : 'VARIABLE_NAME'}
              value={item.key}
              onChange={e => updateItem(list, setList, i, 'key', e.target.value.toUpperCase())}
            />
            <input
              style={{ ...inputStyle, flex: 2 }}
              placeholder={isSecret ? 'secret value' : 'value'}
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
      <h2 className="step-title">GitHub Actions Configuration</h2>
      <p className="step-subtitle">
        Push secrets and variables to{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{owner}/{repo}</strong>.
        Leave a section empty to skip it.
      </p>

      {/* Secrets section */}
      {sectionLabel('🔒', 'Secrets', 'Encrypted and hidden in logs — use for passwords, tokens, API keys')}
      {renderList(secrets, setSecrets, true)}
      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '20px' }}
        onClick={() => addItem(secrets, setSecrets)}
      >
        + Add secret
      </button>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0 20px' }} />

      {/* Variables section */}
      {sectionLabel('📋', 'Variables', 'Plain text and visible in logs — use for environment names, config values')}
      {renderList(variables, setVariables, false)}
      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '20px' }}
        onClick={() => addItem(variables, setVariables)}
      >
        + Add variable
      </button>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button className="btn btn-ghost" onClick={onSkip}>Skip, just download</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Pushing...' : 'Push all'}
        </button>
      </div>
    </div>
  )
}