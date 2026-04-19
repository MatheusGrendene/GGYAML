import { useState } from 'react'
import { defaultWizardData } from './types/wizard'
import type { WizardData } from './types/wizard'
import { generateYAML } from './generator/generateYAML'
import StepPlatform from './steps/StepPlatform'
import StepProjectInfo from './steps/StepProjectInfo'
import StepPipeline from './steps/StepPipeline'
import './App.css'

const TOTAL_STEPS = 3

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultWizardData)

  const update = (newData: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...newData }))

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const yaml = generateYAML(data)
  const handleDownload = async () => {
    const res = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.projectName || 'pipeline'}.yml`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="app">
      {/* Left: Wizard */}
      <div className="wizard-panel">
        <div className="wizard-header">
          <h1>GGYAML</h1>
          <p>Generate CI/CD pipeline configurations</p>
          <div className="step-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`step-dot ${i < step ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="wizard-content">
          {step === 1 && <StepPlatform data={data} onChange={update} />}
          {step === 2 && <StepProjectInfo data={data} onChange={update} />}
          {step === 3 && <StepPipeline data={data} onChange={update} />}
        </div>

        <div className="wizard-footer">
          {step > 1 && (
            <button className="btn btn-ghost" onClick={back}>Back</button>
          )}
          {step < TOTAL_STEPS && (
            <button className="btn btn-primary" onClick={next}>Continue</button>
          )}
          {step === TOTAL_STEPS && (
            <button className="btn btn-primary" onClick={handleDownload}>
              Download YAML
            </button>
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="preview-panel">
        <div className="preview-header">
          <div className="preview-dot" />
          <span>pipeline.yml — live preview</span>
        </div>
        <div className="preview-body">
          <pre>{yaml}</pre>
        </div>
      </div>
    </div>
  )
}