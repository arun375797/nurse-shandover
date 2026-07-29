import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const vitalSignRowSchema = new Schema(
  {
    recordedAt: { type: Date },
    bloodPressure: { type: String, maxlength: 120 },
    heartRate: { type: String, maxlength: 120 },
    respiration: { type: String, maxlength: 120 },
    pulse: { type: String, maxlength: 120 },
    spo2: { type: String, maxlength: 120 },
    painScore: { type: String, maxlength: 120 },
  },
  { _id: false },
);

const infusionRowSchema = new Schema(
  {
    name: { type: String, maxlength: 500 },
    mcg: { type: String, maxlength: 120 },
    mlPerHour: { type: String, maxlength: 120 },
  },
  { _id: false },
);

const intakeOutputRowSchema = new Schema(
  {
    intake: { type: String, maxlength: 120 },
    output: { type: String, maxlength: 120 },
    balance: { type: String, maxlength: 120 },
    urineCountOutput: { type: String, maxlength: 120 },
    stoolCount: { type: String, maxlength: 120 },
    otherOutput: { type: String, maxlength: 120 },
    recordedAt: { type: Date },
  },
  { _id: false },
);

const diagnosticTestRowSchema = new Schema(
  {
    test: { type: String, maxlength: 500 },
    type: { type: String, maxlength: 500 },
    date: { type: Date },
    finding: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const bloodResultRowSchema = new Schema(
  {
    testName: { type: String, maxlength: 500 },
    todayResult: { type: String, maxlength: 500 },
    referenceRange: { type: String, maxlength: 500 },
    previousResult: { type: String, maxlength: 500 },
    previousResultDate: { type: Date },
    notes: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const microbiologyRowSchema = new Schema(
  {
    testSpecimen: { type: String, maxlength: 500 },
    date: { type: Date },
    result: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const bloodProductRowSchema = new Schema(
  {
    productName: { type: String, maxlength: 500 },
    unitsToday: { type: String, maxlength: 120 },
    totalUnits: { type: String, maxlength: 120 },
    notes: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const lineDeviceRowSchema = new Schema(
  {
    type: { type: String, maxlength: 500 },
    size: { type: String, maxlength: 120 },
    insertionDate: { type: Date },
    lastDressingDate: { type: Date },
    duration: { type: String, maxlength: 120 },
    notes: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const ventilationSchema = new Schema(
  {
    type: { type: String, maxlength: 500 },
    o2: { type: String, maxlength: 120 },
    peep: { type: String, maxlength: 120 },
    fio2: { type: String, maxlength: 120 },
    tv: { type: String, maxlength: 120 },
    rr: { type: String, maxlength: 120 },
    ti: { type: String, maxlength: 120 },
    mv: { type: String, maxlength: 120 },
    pcPs: { type: String, maxlength: 120 },
    recordedAt: { type: Date },
    notes: { type: String, maxlength: 5000 },
  },
  { _id: false },
);

const assessmentSchema = new Schema(
  {
    lastBowelOpenedAt: { type: Date },
    acuity: { type: String, maxlength: 120 },
    bradenScore: { type: String, maxlength: 120 },
    fallScore: { type: String, maxlength: 120 },
    gcs: { type: String, maxlength: 120 },
    bisScore: { type: String, maxlength: 120 },
    painScore: { type: String, maxlength: 120 },
  },
  { _id: false },
);

const patientHandoverSchema = new Schema(
  {
    handoverAt: { type: Date },
    shift: { type: String, maxlength: 120 },
    hospitalUnit: { type: String, maxlength: 500 },
    ward: { type: String, maxlength: 120 },
    room: { type: String, maxlength: 120 },
    bedNumber: { type: String, maxlength: 120 },
    outgoingNurse: { type: String, maxlength: 200 },
    incomingNurse: { type: String, maxlength: 200 },
    handoverStatus: {
      type: String,
      enum: ['draft', 'ready', 'acknowledged'],
      default: 'draft',
    },
    generalHandoverNote: { type: String, maxlength: 5000 },

    patientName: { type: String, required: true, trim: true, maxlength: 200 },
    mrNumberDisplay: { type: String, required: true, trim: true, maxlength: 64 },
    mrNumberNormalized: { type: String, required: true, trim: true, maxlength: 64 },
    admissionAt: { type: Date },
    sex: { type: String, maxlength: 120 },
    age: { type: String, maxlength: 120 },
    nationality: { type: String, maxlength: 120 },
    chiefComplaints: { type: String, maxlength: 5000 },
    medicalHistory: { type: String, maxlength: 5000 },
    surgicalHistory: { type: String, maxlength: 5000 },
    admissionNote: { type: String, maxlength: 5000 },

    assessment: { type: assessmentSchema, default: () => ({}) },
    vitalSigns: { type: [vitalSignRowSchema], default: [] },
    infusions: { type: [infusionRowSchema], default: [] },
    feedNotes: { type: String, maxlength: 5000 },
    intakeOutput: { type: [intakeOutputRowSchema], default: [] },
    diagnosticTests: { type: [diagnosticTestRowSchema], default: [] },
    bloodResults: { type: [bloodResultRowSchema], default: [] },
    microbiology: { type: [microbiologyRowSchema], default: [] },
    bloodProducts: { type: [bloodProductRowSchema], default: [] },
    ventilation: { type: ventilationSchema, default: () => ({}) },
    linesDevices: { type: [lineDeviceRowSchema], default: [] },
    pendingItems: { type: String, maxlength: 5000 },
    todaysPlan: { type: String, maxlength: 5000 },

    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'ready', 'acknowledged', 'archived'],
      default: 'draft',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

patientHandoverSchema.index(
  { unitId: 1, mrNumberNormalized: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'archived' } },
  },
);
patientHandoverSchema.index({ unitId: 1, updatedAt: -1 });
patientHandoverSchema.index({ unitId: 1, patientName: 1 });

export type PatientHandoverDocument = InferSchemaType<typeof patientHandoverSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PatientHandover: Model<PatientHandoverDocument> =
  mongoose.models.PatientHandover ??
  mongoose.model<PatientHandoverDocument>('PatientHandover', patientHandoverSchema);
