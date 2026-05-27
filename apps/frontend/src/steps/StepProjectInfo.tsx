import type { WizardData } from '../types/wizard'

type Props = {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

export default function StepProjectInfo({ data, onChange }: Props) {
  const lang = data.language

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
          <option value="node">Node.js / React</option>
          <option value="python">Python</option>
          <option value="php">PHP</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
        </select>
      </div>

      {/* Node.js version */}
      {lang === 'node' && (
        <div className="field">
          <label>Node.js version</label>
          <select
            value={data.nodeVersion || '20'}
            onChange={e => onChange({ nodeVersion: e.target.value })}
          >
            <option value="18">18 LTS</option>
            <option value="20">20 LTS</option>
            <option value="22">22 LTS</option>
          </select>
        </div>
      )}

      {/* Python version */}
      {lang === 'python' && (
        <div className="field">
          <label>Python version</label>
          <select
            value={data.pythonVersion || '3.11'}
            onChange={e => onChange({ pythonVersion: e.target.value })}
          >
            <option value="3.9">3.9</option>
            <option value="3.10">3.10</option>
            <option value="3.11">3.11 (recommended)</option>
            <option value="3.12">3.12</option>
          </select>
        </div>
      )}

      {/* PHP version */}
      {lang === 'php' && (
        <div className="field">
          <label>PHP version</label>
          <select
            value={data.phpVersion || '8.2'}
            onChange={e => onChange({ phpVersion: e.target.value })}
          >
            <option value="8.0">8.0</option>
            <option value="8.1">8.1</option>
            <option value="8.2">8.2 (recommended)</option>
            <option value="8.3">8.3</option>
          </select>
        </div>
      )}

      {/* Unsupported language notice */}
      {lang && !['node', 'python', 'php'].includes(lang) && (
        <div className="stage-item" style={{ borderColor: 'var(--accent-border)' }}>
          <div className="stage-item-left">
            <strong>Basic template</strong>
            <span>
              {lang.charAt(0).toUpperCase() + lang.slice(1)} support is coming soon.
              A generic pipeline will be generated for now.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}