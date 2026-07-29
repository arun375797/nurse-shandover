import { Unit, type UnitDocument } from '../models/Unit.js';
import { escapeRegex } from './patientMapper.js';

function unitCodeFromName(name: string): string {
  const parts = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const code = parts.join('-').slice(0, 32);
  return code || 'UNIT';
}

async function uniqueUnitCode(base: string): Promise<string> {
  let code = base.slice(0, 32);
  let suffix = 2;

  while (await Unit.exists({ code })) {
    const suffixText = `-${suffix}`;
    code = `${base.slice(0, 32 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return code;
}

export async function findOrCreateUnit(unitName: string): Promise<UnitDocument> {
  const name = unitName.trim();
  const escaped = escapeRegex(name);

  const existing = await Unit.findOne({
    active: true,
    name: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });

  if (existing) {
    return existing;
  }

  const code = await uniqueUnitCode(unitCodeFromName(name));
  return Unit.create({ name, code, active: true });
}
