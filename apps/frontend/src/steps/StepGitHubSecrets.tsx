import { useState } from 'react'

type Secret = { key: string; value: string }

type Props = {
  token: string
  owner: string
  repo: string
  onSubmit: (secrets: Secret[]) => void
  onBack: () => void
  isLoading: boolean
}

const emptySecret = (): Secret => ({ key: '', value: '' })

export default function StepGitHubSecrets({ owner, repo, onSubmit, onBack, isLoading }: Props) {
  const [secrets, setSecrets] = useState<Secret[]>([emptySecret()])

  const update = (index: number, field: keyof Secret, value: string) => {
    setSecrets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const add = () => setSecrets(prev => [...prev, emptySecret()])

  const remove = (index: number) => setSecrets(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = () => {
    const valid = secrets.every(s => s.key.trim() !== '' && s.value.trim() !== '')
    if (!valid) {
      alert('All secrets must have both a key and a value.')
      return
    }
    onSubmit(secrets)
  }

  return (
    <div>
      <h2 className="step-title">GitHub Actions Secrets</h2>
      <p className="step-subtitle">
        Push secrets directly to <strong style={{ color: 'var(--text-primary)' }}>{owner}/{repo}</strong>.
        Values are encrypted before leaving this app and never stored.
      </p>

      <div className="stage-list" style={{ marginBottom: '12px' }}>
        {secrets.map((s, i) => (
          <div
            key={i}
            className="stage-item"
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem'
                }}
                placeholder="SECRET_KEY"
                value={s.key}
                onChange={e => update(i, 'key', e.target.value.toUpperCase())}
              />
              <input
                style={{
                  flex: 2,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem'
                }}
                placeholder="secret value"
                type="password"
                value={s.value}
                onChange={e => update(i, 'value', e.target.value)}
              />
              {secrets.length > 1 && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '8px 12px', color: 'var(--text-muted)' }}
                  onClick={() => remove(i)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '16px' }}
        onClick={add}
      >
        + Add secret
      </button>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Pushing...' : 'Push to GitHub'}
        </button>
      </div>
    </div>
  )
}