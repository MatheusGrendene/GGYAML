import { useState } from 'react'

type Secret = { key: string; value: string }

type Props = {
  token: string
  owner: string
  repo: string
  hasAuth: boolean
  onSubmit: (secrets: Secret[]) => void
  onBack: () => void
  onSkip: () => void
  isLoading: boolean
}

const emptySecret = (): Secret => ({ key: '', value: '' })

export default function StepGitHubSecrets({
  owner, repo, hasAuth, onSubmit, onBack, onSkip, isLoading
}: Props) {
  const [secrets, setSecrets] = useState<Secret[]>([emptySecret()])

  const update = (index: number, field: keyof Secret, value: string) =>
    setSecrets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))

  const add = () => setSecrets(prev => [...prev, emptySecret()])

  const remove = (index: number) =>
    setSecrets(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = () => {
    const valid = secrets.every(s => s.key.trim() !== '' && s.value.trim() !== '')
    if (!valid) {
      alert('All secrets must have both a key and a value.')
      return
    }
    onSubmit(secrets)
  }

  // User skipped the connect step — no token available
  if (!hasAuth) {
    return (
      <div>
        <h2 className="step-title">GitHub Actions Secrets</h2>
        <p className="step-subtitle">
          You skipped the GitHub connect step, so secrets cannot be pushed automatically.
          Your YAML file is ready to download.
        </p>
        <div className="stage-item" style={{ marginBottom: '20px', borderColor: 'var(--accent-border)' }}>
          <div className="stage-item-left">
            <strong>Just need the YAML?</strong>
            <span>
              Download your pipeline file and set up secrets manually in your
              GitHub repository under Settings → Secrets → Actions.
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

  // User connected — show the full secrets form
  return (
    <div>
      <h2 className="step-title">GitHub Actions Secrets</h2>
      <p className="step-subtitle">
        Push secrets directly to{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{owner}/{repo}</strong>.
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
        <button className="btn btn-ghost" onClick={onSkip}>
          Skip, just download
        </button>
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