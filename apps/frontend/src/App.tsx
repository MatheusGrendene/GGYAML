import { useState } from 'react'
import { defaultWizardData } from './types/wizard'
import type { WizardData, CIVariable } from './types/wizard'
import { generateYAML } from './generator/generateYAML'
import StepPlatform from './steps/StepPlatform'
import StepProjectInfo from './steps/StepProjectInfo'
import StepPipeline from './steps/StepPipeline'
import StepGitLabVariables from './steps/StepGitLabVariables'
import StepGitHubConnect from './steps/StepGitHubConnect'
import StepGitLabConnect from './steps/StepGitLabConnect'
import StepGitHubSecrets from './steps/StepGitHubSecrets'
import PushResult from './components/PushResult'
import './App.css'

type PushResultType = {
  success: boolean
  created: string[]
  updated: string[]
  failed: { key: string; reason: string }[]
}

type GitHubAuth = { token: string; owner: string; repo: string }
type GitLabAuth = { token: string; projectId: string; projectPath: string }

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultWizardData)
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null)
  const [gitlabAuth, setGitlabAuth] = useState<GitLabAuth | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pushResult, setPushResult] = useState<PushResultType | null>(null)

  const update = (newData: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...newData }))

  const totalSteps = data.platform ? 5 : 3
  const next = () => setStep(s => Math.min(s + 1, totalSteps))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const isGitHub = data.platform === 'github-actions'
  const isGitLab = data.platform === 'gitlab-ci'

  const isConnectStep  = step === 2
  const isProjectStep  = step === 3
  const isPipelineStep = step === 4
  const isActionStep   = step === 5

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

  // Downloads the YAML and resets the wizard back to step 1
  const handleSkip = async () => {
    await handleDownload()
    handleReset()
  }

  const handlePushGitLabVariables = async (variables: CIVariable[]) => {
    if (!gitlabAuth) return
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: gitlabAuth.projectId,
          token: gitlabAuth.token,
          variables
        })
      })
      setPushResult(await res.json())
    } catch {
      setPushResult({ success: false, created: [], updated: [], failed: [{ key: '*', reason: 'Could not reach the backend.' }] })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePushGitHubSecrets = async (secrets: { key: string; value: string }[]) => {
    if (!githubAuth) return
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/github/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubAuth.token,
          owner: githubAuth.owner,
          repo: githubAuth.repo,
          secrets
        })
      })
      setPushResult(await res.json())
    } catch {
      setPushResult({ success: false, created: [], updated: [], failed: [{ key: '*', reason: 'Could not reach the backend.' }] })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setData(defaultWizardData)
    setGithubAuth(null)
    setGitlabAuth(null)
    setPushResult(null)
  }

  const showFooter = !pushResult && !isActionStep

  return (
    <div className="app">
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

              {isConnectStep && isGitHub && (
                <StepGitHubConnect
                  onChange={update}
                  onAuthChange={(token, owner, repo) =>
                    setGithubAuth({ token, owner, repo })
                  }
                />
              )}

              {isConnectStep && isGitLab && (
                <StepGitLabConnect
                  onChange={update}
                  onAuthChange={(token, projectId, projectPath) =>
                    setGitlabAuth({ token, projectId, projectPath })
                  }
                />
              )}

              {isProjectStep  && <StepProjectInfo data={data} onChange={update} />}
              {isPipelineStep && <StepPipeline data={data} onChange={update} onBack={back} />}

              {isActionStep && isGitLab && (
                <StepGitLabVariables
                  projectId={gitlabAuth?.projectId ?? ''}
                  token={gitlabAuth?.token ?? ''}
                  projectPath={gitlabAuth?.projectPath}
                  hasAuth={!!gitlabAuth}
                  onSubmit={handlePushGitLabVariables}
                  onBack={back}
                  onSkip={handleSkip}
                  isLoading={isLoading}
                />
              )}

              {isActionStep && isGitHub && (
                <StepGitHubSecrets
                  token={githubAuth?.token ?? ''}
                  owner={githubAuth?.owner ?? ''}
                  repo={githubAuth?.repo ?? ''}
                  hasAuth={!!githubAuth}
                  onSubmit={handlePushGitHubSecrets}
                  onBack={back}
                  onSkip={handleSkip}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>

        {showFooter && (
          <div className="wizard-footer">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={back}>Back</button>
            )}
            {step < totalSteps && (
              <button className="btn btn-primary" onClick={next}>
                Continue
              </button>
            )}
            {step === totalSteps && (
              <>
                <button className="btn btn-ghost" onClick={handleDownload}>
                  Download YAML
                </button>
                <button className="btn btn-primary" onClick={next}>
                  {isGitHub ? 'Push Secrets' : 'Set Variables'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

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