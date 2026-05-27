import yaml from 'js-yaml'
import type { WizardData } from '../types'

function getSetupSteps(data: WizardData): any[] {
  const checkout = { uses: 'actions/checkout@v4' }

  switch (data.language) {
    case 'python':
      return [
        checkout,
        {
          name: 'Set up Python',
          uses: 'actions/setup-python@v5',
          with: { 'python-version': data.pythonVersion || '3.11' }
        }
      ]
    case 'php':
      return [
        checkout,
        {
          name: 'Set up PHP',
          uses: 'shivammathur/setup-php@v2',
          with: {
            'php-version': data.phpVersion || '8.2',
            'tools': 'composer'
          }
        }
      ]
    default: // node / react
      return [
        checkout,
        {
          name: 'Set up Node.js',
          uses: 'actions/setup-node@v4',
          with: { 'node-version': data.nodeVersion || '20' }
        }
      ]
  }
}

function getInstallStep(data: WizardData): any {
  switch (data.language) {
    case 'python':
      return { name: 'Install dependencies', run: 'pip install -r requirements.txt' }
    case 'php':
      return { name: 'Install dependencies', run: 'composer install --no-interaction --prefer-dist' }
    default:
      return { name: 'Install dependencies', run: 'npm install' }
  }
}

function getBuildStep(data: WizardData): any {
  switch (data.language) {
    case 'python':
      return { name: 'Build', run: 'echo "Add your build step here (e.g. python -m build)"' }
    case 'php':
      return { name: 'Build', run: 'echo "Add your build step here (e.g. php artisan optimize)"' }
    default:
      return { name: 'Build', run: 'npm run build' }
  }
}

function getTestStep(data: WizardData): any {
  switch (data.language) {
    case 'python':
      return { name: 'Run tests', run: 'pytest' }
    case 'php':
      return { name: 'Run tests', run: './vendor/bin/phpunit' }
    default:
      return { name: 'Run tests', run: 'npm test' }
  }
}

export function generateGitHubActions(data: WizardData): string {
  const jobs: Record<string, any> = {}
  const setupSteps = getSetupSteps(data)
  const installStep = getInstallStep(data)

  if (data.stages.build) {
    jobs.build = {
      'runs-on': 'ubuntu-latest',
      steps: [
        ...setupSteps,
        installStep,
        getBuildStep(data)
      ]
    }
  }

  if (data.stages.test) {
    jobs.test = {
      'runs-on': 'ubuntu-latest',
      needs: data.stages.build ? ['build'] : undefined,
      steps: [
        ...setupSteps,
        installStep,
        getTestStep(data)
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