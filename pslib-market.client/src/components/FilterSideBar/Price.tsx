import { type MouseEvent } from 'react'
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

const commitNumberInput = (
  rawValue: string,
  min: number,
  max: number,
  onChange: (value: number | null) => void,
): string => {
  const parsed = parseNumberInput(rawValue)

  if (parsed == null) {
    onChange(null)
    return ''
  }

  const normalized = clamp(parsed, min, max)
  onChange(normalized)
  return normalized.toString()
}

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
  const activeStartPercent = clamp(activeLeftPercent - 0.8, 0, 100)
  const activeEndPercent = clamp(activeRightPercent + 0.8, 0, 100)

  const handleTrackMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const trackStart = 9
    const trackEnd = rect.width - 9
    const trackWidth = Math.max(1, trackEnd - trackStart)
    const x = clamp(event.clientX - rect.left, trackStart, trackEnd)
    const ratio = (x - trackStart) / trackWidth
    const clickedValue = Math.round(minAvailable + ratio * rangeSpan)

    if (Math.abs(clickedValue - leftThumb) <= Math.abs(rightThumb - clickedValue)) {
      onMinChange(Math.min(clickedValue, rightThumb))
      return
    }

    onMaxChange(Math.max(clickedValue, leftThumb))
  }

  return (
    <section className={styles.section}>
      <p className={styles.sectionTitle}>Cena</p>

      <div className={styles.sliderWrap} onMouseDown={handleTrackMouseDown}>
        <div
          className={styles.sliderActiveTrack}
          style={{
            left: '9px',
            right: '9px',
            background: `linear-gradient(to right, #d6d6d6 0%, #d6d6d6 ${activeStartPercent}%, var(--primary-blue) ${activeStartPercent}%, var(--primary-blue) ${activeEndPercent}%, #d6d6d6 ${activeEndPercent}%, #d6d6d6 100%)`,
          }}
        />
        <input
          type='range'
          min={minAvailable}
          max={maxAvailable}
          value={leftThumb}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            onMinChange(Math.min(nextValue, rightThumb))
          }}
          className={styles.slider}
          aria-label='Minimální cena'
        />
        <input
          type='range'
          min={minAvailable}
          max={maxAvailable}
          value={rightThumb}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            onMaxChange(Math.max(nextValue, leftThumb))
          }}
          className={`${styles.slider} ${styles.sliderTop}`}
          aria-label='Maximální cena'
        />
      </div>

      <div className={styles.priceInputs}>
        <label className={styles.fieldLabel}>
          Od
          <input
            key={`min-${minPrice ?? 'empty'}`}
            type='number'
            min={minAvailable}
            max={maxAvailable}
            defaultValue={minPrice ?? ''}
            onBlur={(event) => {
              event.currentTarget.value = commitNumberInput(
                event.currentTarget.value,
                minAvailable,
                rightThumb,
                onMinChange,
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
            className={styles.numberInput}
            placeholder={`${minAvailable}`}
          />
        </label>

        <label className={styles.fieldLabel}>
          Do
          <input
            key={`max-${maxPrice ?? 'empty'}`}
            type='number'
            min={minAvailable}
            max={maxAvailable}
            defaultValue={maxPrice ?? ''}
            onBlur={(event) => {
              event.currentTarget.value = commitNumberInput(
                event.currentTarget.value,
                leftThumb,
                maxAvailable,
                onMaxChange,
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
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