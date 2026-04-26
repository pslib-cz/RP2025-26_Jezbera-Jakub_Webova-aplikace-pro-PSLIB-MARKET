export type SaleStatusFilter = 'available' | 'reserved' | 'reservedByMe'

export type SidebarFilters = {
  minPrice: number | null
  maxPrice: number | null
  subjects: string[]
  conditions: number[]
  saleStatuses: SaleStatusFilter[]
}

export const createEmptyFilters = (): SidebarFilters => ({
  minPrice: null,
  maxPrice: null,
  subjects: [],
  conditions: [],
  saleStatuses: [],
})

export const normalizeSubject = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

export const getSubjectClass = (subject: string, styles: Record<string, string>) => {
  const normalized = normalizeSubject(subject)
  const map: Record<string, string> = {
    dejepis: styles.subjectHistory,
    nemcina: styles.subjectGerman,
    anglictina: styles.subjectEnglish,
    matematika: styles.subjectMath,
    fyzika: styles.subjectPhysics,
    elektronika: styles.subjectElectronics,
    elektrotechnika: styles.subjectElectronics,
    informatika: styles.subjectElectronics,
    technickekresleni: styles.subjectTechnicalDrawing,
    cestina: styles.subjectCzech,
    chemie: styles.subjectChemistry,
  }
  return map[normalized] ?? styles.subjectFallback ?? ''
}

export const getConditionClass = (condition: number, styles: Record<string, string>) => {
  const map: Record<number, string> = {
    0: styles.conditionVeryGood,
    1: styles.conditionGood,
    2: styles.conditionWritten,
    3: styles.conditionDamaged,
  }
  return map[condition] ?? ''
}

export const getSaleStatusClass = (status: SaleStatusFilter, styles: Record<string, string>) => {
  const map: Record<SaleStatusFilter, string> = {
    available: styles.saleStatusAvailable,
    reserved: styles.saleStatusReserved,
    reservedByMe: styles.saleStatusReservedByMe,
  }
  return map[status] ?? ''
}

export const conditionOptions: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Velmi dobrý' },
  { value: 1, label: 'Dobrý' },
  { value: 2, label: 'Popsaný' },
  { value: 3, label: 'Poškozený' },
]

export const saleStatusOptions: Array<{ value: SaleStatusFilter; label: string }> = [
  { value: 'available', label: 'Volný' },
  { value: 'reserved', label: 'Rezervovaný' },
  { value: 'reservedByMe', label: 'Rezervovaný mnou' },
]

export const getConditionLabel = (conditionValue?: number | string) => {
  const numValue = typeof conditionValue === 'string' ? parseInt(conditionValue, 10) : conditionValue
  const option = conditionOptions.find(opt => opt.value === numValue)
  return option ? option.label : "Neznámý stav"
}
