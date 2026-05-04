import { useState } from 'react'
import type { CIVariable } from '../types/wizard'

type Props = {
  onSubmit: (projectId: string, token: string, variables: CIVariable[]) => void
  onBack: () => void
  isLoading: boolean
}

const emptyVariable = (): CIVariable => ({
  key: '',
  value: '',
  masked: false,
  protected: false,
  environment_scope: '*'
})

export default function StepGitLabVariables({ onSubmit, onBack, isLoading }: Props) {
  const [projectId, setProjectId] = useState('')
  const [token, setToken] = useState('')
  const [variables, setVariables] = useState<CIVariable[]>([emptyVariable()])

  const updateVariable = (index: number, field: keyof CIVariable, value: string | boolean) => {
    setVariables(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const addVariable = () => setVariables(prev => [...prev, emptyVariable()])

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const valid = variables.every(v => v.key.trim() !== '')
    if (!valid) {
      alert('All variables must have a key.')
      return
    }
    onSubmit(projectId, token, variables)
  }

  return (
    <div>
      <h2 className="step-title">GitLab CI/CD Variables</h2>
      <p className="step-subtitle">
        Set variables directly on your GitLab project. Your token is never stored.
      </p>

      <div className="field">
        <label>Project ID</label>
        <input
          type="text"
          placeholder="e.g. 12345678"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Personal Access Token</label>
        <input
          type="password"
          placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label className="field" style={{ display: 'block', marginBottom: '10px' }}>
          Variables
        </label>

        <div className="stage-list">
          {variables.map((v, i) => (
            <div key={i} className="stage-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="field input"
                  style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                  placeholder="KEY_NAME"
                  value={v.key}
                  onChange={e => updateVariable(i, 'key', e.target.value.toUpperCase())}
                />
                <input
                  style={{ flex: 2, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                  placeholder="value"
                  type={v.masked ? 'password' : 'text'}
                  value={v.value}
                  onChange={e => updateVariable(i, 'value', e.target.value)}
                />
                {variables.length > 1 && (
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px', color: 'var(--text-muted)' }}
                    onClick={() => removeVariable(i)}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={v.masked}
                    onChange={e => updateVariable(i, 'masked', e.target.checked)}
                  />
                  Masked
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={v.protected}
                    onChange={e => updateVariable(i, 'protected', e.target.checked)}
                  />
                  Protected
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Scope:</span>
                  <select
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 6px', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                    value={v.environment_scope}
                    onChange={e => updateVariable(i, 'environment_scope', e.target.value)}
                  >
                    <option value="*">All</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-ghost"
          style={{ marginTop: '12px', width: '100%' }}
          onClick={addVariable}
        >
          + Add variable
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading || !projectId || !token}
        >
          {isLoading ? 'Pushing...' : 'Push to GitLab'}
        </button>
      </div>
    </div>
  )
}