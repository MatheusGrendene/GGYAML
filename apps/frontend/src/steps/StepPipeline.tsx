import type { WizardData } from '../types/wizard'

type Props = {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
  onBack: () => void
}

const stages: { key: keyof WizardData['stages']; name: string; desc: string }[] = [
  { key: 'build', name: 'Build', desc: 'Compile and package your application' },
  { key: 'test', name: 'Test', desc: 'Run automated tests' },
  { key: 'deploy', name: 'Deploy', desc: 'Deploy to your target environment' },
]

export default function StepPipeline({ data, onChange }: Props) {
  const toggleStage = (stage: keyof WizardData['stages']) => {
    onChange({ stages: { ...data.stages, [stage]: !data.stages[stage] } })
  }

  return (
    <div>
      <h2 className="step-title">Pipeline stages</h2>
      <p className="step-subtitle">Choose which stages to include in your pipeline.</p>
      <div className="stage-list">
        {stages.map(s => (
          <div
            key={s.key}
            className={`stage-item ${data.stages[s.key] ? 'active' : ''}`}
            onClick={() => toggleStage(s.key)}
          >
            <div className="stage-item-left">
              <strong>{s.name}</strong>
              <span>{s.desc}</span>
            </div>
            <div className={`toggle ${data.stages[s.key] ? 'on' : ''}`} />
          </div>
        ))}
      </div>
    </div>
  )
}