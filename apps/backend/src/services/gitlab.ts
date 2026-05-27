import type { GitLabConfig, CIVariable } from '@ggyaml/yaml-generator'

const GITLAB_BASE = 'https://gitlab.com/api/v4'

const gitlabHeaders = (token: string) => ({ 'PRIVATE-TOKEN': token })

// ── existing types ──────────────────────────────────────────────

type GitLabResult = {
  success: boolean
  created: string[]
  updated: string[]
  failed: { key: string; reason: string }[]
}

// ── new types ───────────────────────────────────────────────────

export type GitLabProject = {
  id: number
  name: string
  name_with_namespace: string
  path_with_namespace: string
  default_branch: string
}

// ── project listing ─────────────────────────────────────────────

export async function getGitLabProjects(token: string): Promise<GitLabProject[]> {
  const res = await fetch(
    `${GITLAB_BASE}/projects?membership=true&order_by=last_activity_at&per_page=100&simple=true`,
    { headers: gitlabHeaders(token) }
  )

  if (res.status === 401) throw new Error('Invalid token. Check your Personal Access Token.')
  if (!res.ok) throw new Error(`GitLab API error: ${res.statusText}`)

  return res.json() as Promise<GitLabProject[]>
}

export async function getGitLabProjectTopLanguage(
  token: string,
  projectId: string
): Promise<string | null> {
  const res = await fetch(
    `${GITLAB_BASE}/projects/${projectId}/languages`,
    { headers: gitlabHeaders(token) }
  )

  if (!res.ok) return null

  const data = await res.json() as Record<string, number>
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a)

  return sorted[0]?.[0] ?? null
}

// ── existing variables logic (unchanged) ────────────────────────

async function getExistingVariables(projectId: string, token: string): Promise<string[]> {
  const res = await fetch(`${GITLAB_BASE}/projects/${projectId}/variables`, {
    headers: gitlabHeaders(token)
  })
  if (!res.ok) throw new Error(`Could not reach GitLab project. Check your project ID and token. (${res.status})`)
  const data = await res.json() as { key: string }[]
  return data.map(v => v.key)
}

async function createVariable(projectId: string, token: string, variable: CIVariable): Promise<void> {
  const res = await fetch(`${GITLAB_BASE}/projects/${projectId}/variables`, {
    method: 'POST',
    headers: { ...gitlabHeaders(token), 'Content-Type': 'application/json' },
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
    headers: { ...gitlabHeaders(token), 'Content-Type': 'application/json' },
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