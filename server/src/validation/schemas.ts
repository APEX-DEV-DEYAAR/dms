import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '../shared/constants';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required').max(100),
    password: z.string().min(1, 'Password is required').max(500),
  }),
});

export const createLetterheadSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^\d+$/, 'departmentId must be a number').transform(Number),
    letterDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'letterDate must be YYYY-MM-DD'),
    approvalAuthority: z.string().min(1, 'approvalAuthority is required').max(200),
    description: z.string().min(1, 'description is required').max(2000),
    notes: z.string().max(2000).optional().nullable(),
    iomNumber: z.string().max(50).optional().nullable(),
  }),
});

export const updateLetterheadSchema = z.object({
  body: z.object({
    departmentId: z.string().regex(/^\d+$/, 'departmentId must be a number').transform(Number),
    letterDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'letterDate must be YYYY-MM-DD'),
    approvalAuthority: z.string().min(1, 'approvalAuthority is required').max(200),
    description: z.string().min(1, 'description is required').max(2000),
    notes: z.string().max(2000).optional().nullable(),
    iomNumber: z.string().max(50).optional().nullable(),
    justification: z.string().min(1, 'justification is required').max(2000),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
});

export const letterheadFilterSchema = z.object({
  query: z.object({
    departmentId: z.string().regex(/^\d+$/).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    approvalAuthority: z.string().max(200).optional(),
    search: z.string().max(200).optional(),
    isArchived: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional().default(String(PAGINATION_DEFAULTS.PAGE)),
    limit: z.string().regex(/^\d+$/).optional().default(String(PAGINATION_DEFAULTS.LIMIT)),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  }),
});
