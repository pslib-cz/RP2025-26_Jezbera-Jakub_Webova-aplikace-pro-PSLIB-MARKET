import { useEffect } from "react";
import styles from "./FlashMessage.module.css";

export type FlashMessageType = "success" | "error";

type FlashMessageProps = {
  message: string;
  type?: FlashMessageType;
  onClose?: () => void;
  autoHideMs?: number;
};

export default function FlashMessage({
  message,
  type = "success",
  onClose,
  autoHideMs = 4000,
}: FlashMessageProps) {
  useEffect(() => {
    if (!onClose || autoHideMs <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(onClose, autoHideMs);
    return () => window.clearTimeout(timeoutId);
  }, [autoHideMs, onClose]);

  return (
    <div
      className={`${styles.flashMessage} ${type === "success" ? styles.success : styles.error}`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Zavřít zprávu"
          onClick={onClose}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
