import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import {
  getMyBooks,
  changeBookSaleStatus,
  getReservedByMe,
  cancelReservation,
} from "../services/apiService";
import type { Book, ReservedBook } from "../types/models";
import FlashMessage, {
  type FlashMessageType,
} from "../components/FlashMessage";
import styles from "./MyOffersPage.module.css";
import Button from "../components/Button";
import ReservedCard from "../components/ReservedCard";
import MyOfferCard from "../components/MyOfferCard";

export default function MyOffersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<FlashMessageType>("success");
  const [activeTab, setActiveTab] = useState<"offers" | "reservations">("offers");
  const [reservedBooks, setReservedBooks] = useState<ReservedBook[]>([]);

  const loadBooks = useCallback(() => {
    if (auth.isAuthenticated && auth.user?.access_token) {
      getMyBooks(auth.user.access_token)
        .then(setMyBooks)
        .catch(console.error);
    }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (activeTab === "reservations" && auth.isAuthenticated && auth.user?.access_token) {
      getReservedByMe(auth.user.access_token)
        .then(setReservedBooks)
        .catch(console.error);
    }
  }, [activeTab, auth.isAuthenticated, auth.user]);

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
        (error instanceof Error ? error.message : "Zkuste to prosím znovu."),
      );
    }
  };

  return (
    <main className={styles.page}>
      <h2>Můj přehled</h2>

      <div className={styles.tabButtons}>
        <Button
          text="Moje inzeráty"
          onClick={() => setActiveTab("offers")}
          variant={activeTab === "offers" ? "primary" : "secondary"}
        />
        <Button
          text="Moje rezervace"
          onClick={() => setActiveTab("reservations")}
          variant={activeTab === "reservations" ? "primary" : "secondary"}
        />
      </div>

      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {activeTab === "offers" && (
        myBooks.length === 0 ? (
          <p>Zatím nemáš žádné inzeráty.</p>
        ) : (
          <div className={styles.list}>
            {myBooks.map((book) => (
              <MyOfferCard
                key={book.id}
                book={book}
                onStatusChange={handleStatusChange}
                onEdit={(b) => navigate(`/upravit-inzerat/${b.id}`, { state: { book: b } })}
              />
            ))}
          </div>
        )
      )}

      {activeTab === "reservations" && (
        reservedBooks.length === 0 ? (
          <p>Zatím nemáš žádné rezervace.</p>
        ) : (
          <div className={styles.reservationsList}>
            {reservedBooks.map((reserved) => (
              <ReservedCard 
              key={reserved.id}
              reserved={reserved} 
              onCancel={async (bookId) => {
                const token = auth.user?.access_token;
                if (!token) return;
                if(!confirm("Opravdu chceš zrušit tuto rezervaci?")) return;
                  await cancelReservation(bookId, token);
                  getReservedByMe(token).then(setReservedBooks).catch(console.error);

              }} />
            ))}
          </div>
        )
      )}
    </main>
  );
}
