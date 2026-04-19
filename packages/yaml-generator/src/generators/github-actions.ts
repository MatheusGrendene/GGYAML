import yaml from 'js-yaml'
import type { WizardData } from '../types'

export function generateGitHubActions(data: WizardData): string {
  const jobs: Record<string, any> = {}

  if (data.stages.build) {
    jobs.build = {
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v4' },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v4',
          with: { 'node-version': data.nodeVersion || '20' }
        },
        { name: 'Install dependencies', run: 'npm install' },
        { name: 'Build', run: 'npm run build' }
      ]
    }
  }

  if (data.stages.test) {
    jobs.test = {
      'runs-on': 'ubuntu-latest',
      needs: data.stages.build ? ['build'] : undefined,
      steps: [
        { uses: 'actions/checkout@v4' },
        { name: 'Run tests', run: 'npm test' }
      ]
    }
  }

  if (data.stages.deploy) {
    jobs.deploy = {
      'runs-on': 'ubuntu-latest',
      needs: [
        ...(data.stages.build ? ['build'] : []),
        ...(data.stages.test ? ['test'] : []),
      ],
      steps: [
        { uses: 'actions/checkout@v4' },
        { name: 'Deploy', run: 'echo "Add your deploy script here"' }
      ]
    }
  }

  const pipeline = {
    name: data.projectName || 'CI Pipeline',
    on: {
      push: { branches: ['main'] },
      pull_request: { branches: ['main'] }
    },
    jobs
  }

  return yaml.dump(pipeline, { lineWidth: -1 })
}