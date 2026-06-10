import { useState } from 'react'
import type { WizardData } from '../types/wizard'

type Repo = {
  name: string
  full_name: string
  language: string | null
  default_branch: string
  private: boolean
  owner: { login: string }
}

const LANGUAGE_MAP: Record<string, string> = {
  JavaScript: 'node',
  TypeScript: 'node',
  Python: 'python',
  PHP: 'php',
  Java: 'java',
  Go: 'go',
}

type Props = {
  onChange: (data: Partial<WizardData>) => void
  onAuthChange: (token: string, owner: string, repo: string) => void
}

export default function StepGitHubConnect({ onChange, onAuthChange }: Props) {
  const [token, setToken] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRepos = async () => {
    if (!token.trim()) {
      setError('Por favor, insira seu Personal Access Token.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json() as { error: string }
        throw new Error(data.error || 'Falha ao buscar repositórios')
      }

      const data = await res.json() as Repo[]
      setRepos(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRepo = (fullName: string) => {
    const repo = repos.find(r => r.full_name === fullName)
    if (!repo) return

    setSelectedRepo(repo)

    // Auto-fill WizardData with what we know from the repo
    onChange({
      projectName: repo.name,
      language: LANGUAGE_MAP[repo.language ?? ''] ?? '',
    })

    // Store auth info in App state
    onAuthChange(token, repo.owner.login, repo.name)
  }

  return (
    <div>
      <h2 className="step-title">Conectar ao GitHub</h2>
      <p className="step-subtitle">
        Insira seu Personal Access Token para carregar seus repositórios e preencher o formulário automaticamente.
        Seu token nunca é armazenado.
      </p>

      <div className="field">
        <label>Personal Access Token</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="password"
            placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchRepos()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={fetchRepos}
            disabled={isLoading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isLoading ? 'Carregando...' : 'Buscar repositórios'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Requer o scope <code style={{ fontFamily: 'var(--font-mono)' }}>repo</code>.
          Crie um em GitHub → Settings → Developer settings → Personal access tokens.
        </p>
      </div>

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '16px' }}>
          ⚠ {error}
        </p>
      )}

      {repos.length > 0 && (
        <div className="field">
          <label>Repositório</label>
          <select
            value={selectedRepo?.full_name ?? ''}
            onChange={e => handleSelectRepo(e.target.value)}
          >
            <option value="">Selecione um repositório...</option>
            {repos.map(r => (
              <option key={r.full_name} value={r.full_name}>
                {r.full_name} {r.private ? '🔒' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedRepo && (
        <div className="stage-item active" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '8px' }}>
          <strong style={{ fontSize: '0.85rem' }}>✓ Repositório selecionado</strong>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {selectedRepo.full_name}
          </span>
          {selectedRepo.language && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Linguagem detectada: {selectedRepo.language}
              {LANGUAGE_MAP[selectedRepo.language]
                ? ` → mapeada para "${LANGUAGE_MAP[selectedRepo.language]}"`
                : ' (não está na lista suportada, você pode defini-la manualmente)'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}