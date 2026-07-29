import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HANDOVER_STATUSES,
  SHIFTS,
  URINE_FIELD_LABEL,
  patientHandoverWriteSchema,
} from '@bedsiderelay/shared';
import {
  deletePatient,
  createPatient,
  fetchPatient,
  updatePatient,
} from '../api/patients';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppFooter, AppHeader } from '../components/Layout';
import { CreatableCombobox } from '../components/CreatableCombobox';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SectionJumpNav } from '../components/SectionJumpNav';
import { useFormOptions } from '../hooks/useFormOptions';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../utils/format';
import {
  emptyPatientForm,
  patientToFormValues,
  toApiPayload,
  type PatientFormValues,
} from './patientFormUtils';

const SECTIONS = [
  { id: 'metadata', label: 'Handover Metadata' },
  { id: 'patient', label: 'Patient & Admission' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'vitals', label: 'Vital Signs' },
  { id: 'infusions', label: 'Infusions & I/O' },
  { id: 'diagnostics', label: 'Diagnostic Tests' },
  { id: 'blood', label: 'Blood Results' },
  { id: 'micro', label: 'Microbiology' },
  { id: 'products', label: 'Blood Products' },
  { id: 'ventilation', label: 'Ventilation' },
  { id: 'lines', label: 'Lines & Devices' },
  { id: 'plan', label: 'Pending & Plan' },
] as const;

