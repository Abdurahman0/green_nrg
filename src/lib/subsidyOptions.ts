export interface SubsidyOption {
  value: string;
  labelKey: string;
}

export const panelTypeOptions: SubsidyOption[] = [
  { value: 'monocrystalline', labelKey: 'home.subsidy.panel.monocrystalline' },
  { value: 'polycrystalline', labelKey: 'home.subsidy.panel.polycrystalline' },
  { value: 'thin-film', labelKey: 'home.subsidy.panel.thinFilm' },
];

export const inverterTypeOptions: SubsidyOption[] = [
  { value: 'string', labelKey: 'home.subsidy.inverter.string' },
  { value: 'hybrid', labelKey: 'home.subsidy.inverter.hybrid' },
  { value: 'on-grid', labelKey: 'home.subsidy.inverter.onGrid' },
  { value: 'off-grid', labelKey: 'home.subsidy.inverter.offGrid' },
];
