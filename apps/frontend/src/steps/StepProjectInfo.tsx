import type { WizardData } from '../types/wizard'

type Props = {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

export default function StepProjectInfo({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="step-title">Project info</h2>
      <p className="step-subtitle">Tell us a bit about your project.</p>

      <div className="field">
        <label>Project name</label>
        <input
          type="text"
          placeholder="my-app"
          value={data.projectName || ''}
          onChange={e => onChange({ projectName: e.target.value })}
        />
      </div>

      <div className="field">
        <label>Language</label>
        <select
          value={data.language || ''}
          onChange={e => onChange({ language: e.target.value })}
        >
          <option value="">Select a language</option>
          <option value="node">Node.js</option>
        </select>
      </div>

      <div className="field">
        <label>Node version</label>
        <select
          value={data.nodeVersion || '20'}
          onChange={e => onChange({ nodeVersion: e.target.value })}
        >
          <option value="18">18 LTS</option>
          <option value="20">20 LTS</option>
          <option value="22">22 LTS</option>
        </select>
      </div>
    </div>
  )
}