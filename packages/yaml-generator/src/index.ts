import type { WizardData } from './types'
import { generateGitHubActions } from './generators/github-actions'
import { generateGitLabCI } from './generators/gitlab-ci'

export function generateYAML(data: WizardData): string {
  if (!data.platform) return '# Choose a platform to get started'

  if (data.platform === 'github-actions') {
    return generateGitHubActions(data)
  } else {
    return generateGitLabCI(data)
  }
}

export * from './types'