import { describe, it, expect } from 'vitest'
import {
  normalizeSubject,
  getSubjectClass,
  getConditionClass,
  getSaleStatusClass,
  getSaleStatusOptions,
  getConditionLabel,
  createEmptyFilters,
} from '../utils/constants'

// ─── normalizeSubject ───────────────────────────────────────────────
describe('normalizeSubject', () => {
  it('převede velká písmena na malá', () => {
    expect(normalizeSubject('Matematika')).toBe('matematika')
  })

  it('odstraní diakritiku', () => {
    expect(normalizeSubject('Čeština')).toBe('cestina')
    expect(normalizeSubject('Němčina')).toBe('nemcina')
    expect(normalizeSubject('Fyzika')).toBe('fyzika')
  })

  it('odstraní mezery na okrajích', () => {
    expect(normalizeSubject('  anglictina  ')).toBe('anglictina')
  })

  it('odstraní speciální znaky', () => {
    expect(normalizeSubject('Technické kreslení')).toBe('technickekresleni')
  })
})

// ─── getSubjectClass ────────────────────────────────────────────────
describe('getSubjectClass', () => {
  const styles = {
    subjectMath: 'math-class',
    subjectEnglish: 'english-class',
    subjectCzech: 'czech-class',
    subjectHistory: 'history-class',
    subjectPhysics: 'physics-class',
    subjectGerman: 'german-class',
    subjectElectronics: 'electronics-class',
    subjectTechnicalDrawing: 'drawing-class',
    subjectChemistry: 'chemistry-class',
    subjectFallback: 'fallback-class',
  }

  it('vrátí správnou třídu pro matematiku', () => {
    expect(getSubjectClass('Matematika', styles)).toBe('math-class')
  })

  it('vrátí správnou třídu pro angličtinu s diakritikou', () => {
    expect(getSubjectClass('Angličtina', styles)).toBe('english-class')
  })

  it('vrátí správnou třídu pro němčinu', () => {
    expect(getSubjectClass('Němčina', styles)).toBe('german-class')
  })

  it('vrátí správnou třídu pro informatiku (spadá do electronics)', () => {
    expect(getSubjectClass('Informatika', styles)).toBe('electronics-class')
  })

  it('vrátí fallback třídu pro neznámý předmět', () => {
    expect(getSubjectClass('Biologie', styles)).toBe('fallback-class')
  })

  it('vrátí prázdný string pokud chybí fallback ve styles', () => {
    expect(getSubjectClass('Biologie', {})).toBe('')
  })
})

// ─── getConditionClass ──────────────────────────────────────────────
describe('getConditionClass', () => {
  const styles = {
    conditionVeryGood: 'very-good',
    conditionGood: 'good',
    conditionWritten: 'written',
    conditionDamaged: 'damaged',
  }

  it('vrátí třídu pro stav 0 (velmi dobrý)', () => {
    expect(getConditionClass(0, styles)).toBe('very-good')
  })

  it('vrátí třídu pro stav 1 (dobrý)', () => {
    expect(getConditionClass(1, styles)).toBe('good')
  })

  it('vrátí třídu pro stav 2 (popsaný)', () => {
    expect(getConditionClass(2, styles)).toBe('written')
  })

  it('vrátí třídu pro stav 3 (poškozený)', () => {
    expect(getConditionClass(3, styles)).toBe('damaged')
  })

  it('vrátí prázdný string pro neznámý stav', () => {
    expect(getConditionClass(99, styles)).toBe('')
  })
})

// ─── getSaleStatusClass ─────────────────────────────────────────────
describe('getSaleStatusClass', () => {
  const styles = {
    saleStatusAvailable: 'available',
    saleStatusReserved: 'reserved',
    saleStatusReservedByMe: 'reserved-by-me',
    saleStatusSold: 'sold',
    saleStatusPending: 'pending',
    saleStatusRejected: 'rejected',
  }

  it('vrátí správnou třídu pro available', () => {
    expect(getSaleStatusClass('available', styles)).toBe('available')
  })

  it('vrátí správnou třídu pro reservedByMe', () => {
    expect(getSaleStatusClass('reservedByMe', styles)).toBe('reserved-by-me')
  })

  it('vrátí správnou třídu pro rejected', () => {
    expect(getSaleStatusClass('rejected', styles)).toBe('rejected')
  })
})

// ─── getSaleStatusOptions ───────────────────────────────────────────
describe('getSaleStatusOptions', () => {
  it('vrátí 3 možnosti pro běžného uživatele', () => {
    const options = getSaleStatusOptions(false)
    expect(options).toHaveLength(3)
    expect(options.map(o => o.value)).toContain('available')
    expect(options.map(o => o.value)).toContain('reserved')
    expect(options.map(o => o.value)).toContain('reservedByMe')
  })

  it('vrátí 6 možností pro admina', () => {
    const options = getSaleStatusOptions(true)
    expect(options).toHaveLength(6)
    expect(options.map(o => o.value)).toContain('sold')
    expect(options.map(o => o.value)).toContain('pending')
    expect(options.map(o => o.value)).toContain('rejected')
  })

  it('admin options obsahují i běžné možnosti', () => {
    const adminOptions = getSaleStatusOptions(true)
    const userOptions = getSaleStatusOptions(false)
    userOptions.forEach(opt => {
      expect(adminOptions.map(o => o.value)).toContain(opt.value)
    })
  })
})

// ─── getConditionLabel ──────────────────────────────────────────────
describe('getConditionLabel', () => {
  it('vrátí label pro číslo 0', () => {
    expect(getConditionLabel(0)).toContain('Velmi') // "Velmi dobrý" (bez diakritiky v kódu je OK)
  })

  it('vrátí label pro string "1"', () => {
    const label = getConditionLabel('1')
    expect(label).toBeTruthy()
    expect(label).not.toBe('Neznámý stav')
  })

  it('vrátí fallback pro undefined', () => {
    expect(getConditionLabel(undefined)).toContain('Nezn')
  })

  it('vrátí fallback pro neznámou hodnotu', () => {
    expect(getConditionLabel(99)).toContain('Nezn')
  })
})

// ─── createEmptyFilters ─────────────────────────────────────────────
describe('createEmptyFilters', () => {
  it('vrátí prázdné filtry', () => {
    const filters = createEmptyFilters()
    expect(filters.minPrice).toBeNull()
    expect(filters.maxPrice).toBeNull()
    expect(filters.subjects).toHaveLength(0)
    expect(filters.conditions).toHaveLength(0)
    expect(filters.saleStatuses).toHaveLength(0)
  })

  it('každé volání vrátí nový objekt (ne reference)', () => {
    const a = createEmptyFilters()
    const b = createEmptyFilters()
    a.subjects.push('matematika')
    expect(b.subjects).toHaveLength(0)
  })
})