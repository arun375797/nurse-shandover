import { z } from 'zod';
import {
  FORM_OPTION_CATEGORY_KEYS,
  HANDOVER_STATUSES,
  PAGINATION,
  PATIENT_LIST_STATUSES,
  STRING_LIMITS,
} from './options.js';

const trim = (max: number) =>
  z
    .string()
    .trim()
    .max(max);

const optionalTrim = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' || v === undefined ? undefined : v));

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine(
    (v) => !v || !Number.isNaN(Date.parse(v)),
    { message: 'Invalid date/time' },
  )
  .transform((v) => (v === '' || v === undefined ? undefined : v));

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(STRING_LIMITS.email),
    password: z.string().min(8).max(128),
  })
  .strict();

export const registerSchema = z
  .object({
    fullName: trim(STRING_LIMITS.name).min(1, 'Name is required'),
    email: z.string().trim().email().max(STRING_LIMITS.email),
    unitName: trim(STRING_LIMITS.medium).min(1, 'Unit is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const vitalSignRowSchema = z
  .object({
    recordedAt: optionalDateString,
    bloodPressure: optionalTrim(STRING_LIMITS.short),
    heartRate: optionalTrim(STRING_LIMITS.short),
    respiration: optionalTrim(STRING_LIMITS.short),
    pulse: optionalTrim(STRING_LIMITS.short),
    spo2: optionalTrim(STRING_LIMITS.short),
    painScore: optionalTrim(STRING_LIMITS.short),
  })
  .strict();

export const infusionRowSchema = z
  .object({
    name: optionalTrim(STRING_LIMITS.medium),
    mcg: optionalTrim(STRING_LIMITS.short),
    mlPerHour: optionalTrim(STRING_LIMITS.short),
  })
  .strict();

export const intakeOutputRowSchema = z
  .object({
    intake: optionalTrim(STRING_LIMITS.short),
    output: optionalTrim(STRING_LIMITS.short),
    balance: optionalTrim(STRING_LIMITS.short),
    urineCountOutput: optionalTrim(STRING_LIMITS.short),
    stoolCount: optionalTrim(STRING_LIMITS.short),
    otherOutput: optionalTrim(STRING_LIMITS.short),
    recordedAt: optionalDateString,
  })
  .strict();

export const diagnosticTestRowSchema = z
  .object({
    test: optionalTrim(STRING_LIMITS.medium),
    type: optionalTrim(STRING_LIMITS.medium),
    date: optionalDateString,
    finding: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const bloodResultRowSchema = z
  .object({
    testName: optionalTrim(STRING_LIMITS.medium),
    todayResult: optionalTrim(STRING_LIMITS.medium),
    referenceRange: optionalTrim(STRING_LIMITS.medium),
    previousResult: optionalTrim(STRING_LIMITS.medium),
    previousResultDate: optionalDateString,
    notes: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const microbiologyRowSchema = z
  .object({
    testSpecimen: optionalTrim(STRING_LIMITS.medium),
    date: optionalDateString,
    result: optionalTrim(STRING_LIMITS.medium),
    notes: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const bloodProductRowSchema = z
  .object({
    productName: optionalTrim(STRING_LIMITS.medium),
    unitsToday: optionalTrim(STRING_LIMITS.short),
    totalUnits: optionalTrim(STRING_LIMITS.short),
    notes: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const lineDeviceRowSchema = z
  .object({
    type: optionalTrim(STRING_LIMITS.medium),
    size: optionalTrim(STRING_LIMITS.short),
    insertionDate: optionalDateString,
    lastDressingDate: optionalDateString,
    duration: optionalTrim(STRING_LIMITS.short),
    notes: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const ventilationSchema = z
  .object({
    type: optionalTrim(STRING_LIMITS.medium),
    o2: optionalTrim(STRING_LIMITS.short),
    peep: optionalTrim(STRING_LIMITS.short),
    fio2: optionalTrim(STRING_LIMITS.short),
    tv: optionalTrim(STRING_LIMITS.short),
    rr: optionalTrim(STRING_LIMITS.short),
    ti: optionalTrim(STRING_LIMITS.short),
    mv: optionalTrim(STRING_LIMITS.short),
    pcPs: optionalTrim(STRING_LIMITS.short),
    recordedAt: optionalDateString,
    notes: optionalTrim(STRING_LIMITS.long),
  })
  .strict();

export const assessmentSchema = z
  .object({
    lastBowelOpenedAt: optionalDateString,
    acuity: optionalTrim(STRING_LIMITS.short),
    bradenScore: optionalTrim(STRING_LIMITS.short),
    fallScore: optionalTrim(STRING_LIMITS.short),
    gcs: optionalTrim(STRING_LIMITS.short),
    bisScore: optionalTrim(STRING_LIMITS.short),
    painScore: optionalTrim(STRING_LIMITS.short),
  })
  .strict();

export const patientHandoverWriteSchema = z
  .object({
    handoverAt: optionalDateString,
    shift: optionalTrim(STRING_LIMITS.short),
    hospitalUnit: optionalTrim(STRING_LIMITS.medium),
    ward: optionalTrim(STRING_LIMITS.short),
    room: optionalTrim(STRING_LIMITS.short),
    bedNumber: optionalTrim(STRING_LIMITS.short),
    outgoingNurse: optionalTrim(STRING_LIMITS.name),
    incomingNurse: optionalTrim(STRING_LIMITS.name),
    handoverStatus: z.enum(HANDOVER_STATUSES).default('draft'),
    generalHandoverNote: optionalTrim(STRING_LIMITS.long),

    patientName: trim(STRING_LIMITS.name).min(1, 'Patient name is required'),
    mrNumberDisplay: trim(STRING_LIMITS.mrNumber).min(1, 'MR number is required'),
    admissionAt: optionalDateString,
    sex: optionalTrim(STRING_LIMITS.short),
    age: optionalTrim(STRING_LIMITS.short),
    nationality: optionalTrim(STRING_LIMITS.short),
    chiefComplaints: optionalTrim(STRING_LIMITS.long),
    medicalHistory: optionalTrim(STRING_LIMITS.long),
    surgicalHistory: optionalTrim(STRING_LIMITS.long),
    admissionNote: optionalTrim(STRING_LIMITS.long),

    assessment: assessmentSchema.default({}),
    vitalSigns: z.array(vitalSignRowSchema).max(50).default([]),
    infusions: z.array(infusionRowSchema).max(50).default([]),
    feedNotes: optionalTrim(STRING_LIMITS.long),
    intakeOutput: z.array(intakeOutputRowSchema).max(50).default([]),
    diagnosticTests: z.array(diagnosticTestRowSchema).max(50).default([]),
    bloodResults: z.array(bloodResultRowSchema).max(50).default([]),
    microbiology: z.array(microbiologyRowSchema).max(50).default([]),
    bloodProducts: z.array(bloodProductRowSchema).max(50).default([]),
    ventilation: ventilationSchema.default({}),
    linesDevices: z.array(lineDeviceRowSchema).max(50).default([]),
    pendingItems: optionalTrim(STRING_LIMITS.long),
    todaysPlan: optionalTrim(STRING_LIMITS.long),

    version: z.number().int().nonnegative().optional(),
  })
  .strict();

export const patientUpdateSchema = patientHandoverWriteSchema.extend({
  version: z.number().int().nonnegative({ message: 'Version is required for updates' }),
});

export const patientListQuerySchema = z
  .object({
    search: z.string().trim().max(STRING_LIMITS.medium).optional(),
    status: z.enum(PATIENT_LIST_STATUSES).optional(),
    unitId: objectIdSchema.optional(),
    ward: z.string().trim().max(STRING_LIMITS.short).optional(),
    shift: z.string().trim().max(STRING_LIMITS.short).optional(),
    page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGINATION.maxLimit)
      .default(PAGINATION.defaultLimit),
    sort: z.enum(['updatedAt', '-updatedAt', 'patientName', '-patientName']).default('-updatedAt'),
  })
  .strict();

export const adminUserUpdateSchema = z
  .object({
    active: z.boolean(),
  })
  .strict();

export const formOptionCreateSchema = z
  .object({
    category: z.enum(FORM_OPTION_CATEGORY_KEYS),
    value: trim(STRING_LIMITS.medium).min(1, 'Value is required'),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .strict();

export const formOptionUpdateSchema = z
  .object({
    value: trim(STRING_LIMITS.medium).min(1).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PatientHandoverWrite = z.infer<typeof patientHandoverWriteSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type FormOptionCreateInput = z.infer<typeof formOptionCreateSchema>;
export type FormOptionUpdateInput = z.infer<typeof formOptionUpdateSchema>;

/** Normalize MR number for uniqueness and search (preserve display separately). */
export function normalizeMrNumber(display: string): string {
  return display.trim().toUpperCase().replace(/[\s\-_/]/g, '');
}
