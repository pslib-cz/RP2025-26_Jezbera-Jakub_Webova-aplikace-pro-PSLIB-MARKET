import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import { getBooks } from "../services/apiService";
import BookCard from "../components/BookCard/BookCard";
import type { Book } from "../types/models";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FlashMessage, {
  type FlashMessageType,
} from "../components/FlashMessage";
import styles from "./HomePage.module.css";
import SortButtons, {
  type SortOption,
} from "../components/SortButtons/SortButtons";
import FilterSidebar from "../components/FilterSideBar/FilterSidebar";
import { type SidebarFilters, createEmptyFilters } from "../utils/constants";
import { mobileSortOptions } from "../utils/sortConstants";
import Button from "../components/Button";

type FlashMessageState = {
  flashMessage?: string;
  flashType?: FlashMessageType;
};

const RESERVED_STATUS = 1;
const ITEMS_PER_PAGE = 12;

const HomePage = () => {
  const auth = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<SidebarFilters>(createEmptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
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

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Nepodařilo se načíst knihy.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Nabídka knih | PSLIB Market";
    loadBooks();
  }, [loadBooks]);

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

  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFilters, sortOption]);

  const filteredBooks = !searchQuery
    ? books
    : books.filter((book) => {
        const searchableValues = [
          book.title,
          book.description ?? "",
          book.ownerName,
          (book.tags ?? []).map((t) => t.name).join(" "),
        ];
        return searchableValues.some((value) =>
          value.toLowerCase().includes(searchQuery),
        );
      });

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

  const normalizedCurrentUserEmail = String(auth.user?.profile?.email ?? "")
    .trim()
    .toLowerCase();

  const subjectOptions = useMemo(() => {
    const allTagsMap = new Map();
    books.forEach((book) => {
      (book.tags ?? []).forEach((tag) => {
        if (tag && tag.name && !allTagsMap.has(tag.name)) {
          allTagsMap.set(tag.name, tag);
        }
      });
    });
    return Array.from(allTagsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "cs"),
    );
  }, [books]);

  const minAvailablePrice =
    books.length > 0 ? Math.min(...books.map((book) => book.price)) : 0;
  const maxAvailablePrice =
    books.length > 0 ? Math.max(...books.map((book) => book.price)) : 1000;

  const filterMatchedBooks = filteredBooks.filter((book) => {
    if (appliedFilters.minPrice != null && book.price < appliedFilters.minPrice)
      return false;
    if (appliedFilters.maxPrice != null && book.price > appliedFilters.maxPrice)
      return false;

    if (appliedFilters.subjects.length > 0) {
      const hasSelectedSubject = (book.tags ?? []).some((tag) =>
        appliedFilters.subjects.includes(tag.name),
      );
      if (!hasSelectedSubject) return false;
    }

    if (appliedFilters.conditions.length > 0) {
      const numericCondition =
        typeof book.condition === "string"
          ? parseInt(book.condition, 10)
          : book.condition;
      if (
        typeof numericCondition !== "number" ||
        !appliedFilters.conditions.includes(numericCondition)
      )
        return false;
    }

    if (appliedFilters.saleStatuses.length > 0) {
      const isAvailable = book.saleStatus !== RESERVED_STATUS;
      const isReserved = book.saleStatus === RESERVED_STATUS;
      const isReservedByMe = (book.reservations ?? []).some(
        (reservation) =>
          reservation.reservedByUserEmail?.trim().toLowerCase() ===
          normalizedCurrentUserEmail,
      );

      const matchesAnyStatus = appliedFilters.saleStatuses.some(
        (selectedStatus) => {
          if (selectedStatus === "available") return isAvailable;
          if (selectedStatus === "reserved") return isReserved;
          return isReservedByMe;
        },
      );

      if (!matchesAnyStatus) return false;
    }

    return true;
  });

  const getCreationTimestamp = (book: Book): number => {
    const parsedDate = book.createdAt
      ? new Date(book.createdAt).getTime()
      : Number.NaN;
    return Number.isFinite(parsedDate) ? parsedDate : book.id;
  };

  const sortedBooks = [...filterMatchedBooks].sort((left, right) => {
    if (sortOption === "priceAsc") return left.price - right.price;
    if (sortOption === "priceDesc") return right.price - left.price;
    if (sortOption === "newest")
      return getCreationTimestamp(right) - getCreationTimestamp(left);
    return getCreationTimestamp(left) - getCreationTimestamp(right);
  });

  const totalPages = Math.ceil(sortedBooks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBooks = sortedBooks.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const hasNoBooksAtAll = !isLoading && !loadError && books.length === 0;
  const hasNoSearchResults =
    !isLoading &&
    !loadError &&
    books.length > 0 &&
    filterMatchedBooks.length === 0;

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
            onClick={loadBooks}
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
              subjectOptions={subjectOptions}
              visibleCount={filterMatchedBooks.length}
              totalCount={filteredBooks.length}
              appliedFilters={appliedFilters}
              onApplyFilters={setAppliedFilters}
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
                onSortChange={setSortOption}
              />
            </div>

            {paginatedBooks.length > 0 && (
              <>
                <div className={styles.bookGrid}>
                  {paginatedBooks.map((book) => {
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
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div
                    className={styles.paginationWrapper}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "1rem",
                      marginTop: "2rem",
                    }}
                  >
                    <Button
                      text="Předchozí"
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    />
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
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
              subjectOptions={subjectOptions}
              visibleCount={filterMatchedBooks.length}
              totalCount={filteredBooks.length}
              appliedFilters={appliedFilters}
              onApplyFilters={setAppliedFilters}
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
                    setSortOption(option.value);
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
