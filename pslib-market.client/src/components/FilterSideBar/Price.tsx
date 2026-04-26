import styles from './FilterSidebar.module.css'

type PriceProps = {
  minAvailable: number
  maxAvailable: number
  minPrice: number | null
  maxPrice: number | null
  onMinChange: (value: number | null) => void
  onMaxChange: (value: number | null) => void
}

const parseNumberInput = (value: string): number | null => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const Price: React.FC<PriceProps> = ({
  minAvailable,
  maxAvailable,
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}) => {
  const safeMinValue = clamp(minPrice ?? minAvailable, minAvailable, maxAvailable)
  const safeMaxValue = clamp(maxPrice ?? maxAvailable, minAvailable, maxAvailable)
  const leftThumb = Math.min(safeMinValue, safeMaxValue)
  const rightThumb = Math.max(safeMinValue, safeMaxValue)

  const rangeSpan = Math.max(1, maxAvailable - minAvailable)
  const activeLeftPercent = clamp(((leftThumb - minAvailable) / rangeSpan) * 100, 0, 100)
  const activeRightPercent = clamp(((rightThumb - minAvailable) / rangeSpan) * 100, 0, 100)

  return (
    <section className={styles.section}>
      <p className={styles.sectionTitle}>Cena</p>

      <div className={styles.sliderWrap}>
        <div
          className={styles.sliderActiveTrack}
          style={{
            left: `calc(9px + ${activeLeftPercent}% * (100% - 18px) / 100)`,
            width: `calc(${Math.max(0, activeRightPercent - activeLeftPercent)}% * (100% - 18px) / 100)`,
          }}
        />
        <input
          type='range'
          min={minAvailable}
          max={maxAvailable}
          value={leftThumb}
          onChange={(event) => onMinChange(Number(event.target.value))}
          className={styles.slider}
          aria-label='Minimální cena'
        />
        <input
          type='range'
          min={minAvailable}
          max={maxAvailable}
          value={rightThumb}
          onChange={(event) => onMaxChange(Number(event.target.value))}
          className={`${styles.slider} ${styles.sliderTop}`}
          aria-label='Maximální cena'
        />
      </div>

      <div className={styles.priceInputs}>
        <label className={styles.fieldLabel}>
          Od
          <input
            type='number'
            min={minAvailable}
            max={maxAvailable}
            value={minPrice ?? ''}
            onChange={(event) => {
              const parsed = parseNumberInput(event.target.value)
              onMinChange(parsed == null ? null : clamp(parsed, minAvailable, maxAvailable))
            }}
            className={styles.numberInput}
            placeholder={`${minAvailable}`}
          />
        </label>

        <label className={styles.fieldLabel}>
          Do
          <input
            type='number'
            min={minAvailable}
            max={maxAvailable}
            value={maxPrice ?? ''}
            onChange={(event) => {
              const parsed = parseNumberInput(event.target.value)
              onMaxChange(parsed == null ? null : clamp(parsed, minAvailable, maxAvailable))
            }}
            className={styles.numberInput}
            placeholder={`${maxAvailable}`}
          />
        </label>
      </div>
    </section>
  )
}

export default Price