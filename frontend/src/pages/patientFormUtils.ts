import type { PatientHandoverWrite } from '@/shared';

export type PatientFormValues = PatientHandoverWrite & { version?: number };

export function emptyPatientForm(outgoingNurse = ''): PatientFormValues {
  return {
    handoverAt: new Date().toISOString().slice(0, 16),
    shift: 'Day',
    hospitalUnit: '',
    ward: '',
    room: '',
    bedNumber: '',
    outgoingNurse,
    incomingNurse: '',
    handoverStatus: 'draft',
    generalHandoverNote: '',
    patientName: '',
    mrNumberDisplay: '',
    admissionAt: '',
    sex: '',
    age: '',
    nationality: '',
    chiefComplaints: '',
    medicalHistory: '',
    surgicalHistory: '',
    admissionNote: '',
    assessment: {
      lastBowelOpenedAt: '',
      acuity: '',
      bradenScore: '',
      fallScore: '',
      gcs: '',
      bisScore: '',
      painScore: '',
    },
    vitalSigns: [],
    infusions: [],
    feedNotes: '',
    intakeOutput: [],
    diagnosticTests: [],
    bloodResults: [],
    microbiology: [],
    bloodProducts: [],
    ventilation: {
      type: '',
      o2: '',
      peep: '',
      fio2: '',
      tv: '',
      rr: '',
      ti: '',
      mv: '',
      pcPs: '',
      recordedAt: '',
      notes: '',
    },
    linesDevices: [],
    pendingItems: '',
    todaysPlan: '',
  };
}

