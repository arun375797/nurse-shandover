/**
 * Hospital-configurable terminology and suggested options.
 * Staff can update these values without rewriting form components.
 */
export const SHIFTS = ['Day', 'Evening', 'Night'] as const;

export const HANDOVER_STATUSES = ['draft', 'ready', 'acknowledged'] as const;

export const PATIENT_LIST_STATUSES = [
  'draft',
  'ready',
  'acknowledged',
  'archived',
] as const;

export const SEX_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say'] as const;

export const NATIONALITY_OPTIONS = [
  'Indian',
  'Nepalese',
  'Bangladeshi',
  'Sri Lankan',
  'Other',
] as const;

export const ACUITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;

export const DIAGNOSTIC_TEST_OPTIONS = [
  'X-ray',
  'MRI',
  'CT',
  'ECHO',
  'ECG',
  'USG',
  'Other',
] as const;

export const BLOOD_RESULT_TEST_OPTIONS = [
  'CBC',
  'TFT',
  'LFT',
  'Electrolytes',
  'Troponin I',
  'Cardiac enzymes',
  'RFT',
  'Other',
] as const;

export const MICROBIOLOGY_OPTIONS = [
  'MRSA',
  'Fungal',
  'COVID-19',
  'Influenza',
  'Pus culture',
  'Blood culture',
  'Urine culture',
  'Sputum culture',
  'Other',
] as const;

export const BLOOD_PRODUCT_OPTIONS = ['PRBC', 'FFP', 'Platelets', 'Other'] as const;

export const VENTILATION_TYPE_OPTIONS = [
  'Room air',
  'O₂ mask',
  'Nasal cannula',
  'BiPAP',
  'CPAP',
  'High flow',
  'Ventilator',
  'Other',
] as const;

/** Configurable — exact clinical term should be confirmed by the hospital. */
export const LINE_DEVICE_OPTIONS = [
  'Central line',
  'Peripheral line',
  'PEG tube',
  'ET tube',
  'T/TT tube',
  'OGT',
  'NGT',
  'Chest tube',
  'Other',
] as const;

export const INFUSION_NAME_OPTIONS = [
  'Noradrenaline',
  'Adrenaline',
  'Dobamine',
  'Insulin',
  'Heparin',
  'Sedation',
  'Other',
] as const;

/** Label for urine field — configurable because source terminology may vary. */
export const URINE_FIELD_LABEL = 'Urine count/output';

export const STRING_LIMITS = {
  short: 120,
  medium: 500,
  long: 5000,
  name: 200,
  mrNumber: 64,
  email: 254,
  unitCode: 32,
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

/** Categories for admin-managed nurse form dropdown suggestions. */
export const FORM_OPTION_CATEGORIES = [
  { key: 'sex', label: 'Sex' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'acuity', label: 'Acuity' },
  { key: 'diagnostic_test', label: 'Diagnostic Tests' },
  { key: 'blood_result_test', label: 'Blood Result Tests' },
  { key: 'microbiology', label: 'Microbiology' },
  { key: 'blood_product', label: 'Blood Products' },
  { key: 'ventilation_type', label: 'Ventilation Types' },
  { key: 'line_device', label: 'Lines & Devices' },
  { key: 'infusion_name', label: 'Infusion Names' },
] as const;

export type FormOptionCategory = (typeof FORM_OPTION_CATEGORIES)[number]['key'];

export const FORM_OPTION_CATEGORY_KEYS = FORM_OPTION_CATEGORIES.map((c) => c.key) as [
  FormOptionCategory,
  ...FormOptionCategory[],
];

/** Default option values per category — used for seeding and client-side fallback. */
export const DEFAULT_FORM_OPTIONS: Record<FormOptionCategory, readonly string[]> = {
  sex: SEX_OPTIONS,
  nationality: NATIONALITY_OPTIONS,
  acuity: ACUITY_OPTIONS,
  diagnostic_test: DIAGNOSTIC_TEST_OPTIONS,
  blood_result_test: BLOOD_RESULT_TEST_OPTIONS,
  microbiology: MICROBIOLOGY_OPTIONS,
  blood_product: BLOOD_PRODUCT_OPTIONS,
  ventilation_type: VENTILATION_TYPE_OPTIONS,
  line_device: LINE_DEVICE_OPTIONS,
  infusion_name: INFUSION_NAME_OPTIONS,
};
