import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { API_BASE_URL, reserveBook } from "../../services/apiService";
import styles from "./BookCard.module.css";
import Button from "../Button";

type BookCardProps = {
  id: number; 
  title: string;
  description?: string;
  price: number;
  ownerName: string;
  condition?: number | string;
  tags?: string[];
};

const normalizeSubject = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const SUBJECT_CLASS_MAP: Record<string, string> = {
  dejepis: styles.subjectHistory,
  nemcina: styles.subjectGerman,
  anglictina: styles.subjectEnglish,
  matematika: styles.subjectMath,
  fyzika: styles.subjectPhysics,
  elektronika: styles.subjectElectronics,
  informatika: styles.subjectElectronics,
  technickekresleni: styles.subjectTechnicalDrawing,
  cestina: styles.subjectCzech,
  chemie: styles.subjectChemistry,

};

const CONDITION_CLASS_MAP: Record<number, string> = {
  0: styles.conditionVeryGood,
  1: styles.conditionGood,
  2: styles.conditionWritten,
  3: styles.conditionDamaged,
};

const getConditionLabel = (conditionValue?: number | string) => {
  const numValue = typeof conditionValue === 'string' ? parseInt(conditionValue, 10) : conditionValue;
  switch (numValue) {
    case 0: return "Velmi dobrý";
    case 1: return "Dobrý";
    case 2: return "Popsaná";
    case 3: return "Poškozená";
    default: return "Neznámý stav"; 
  }
};

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  description,
  price,
  ownerName,
  condition,
  tags,
}) => {
  const auth = useAuth();
  const [interestState, setInterestState] = useState<"idle" | "sending" | "sent">("idle");
  const [interestError, setInterestError] = useState<string | null>(null);

  const handleInterestClick = async () => {
    if (interestState === "sending" || interestState === "sent") {
      return;
    }

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
      setInterestError(error instanceof Error ? error.message : "Nepodařilo se odeslat zájem o knihu.");
    }
  };

  const interestButtonText =
    interestState === "sending"
      ? "Posílám..."
      : interestState === "sent"
        ? "Posláno"
        : "Mám zájem";

  const normalizedTags = (tags ?? []).filter(Boolean);
  const numCondition =
    typeof condition === "string" ? parseInt(condition, 10) : condition;
  const conditionClass =
    typeof numCondition === "number"
      ? CONDITION_CLASS_MAP[numCondition] ?? ""
      : "";

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          className={styles.cardImage}
          src={`${API_BASE_URL}/books/${id}/image`}
          alt={title}
        />

        <div className={styles.badgesOverlay}>
          {normalizedTags.length > 0 && (
            <div className={styles.cardTags}>
              {normalizedTags.map((tag) => {
                const subjectClass =
                  SUBJECT_CLASS_MAP[normalizeSubject(tag)] ?? "";

                return (
                  <span key={tag} className={`${styles.tagChip} ${subjectClass}`}>
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          <p className={`${styles.cardCondition} ${conditionClass}`}>
            {getConditionLabel(condition)}
          </p>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardWrap}>
        <p className={styles.cardTitle}> {title}</p>
        
        {description && (
          <p className={styles.cardDescription}>{description}</p>
        )}
        <p className={styles.cardOwner}> {ownerName}</p>
        </div>
        
        <div className={styles.cardFooter}>
          <p className={styles.cardPrice}>{price},-</p>
          <div
            className={`${styles.interestButtonWrap} ${
              interestState === "sending"
                ? styles.interestButtonSending
                : interestState === "sent"
                  ? styles.interestButtonSent
                  : ""
            }`}
          >
            <Button
              text={interestButtonText}
              onClick={() => {
                void handleInterestClick();
              }}
              disabled={interestState === "sending" || interestState === "sent"}
            />
          </div>
        </div>
        {interestError && <p className={styles.cardActionError}>{interestError}</p>}
      </div>
    </div>
  );
};

export default BookCard;