export function PatientFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, unit, timezone } = useAuth();
  const { pushToast } = useToast();
  const { getOptions } = useFormOptions();
  const [section, setSection] = useState<string>('metadata');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const formTopRef = useRef<HTMLFormElement>(null);

  const detailQuery = useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchPatient(id!),
    enabled: !isNew,
  });

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientHandoverWriteSchema),
    defaultValues: emptyPatientForm(user?.fullName ?? ''),
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
    setFocus,
  } = form;

  useEffect(() => {
    if (isNew && user) {
      reset({
        ...emptyPatientForm(user.fullName),
        hospitalUnit: unit?.name ?? '',
        outgoingNurse: user.fullName,
      });
    }
  }, [isNew, user, unit, reset]);

  useEffect(() => {
    if (detailQuery.data?.item) {
      reset(patientToFormValues(detailQuery.data.item as Record<string, unknown>, user?.fullName));
    }
  }, [detailQuery.data, reset, user?.fullName]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const vitals = useFieldArray({ control, name: 'vitalSigns' });
  const infusions = useFieldArray({ control, name: 'infusions' });
  const intakeOutput = useFieldArray({ control, name: 'intakeOutput' });
  const diagnostics = useFieldArray({ control, name: 'diagnosticTests' });
  const bloodResults = useFieldArray({ control, name: 'bloodResults' });
  const microbiology = useFieldArray({ control, name: 'microbiology' });
  const bloodProducts = useFieldArray({ control, name: 'bloodProducts' });
  const linesDevices = useFieldArray({ control, name: 'linesDevices' });

  const saveMutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      const payload = toApiPayload(values);
      if (isNew) {
        return createPatient(payload);
      }

      const fromForm = values.version;
      const fromServer = detailQuery.data?.item?.version;
      const version =
        typeof fromForm === 'number' && Number.isInteger(fromForm)
          ? fromForm
          : typeof fromServer === 'number' && Number.isInteger(fromServer)
            ? fromServer
            : undefined;

      if (version === undefined) {
        throw new ApiError(
          400,
          'VALIDATION',
          'Missing record version. Reload the patient and try again.',
        );
      }

      return updatePatient(id!, { ...payload, version });
    },
    onSuccess: async () => {
      setConflictMessage(null);
      pushToast('Patient handover saved.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (!isNew) {
        await queryClient.invalidateQueries({ queryKey: ['patient', id] });
      }
      navigate('/');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
        setConflictMessage(err.message);
        return;
      }
      if (err instanceof ApiError && err.code === 'DUPLICATE_MR') {
        pushToast(err.message, 'error');
        return;
      }
      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        pushToast(err.message, 'error');
        return;
      }
      pushToast(err instanceof ApiError ? err.message : 'Save failed.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: async () => {
      pushToast('Patient archived.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate('/');
    },
    onError: (err) => {
      pushToast(err instanceof ApiError ? err.message : 'Delete failed.', 'error');
    },
  });

  const meta = useMemo(() => {
    const item = detailQuery.data?.item;
    if (!item) return null;
    return {
      updatedAt: item.updatedAt,
      updatedBy: String(item.updatedBy ?? ''),
    };
  }, [detailQuery.data]);

  const patientName = form.watch('patientName');
  const mrNumber = form.watch('mrNumberDisplay');

  async function onInvalid() {
    const order: Array<keyof PatientFormValues> = ['patientName', 'mrNumberDisplay'];
    for (const key of order) {
      if (errors[key]) {
        setFocus(key);
        break;
      }
    }
  }

  if (!isNew && detailQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto max-w-7xl flex-1 p-8">Loading patient…</main>
        <AppFooter />
      </div>
    );
  }

  if (!isNew && detailQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto max-w-7xl flex-1 p-8">
          <p className="text-red-800" role="alert">
            Unable to load patient.
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => void detailQuery.refetch()}>
            Retry
          </button>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="page-shell flex-1 pb-28">
        <div className="mb-6">
          <h1 className="page-title">
            {isNew ? 'Add Patient Handover' : 'Edit Patient Handover'}
          </h1>
          <p className="page-subtitle">
            Information is sent only when you click Save Patient.
          </p>
          {meta ? (
            <p className="mt-2 text-sm text-slate-600">
              Last updated at {formatDateTime(meta.updatedAt, timezone)}
              {meta.updatedBy ? ` · Last updated by user ${meta.updatedBy.slice(-6)}` : ''}
            </p>
          ) : null}
        </div>

        {conflictMessage ? (
          <div className="mb-4 rounded-md border border-amber-400 bg-amber-50 px-4 py-3 text-amber-950" role="alert">
            <p className="font-semibold">Simultaneous edit conflict</p>
            <p className="mt-1">{conflictMessage}</p>
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => void detailQuery.refetch().then(() => setConflictMessage(null))}
            >
              Reload latest version
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="hidden lg:block" aria-label="Form sections">
            <ul className="sticky top-4 space-y-1 rounded-lg border border-slate-200 bg-white p-3">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block rounded-md px-3 py-2 text-sm font-medium ${
                      section === s.id ? 'bg-teal-50 text-teal-700' : 'text-navy-800 hover:bg-slate-50'
                    }`}
                    onClick={() => setSection(s.id)}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <form
            ref={formTopRef}
            className="space-y-8"
            onSubmit={handleSubmit(async (values) => {
              try {
                await saveMutation.mutateAsync(values);
              } catch {
                // Error UI is handled in mutation onError.
              }
            }, onInvalid)}
            noValidate
          >
            {!isNew ? <input type="hidden" {...register('version', { valueAsNumber: true })} /> : null}
            <fieldset id="metadata" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">
                Handover Metadata
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="handoverAt" className="field-label">
                    Handover date and time
                  </label>
                  <input id="handoverAt" type="datetime-local" className="field-input" {...register('handoverAt')} />
                </div>
                <Controller
                  control={control}
                  name="shift"
                  render={({ field }) => (
                    <CreatableCombobox
                      label="Shift"
                      options={SHIFTS}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                <div>
                  <label htmlFor="hospitalUnit" className="field-label">
                    Hospital unit / department
                  </label>
                  <input id="hospitalUnit" className="field-input" {...register('hospitalUnit')} />
                </div>
                <div>
                  <label htmlFor="ward" className="field-label">
                    Ward
                  </label>
                  <input id="ward" className="field-input" {...register('ward')} />
                </div>
                <div>
                  <label htmlFor="room" className="field-label">
                    Room
                  </label>
                  <input id="room" className="field-input" {...register('room')} />
                </div>
                <div>
                  <label htmlFor="bedNumber" className="field-label">
                    Bed number
                  </label>
                  <input id="bedNumber" className="field-input" {...register('bedNumber')} />
                </div>
                <div>
                  <label htmlFor="outgoingNurse" className="field-label">
                    Outgoing nurse
                  </label>
                  <input id="outgoingNurse" className="field-input" {...register('outgoingNurse')} />
                </div>
                <div>
                  <label htmlFor="incomingNurse" className="field-label">
                    Incoming nurse
                  </label>
                  <input id="incomingNurse" className="field-input" {...register('incomingNurse')} />
                </div>
                <div>
                  <label htmlFor="handoverStatus" className="field-label">
                    Handover status
                  </label>
                  <select id="handoverStatus" className="field-input" {...register('handoverStatus')}>
                    {HANDOVER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="generalHandoverNote" className="field-label">
                    General handover note
                  </label>
                  <textarea
                    id="generalHandoverNote"
                    className="field-input min-h-28 resize-y"
                    {...register('generalHandoverNote')}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset id="patient" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">
                Patient and Admission Details
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="patientName" className="field-label">
                    Patient Name
                  </label>
                  <input id="patientName" className="field-input" {...register('patientName')} />
                  {errors.patientName ? (
                    <p className="field-error">{errors.patientName.message}</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="mrNumberDisplay" className="field-label">
                    MR Number
                  </label>
                  <input id="mrNumberDisplay" className="field-input" {...register('mrNumberDisplay')} />
                  {errors.mrNumberDisplay ? (
                    <p className="field-error">{errors.mrNumberDisplay.message}</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="admissionAt" className="field-label">
                    Date and time of admission
                  </label>
                  <input id="admissionAt" type="datetime-local" className="field-input" {...register('admissionAt')} />
                </div>
                <Controller
                  control={control}
                  name="sex"
                  render={({ field }) => (
                    <CreatableCombobox label="Sex" options={getOptions('sex')} value={field.value ?? ''} onChange={field.onChange} />
                  )}
                />
                <div>
                  <label htmlFor="age" className="field-label">
                    Age
                  </label>
                  <input id="age" className="field-input" {...register('age')} />
                </div>
                <Controller
                  control={control}
                  name="nationality"
                  render={({ field }) => (
                    <CreatableCombobox
                      label="Nationality"
                      options={getOptions('nationality')}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                <div className="md:col-span-2">
                  <label htmlFor="chiefComplaints" className="field-label">
                    Chief complaints
                  </label>
                  <textarea id="chiefComplaints" className="field-input min-h-24 resize-y" {...register('chiefComplaints')} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="medicalHistory" className="field-label">
                    Medical history
                  </label>
                  <textarea id="medicalHistory" className="field-input min-h-24 resize-y" {...register('medicalHistory')} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="surgicalHistory" className="field-label">
                    Surgical history
                  </label>
                  <textarea id="surgicalHistory" className="field-input min-h-24 resize-y" {...register('surgicalHistory')} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="admissionNote" className="field-label">
                    Admission note
                  </label>
                  <textarea id="admissionNote" className="field-input min-h-24 resize-y" {...register('admissionNote')} />
                </div>
              </div>
            </fieldset>

            <fieldset id="assessment" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Assessment</legend>
              <p className="mt-2 text-sm text-slate-600">
                Enter staff-recorded values only. Scores are not calculated or interpreted by this application.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="lastBowelOpenedAt" className="field-label">
                    Last bowel opened date
                  </label>
                  <input
                    id="lastBowelOpenedAt"
                    type="datetime-local"
                    className="field-input"
                    {...register('assessment.lastBowelOpenedAt')}
                  />
                </div>
                <Controller
                  control={control}
                  name="assessment.acuity"
                  render={({ field }) => (
                    <CreatableCombobox
                      label="Acuity"
                      options={getOptions('acuity')}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                {(['bradenScore', 'fallScore', 'gcs', 'bisScore', 'painScore'] as const).map((key) => (
                  <div key={key}>
                    <label htmlFor={key} className="field-label">
                      {key === 'bradenScore'
                        ? 'Braden score'
                        : key === 'fallScore'
                          ? 'Fall score'
                          : key === 'gcs'
                            ? 'GCS'
                            : key === 'bisScore'
                              ? 'BIS score'
                              : 'Pain score'}
                    </label>
                    <input id={key} className="field-input" {...register(`assessment.${key}`)} />
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset id="vitals" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Vital Signs</legend>
              <div className="mt-4 space-y-4">
                {vitals.fields.map((field, index) => (
                  <div key={field.id} className="rounded-md border border-slate-200 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold">Reading {index + 1}</p>
                      <button type="button" className="btn-secondary" onClick={() => vitals.remove(index)}>
                        Remove Row
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="field-label" htmlFor={`vs-at-${index}`}>
                          Recorded date/time
                        </label>
                        <input id={`vs-at-${index}`} type="datetime-local" className="field-input" {...register(`vitalSigns.${index}.recordedAt`)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-bp-${index}`}>
                          Blood pressure
                        </label>
                        <input id={`vs-bp-${index}`} className="field-input" {...register(`vitalSigns.${index}.bloodPressure`)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-hr-${index}`}>
                          Heart rate
                        </label>
                        <div className="flex items-center gap-2">
                          <input id={`vs-hr-${index}`} className="field-input" {...register(`vitalSigns.${index}.heartRate`)} />
                          <span className="text-sm text-slate-600">bpm</span>
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-rr-${index}`}>
                          Respiration
                        </label>
                        <input id={`vs-rr-${index}`} className="field-input" {...register(`vitalSigns.${index}.respiration`)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-pulse-${index}`}>
                          Pulse
                        </label>
                        <input id={`vs-pulse-${index}`} className="field-input" {...register(`vitalSigns.${index}.pulse`)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-spo2-${index}`}>
                          SpO₂
                        </label>
                        <div className="flex items-center gap-2">
                          <input id={`vs-spo2-${index}`} className="field-input" {...register(`vitalSigns.${index}.spo2`)} />
                          <span className="text-sm text-slate-600">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`vs-pain-${index}`}>
                          Pain score
                        </label>
                        <input id={`vs-pain-${index}`} className="field-input" {...register(`vitalSigns.${index}.painScore`)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    vitals.append({
                      recordedAt: '',
                      bloodPressure: '',
                      heartRate: '',
                      respiration: '',
                      pulse: '',
                      spo2: '',
                      painScore: '',
                    })
                  }
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="infusions" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">
                Infusions, Feeding, and Intake/Output
              </legend>
              <div className="mt-4 space-y-4">
                {infusions.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-4">
                    <Controller
                      control={control}
                      name={`infusions.${index}.name`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Infusion name"
                          options={getOptions('infusion_name')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`inf-mcg-${index}`}>
                        mcg
                      </label>
                      <input id={`inf-mcg-${index}`} className="field-input" {...register(`infusions.${index}.mcg`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`inf-ml-${index}`}>
                        mL/hr
                      </label>
                      <input id={`inf-ml-${index}`} className="field-input" {...register(`infusions.${index}.mlPerHour`)} />
                    </div>
                    <div className="flex items-end">
                      <button type="button" className="btn-secondary w-full" onClick={() => infusions.remove(index)}>
                        Remove Row
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => infusions.append({ name: '', mcg: '', mlPerHour: '' })}
                >
                  Add Row
                </button>
                <div>
                  <label htmlFor="feedNotes" className="field-label">
                    Feed
                  </label>
                  <textarea id="feedNotes" className="field-input min-h-24 resize-y" {...register('feedNotes')} />
                </div>
                {intakeOutput.fields.map((field, index) => (
                  <div key={field.id} className="rounded-md border border-slate-200 p-3">
                    <div className="mb-3 flex justify-between">
                      <p className="font-semibold">I/O row {index + 1}</p>
                      <button type="button" className="btn-secondary" onClick={() => intakeOutput.remove(index)}>
                        Remove Row
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(['intake', 'output', 'balance', 'stoolCount', 'otherOutput'] as const).map((key) => (
                        <div key={key}>
                          <label className="field-label" htmlFor={`io-${key}-${index}`}>
                            {key === 'stoolCount' ? 'Stool count' : key === 'otherOutput' ? 'Other output' : key[0].toUpperCase() + key.slice(1)}
                          </label>
                          <input id={`io-${key}-${index}`} className="field-input" {...register(`intakeOutput.${index}.${key}`)} />
                        </div>
                      ))}
                      <div>
                        <label className="field-label" htmlFor={`io-urine-${index}`}>
                          {URINE_FIELD_LABEL}
                        </label>
                        <input id={`io-urine-${index}`} className="field-input" {...register(`intakeOutput.${index}.urineCountOutput`)} />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`io-at-${index}`}>
                          Recorded date/time
                        </label>
                        <input id={`io-at-${index}`} type="datetime-local" className="field-input" {...register(`intakeOutput.${index}.recordedAt`)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    intakeOutput.append({
                      intake: '',
                      output: '',
                      balance: '',
                      urineCountOutput: '',
                      stoolCount: '',
                      otherOutput: '',
                      recordedAt: '',
                    })
                  }
                >
                  Add I/O Row
                </button>
              </div>
            </fieldset>

            <fieldset id="diagnostics" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Diagnostic Tests</legend>
              <div className="mt-4 space-y-4">
                {diagnostics.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`diagnosticTests.${index}.test`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Diagnostic test"
                          options={getOptions('diagnostic_test')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`diag-type-${index}`}>
                        Type
                      </label>
                      <input id={`diag-type-${index}`} className="field-input" {...register(`diagnosticTests.${index}.type`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`diag-date-${index}`}>
                        Date
                      </label>
                      <input id={`diag-date-${index}`} type="datetime-local" className="field-input" {...register(`diagnosticTests.${index}.date`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`diag-finding-${index}`}>
                        Finding
                      </label>
                      <textarea id={`diag-finding-${index}`} className="field-input min-h-20 resize-y" {...register(`diagnosticTests.${index}.finding`)} />
                    </div>
                    <button type="button" className="btn-secondary md:col-span-2" onClick={() => diagnostics.remove(index)}>
                      Remove Row
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => diagnostics.append({ test: '', type: '', date: '', finding: '' })}
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="blood" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Blood Results</legend>
              <p className="mt-2 text-sm text-slate-600">
                Store results as entered text. Reference ranges are staff-entered only.
              </p>
              <div className="mt-4 space-y-4">
                {bloodResults.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`bloodResults.${index}.testName`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Test name"
                          options={getOptions('blood_result_test')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`br-today-${index}`}>
                        Today’s result
                      </label>
                      <input id={`br-today-${index}`} className="field-input" {...register(`bloodResults.${index}.todayResult`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`br-ref-${index}`}>
                        Reference range
                      </label>
                      <input id={`br-ref-${index}`} className="field-input" {...register(`bloodResults.${index}.referenceRange`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`br-prev-${index}`}>
                        Previous/other-day result
                      </label>
                      <input id={`br-prev-${index}`} className="field-input" {...register(`bloodResults.${index}.previousResult`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`br-prevdate-${index}`}>
                        Previous result date
                      </label>
                      <input id={`br-prevdate-${index}`} type="datetime-local" className="field-input" {...register(`bloodResults.${index}.previousResultDate`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`br-notes-${index}`}>
                        Notes
                      </label>
                      <textarea id={`br-notes-${index}`} className="field-input min-h-20 resize-y" {...register(`bloodResults.${index}.notes`)} />
                    </div>
                    <button type="button" className="btn-secondary md:col-span-2" onClick={() => bloodResults.remove(index)}>
                      Remove Row
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    bloodResults.append({
                      testName: '',
                      todayResult: '',
                      referenceRange: '',
                      previousResult: '',
                      previousResultDate: '',
                      notes: '',
                    })
                  }
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="micro" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Microbiology</legend>
              <div className="mt-4 space-y-4">
                {microbiology.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`microbiology.${index}.testSpecimen`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Test/specimen"
                          options={getOptions('microbiology')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`micro-date-${index}`}>
                        Date
                      </label>
                      <input id={`micro-date-${index}`} type="datetime-local" className="field-input" {...register(`microbiology.${index}.date`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`micro-result-${index}`}>
                        Result
                      </label>
                      <input id={`micro-result-${index}`} className="field-input" {...register(`microbiology.${index}.result`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`micro-notes-${index}`}>
                        Notes
                      </label>
                      <textarea id={`micro-notes-${index}`} className="field-input min-h-20 resize-y" {...register(`microbiology.${index}.notes`)} />
                    </div>
                    <button type="button" className="btn-secondary md:col-span-2" onClick={() => microbiology.remove(index)}>
                      Remove Row
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => microbiology.append({ testSpecimen: '', date: '', result: '', notes: '' })}
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="products" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Blood and Blood Products</legend>
              <div className="mt-4 space-y-4">
                {bloodProducts.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`bloodProducts.${index}.productName`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Product name"
                          options={getOptions('blood_product')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`bp-today-${index}`}>
                        Units today
                      </label>
                      <input id={`bp-today-${index}`} className="field-input" {...register(`bloodProducts.${index}.unitsToday`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`bp-total-${index}`}>
                        Total number of units
                      </label>
                      <input id={`bp-total-${index}`} className="field-input" {...register(`bloodProducts.${index}.totalUnits`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`bp-notes-${index}`}>
                        Notes
                      </label>
                      <textarea id={`bp-notes-${index}`} className="field-input min-h-20 resize-y" {...register(`bloodProducts.${index}.notes`)} />
                    </div>
                    <button type="button" className="btn-secondary md:col-span-2" onClick={() => bloodProducts.remove(index)}>
                      Remove Row
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    bloodProducts.append({ productName: '', unitsToday: '', totalUnits: '', notes: '' })
                  }
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="ventilation" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Ventilation</legend>
              <p className="mt-2 text-sm text-slate-600">
                Settings are recorded as entered. This application does not calculate or recommend ventilation settings.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Controller
                  control={control}
                  name="ventilation.type"
                  render={({ field }) => (
                    <CreatableCombobox
                      label="Ventilation type"
                      options={getOptions('ventilation_type')}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                {(
                  [
                    ['o2', 'O₂'],
                    ['peep', 'PEEP'],
                    ['fio2', 'FiO₂'],
                    ['tv', 'TV'],
                    ['rr', 'RR'],
                    ['ti', 'Ti'],
                    ['mv', 'MV'],
                    ['pcPs', 'PC/PS'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="field-label" htmlFor={`vent-${key}`}>
                      {label}
                    </label>
                    <input id={`vent-${key}`} className="field-input" {...register(`ventilation.${key}`)} />
                  </div>
                ))}
                <div>
                  <label className="field-label" htmlFor="vent-recordedAt">
                    Recorded date/time
                  </label>
                  <input id="vent-recordedAt" type="datetime-local" className="field-input" {...register('ventilation.recordedAt')} />
                </div>
                <div className="md:col-span-3">
                  <label className="field-label" htmlFor="vent-notes">
                    Notes
                  </label>
                  <textarea id="vent-notes" className="field-input min-h-24 resize-y" {...register('ventilation.notes')} />
                </div>
              </div>
            </fieldset>

            <fieldset id="lines" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Lines and Devices</legend>
              <div className="mt-4 space-y-4">
                {linesDevices.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`linesDevices.${index}.type`}
                      render={({ field: f }) => (
                        <CreatableCombobox
                          label="Line/device type"
                          options={getOptions('line_device')}
                          value={f.value ?? ''}
                          onChange={f.onChange}
                        />
                      )}
                    />
                    <div>
                      <label className="field-label" htmlFor={`line-size-${index}`}>
                        Size
                      </label>
                      <input id={`line-size-${index}`} className="field-input" {...register(`linesDevices.${index}.size`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`line-ins-${index}`}>
                        Insertion date
                      </label>
                      <input id={`line-ins-${index}`} type="datetime-local" className="field-input" {...register(`linesDevices.${index}.insertionDate`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`line-dress-${index}`}>
                        Last dressing date
                      </label>
                      <input id={`line-dress-${index}`} type="datetime-local" className="field-input" {...register(`linesDevices.${index}.lastDressingDate`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`line-dur-${index}`}>
                        Duration
                      </label>
                      <input id={`line-dur-${index}`} className="field-input" {...register(`linesDevices.${index}.duration`)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`line-notes-${index}`}>
                        Notes
                      </label>
                      <textarea id={`line-notes-${index}`} className="field-input min-h-20 resize-y" {...register(`linesDevices.${index}.notes`)} />
                    </div>
                    <button type="button" className="btn-secondary md:col-span-2" onClick={() => linesDevices.remove(index)}>
                      Remove Row
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    linesDevices.append({
                      type: '',
                      size: '',
                      insertionDate: '',
                      lastDressingDate: '',
                      duration: '',
                      notes: '',
                    })
                  }
                >
                  Add Row
                </button>
              </div>
            </fieldset>

            <fieldset id="plan" className="rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <legend className="px-2 font-display text-lg font-bold text-navy-900">Pending Items and Plan</legend>
              <div className="mt-4 grid gap-4">
                <div>
                  <label htmlFor="pendingItems" className="field-label">
                    Pending items
                  </label>
                  <textarea id="pendingItems" className="field-input min-h-28 resize-y" {...register('pendingItems')} />
                </div>
                <div>
                  <label htmlFor="todaysPlan" className="field-label">
                    Today’s plan
                  </label>
                  <textarea id="todaysPlan" className="field-input min-h-28 resize-y" {...register('todaysPlan')} />
                </div>
              </div>
            </fieldset>

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) {
                        return;
                      }
                      navigate('/');
                    }}
                  >
                    Cancel
                  </button>
                  {!isNew ? (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setConfirmDelete(true)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete Patient
                    </button>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || saveMutation.isPending}
                >
                  {isSubmitting || saveMutation.isPending ? 'Saving…' : 'Save Patient'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <AppFooter />

      <SectionJumpNav sections={SECTIONS} section={section} onSectionChange={setSection} />

      <ConfirmDialog
        open={confirmDelete}
        title="Archive patient?"
        message={`Archive this handover?\n\nPatient: ${patientName || '—'}\nMR Number: ${mrNumber || '—'}\n\nThe record will be hidden from the active list. An admin can restore it later.`}
        confirmLabel="Delete Permanently"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void deleteMutation.mutateAsync();
        }}
      />
    </div>
  );
}
