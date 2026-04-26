import styles from './SortButtons.module.css'
import SortButton from "./SortButton"
import { desktopSortIcons } from '../../utils/sortConstants'

export type SortOption = 'priceAsc' | 'priceDesc' | 'newest' | 'oldest'

type SortButtonsProps = {
  selectedSort: SortOption
  onSortChange: (sortOption: SortOption) => void
}

const SortButtons: React.FC<SortButtonsProps> = ({ selectedSort, onSortChange }) => {
  return (
    <div className={styles.sortButtons}>
      <SortButton
        text="Nejlevnější"
        svgIcon={desktopSortIcons.cheapest}
        isActive={selectedSort === 'priceAsc'}
        onClick={() => onSortChange('priceAsc')}
      />
      <SortButton
        text="Nejdražší"
        svgIcon={desktopSortIcons.expensive}
        isActive={selectedSort === 'priceDesc'}
        onClick={() => onSortChange('priceDesc')}
      />
      <SortButton
        text="Nejnovější"
        svgIcon={desktopSortIcons.newest}
        isActive={selectedSort === 'newest'}
        onClick={() => onSortChange('newest')}
      />
      <SortButton
        text="Nejstarší"
        svgIcon={desktopSortIcons.oldest}
        isActive={selectedSort === 'oldest'}
        onClick={() => onSortChange('oldest')}
      />
    </div>
  )
}

export default SortButtons