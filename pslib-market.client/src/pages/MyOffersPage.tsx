import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getMyBooks, changeBookSaleStatus } from "../services/apiService";
import type { Book } from "../types/models";
import FlashMessage, { type FlashMessageType } from "../components/FlashMessage";
import styles from "./MyOffersPage.module.css";

const getReservationNames = (book: Book): string[] => {
  const reservations = book.reservations;
  if (!reservations || reservations.length === 0) {
    return [];
  }

  return [...reservations]
    .sort((a, b) => {
      const left = a.reservedAt ? new Date(a.reservedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.reservedAt ? new Date(b.reservedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .map((reservation) => {
      const name = reservation.reservedByUserName?.trim();
      const email = reservation.reservedByUserEmail?.trim();
      return name || email || "Neznámý uživatel";
    });
};

const getImageUrl = (bookId: number): string => `${API_BASE_URL}/books/${bookId}/image`;

export default function MyOffersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [missingImageBookIds, setMissingImageBookIds] = useState<Set<number>>(new Set());
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<FlashMessageType>("success");

  const loadBooks = useCallback(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      getMyBooks(auth.user.access_token)
        .then((books) => {
          setMyBooks(books);
          setMissingImageBookIds(new Set());
        })
        .catch(console.error);
    }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleStatusChange = async (bookId: number, newStatus: number) => {
    try {
      const token = auth.user?.access_token;
      if (!token) {
        setFlashType("error");
        setFlashMessage("Nejste přihlášený.");
        return;
      }

      await changeBookSaleStatus(bookId, newStatus, token);
      setFlashType("success");
      setFlashMessage("Stav inzerátu byl úspěšně změněn.");
      loadBooks();
    } catch (error) {
      setFlashType("error");
      setFlashMessage(
        "Chyba při změně stavu. " +
          (error instanceof Error ? error.message : "Zkuste to prosím znovu.")
      );
    }
  };

  return (
    <main className={styles.page}>
      <h2>Moje inzeráty</h2>
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}
      {myBooks.length === 0 ? (
        <p>Zatím nemáš žádné inzeráty.</p>
      ) : (
        <div className={styles.list}>
          {myBooks.map((book) => {
            const imageUrl = getImageUrl(book.id);
            const imageMissing = missingImageBookIds.has(book.id);
            const reservationNames = getReservationNames(book);

            return (
            <div key={book.id} className={styles.card}>
              <div className={styles.headerRow}>
                {!imageMissing ? (
                  <img
                    className={styles.thumbnail}
                    src={imageUrl}
                    alt={`Náhled knihy ${book.title}`}
                    loading="lazy"
                    onError={() => {
                      setMissingImageBookIds((prev) => {
                        const next = new Set(prev);
                        next.add(book.id);
                        return next;
                      });
                    }}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder} aria-hidden="true">Bez obrázku</div>
                )}
                <div className={styles.titleRow}>
                  <h3 className={styles.title}>{book.title}</h3>
                  <button
                    type="button"
                    className={styles.editIconButton}
                    aria-label="Upravit inzerát"
                    onClick={() => navigate(`/upravit-inzerat/${book.id}`, { state: { book } })}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 20h4l10-10-4-4L4 16v4zM15 5l4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Stav</span>
                  <div className={styles.statusControl}>
                    <select
                      className={styles.select}
                      defaultValue={book.saleStatus}
                      onChange={(e) => handleStatusChange(book.id, parseInt(e.target.value, 10))}
                    >
                      <option value={0}>Volné</option>
                      <option value={1}>Rezervováno</option>
                      <option value={2}>Prodáno</option>
                      <option value={3}>Archivováno</option>
                    </select>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Cena</span>
                  <span className={styles.price}>{book.price} Kč</span>
                </div>

                <details className={styles.reservationDropdown}>
                  <summary className={styles.reservationSummary}>
                    <span className={styles.metaLabel}>Pořadí rezervovaných lidí</span>
                    <span className={styles.dropdownIconWrap} aria-hidden="true">
                      <svg
                        className={styles.dropdownIconClosed}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <svg
                        className={styles.dropdownIconOpen}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 15L12 9L18 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <ol className={styles.reservationList}>
                    {reservationNames.length > 0 ? (
                      reservationNames.map((name, index) => (
                        <li key={`${book.id}-${index}-${name}`}>{name}</li>
                      ))
                    ) : (
                      <li>Nikdo si to zatím nerezervoval</li>
                    )}
                  </ol>
                </details>
              </div>
            </div>
          )})}
        </div>
      )}
    </main>
  );
}