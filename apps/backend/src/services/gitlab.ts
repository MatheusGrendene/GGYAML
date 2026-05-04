import type { GitLabConfig, CIVariable } from '@ggyaml/yaml-generator'

const GITLAB_BASE = 'https://gitlab.com/api/v4'

type GitLabResult = {
  success: boolean
  created: string[]
  updated: string[]
  failed: { key: string; reason: string }[]
}

async function getExistingVariables(projectId: string, token: string): Promise<string[]> {
  const res = await fetch(`${GITLAB_BASE}/projects/${projectId}/variables`, {
    headers: { 'PRIVATE-TOKEN': token }
  })

  if (!res.ok) throw new Error(`Could not reach GitLab project. Check your project ID and token. (${res.status})`)

  const data = await res.json() as { key: string }[]
  return data.map(v => v.key)
}

async function createVariable(projectId: string, token: string, variable: CIVariable): Promise<void> {
  const res = await fetch(`${GITLAB_BASE}/projects/${projectId}/variables`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: variable.key,
      value: variable.value,
      masked: variable.masked,
      protected: variable.protected,
      environment_scope: variable.environment_scope || '*'
    })
  })

  if (!res.ok) throw new Error(await res.text())
}

async function updateVariable(projectId: string, token: string, variable: CIVariable): Promise<void> {
  const res = await fetch(`${GITLAB_BASE}/projects/${projectId}/variables/${variable.key}`, {
    method: 'PUT',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: variable.value,
      masked: variable.masked,
      protected: variable.protected,
      environment_scope: variable.environment_scope || '*'
    })
  })

  if (!res.ok) throw new Error(await res.text())
}

export async function pushVariablesToGitLab(config: GitLabConfig): Promise<GitLabResult> {
  const result: GitLabResult = { success: true, created: [], updated: [], failed: [] }

  let existingKeys: string[] = []
  try {
    existingKeys = await getExistingVariables(config.projectId, config.token)
  } catch (err: any) {
    return { ...result, success: false, failed: [{ key: '*', reason: err.message }] }
  }

  for (const variable of config.variables) {
    try {
      if (existingKeys.includes(variable.key)) {
        await updateVariable(config.projectId, config.token, variable)
        result.updated.push(variable.key)
      } else {
        await createVariable(config.projectId, config.token, variable)
        result.created.push(variable.key)
      }
    } catch (err: any) {
      result.failed.push({ key: variable.key, reason: err.message })
      result.success = false
    }
  }

  return result
}