import Button from '../Button'
import styles from './FilterSidebar.module.css'

type FilterActionProps = {
  visibleCount: number
  totalCount: number
  hasActiveFilters: boolean
  onReset: () => void
  onApply: () => void
}

const FilterAction: React.FC<FilterActionProps> = ({
  visibleCount,
  totalCount,
  hasActiveFilters,
  onReset,
  onApply,
}) => {
  return (
    <section className={styles.actionRow}>
      <div className={styles.counterWrap}>
        <p className={styles.resultCounter}>
          {visibleCount}
          <span className={styles.resultCount}> z {totalCount} </span>
        </p>
        <button
          type='button'
          className={styles.clearButton}
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          Zrušit filtr
        </button>
      </div>

      <Button text='Zobrazit výsledky' onClick={onApply} />
    </section>
  )
}

export default FilterAction