import {
  DEFAULT_FORM_OPTIONS,
  FORM_OPTION_CATEGORIES,
  type FormOptionCategory,
} from '../shared/index.js';
import { FormOption } from '../models/FormOption.js';

export async function seedDefaultFormOptions() {
  for (const { key } of FORM_OPTION_CATEGORIES) {
    const defaults = DEFAULT_FORM_OPTIONS[key as FormOptionCategory];
    for (let i = 0; i < defaults.length; i++) {
      await FormOption.findOneAndUpdate(
        { category: key, value: defaults[i] },
        { category: key, value: defaults[i], sortOrder: i, active: true },
        { upsert: true, new: true },
      );
    }
  }
}

export async function getFormOptionsGrouped(activeOnly = true) {
  const filter = activeOnly ? { active: true } : {};
  const options = await FormOption.find(filter)
    .sort({ category: 1, sortOrder: 1, value: 1 })
    .lean();

  const grouped: Record<string, string[]> = {};
  for (const { key } of FORM_OPTION_CATEGORIES) {
    grouped[key] = [];
  }

  for (const opt of options) {
    if (!grouped[opt.category]) grouped[opt.category] = [];
    grouped[opt.category].push(opt.value);
  }

  return grouped;
}

export async function getFormOptionsAdmin() {
  const options = await FormOption.find()
    .sort({ category: 1, sortOrder: 1, value: 1 })
    .lean();

  return options.map((opt) => ({
    id: opt._id.toString(),
    category: opt.category,
    value: opt.value,
    sortOrder: opt.sortOrder,
    active: opt.active,
    createdAt: opt.createdAt,
    updatedAt: opt.updatedAt,
  }));
}
