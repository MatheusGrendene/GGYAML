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

export const ciVariableSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Must start with a letter and contain only uppercase letters, numbers and underscores'),
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