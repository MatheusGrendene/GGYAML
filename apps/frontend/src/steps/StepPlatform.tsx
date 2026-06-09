import type { WizardData } from '../types/wizard'

type Props = {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

const platforms = [
  { id: 'github-actions', icon: '🐙', name: 'GitHub Actions', desc: 'Integrado aos repositórios do GitHub' },
  { id: 'gitlab-ci', icon: '🦊', name: 'GitLab CI', desc: 'Configuração nativa de pipeline do GitLab' },
] as const

export default function StepPlatform({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="step-title">Escolha sua plataforma</h2>
      <p className="step-subtitle">Selecione a plataforma de CI/CD que seu projeto utiliza.</p>
      <div className="platform-grid">
        {platforms.map(p => (
          <div
            key={p.id}
            className={`platform-card ${data.platform === p.id ? 'selected' : ''}`}
            onClick={() => onChange({ platform: p.id })}
          >
            <span className="platform-icon">{p.icon}</span>
            <div className="platform-card-text">
              <strong>{p.name}</strong>
              <span>{p.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}