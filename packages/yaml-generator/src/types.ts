export type Platform = 'github-actions' | 'gitlab-ci'

export type WizardData = {
  platform?: Platform
  projectName?: string
  language?: string
  nodeVersion?: string
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
  stages: {
    build: true,
    test: false,
    deploy: false,
  }
}