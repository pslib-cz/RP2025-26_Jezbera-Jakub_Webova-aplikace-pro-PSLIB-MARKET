import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import {
  API_BASE_URL,
  reserveBook,
  changeBookSaleStatus, 
  deleteBook,
} from "../../services/apiService";
import styles from "./BookCard.module.css";
import Button from "../Button";
import { getConditionClass, getConditionLabel } from "../../utils/constants";
import type { BookReservation } from "../../types/models";

type BookCardProps = {
  id: number;
  title: string;
  description?: string;
  price: number;
  ownerName: string;
  saleStatus?: number;
  condition?: number | string;
  tags?: { name: string; bgColor: string; textColor: string }[];
  isReservedByCurrentUser?: boolean;
  isOwnedByCurrentUser?: boolean;
  isAdmin?: boolean;
  onReloadRequest?: () => void;
  reservations?: BookReservation[];
};

const AVAILABLE_STATUS = 0;
const RESERVED_STATUS = 1;
const SOLD_STATUS = 2;
const PENDING_STATUS = 4;
const REJECTED_STATUS = 5;

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  description,
  price,
  ownerName,
  saleStatus,
  condition,
  tags,
  isReservedByCurrentUser,
  isOwnedByCurrentUser,
  isAdmin,
  reservations,
  onReloadRequest,
}) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [interestState, setInterestState] = useState<
    "idle" | "sending" | "sent"
  >("idle");
  const [interestError, setInterestError] = useState<string | null>(null);

  const isReserved = saleStatus === RESERVED_STATUS;
  const canManage = isAdmin || isOwnedByCurrentUser;

  const handleInterestClick = async () => {
    if (interestState === "sending" || interestState === "sent") return;
    const token = auth.user?.access_token;
    if (!token) {
      await auth.signinRedirect();
      return;
    }
    setInterestError(null);
    setInterestState("sending");
    try {
      await reserveBook(id, token);
      setInterestState("sent");
    } catch (error) {
      setInterestState("idle");
      setInterestError(
        error instanceof Error
          ? error.message
          : "Nepodařilo se odeslat zájem o knihu.",
      );
    }
  };

  const handleStatusChange = async (newStatus: number) => {
    const token = auth.user?.access_token;
    if (!token) return;
    try {
      await changeBookSaleStatus(id, newStatus, token);
      if (onReloadRequest) onReloadRequest();
    } catch {
      setInterestError("Chyba při změně stavu. Zkuste to znovu.");
    }
  };
  const handleEditClick = () => {
    navigate(`/upravit-inzerat/${id}`, {
      state: {
        initialData: {
          id,
          title,
          description,
          price,
          condition,
          tags,
        },
      },
    });
  };

  let interestButtonText = "Mám zájem";
  if (isOwnedByCurrentUser) interestButtonText = "Vlastní inzerát";
  else if (isReservedByCurrentUser) interestButtonText = "Vaše rezervace";
  else if (interestState === "sending") interestButtonText = "Posílám...";
  else if (interestState === "sent")
    interestButtonText = isReserved ? "Zařazeno" : "Posláno";
  else if (isReserved) interestButtonText = "Zařadit do fronty";

  const normalizedTags = (tags ?? []).filter(Boolean);
  const numCondition =
    typeof condition === "string" ? parseInt(condition, 10) : condition;
  const conditionClass =
    typeof numCondition === "number"
      ? getConditionClass(numCondition, styles)
      : "";

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          className={styles.cardImage}
          src={`${API_BASE_URL}/books/${id}/image`}
          alt={title}
        />
        {isReserved && (
          <span className={styles.reservedBadge}>{isReservedByCurrentUser ? "Vaše rezervace" : "Rezervováno"}</span>
        )}
        <div className={styles.badgesOverlay}>
          {normalizedTags.map((tag) => (
            <span
              key={tag.name}
              className={styles.tagChip}
              style={{ backgroundColor: tag.bgColor, color: tag.textColor }}
            >
              {tag.name}
            </span>
          ))}
          <p className={`${styles.cardCondition} ${conditionClass}`}>
            {getConditionLabel(condition)}
          </p>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardWrap}>
          <p className={styles.cardTitle}>{title}</p>
          {description && (
            <p className={styles.cardDescription}>{description}</p>
          )}
          <p className={styles.cardOwner}>{ownerName}</p>
        </div>

        <div className={styles.cardFooter}>
          <p className={styles.cardPrice}>{price},-</p>
          { (
            <div
              className={`${styles.interestButtonWrap} ${interestState === "sending"
                  ? styles.interestButtonSending
                  : interestState === "sent"
                    ? styles.interestButtonSent
                    : ""
                }`}
            >
              <Button
                text={interestButtonText}
                onClick={() => void handleInterestClick()}
                disabled={
                  isOwnedByCurrentUser ||
                  isReservedByCurrentUser ||
                  interestState === "sending" ||
                  interestState === "sent"
                }
              />
            </div>
          )}
        </div>

        {interestError && (
          <p className={styles.cardActionError}>{interestError}</p>
        )}

        {canManage && (
          <div className={styles.adminPanel}>
            <div className={styles.adminPanelHeader}>
              <span className={styles.adminPanelTitle}>
                {isAdmin && !isOwnedByCurrentUser
                  ? "Správa (Admin)"
                  : "Vlastní inzerát"}
              </span>
              <button
                type="button"
                onClick={handleEditClick}
                className={styles.adminPanelEdit}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Upravit
              </button>
            </div>

            <div className={styles.adminActionGrid}>
              {saleStatus === PENDING_STATUS ? (
                <>
                  <div className={styles.actionButtonWrapper}>
                    <Button
                      text="Schválit"
                      onClick={() => handleStatusChange(AVAILABLE_STATUS)}
                    />
                  </div>
                  <div className={styles.actionButtonWrapper}>
                    <Button
                      text="Zamítnout"
                      variant="secondary"
                      onClick={() => handleStatusChange(REJECTED_STATUS)}
                    />
                  </div>
                </>
              ) : saleStatus === REJECTED_STATUS ? null : (
                <>

                 
                  {saleStatus !== SOLD_STATUS && (
                    <div className={styles.actionButtonWrapper}>
                      <Button
                        text="Označit jako prodané "
                        variant="secondary"
                        onClick={() => handleStatusChange(SOLD_STATUS)}
                      />
                    </div>
                  )}
                  {saleStatus === SOLD_STATUS && (
                    <div className={styles.actionButtonWrapper}>
                      <Button
                        text="Označit jako dostupné"
                        variant="secondary"
                        onClick={() => handleStatusChange(AVAILABLE_STATUS)}
                      />
                    </div>
                  )}
                  {isAdmin && !isOwnedByCurrentUser && (
                    <div className={styles.actionButtonWrapper}>
                      <Button
                        text="Smazat inzerát"
                        variant="secondary"
                        onClick={async () => {
                          if (!confirm("Opravdu nevratně smazat tento inzerát?")) return;
                          const token = auth.user?.access_token;
                          if (!token) return;
                          await deleteBook(id, token);
                          onReloadRequest?.();
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {isAdmin && reservations && reservations.length > 0 && (
          <ol className={styles.reservationsList}>
            {[...reservations]
            .sort((a,b) =>
            new Date(a.reservedAt ?? "").getTime() - new Date(b.reservedAt ?? "").getTime()
            )
            .map((res, index) => (
              <li key={res.id} className={styles.reservationItem}>
                {index + 1}. {res.reservedByUserName}
                {res.reservedByUserEmail ? ` (${res.reservedByUserEmail})` : ""}
                </li>
              ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default BookCard;
