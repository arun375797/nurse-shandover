import type { PatientHandoverWrite } from '@bedsiderelay/shared';

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapVital(row: PatientHandoverWrite['vitalSigns'][number]) {
  return {
    ...row,
    recordedAt: parseDate(row.recordedAt),
  };
}

function mapIo(row: PatientHandoverWrite['intakeOutput'][number]) {
  return {
    ...row,
    recordedAt: parseDate(row.recordedAt),
  };
}

function mapDiag(row: PatientHandoverWrite['diagnosticTests'][number]) {
  return {
    ...row,
    date: parseDate(row.date),
  };
}

function mapBlood(row: PatientHandoverWrite['bloodResults'][number]) {
  return {
    ...row,
    previousResultDate: parseDate(row.previousResultDate),
  };
}

function mapMicro(row: PatientHandoverWrite['microbiology'][number]) {
  return {
    ...row,
    date: parseDate(row.date),
  };
}

function mapLine(row: PatientHandoverWrite['linesDevices'][number]) {
  return {
    ...row,
    insertionDate: parseDate(row.insertionDate),
    lastDressingDate: parseDate(row.lastDressingDate),
  };
}

/** Whitelist mapped clinical fields for create/update — never pass raw req.body. */
export function mapPatientPayload(input: PatientHandoverWrite) {
  return {
    handoverAt: parseDate(input.handoverAt),
    shift: input.shift,
    hospitalUnit: input.hospitalUnit,
    ward: input.ward,
    room: input.room,
    bedNumber: input.bedNumber,
    outgoingNurse: input.outgoingNurse,
    incomingNurse: input.incomingNurse,
    handoverStatus: input.handoverStatus,
    generalHandoverNote: input.generalHandoverNote,

    patientName: input.patientName,
    mrNumberDisplay: input.mrNumberDisplay,
    admissionAt: parseDate(input.admissionAt),
    sex: input.sex,
    age: input.age,
    nationality: input.nationality,
    chiefComplaints: input.chiefComplaints,
    medicalHistory: input.medicalHistory,
    surgicalHistory: input.surgicalHistory,
    admissionNote: input.admissionNote,

    assessment: {
      ...input.assessment,
      lastBowelOpenedAt: parseDate(input.assessment?.lastBowelOpenedAt),
    },
    vitalSigns: (input.vitalSigns ?? []).map(mapVital),
    infusions: input.infusions ?? [],
    feedNotes: input.feedNotes,
    intakeOutput: (input.intakeOutput ?? []).map(mapIo),
    diagnosticTests: (input.diagnosticTests ?? []).map(mapDiag),
    bloodResults: (input.bloodResults ?? []).map(mapBlood),
    microbiology: (input.microbiology ?? []).map(mapMicro),
    bloodProducts: input.bloodProducts ?? [],
    ventilation: {
      ...input.ventilation,
      recordedAt: parseDate(input.ventilation?.recordedAt),
    },
    linesDevices: (input.linesDevices ?? []).map(mapLine),
    pendingItems: input.pendingItems,
    todaysPlan: input.todaysPlan,
  };
}

export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