function toLocalInput(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function patientToFormValues(item: Record<string, unknown>, fallbackNurse = ''): PatientFormValues {
  const base = emptyPatientForm(fallbackNurse);
  const assessment = (item.assessment as Record<string, unknown> | undefined) ?? {};
  const ventilation = (item.ventilation as Record<string, unknown> | undefined) ?? {};

  return {
    ...base,
    handoverAt: toLocalInput(item.handoverAt) || base.handoverAt,
    shift: String(item.shift ?? base.shift ?? ''),
    hospitalUnit: String(item.hospitalUnit ?? ''),
    ward: String(item.ward ?? ''),
    room: String(item.room ?? ''),
    bedNumber: String(item.bedNumber ?? ''),
    outgoingNurse: String(item.outgoingNurse ?? fallbackNurse),
    incomingNurse: String(item.incomingNurse ?? ''),
    handoverStatus: (item.handoverStatus as PatientFormValues['handoverStatus']) ?? 'draft',
    generalHandoverNote: String(item.generalHandoverNote ?? ''),
    patientName: String(item.patientName ?? ''),
    mrNumberDisplay: String(item.mrNumberDisplay ?? ''),
    admissionAt: toLocalInput(item.admissionAt),
    sex: String(item.sex ?? ''),
    age: String(item.age ?? ''),
    nationality: String(item.nationality ?? ''),
    chiefComplaints: String(item.chiefComplaints ?? ''),
    medicalHistory: String(item.medicalHistory ?? ''),
    surgicalHistory: String(item.surgicalHistory ?? ''),
    admissionNote: String(item.admissionNote ?? ''),
    assessment: {
      lastBowelOpenedAt: toLocalInput(assessment.lastBowelOpenedAt),
      acuity: String(assessment.acuity ?? ''),
      bradenScore: String(assessment.bradenScore ?? ''),
      fallScore: String(assessment.fallScore ?? ''),
      gcs: String(assessment.gcs ?? ''),
      bisScore: String(assessment.bisScore ?? ''),
      painScore: String(assessment.painScore ?? ''),
    },
    vitalSigns: Array.isArray(item.vitalSigns)
      ? (item.vitalSigns as Record<string, unknown>[]).map((row) => ({
          recordedAt: toLocalInput(row.recordedAt),
          bloodPressure: String(row.bloodPressure ?? ''),
          heartRate: String(row.heartRate ?? ''),
          respiration: String(row.respiration ?? ''),
          pulse: String(row.pulse ?? ''),
          spo2: String(row.spo2 ?? ''),
          painScore: String(row.painScore ?? ''),
        }))
      : [],
    infusions: Array.isArray(item.infusions)
      ? (item.infusions as Record<string, unknown>[]).map((row) => ({
          name: String(row.name ?? ''),
          mcg: String(row.mcg ?? ''),
          mlPerHour: String(row.mlPerHour ?? ''),
        }))
      : [],
    feedNotes: String(item.feedNotes ?? ''),
    intakeOutput: Array.isArray(item.intakeOutput)
      ? (item.intakeOutput as Record<string, unknown>[]).map((row) => ({
          intake: String(row.intake ?? ''),
          output: String(row.output ?? ''),
          balance: String(row.balance ?? ''),
          urineCountOutput: String(row.urineCountOutput ?? ''),
          stoolCount: String(row.stoolCount ?? ''),
          otherOutput: String(row.otherOutput ?? ''),
          recordedAt: toLocalInput(row.recordedAt),
        }))
      : [],
    diagnosticTests: Array.isArray(item.diagnosticTests)
      ? (item.diagnosticTests as Record<string, unknown>[]).map((row) => ({
          test: String(row.test ?? ''),
          type: String(row.type ?? ''),
          date: toLocalInput(row.date),
          finding: String(row.finding ?? ''),
        }))
      : [],
    bloodResults: Array.isArray(item.bloodResults)
      ? (item.bloodResults as Record<string, unknown>[]).map((row) => ({
          testName: String(row.testName ?? ''),
          todayResult: String(row.todayResult ?? ''),
          referenceRange: String(row.referenceRange ?? ''),
          previousResult: String(row.previousResult ?? ''),
          previousResultDate: toLocalInput(row.previousResultDate),
          notes: String(row.notes ?? ''),
        }))
      : [],
    microbiology: Array.isArray(item.microbiology)
      ? (item.microbiology as Record<string, unknown>[]).map((row) => ({
          testSpecimen: String(row.testSpecimen ?? ''),
          date: toLocalInput(row.date),
          result: String(row.result ?? ''),
          notes: String(row.notes ?? ''),
        }))
      : [],
    bloodProducts: Array.isArray(item.bloodProducts)
      ? (item.bloodProducts as Record<string, unknown>[]).map((row) => ({
          productName: String(row.productName ?? ''),
          unitsToday: String(row.unitsToday ?? ''),
          totalUnits: String(row.totalUnits ?? ''),
          notes: String(row.notes ?? ''),
        }))
      : [],
    ventilation: {
      type: String(ventilation.type ?? ''),
      o2: String(ventilation.o2 ?? ''),
      peep: String(ventilation.peep ?? ''),
      fio2: String(ventilation.fio2 ?? ''),
      tv: String(ventilation.tv ?? ''),
      rr: String(ventilation.rr ?? ''),
      ti: String(ventilation.ti ?? ''),
      mv: String(ventilation.mv ?? ''),
      pcPs: String(ventilation.pcPs ?? ''),
      recordedAt: toLocalInput(ventilation.recordedAt),
      notes: String(ventilation.notes ?? ''),
    },
    linesDevices: Array.isArray(item.linesDevices)
      ? (item.linesDevices as Record<string, unknown>[]).map((row) => ({
          type: String(row.type ?? ''),
          size: String(row.size ?? ''),
          insertionDate: toLocalInput(row.insertionDate),
          lastDressingDate: toLocalInput(row.lastDressingDate),
          duration: String(row.duration ?? ''),
          notes: String(row.notes ?? ''),
        }))
      : [],
    pendingItems: String(item.pendingItems ?? ''),
    todaysPlan: String(item.todaysPlan ?? ''),
    version: typeof item.version === 'number' ? item.version : undefined,
  };
}

export function toApiPayload(values: PatientFormValues) {
  const { version: _version, ...rest } = values;
  const toIso = (v?: string) => {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  };

  return {
    ...rest,
    handoverAt: toIso(rest.handoverAt),
    admissionAt: toIso(rest.admissionAt),
    assessment: {
      ...rest.assessment,
      lastBowelOpenedAt: toIso(rest.assessment?.lastBowelOpenedAt),
    },
    vitalSigns: (rest.vitalSigns ?? []).map((row) => ({
      ...row,
      recordedAt: toIso(row.recordedAt),
    })),
    intakeOutput: (rest.intakeOutput ?? []).map((row) => ({
      ...row,
      recordedAt: toIso(row.recordedAt),
    })),
    diagnosticTests: (rest.diagnosticTests ?? []).map((row) => ({
      ...row,
      date: toIso(row.date),
    })),
    bloodResults: (rest.bloodResults ?? []).map((row) => ({
      ...row,
      previousResultDate: toIso(row.previousResultDate),
    })),
    microbiology: (rest.microbiology ?? []).map((row) => ({
      ...row,
      date: toIso(row.date),
    })),
    ventilation: {
      ...rest.ventilation,
      recordedAt: toIso(rest.ventilation?.recordedAt),
    },
    linesDevices: (rest.linesDevices ?? []).map((row) => ({
      ...row,
      insertionDate: toIso(row.insertionDate),
      lastDressingDate: toIso(row.lastDressingDate),
    })),
  };
}
