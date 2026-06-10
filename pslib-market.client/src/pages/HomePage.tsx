import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { getBooks, getTags } from "../services/apiService";
import BookCard from "../components/BookCard/BookCard";
import type { Book, Tag } from "../types/models";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FlashMessage, {
  type FlashMessageType,
} from "../components/FlashMessage";
import styles from "./HomePage.module.css";
import SortButtons, {
  type SortOption,
} from "../components/SortButtons/SortButtons";
import FilterSidebar from "../components/FilterSideBar/FilterSidebar";
import { type SidebarFilters } from "../utils/constants";
import { mobileSortOptions } from "../utils/sortConstants";
import Button from "../components/Button";

type FlashMessageState = {
  flashMessage?: string;
  flashType?: FlashMessageType;
};

const ITEMS_PER_PAGE = 12;

const hasAdminAccess = (
  profile: Record<string, unknown> | undefined,
): boolean => {
  if (!profile) return false;
  const adminClaim = profile["market.admin"];
  const adminRole = profile["role"];
  const claimValues = Array.isArray(adminClaim) ? adminClaim : [adminClaim];
  const roleValues = Array.isArray(adminRole) ? adminRole : [adminRole];

  return (
    claimValues.some((value) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value === 1;
      if (typeof value === "string") {
        return value.toLowerCase() === "1" || value.toLowerCase() === "true";
      }
      return false;
    }) ||
    roleValues.some(
      (value) =>
        typeof value === "string" && value.toLowerCase() === "market.admin",
    )
  );
};

