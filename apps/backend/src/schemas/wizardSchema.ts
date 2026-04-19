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