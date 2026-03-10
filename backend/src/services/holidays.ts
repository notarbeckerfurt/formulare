export type BundeslandCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export interface HolidayDefinition {
  name: string;
  date: string;
}

const nationwide2026: HolidayDefinition[] = [
  { name: 'Neujahr', date: '2026-01-01' },
  { name: 'Karfreitag', date: '2026-04-03' },
  { name: 'Ostermontag', date: '2026-04-06' },
  { name: 'Tag der Arbeit', date: '2026-05-01' },
  { name: 'Christi Himmelfahrt', date: '2026-05-14' },
  { name: 'Pfingstmontag', date: '2026-05-25' },
  { name: 'Tag der Deutschen Einheit', date: '2026-10-03' },
  { name: '1. Weihnachtstag', date: '2026-12-25' },
  { name: '2. Weihnachtstag', date: '2026-12-26' }
];

const stateSpecific2026: Record<BundeslandCode, HolidayDefinition[]> = {
  BW: [{ name: 'Heilige Drei Könige', date: '2026-01-06' }, { name: 'Fronleichnam', date: '2026-06-04' }, { name: 'Allerheiligen', date: '2026-11-01' }],
  BY: [{ name: 'Heilige Drei Könige', date: '2026-01-06' }, { name: 'Fronleichnam', date: '2026-06-04' }, { name: 'Mariä Himmelfahrt', date: '2026-08-15' }, { name: 'Allerheiligen', date: '2026-11-01' }],
  BE: [{ name: 'Internationaler Frauentag', date: '2026-03-08' }],
  BB: [{ name: 'Ostersonntag', date: '2026-04-05' }, { name: 'Pfingstsonntag', date: '2026-05-24' }, { name: 'Reformationstag', date: '2026-10-31' }],
  HB: [{ name: 'Reformationstag', date: '2026-10-31' }],
  HH: [{ name: 'Reformationstag', date: '2026-10-31' }],
  HE: [{ name: 'Fronleichnam', date: '2026-06-04' }],
  MV: [{ name: 'Internationaler Frauentag', date: '2026-03-08' }, { name: 'Reformationstag', date: '2026-10-31' }],
  NI: [{ name: 'Reformationstag', date: '2026-10-31' }],
  NW: [{ name: 'Fronleichnam', date: '2026-06-04' }, { name: 'Allerheiligen', date: '2026-11-01' }],
  RP: [{ name: 'Fronleichnam', date: '2026-06-04' }, { name: 'Allerheiligen', date: '2026-11-01' }],
  SL: [{ name: 'Fronleichnam', date: '2026-06-04' }, { name: 'Mariä Himmelfahrt', date: '2026-08-15' }, { name: 'Allerheiligen', date: '2026-11-01' }],
  SN: [{ name: 'Reformationstag', date: '2026-10-31' }, { name: 'Buß- und Bettag', date: '2026-11-18' }],
  ST: [{ name: 'Heilige Drei Könige', date: '2026-01-06' }, { name: 'Reformationstag', date: '2026-10-31' }],
  SH: [{ name: 'Reformationstag', date: '2026-10-31' }],
  TH: [{ name: 'Weltkindertag', date: '2026-09-20' }, { name: 'Reformationstag', date: '2026-10-31' }]
};

export function getHolidaysForState(bundesland: BundeslandCode): HolidayDefinition[] {
  const stateHolidays = stateSpecific2026[bundesland] || [];
  return [...nationwide2026, ...stateHolidays].sort((a, b) => a.date.localeCompare(b.date));
}

export const holidaysByState2026 = Object.fromEntries(
  (Object.keys(stateSpecific2026) as BundeslandCode[]).map((code) => [code, getHolidaysForState(code)])
) as Record<BundeslandCode, HolidayDefinition[]>;
