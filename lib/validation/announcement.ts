import { z } from 'zod'

export const announcementSchema = z.object({
  title: z.string().min(2, 'Title required'),
  body: z.string().optional(),
  level: z.enum(['info', 'warning', 'payment']).default('info'),
  // 'all' | 'role:agent' | 'agent:<uuid>'
  audience: z.string().default('all'),
  endsAt: z.string().optional(),
})

export type AnnouncementInput = z.infer<typeof announcementSchema>
