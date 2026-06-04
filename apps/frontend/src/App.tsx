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
import StepGitHubConfig from './steps/StepGitHubConfig'
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

const STEP_NAMES: Record<string, string[]> = {
  'github-actions': ['Platform', 'Connect', 'Project info', 'Pipeline', 'Secrets & vars'],
  'gitlab-ci': ['Platform', 'Connect', 'Project info', 'Pipeline', 'Variables'],
}

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultWizardData)
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null)
  const [gitlabAuth, setGitlabAuth] = useState<GitLabAuth | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pushResult, setPushResult] = useState<PushResultType | null>(null)
  const [copied, setCopied] = useState(false)

  const update = (newData: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...newData }))

  const totalSteps = data.platform ? 5 : 3
  const next = () => setStep(s => Math.min(s + 1, totalSteps))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const isGitHub = data.platform === 'github-actions'
  const isGitLab = data.platform === 'gitlab-ci'

  const isConnectStep = step === 2
  const isProjectStep = step === 3
  const isPipelineStep = step === 4
  const isActionStep = step === 5

  const stepNames = data.platform
    ? (STEP_NAMES[data.platform] ?? ['Platform', 'Connect', 'Configure'])
    : ['Platform', 'Connect', 'Configure']
  const currentStepName = stepNames[step - 1] ?? ''

  const yaml = generateYAML(data)
  const yamlLines = yaml.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = async () => {
    const res = await fetch(' /api/generate', {
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

  const handleSkip = async () => {
    await handleDownload()
    handleReset()
  }

  const handlePushGitLabVariables = async (variables: CIVariable[]) => {
    if (!gitlabAuth) return
    setIsLoading(true)
    try {
      const res = await fetch(' /api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: gitlabAuth.projectId,
          token: gitlabAuth.token,
          variables
        })
      })

      if (!res.ok) {
        setPushResult({ success: false, created: [], updated: [], failed: [{ key: '*', reason: `Server error: ${res.status}` }] })
        return
      }

      const json = await res.json()
      if (json.success) await handleDownload()
      setPushResult(json)
    } catch {
      setPushResult({ success: false, created: [], updated: [], failed: [{ key: '*', reason: 'Could not reach the backend.' }] })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePushGitHubConfig = async (
    secrets: { key: string; value: string }[],
    variables: { key: string; value: string }[]
  ) => {
    if (!githubAuth) return
    setIsLoading(true)

    const combined: PushResultType = {
      success: true,
      created: [],
      updated: [],
      failed: []
    }

    try {
      if (secrets.length > 0) {
        const res = await fetch(' /api/github/secrets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: githubAuth.token,
            owner: githubAuth.owner,
            repo: githubAuth.repo,
            secrets
          })
        })

        if (!res.ok) {
          combined.failed.push({ key: '(secrets)', reason: `Server error: ${res.status}` })
          combined.success = false
        } else {
          const json = await res.json() as { success: boolean; pushed?: string[]; failed: { key: string; reason: string }[] }
          combined.created.push(...(json.pushed ?? []).map(k => `🔒 ${k}`))
          combined.failed.push(...json.failed)
          if (!json.success) combined.success = false
        }
      }

      if (variables.length > 0) {
        const res = await fetch(' /api/github/variables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: githubAuth.token,
            owner: githubAuth.owner,
            repo: githubAuth.repo,
            variables
          })
        })

        if (!res.ok) {
          combined.failed.push({ key: '(variables)', reason: `Server error: ${res.status}` })
          combined.success = false
        } else {
          const json = await res.json() as { success: boolean; pushed?: string[]; failed: { key: string; reason: string }[] }
          combined.created.push(...(json.pushed ?? []).map(k => `📋 ${k}`))
          combined.failed.push(...json.failed)
          if (!json.success) combined.success = false
        }
      }

      if (combined.success || combined.created.length > 0) {
        await handleDownload()
      }

      setPushResult(combined)
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
          <div className="wizard-header-top">
            <span className="wizard-wordmark">GGYAML</span>
            <span className="wizard-step-badge">{step} / {totalSteps}</span>
          </div>
          <div className="wizard-step-area">
            <div className="wizard-step-name">{currentStepName}</div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
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

              {isProjectStep && <StepProjectInfo data={data} onChange={update} />}
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
                <StepGitHubConfig
                  owner={githubAuth?.owner ?? ''}
                  repo={githubAuth?.repo ?? ''}
                  hasAuth={!!githubAuth}
                  onSubmit={handlePushGitHubConfig}
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
            <div>
              {step > 1 && (
                <button className="btn btn-ghost" onClick={back}>← Back</button>
              )}
            </div>
            <div className="wizard-footer-right">
              {step < totalSteps && (
                <button className="btn btn-primary" onClick={next}>
                  Continue →
                </button>
              )}
              {step === totalSteps && (
                <>
                  <button className="btn btn-ghost" onClick={handleDownload}>
                    ↓ Download
                  </button>
                  <button className="btn btn-primary" onClick={next}>
                    {isGitHub ? 'Push secrets →' : 'Set variables →'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="preview-panel">
        <div className="preview-toolbar">
          <div className="preview-file-info">
            <div className="preview-dot" />
            <span className="preview-filename">pipeline.yml</span>
            <span className="preview-badge">YAML</span>
          </div>
          <button
            className={`preview-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
        <div className="preview-body">
          <div className="preview-gutter">
            {yamlLines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <pre className="preview-code">{yaml}</pre>
        </div>
      </div>
    </div>
  )
}