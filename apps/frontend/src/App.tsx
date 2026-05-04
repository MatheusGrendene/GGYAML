import { useState } from 'react'
import { defaultWizardData } from './types/wizard'
import type { WizardData, CIVariable } from './types/wizard'
import { generateYAML } from './generator/generateYAML'
import StepPlatform from './steps/StepPlatform'
import StepProjectInfo from './steps/StepProjectInfo'
import StepPipeline from './steps/StepPipeline'
import StepGitLabVariables from './steps/StepGitLabVariables.tsx'
import PushResult from './components/PushResult.tsx'
import './App.css'

type PushResultType = {
  success: boolean
  created: string[]
  updated: string[]
  failed: { key: string; reason: string }[]
}

// GitLab flow has an extra step for variables
const getStepCount = (data: WizardData) => data.platform === 'gitlab-ci' ? 4 : 3

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultWizardData)
  const [isLoading, setIsLoading] = useState(false)
  const [pushResult, setPushResult] = useState<PushResultType | null>(null)

  const update = (newData: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...newData }))

  const totalSteps = getStepCount(data)
  const next = () => setStep(s => Math.min(s + 1, totalSteps))
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

  const handlePushVariables = async (projectId: string, token: string, variables: CIVariable[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, token, variables })
      })
      const result = await res.json()
      setPushResult(result)
    } catch {
      setPushResult({
        success: false,
        created: [],
        updated: [],
        failed: [{ key: '*', reason: 'Could not reach the backend.' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setData(defaultWizardData)
    setPushResult(null)
  }

  const isLastStep = step === totalSteps
  const isGitLabVariablesStep = data.platform === 'gitlab-ci' && step === 4

  return (
    <div className="app">
      {/* Left: Wizard */}
      <div className="wizard-panel">
        <div className="wizard-header">
          <h1>GGYAML</h1>
          <p>Generate CI/CD pipeline configurations</p>
          <div className="step-progress">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`step-dot ${i < step ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="wizard-content">
          {pushResult ? (
            <PushResult result={pushResult} onReset={handleReset} />
          ) : (
            <>
              {step === 1 && <StepPlatform data={data} onChange={update} />}
              {step === 2 && <StepProjectInfo data={data} onChange={update} />}
              {step === 3 && <StepPipeline data={data} onChange={update} />}
              {isGitLabVariablesStep && (
                <StepGitLabVariables
                  onSubmit={handlePushVariables}
                  onBack={back}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>

        {!pushResult && !isGitLabVariablesStep && (
          <div className="wizard-footer">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={back}>Back</button>
            )}
            {!isLastStep && (
              <button className="btn btn-primary" onClick={next}>Continue</button>
            )}
            {isLastStep && data.platform !== 'gitlab-ci' && (
              <button className="btn btn-primary" onClick={handleDownload}>
                Download YAML
              </button>
            )}
            {isLastStep && data.platform === 'gitlab-ci' && (
              <button className="btn btn-primary" onClick={next}>
                Set Variables
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Live Preview */}
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