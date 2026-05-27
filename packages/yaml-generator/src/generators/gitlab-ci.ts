import yaml from 'js-yaml'
import type { WizardData } from '../types'

function getImage(data: WizardData): string {
  switch (data.language) {
    case 'python': return `python:${data.pythonVersion || '3.11'}`
    case 'php':    return `php:${data.phpVersion || '8.2'}-cli`
    default:       return `node:${data.nodeVersion || '20'}`
  }
}

function getBeforeScript(data: WizardData): string[] | undefined {
  // PHP needs composer installed manually on the base image
  if (data.language === 'php') {
    return [
      'curl -sS https://getcomposer.org/installer | php',
      'mv composer.phar /usr/local/bin/composer'
    ]
  }
  return undefined
}

function getInstallScript(data: WizardData): string[] {
  switch (data.language) {
    case 'python': return ['pip install -r requirements.txt']
    case 'php':    return ['composer install --no-interaction --prefer-dist']
    default:       return ['npm install']
  }
}

function getBuildScript(data: WizardData): string[] {
  switch (data.language) {
    case 'python': return ['echo "Add your build step here (e.g. python -m build)"']
    case 'php':    return ['echo "Add your build step here (e.g. php artisan optimize)"']
    default:       return ['npm run build']
  }
}

function getTestScript(data: WizardData): string[] {
  switch (data.language) {
    case 'python': return ['pip install -r requirements.txt', 'pytest']
    case 'php':    return ['composer install --no-interaction --prefer-dist', './vendor/bin/phpunit']
    default:       return ['npm install', 'npm test']
  }
}

function getCacheConfig(data: WizardData): any {
  switch (data.language) {
    case 'python':
      return { paths: ['.cache/pip', 'venv/'] }
    case 'php':
      return { paths: ['vendor/'] }
    default:
      return { paths: ['node_modules/'] }
  }
}

export function generateGitLabCI(data: WizardData): string {
  const image = getImage(data)
  const beforeScript = getBeforeScript(data)
  const cache = getCacheConfig(data)

  const config: Record<string, any> = {
    image,
    stages: Object.entries(data.stages)
      .filter(([, enabled]) => enabled)
      .map(([stage]) => stage)
  }

  if (data.stages.build) {
    config['build-job'] = {
      stage: 'build',
      ...(beforeScript && { before_script: beforeScript }),
      script: [
        ...getInstallScript(data),
        ...getBuildScript(data)
      ],
      cache
    }
  }

  if (data.stages.test) {
    config['test-job'] = {
      stage: 'test',
      ...(beforeScript && { before_script: beforeScript }),
      script: getTestScript(data),
      needs: data.stages.build ? ['build-job'] : [],
      cache
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