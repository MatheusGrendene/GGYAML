export type Platform = 'github-actions' | 'gitlab-ci'
export type Language = 'node' | 'python' | 'php' | 'java' | 'go'

export type WizardData = {
  platform?: Platform
  projectName?: string
  language?: Language | string
  nodeVersion?: string
  pythonVersion?: string
  phpVersion?: string
  stages: {
    build: boolean
    test: boolean
    deploy: boolean
  }
}

export const defaultWizardData: WizardData = {
  platform: undefined,
  projectName: '',
  language: '',
  nodeVersion: '20',
  pythonVersion: '3.11',
  phpVersion: '8.2',
  stages: {
    build: true,
    test: false,
    deploy: false,
  }
}

export type CIVariable = {
  key: string
  value: string
  masked: boolean
  protected: boolean
  environment_scope: string
}

export type GitLabConfig = {
  projectId: string
  token: string
  variables: CIVariable[]
}