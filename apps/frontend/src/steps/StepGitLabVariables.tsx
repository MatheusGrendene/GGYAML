import { useState } from 'react'
import type { CIVariable } from '../types/wizard'

type Props = {
  projectId: string
  token: string
  projectPath?: string
  hasAuth: boolean
  onSubmit: (variables: CIVariable[]) => void
  onBack: () => void
  onSkip: () => void
  isLoading: boolean
}

const emptyVariable = (): CIVariable => ({
  key: '',
  value: '',
  masked: false,
  protected: false,
  environment_scope: '*'
})

export default function StepGitLabVariables({
  projectPath,
  hasAuth,
  onSubmit,
  onBack,
  onSkip,
  isLoading
}: Props) {
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
      alert('Todas as variáveis precisam ter uma chave.')
      return
    }
    onSubmit(variables)
  }

  // User skipped the connect step — no token available
  if (!hasAuth) {
    return (
      <div>
        <h2 className="step-title">Variáveis CI/CD do GitLab</h2>
        <p className="step-subtitle">
          Você pulou a etapa de conexão com o GitLab, então as variáveis não podem ser enviadas automaticamente.
          Seu arquivo YAML está pronto para download.
        </p>
        <div className="stage-item" style={{ marginBottom: '20px', borderColor: 'var(--accent-border)' }}>
          <div className="stage-item-left">
            <strong>Só precisa do YAML?</strong>
            <span>
              Baixe seu arquivo de pipeline e configure as variáveis manualmente no seu projeto
              GitLab em Settings → CI/CD → Variables.
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

  // User connected — show the full variables form
  return (
    <div>
      <h2 className="step-title">Variáveis CI/CD do GitLab</h2>
      <p className="step-subtitle">
        Envie variáveis diretamente para{' '}
        <strong style={{ color: 'var(--text-primary)' }}>
          {projectPath ?? 'seu projeto'}
        </strong>.
        Seu token nunca é armazenado.
      </p>

      <div className="stage-list" style={{ marginBottom: '12px' }}>
        {variables.map((v, i) => (
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
                placeholder="NOME_DA_CHAVE"
                value={v.key}
                onChange={e => updateVariable(i, 'key', e.target.value.toUpperCase())}
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
                placeholder="valor"
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
                Mascarada
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={v.protected}
                  onChange={e => updateVariable(i, 'protected', e.target.checked)}
                />
                Protegida
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Escopo:</span>
                <select
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '5px',
                    padding: '2px 6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem'
                  }}
                  value={v.environment_scope}
                  onChange={e => updateVariable(i, 'environment_scope', e.target.value)}
                >
                  <option value="*">Todos</option>
                  <option value="production">Produção</option>
                  <option value="staging">Homologação</option>
                  <option value="development">Desenvolvimento</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-ghost"
        style={{ width: '100%', marginBottom: '16px' }}
        onClick={addVariable}
      >
        + Adicionar variável
      </button>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onBack}>Voltar</button>
        <button className="btn btn-ghost" onClick={onSkip}>
          Pular, apenas baixar
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar ao GitLab'}
        </button>
      </div>
    </div>
  )
}