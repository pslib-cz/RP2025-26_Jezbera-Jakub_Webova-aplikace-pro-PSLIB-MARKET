import type { ReservedBook } from "../types/models";
import { API_BASE_URL } from "../services/apiService";
import styles from "../pages/MyOffersPage.module.css";
import Button from "./Button";

const statusLabels: Record<number, string> = {
  0: "Volné",
  1: "Rezervováno",
  2: "Prodáno",
  3: "Archivováno",
  4: "Čeká na schválení",
  5: "Zamítnuto",
};

export default function ReservedCard({ reserved, onCancel }: { reserved: ReservedBook; onCancel: (id: number) => void }) {
  return (
    <div className={styles.reservedItem}>
      <div className={styles.headerRow}>
        <img
          className={styles.thumbnail}
          src={`${API_BASE_URL}/books/${reserved.id}/image`}
          alt={`Náhled knihy ${reserved.title}`}
          loading="lazy"
        />
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{reserved.title}</h3>
        </div>
      </div>
      <div className={styles.metaGrid}>
        <div className={styles.metaRow}><strong>Cena:</strong> {reserved.price},-</div>
        <div className={styles.metaRow}>
          <strong>Stav:</strong> {statusLabels[reserved.saleStatus] ?? "Neznámý stav"}
        </div>
        <div className={styles.metaRow}>
          <strong>Pořadí ve frontě:</strong>{" "}
          {reserved.queuePosition === 1
            ? "1. (jsi na řadě)"
            : `${reserved.queuePosition}. z ${reserved.queueLength}`}
        </div>
        <div className={styles.metaRow}>
          <strong>Prodávající:</strong> {reserved.ownerName}
          {reserved.ownerEmail ? ` (${reserved.ownerEmail})` : ""}
        </div>
        {reserved.reservedAt && (
          <div className={styles.metaRow}>
            <strong>Rezervováno:</strong>{" "}
            {new Date(reserved.reservedAt).toLocaleString("cs-CZ")}
          </div>
        )}
      </div>
      <Button variant="secondary" onClick={() => onCancel(reserved.id)} text="Zrušit rezervaci" />
    </div>
  );
}