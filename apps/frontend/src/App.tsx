import { useState } from 'react'
import { defaultWizardData } from './types/wizard'
import type { WizardData, CIVariable } from './types/wizard'
import { generateYAML } from './generator/generateYAML'
import StepPlatform from './steps/StepPlatform'
import StepProjectInfo from './steps/StepProjectInfo'
import StepPipeline from './steps/StepPipeline'
import StepGitLabVariables from './steps/StepGitLabVariables'
import StepGitHubConnect from './steps/StepGitHubConnect'
import StepGitHubSecrets from './steps/StepGitHubSecrets'
import PushResult from './components/PushResult'
import './App.css'

type PushResult = {
  success: boolean
  created: string[]
  updated: string[]
  failed: { key: string; reason: string }[]
}

type GitHubAuth = { token: string; owner: string; repo: string }

const getStepCount = (platform?: string) => {
  if (platform === 'github-actions') return 5
  if (platform === 'gitlab-ci') return 4
  return 3
}

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultWizardData)
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pushResult, setPushResult] = useState<PushResult | null>(null)

  const update = (newData: Partial<WizardData>) =>
    setData(prev => ({ ...prev, ...newData }))

  const totalSteps = getStepCount(data.platform)
  const next = () => setStep(s => Math.min(s + 1, totalSteps))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const yaml = generateYAML(data)

  // Determine what each step number renders
  // GitHub: 1=Platform, 2=Connect, 3=ProjectInfo, 4=Pipeline, 5=Secrets
  // GitLab: 1=Platform, 2=ProjectInfo, 3=Pipeline, 4=Variables
  const isGitHub = data.platform === 'github-actions'
  const isGitLab = data.platform === 'gitlab-ci'

  const isGitHubConnectStep = isGitHub && step === 2
  const isProjectInfoStep = (isGitHub && step === 3) || (isGitLab && step === 2) || (!data.platform && step === 2)
  const isPipelineStep = (isGitHub && step === 4) || (isGitLab && step === 3)
  const isGitLabVariablesStep = isGitLab && step === 4
  const isGitHubSecretsStep = isGitHub && step === 5
  const isActionStep = isGitLabVariablesStep || isGitHubSecretsStep

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

  const handlePushGitLabVariables = async (
    projectId: string,
    token: string,
    variables: CIVariable[]
  ) => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, token, variables })
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
    // 1. Fetch the public key
    const pkRes = await fetch(
      `http://localhost:3001/api/github/public-key?owner=${githubAuth.owner}&repo=${githubAuth.repo}`,
      { headers: { Authorization: `Bearer ${githubAuth.token}` } }
    )
    const { key_id, key: publicKey } = await pkRes.json()

    // 2. Encrypt every value locally — backend never sees plain text
    const encryptedSecrets = await Promise.all(
      secrets.map(async (s) => ({
        key: s.key,
        encryptedValue: await encryptSecret(publicKey, s.value),
        keyId: key_id,
      }))
    )

    // 3. Send pre-encrypted values to backend for forwarding
    const res = await fetch('http://localhost:3001/api/github/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: githubAuth.token,
        owner: githubAuth.owner,
        repo:  githubAuth.repo,
        secrets: encryptedSecrets
      })
    })

    setPushResult(await res.json())
  } catch {
    setPushResult({ success: false, created: [], updated: [], failed: [{ key: '*', reason: 'Encryption or network error.' }] })
  } finally {
    setIsLoading(false)
  }
}

  const handleReset = () => {
    setStep(1)
    setData(defaultWizardData)
    setGithubAuth(null)
    setPushResult(null)
  }

  const isLastStep = step === totalSteps
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

              {isGitHubConnectStep && (
                <StepGitHubConnect
                  onChange={update}
                  onAuthChange={(token, owner, repo) =>
                    setGithubAuth({ token, owner, repo })
                  }
                />
              )}

              {isProjectInfoStep && (
                <StepProjectInfo data={data} onChange={update} />
              )}

              {isPipelineStep && (
                <StepPipeline data={data} onChange={update} onBack={back} />
              )}

              {isGitLabVariablesStep && (
                <StepGitLabVariables
                  onSubmit={handlePushGitLabVariables}
                  onBack={back}
                  isLoading={isLoading}
                />
              )}

              {isGitHubSecretsStep && githubAuth && (
                <StepGitHubSecrets
                  token={githubAuth.token}
                  owner={githubAuth.owner}
                  repo={githubAuth.repo}
                  onSubmit={handlePushGitHubSecrets}
                  onBack={back}
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
            {!isLastStep && (
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={isGitHubConnectStep && !githubAuth}
              >
                Continue
              </button>
            )}
            {isLastStep && isGitHub && (
              <>
                <button className="btn btn-ghost" onClick={handleDownload}>
                  Download YAML
                </button>
                <button className="btn btn-primary" onClick={next}>
                  Push Secrets
                </button>
              </>
            )}
            {isLastStep && isGitLab && (
              <button className="btn btn-primary" onClick={next}>
                Set Variables
              </button>
            )}
            {isLastStep && !data.platform && (
              <button className="btn btn-primary" onClick={handleDownload}>
                Download YAML
              </button>
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