const HomePage = () => {
  const auth = useAuth();
  const isAdmin =
    auth.isAuthenticated &&
    hasAdminAccess(auth.user?.profile as Record<string, unknown> | undefined);

  const [books, setBooks] = useState<Book[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
 const [searchParams, setSearchParams] = useSearchParams();
  const [sortOption, setSortOption] = useState<SortOption>(
    () => (searchParams.get("sort") as SortOption) || "newest",
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<SidebarFilters>(() => ({
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
    subjects: searchParams.getAll("subject"),
    conditions: searchParams.getAll("condition").map(Number),
    saleStatuses: searchParams.getAll("saleStatuses") as SidebarFilters["saleStatuses"],
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const [flashMessage, setFlashMessage] = useState<string | null>(() => {
    const state = location.state as FlashMessageState | null;
    return state?.flashMessage ?? null;
  });
  const [flashType] = useState<FlashMessageType>(() => {
    const state = location.state as FlashMessageState | null;
    return state?.flashType ?? "success";
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [minAvailablePrice, setMinAvailablePrice] = useState(0);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(0);
  const searchQuery = (searchParams.get("q") ?? "").trim();

  const loadData = useCallback(async () => {
    if (auth.isLoading) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const [booksData, tagsData] = await Promise.all([
        getBooks({
          token: auth.user?.access_token,
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
          search: searchQuery,
          minPrice: appliedFilters.minPrice,
          maxPrice: appliedFilters.maxPrice,
          subjects: appliedFilters.subjects,
          conditions: appliedFilters.conditions,
          saleStatuses: appliedFilters.saleStatuses,
          sort: sortOption,
        }),
        getTags(),
      ]);
      setBooks(booksData.items);
      setFilteredCount(booksData.filteredCount);
      setVisibleCount(booksData.visibleCount);
      setMinAvailablePrice(booksData.minPrice);
      setMaxAvailablePrice(booksData.maxPrice);
      setAllTags(tagsData);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Nepodařilo se načíst data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    appliedFilters,
    auth.isLoading,
    auth.user?.access_token,
    currentPage,
    searchQuery,
    sortOption,
  ]);

  useEffect(() => {
    document.title = "Nabídka knih | PSLIB Market";
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const state = location.state as FlashMessageState | null;
    if (!state?.flashMessage) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const shouldLockScroll = isMobileFilterOpen || isMobileSortOpen;
    if (!shouldLockScroll) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileFilterOpen, isMobileSortOpen]);

  const filtersIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 3H12L8.3 7.1V10.8L5.7 12V7.1L2 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const sortIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 3V11M4 11L2.5 9.5M4 11L5.5 9.5M10 11V3M10 3L8.5 4.5M10 3L11.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const syncUrl = (filters: SidebarFilters, sort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    if (sort && sort !== "newest") params.set("sort", sort);
    else params.delete("sort");

    if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
    else params.delete("minPrice");

    if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
    else params.delete("maxPrice");

    params.delete("subject");
    filters.subjects.forEach((subject) => params.append("subject", subject));

    params.delete("condition");
    filters.conditions.forEach((condition) => params.append("condition", String(condition)));

    params.delete("saleStatuses");
    filters.saleStatuses.forEach((status) => params.append("saleStatuses", status));

    setSearchParams(params, { replace: true });
  };

  const normalizedCurrentUserEmail = String(auth.user?.profile?.email ?? "")
    .trim()
    .toLowerCase();
  const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);

  const handleApplyFilters = (filters: SidebarFilters) => {
    setCurrentPage(1);
    setAppliedFilters(filters);
    syncUrl(filters, sortOption);
  };

  const handleSortChange = (nextSort: SortOption) => {
    setCurrentPage(1);
    setSortOption(nextSort);
    syncUrl(appliedFilters, nextSort);
  };

  const hasNoBooksAtAll = !isLoading && !loadError && visibleCount === 0;
  const hasNoSearchResults =
    !isLoading && !loadError && visibleCount > 0 && filteredCount === 0;

  return (
    <main className={styles.page}>
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {isLoading && (
        <section
          className={styles.statePanel}
          aria-live="polite"
          aria-busy="true"
        >
          <div className={styles.loader} aria-hidden="true" />
          <p className={styles.stateTitle}>Načítám inzeráty</p>
          <p className={styles.stateText}>
            Chvilku strpení, připravujeme nabídku knih.
          </p>
        </section>
      )}

      {!isLoading && loadError && (
        <section
          className={`${styles.statePanel} ${styles.statePanelError}`}
          role="alert"
        >
          <p className={styles.stateTitle}>Načtení se nepovedlo</p>
          <p className={styles.stateText}>{loadError}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={loadData}
          >
            Zkusit znovu
          </button>
        </section>
      )}

      {hasNoBooksAtAll && (
        <section className={styles.statePanel} aria-live="polite">
          <p className={styles.stateTitle}>Zatím tu nejsou žádné knihy</p>
          <p className={styles.stateText}>Buď první, kdo přidá inzerát.</p>
        </section>
      )}

      {hasNoSearchResults && (
        <section className={styles.statePanel} aria-live="polite">
          <p className={styles.stateTitle}>Žádná kniha neodpovídá hledání</p>
          <p className={styles.stateText}>Zkus upravit vyhledávací výraz.</p>
        </section>
      )}

      {!isLoading && !loadError && (
        <div className={styles.contentLayout}>
          <div className={styles.desktopSidebar}>
            <FilterSidebar
              minAvailablePrice={minAvailablePrice}
              maxAvailablePrice={maxAvailablePrice}
              subjectOptions={allTags}
              visibleCount={filteredCount}
              totalCount={visibleCount}
              appliedFilters={appliedFilters}
              isAdmin={isAdmin}
              onApplyFilters={handleApplyFilters}
            />
          </div>

          <div className={styles.contentMain}>
            <div className={styles.mobileTopActions}>
              <Button
                text="Filtrovat"
                onClick={() => setIsMobileFilterOpen(true)}
                iconPosition="right"
                icon={filtersIcon}
                variant="secondary"
                iconSize={18}
              />
              <Button
                text="Řadit"
                onClick={() => setIsMobileSortOpen(true)}
                iconPosition="right"
                icon={sortIcon}
                iconSize={18}
              />
            </div>

            <div className={`${styles.toolbarRow} ${styles.desktopSortRow}`}>
              <SortButtons
                selectedSort={sortOption}
                onSortChange={handleSortChange}
              />
            </div>

            {books.length > 0 && (
              <>
                <div className={styles.bookGrid}>
                  {books.map((book) => {
                    const isReservedByCurrentUser = (
                      book.reservations ?? []
                    ).some(
                      (reservation) =>
                        reservation.reservedByUserEmail
                          ?.trim()
                          .toLowerCase() === normalizedCurrentUserEmail,
                    );
                    const isOwnedByCurrentUser =
                      book.ownerEmail?.trim().toLowerCase() ===
                      normalizedCurrentUserEmail;

                    return (
                      <BookCard
                        key={book.id}
                        id={book.id}
                        title={book.title}
                        description={book.description}
                        price={book.price}
                        ownerName={book.ownerName}
                        saleStatus={book.saleStatus}
                        condition={book.condition}
                        tags={book.tags ?? []}
                        isReservedByCurrentUser={isReservedByCurrentUser}
                        isOwnedByCurrentUser={isOwnedByCurrentUser}
                        isAdmin={isAdmin}
                        onReloadRequest={loadData}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Button
                      text="Předchozí"
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    />
                    <span className={styles.paginationInfo}>
                      Stránka {currentPage} z {totalPages}
                    </span>
                    <Button
                      text="Další"
                      variant="secondary"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isMobileFilterOpen && (
        <div className={styles.mobileFilterPage}>
          <div className={styles.mobilePanelHeaderRow}>
            <button
              type="button"
              className={styles.mobileBackButton}
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Zpět
            </button>
            <p className={styles.mobilePanelTitle}>Upřesnit výběr</p>
          </div>
          <div className={styles.mobilePanelDivider} />
          <div className={styles.mobileFilterContent}>
            <FilterSidebar
              minAvailablePrice={minAvailablePrice}
              maxAvailablePrice={maxAvailablePrice}
              subjectOptions={allTags}
              visibleCount={filteredCount}
              totalCount={visibleCount}
              appliedFilters={appliedFilters}
              isAdmin={isAdmin}
              onApplyFilters={handleApplyFilters}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}

      {isMobileSortOpen && (
        <div className={styles.mobileSortSheetOverlay}>
          <div className={styles.mobileSortSheet}>
            <div className={styles.mobileSortHeader}>
              <p className={styles.mobileSortTitle}>Seřadit dle</p>
              <button
                type="button"
                className={styles.mobileSortCloseBtn}
                onClick={() => setIsMobileSortOpen(false)}
              >
                Zavřít
              </button>
            </div>
            <div className={styles.mobileSortDivider} />
            <div className={styles.mobileSortList}>
              {mobileSortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.mobileSortOption} ${sortOption === option.value ? styles.mobileSortOptionActive : ""}`.trim()}
                  onClick={() => {
                    handleSortChange(option.value);
                    setIsMobileSortOpen(false);
                  }}
                >
                  <span className={styles.mobileSortOptionIcon}>
                    {option.icon}
                  </span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default HomePage;
