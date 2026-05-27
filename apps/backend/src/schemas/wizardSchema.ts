import { z } from 'zod'

export const wizardSchema = z.object({
  platform: z.enum(['github-actions', 'gitlab-ci']),
  projectName: z.string().min(1).max(100).optional(),
  language: z.string().optional(),
  nodeVersion: z.string().optional(),
  stages: z.object({
    build: z.boolean(),
    test: z.boolean(),
    deploy: z.boolean(),
  })
})

export type WizardInput = z.infer<typeof wizardSchema>

// GitLab schemas
export const ciVariableSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must start with a letter, uppercase letters, numbers and underscores only'),
  value: z.string(),
  masked: z.boolean().default(false),
  protected: z.boolean().default(false),
  environment_scope: z.string().default('*')
})

export const gitlabConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  token: z.string().min(1, 'Token is required'),
  variables: z.array(ciVariableSchema).min(1, 'Add at least one variable')
})

export type GitLabConfigInput = z.infer<typeof gitlabConfigSchema>

// GitHub schemas
export const githubSecretSchema = z.object({
  key: z.string().min(1).regex(/^[A-Z][A-Z0-9_]*$/),
  encryptedValue: z.string().min(1),  // ← was "value"
  keyId: z.string().min(1),           // ← new, needed by GitHub
})

export const githubSecretsConfigSchema = z.object({
  token: z.string().min(1),
  owner: z.string().min(1),
  repo:  z.string().min(1),
  secrets: z.array(githubSecretSchema).min(1)
})

export type GitHubSecretsConfigInput = z.infer<typeof githubSecretsConfigSchema>