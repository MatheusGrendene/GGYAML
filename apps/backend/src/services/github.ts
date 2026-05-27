import sodium from 'libsodium-wrappers'

const GITHUB_BASE = 'https://api.github.com'
const GITHUB_HEADERS = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
})

export type GitHubRepo = {
  name: string
  full_name: string
  language: string | null
  default_branch: string
  private: boolean
  owner: { login: string }
}

type GitHubSecret = {
  key: string
  value: string
}

type GitHubSecretsConfig = {
  token: string
  owner: string
  repo: string
  secrets: GitHubSecret[]
}

type GitHubResult = {
  success: boolean
  pushed: string[]
  failed: { key: string; reason: string }[]
}

// --- Repo listing ---

export async function getGitHubRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_BASE}/user/repos?sort=updated&per_page=100&type=owner`,
    { headers: GITHUB_HEADERS(token) }
  )

  if (res.status === 401) throw new Error('Invalid token. Check your Personal Access Token.')
  if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`)

  return res.json() as Promise<GitHubRepo[]>
}

// --- Secret encryption ---

async function encryptSecret(publicKeyBase64: string, secretValue: string): Promise<string> {
  await sodium.ready

  const publicKeyBytes = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL)
  const secretBytes = sodium.from_string(secretValue)
  const encryptedBytes = sodium.crypto_box_seal(secretBytes, publicKeyBytes)

  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL)
}

async function getRepoPublicKey(token: string, owner: string, repo: string) {
  const res = await fetch(
    `${GITHUB_BASE}/repos/${owner}/${repo}/actions/secrets/public-key`,
    { headers: GITHUB_HEADERS(token) }
  )

  if (!res.ok) throw new Error(`Could not fetch repo public key: ${res.statusText}`)

  return res.json() as Promise<{ key_id: string; key: string }>
}

// --- Push secrets ---

async function pushSecret(
  token: string,
  owner: string,
  repo: string,
  keyId: string,
  secretName: string,
  encryptedValue: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_BASE}/repos/${owner}/${repo}/actions/secrets/${secretName}`,
    {
      method: 'PUT',
      headers: {
        ...GITHUB_HEADERS(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        encrypted_value: encryptedValue,
        key_id: keyId
      })
    }
  )

  // GitHub returns 201 (created) or 204 (updated) on success
  if (res.status !== 201 && res.status !== 204) {
    const body = await res.text()
    throw new Error(body || res.statusText)
  }
}

export async function pushSecretsToGitHub(config: GitHubSecretsConfig): Promise<GitHubResult> {
  const result: GitHubResult = { success: true, pushed: [], failed: [] }

  let keyId: string
  let publicKey: string

  try {
    const pk = await getRepoPublicKey(config.token, config.owner, config.repo)
    keyId = pk.key_id
    publicKey = pk.key
  } catch (err: any) {
    return { success: false, pushed: [], failed: [{ key: '*', reason: err.message }] }
  }

  for (const secret of config.secrets) {
    try {
      const encryptedValue = await encryptSecret(publicKey, secret.value)
      await pushSecret(config.token, config.owner, config.repo, keyId, secret.key, encryptedValue)
      result.pushed.push(secret.key)
    } catch (err: any) {
      result.failed.push({ key: secret.key, reason: err.message })
      result.success = false
    }
  }

  return result
}