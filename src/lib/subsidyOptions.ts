export interface SubsidyOption {
  value: string;
  label: string;
}

export const panelTypeOptions: SubsidyOption[] = [
  { value: 'jinko_ja_solar', label: 'Jinko / JA Solar' },
  { value: 'longi_hi_mo_x10', label: 'Longi HI MO X10' },
];

export const inverterTypeOptions: SubsidyOption[] = [
  { value: 'deye', label: 'Deye' },
  { value: 'solax', label: 'Solax' },
];

export const requestedPowerOptions: SubsidyOption[] = [
  { value: '10', label: '10' },
  { value: '15', label: '15' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
];
