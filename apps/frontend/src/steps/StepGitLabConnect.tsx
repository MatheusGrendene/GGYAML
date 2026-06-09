import { useState } from 'react'
import type { WizardData } from '../types/wizard'

type Project = {
  id: number
  name: string
  name_with_namespace: string
  path_with_namespace: string
  default_branch: string
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
  onAuthChange: (token: string, projectId: string, projectPath: string) => void
}

export default function StepGitLabConnect({ onChange, onAuthChange }: Props) {
  const [token, setToken] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [isLoadingLang, setIsLoadingLang] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = async () => {
    if (!token.trim()) {
      setError('Por favor, insira seu Personal Access Token.')
      return
    }

    setIsLoadingRepos(true)
    setError('')

    try {
      const res = await fetch(' /api/gitlab/repos', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json() as { error: string }
        throw new Error(data.error || 'Falha ao buscar projetos')
      }

      const data = await res.json() as Project[]
      setProjects(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar projetos')
    } finally {
      setIsLoadingRepos(false)
    }
  }

  const handleSelectProject = async (idStr: string) => {
    const project = projects.find(p => p.id.toString() === idStr)
    if (!project) return

    setSelectedProject(project)
    onChange({ projectName: project.name })
    onAuthChange(token, project.id.toString(), project.path_with_namespace)

    // Fetch top language separately
    setIsLoadingLang(true)
    try {
      const res = await fetch(
        ` /api/gitlab/language?projectId=${project.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const { language } = await res.json() as { language: string | null }

      if (language) {
        onChange({
          projectName: project.name,
          language: LANGUAGE_MAP[language] ?? '',
        })
      }
    } catch {
      // language detection failing is non-critical, ignore silently
    } finally {
      setIsLoadingLang(false)
    }
  }

  return (
    <div>
      <h2 className="step-title">Conectar ao GitLab</h2>
      <p className="step-subtitle">
        Insira seu Personal Access Token para carregar seus projetos e preencher o formulário automaticamente.
        Seu token nunca é armazenado.
      </p>

      <div className="field">
        <label>Personal Access Token</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="password"
            placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProjects()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={fetchProjects}
            disabled={isLoadingRepos}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isLoadingRepos ? 'Carregando...' : 'Buscar projetos'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Requer o scope <code style={{ fontFamily: 'var(--font-mono)' }}>api</code>.
          Crie um em GitLab → User Settings → Access Tokens.
        </p>
      </div>

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '0.82rem', marginBottom: '16px' }}>
          ⚠ {error}
        </p>
      )}

      {projects.length > 0 && (
        <div className="field">
          <label>Projeto</label>
          <select
            value={selectedProject?.id.toString() ?? ''}
            onChange={e => handleSelectProject(e.target.value)}
          >
            <option value="">Selecione um projeto...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id.toString()}>
                {p.name_with_namespace}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedProject && (
        <div
          className="stage-item active"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '8px' }}
        >
          <strong style={{ fontSize: '0.85rem' }}>
            {isLoadingLang ? '⏳ Detectando linguagem...' : '✓ Projeto selecionado'}
          </strong>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {selectedProject.path_with_namespace}
          </span>
        </div>
      )}
    </div>
  )
}