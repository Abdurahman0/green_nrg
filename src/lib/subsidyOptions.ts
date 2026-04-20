export interface SubsidyOption {
  value: string;
  labelKey: string;
}

export const panelTypeOptions: SubsidyOption[] = [
  { value: 'jinko_ja_solar', labelKey: 'home.subsidy.panel.jinkoJaSolar' },
  { value: 'longi_hi_mo_x10', labelKey: 'home.subsidy.panel.longiHiMoX10' },
];

export const inverterTypeOptions: SubsidyOption[] = [
  { value: 'deye', labelKey: 'home.subsidy.inverter.deye' },
  { value: 'solax', labelKey: 'home.subsidy.inverter.solax' },
];

export const requestedPowerOptions: SubsidyOption[] = [
  { value: '10', labelKey: 'home.subsidy.power.10' },
  { value: '15', labelKey: 'home.subsidy.power.15' },
  { value: '20', labelKey: 'home.subsidy.power.20' },
  { value: '30', labelKey: 'home.subsidy.power.30' },
  { value: '50', labelKey: 'home.subsidy.power.50' },
];
