import { z } from 'zod';

export const processUrlSchema = z.object({
  url: z.string().url(),
  archetype: z.string().optional(),
});
