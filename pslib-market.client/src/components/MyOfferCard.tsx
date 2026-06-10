import { useState } from "react";
import type { Book } from "../types/models";
import { API_BASE_URL } from "../services/apiService";
import styles from "../pages/MyOffersPage.module.css";

const AVAILABLE_STATUS = 0;
const RESERVED_STATUS = 1;
const SOLD_STATUS = 2;
const ARCHIVED_STATUS = 3;
const PENDING_STATUS = 4;
const REJECTED_STATUS = 5;

const getSaleStatusLabel = (status: number): string => {
  switch (status) {
    case 0:
      return "Volné";
    case 1:
      return "Rezervováno";
    case 2:
      return "Prodáno";
    case 3:
      return "Archivováno";
    case 4:
      return "Čeká na schválení";
    case 5:
      return "Zamítnuto";
    default:
      return "Neznámý stav";
  }
};

const getSaleStatusClassName = (status: number): string => {
  switch (status) {
    case AVAILABLE_STATUS:
      return styles.statusAvailable;
    case RESERVED_STATUS:
      return styles.statusReserved;
    case SOLD_STATUS:
      return styles.statusSold;
    case ARCHIVED_STATUS:
      return styles.statusArchived;
    case PENDING_STATUS:
      return styles.statusPending;
    case REJECTED_STATUS:
      return styles.statusRejected;
    default:
      return styles.statusUnknown;
  }
};

const getReservationNames = (book: Book): string[] => {
  const reservations = book.reservations;
  if (!reservations || reservations.length === 0) {
    return [];
  }

  return [...reservations]
    .sort((a, b) => {
      const left = a.reservedAt
        ? new Date(a.reservedAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const right = b.reservedAt
        ? new Date(b.reservedAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .map((reservation) => {
      const name = reservation.reservedByUserName?.trim();
      const email = reservation.reservedByUserEmail?.trim();
      if (name && email) return `${name} (${email})`;
      return email || name || "Neznámý uživatel";
    });
};

type MyOfferCardProps = {
  book: Book;
  onStatusChange: (bookId: number, newStatus: number) => void;
  onEdit: (book: Book) => void;
};

export default function MyOfferCard({ book, onStatusChange, onEdit }: MyOfferCardProps) {
  const [imageMissing, setImageMissing] = useState(false);

  const reservationNames = getReservationNames(book);
  const isUnapproved =
    book.saleStatus === PENDING_STATUS || book.saleStatus === REJECTED_STATUS;
  const cardStateClassName =
    book.saleStatus === AVAILABLE_STATUS
      ? styles.cardAvailable
      : book.saleStatus === RESERVED_STATUS
        ? styles.cardReserved
        : book.saleStatus === SOLD_STATUS
          ? styles.cardSold
          : book.saleStatus === ARCHIVED_STATUS
            ? styles.cardArchived
            : book.saleStatus === PENDING_STATUS
              ? styles.cardPending
              : book.saleStatus === REJECTED_STATUS
                ? styles.cardRejected
                : styles.cardUnknown;

  return (
    <div className={`${styles.card} ${cardStateClassName}`}>
      <div className={styles.headerRow}>
        {!imageMissing ? (
          <img
            className={styles.thumbnail}
            src={`${API_BASE_URL}/books/${book.id}/image`}
            alt={`Náhled knihy ${book.title}`}
            loading="lazy"
            onError={() => setImageMissing(true)}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder} aria-hidden="true">
            Bez obrázku
          </div>
        )}
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{book.title}</h3>
          <button
            type="button"
            className={styles.editIconButton}
            aria-label="Upravit inzerát"
            onClick={() => onEdit(book)}
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
            <span
              className={`${styles.statusBadge} ${getSaleStatusClassName(book.saleStatus)}`}
            >
              {getSaleStatusLabel(book.saleStatus)}
            </span>
          </div>
        </div>

        {isUnapproved && (
          <div
            className={`${styles.moderationNotice} ${book.saleStatus === PENDING_STATUS
              ? styles.moderationNoticePending
              : styles.moderationNoticeRejected
              }`}
          >
            {book.saleStatus === PENDING_STATUS
              ? "Inzerát čeká na schválení adminem. Po schválení bude viditelný pro ostatní."
              : "Inzerát byl zamítnut. Uprav ho a odešli znovu ke schválení."}
          </div>
        )}

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

        {!isUnapproved && (
          <div className={styles.saleActions}>
            <button
              type="button"
              className={`${styles.saleButton} ${styles.buttonSold} ${book.saleStatus === SOLD_STATUS
                ? styles.activeSaleButton
                : ""
                }`}
              disabled={book.saleStatus === SOLD_STATUS}
              onClick={() => onStatusChange(book.id, SOLD_STATUS)}
            >
              Prodané
            </button>
            <button
              type="button"
              className={`${styles.saleButton} ${styles.buttonAvailable} ${book.saleStatus === AVAILABLE_STATUS
                ? styles.activeSaleButton
                : ""
                }`}
              disabled={book.saleStatus === AVAILABLE_STATUS}
              onClick={() => onStatusChange(book.id, AVAILABLE_STATUS)}
            >
              Zpět do prodeje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
