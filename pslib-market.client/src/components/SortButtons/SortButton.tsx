import React from 'react'
import styles from './SortButtons.module.css'

type SortButtonProps = {
  text: string
  svgIcon: React.ReactNode
  isActive: boolean
  onClick: () => void
}

const SortButton: React.FC<SortButtonProps> = ({ text, svgIcon, isActive, onClick }) => {
  const className = `${styles.sortButton} ${isActive ? styles.sortButtonActive : ''}`.trim()

  return (
    <button type='button' className={className} onClick={onClick} aria-pressed={isActive}>
      {svgIcon}
      {text}
    </button>
  )
}

export default SortButton