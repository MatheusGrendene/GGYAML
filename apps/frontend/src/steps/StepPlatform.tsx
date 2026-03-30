import type { WizardData } from '../types/wizard'

type Props = {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

const platforms = [
  { id: 'github-actions', icon: '🐙', name: 'GitHub Actions', desc: 'Integrated with GitHub repositories' },
  { id: 'gitlab-ci', icon: '🦊', name: 'GitLab CI', desc: 'Native GitLab pipeline configuration' },
] as const

export default function StepPlatform({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="step-title">Choose your platform</h2>
      <p className="step-subtitle">Select the CI/CD platform your project uses.</p>
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