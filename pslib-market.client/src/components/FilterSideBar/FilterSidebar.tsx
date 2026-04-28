import { useMemo } from "react";
import styles from "./FilterSidebar.module.css";

import FilterAction from "./FilterAction";
import Filters, { type TagData } from "./Filters";
import Price from "./Price";
import {
  type SaleStatusFilter,
  type SidebarFilters,
  createEmptyFilters,
  getSaleStatusOptions,
} from "../../utils/constants";

type FilterSidebarProps = {
  minAvailablePrice: number;
  maxAvailablePrice: number;
  subjectOptions: TagData[];
  visibleCount: number;
  totalCount: number;
  appliedFilters: SidebarFilters;
  isAdmin: boolean;
  onApplyFilters: (filters: SidebarFilters) => void;
  onCloseMobile?: () => void;
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  minAvailablePrice,
  maxAvailablePrice,
  subjectOptions,
  visibleCount,
  totalCount,
  appliedFilters,
  isAdmin,
  onApplyFilters,
  onCloseMobile,
}) => {
  const toggleSubject = (subjectName: string) => {
    const hasSubject = appliedFilters.subjects.includes(subjectName);
    onApplyFilters({
      ...appliedFilters,
      subjects: hasSubject
        ? appliedFilters.subjects.filter((item) => item !== subjectName)
        : [...appliedFilters.subjects, subjectName],
    });
  };

  const toggleCondition = (condition: number) => {
    const hasCondition = appliedFilters.conditions.includes(condition);
    onApplyFilters({
      ...appliedFilters,
      conditions: hasCondition
        ? appliedFilters.conditions.filter((item) => item !== condition)
        : [...appliedFilters.conditions, condition],
    });
  };

  const toggleSaleStatus = (saleStatus: SaleStatusFilter) => {
    const hasSaleStatus = appliedFilters.saleStatuses.includes(saleStatus);
    onApplyFilters({
      ...appliedFilters,
      saleStatuses: hasSaleStatus
        ? appliedFilters.saleStatuses.filter((item) => item !== saleStatus)
        : [...appliedFilters.saleStatuses, saleStatus],
    });
  };

  const handleReset = () => {
    onApplyFilters(createEmptyFilters());
  };

  const hasActiveFilters = useMemo(
    () =>
      appliedFilters.minPrice != null ||
      appliedFilters.maxPrice != null ||
      appliedFilters.subjects.length > 0 ||
      appliedFilters.conditions.length > 0 ||
      appliedFilters.saleStatuses.length > 0,
    [appliedFilters],
  );

  return (
    <aside className={styles.sidebar}>
      <Price
        minAvailable={minAvailablePrice}
        maxAvailable={maxAvailablePrice}
        minPrice={appliedFilters.minPrice}
        maxPrice={appliedFilters.maxPrice}
        onMinChange={(minPrice) =>
          onApplyFilters({ ...appliedFilters, minPrice })
        }
        onMaxChange={(maxPrice) =>
          onApplyFilters({ ...appliedFilters, maxPrice })
        }
      />

      <Filters
        subjectOptions={subjectOptions}
        selectedSubjects={appliedFilters.subjects}
        onToggleSubject={toggleSubject}
        selectedConditions={appliedFilters.conditions}
        onToggleCondition={toggleCondition}
        selectedSaleStatuses={appliedFilters.saleStatuses}
        saleStatusOptions={getSaleStatusOptions(isAdmin)}
        onToggleSaleStatus={toggleSaleStatus}
      />

      <FilterAction
        visibleCount={visibleCount}
        totalCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
        onApply={() => onCloseMobile?.()}
      />
    </aside>
  );
};

export default FilterSidebar;
