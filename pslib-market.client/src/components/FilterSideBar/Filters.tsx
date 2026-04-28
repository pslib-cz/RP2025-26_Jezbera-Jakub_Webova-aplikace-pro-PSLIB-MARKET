import React from 'react'
import styles from './FilterSidebar.module.css'
import {
  type SaleStatusFilter,
  getConditionClass,
  getSaleStatusClass,
  conditionOptions,
  saleStatusOptions,
} from '../../utils/constants'

export type TagData = {
  name: string;
  bgColor: string;
  textColor: string;
}

type FiltersProps = {
  subjectOptions: TagData[] 
  selectedSubjects: string[] 
  onToggleSubject: (subject: string) => void
  selectedConditions: number[]
  onToggleCondition: (condition: number) => void
  selectedSaleStatuses: SaleStatusFilter[]
  onToggleSaleStatus: (saleStatus: SaleStatusFilter) => void
}

const CloseIcon = () => (
  <svg width='6' height='6' viewBox='0 0 6 6' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path d='M5.5 0.5L0.5 5.5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
    <path d='M0.5 0.5L5.5 5.5' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const Filters: React.FC<FiltersProps> = ({
  subjectOptions,
  selectedSubjects,
  onToggleSubject,
  selectedConditions,
  onToggleCondition,
  selectedSaleStatuses,
  onToggleSaleStatus,
}) => {
  return (
    <section className={styles.section}>
      <p className={styles.sectionTitle}>Filtry</p>

      <div className={styles.filtersWrap}>
        <div className={styles.filterGroup}>
          <p className={styles.subTitle}>Dle předmětu</p>
          <div className={styles.chipList}>
            {subjectOptions.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.name)

              return (
                <button
                  key={subject.name}
                  type='button'
                  className={`${styles.chip} ${styles.subjectChip} ${isSelected ? styles.chipSelected : ''}`.trim()}
                  style={{ 
                    backgroundColor: isSelected ? subject.bgColor : 'transparent',
                    color: isSelected ? subject.textColor : '#666',
                    borderColor: subject.bgColor 
                  }}
                  onClick={() => onToggleSubject(subject.name)}
                >
                  <span>{subject.name}</span>
                  {isSelected && <span className={styles.chipClose} aria-hidden='true'><CloseIcon /></span>}
                </button>
              )
            })}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <p className={styles.subTitle}>Dle stavu knihy</p>
          <div className={styles.chipList}>
            {conditionOptions.map((option) => {
              const isSelected = selectedConditions.includes(option.value)
              const conditionClass = getConditionClass(option.value, styles)

              return (
                <button
                  key={option.value}
                  type='button'
                  className={`${styles.chip} ${styles.conditionChip} ${conditionClass} ${isSelected ? styles.chipSelected : ''}`.trim()}
                  onClick={() => onToggleCondition(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className={styles.chipClose} aria-hidden='true'><CloseIcon /></span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.filterGroup}>

          <p className={styles.subTitle}>Dle stavu</p>
          <div className={styles.chipList}>
            {saleStatusOptions.map((option) => {
              const isSelected = selectedSaleStatuses.includes(option.value)
              const saleStatusClass = getSaleStatusClass(option.value, styles)

              return (
                <button
                  key={option.value}
                  type='button'
                  className={`${styles.chip} ${styles.saleStatusChip} ${saleStatusClass} ${isSelected ? styles.chipSelected : ''}`.trim()}
                  onClick={() => onToggleSaleStatus(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className={styles.chipClose} aria-hidden='true'><CloseIcon /></span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Filters