import yaml from 'js-yaml'
import type { WizardData } from '../types'

export function generateGitLabCI(data: WizardData): string {
  const config: Record<string, any> = {
    stages: Object.entries(data.stages)
      .filter(([, enabled]) => enabled)
      .map(([stage]) => stage)
  }

  if (data.stages.build) {
    config['build-job'] = {
      stage: 'build',
      script: ['npm install', 'npm run build']
    }
  }

  if (data.stages.test) {
    config['test-job'] = {
      stage: 'test',
      script: ['npm test'],
      needs: data.stages.build ? ['build-job'] : []
    }
  }

  if (data.stages.deploy) {
    config['deploy-job'] = {
      stage: 'deploy',
      script: ['echo "Add your deploy script here"'],
      needs: [
        ...(data.stages.build ? ['build-job'] : []),
        ...(data.stages.test ? ['test-job'] : []),
      ]
    }
  }

  return yaml.dump(config, { lineWidth: -1 })
}