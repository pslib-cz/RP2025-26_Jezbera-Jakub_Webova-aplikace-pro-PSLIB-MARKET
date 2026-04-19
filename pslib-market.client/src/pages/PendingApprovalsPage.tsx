import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { API_BASE_URL, approveBook, getPendingBooks, rejectBook } from "../services/apiService";
import type { Book } from "../types/models";
import FlashMessage, { type FlashMessageType } from "../components/FlashMessage";
import Button from "../components/Button";
import AdminNav from "../components/AdminNav/AdminNav";
import styles from "./PendingApprovalsPage.module.css";

const getImageUrl = (bookId: number): string => `${API_BASE_URL}/books/${bookId}/image`;

export default function PendingApprovalsPage() {
  const auth = useAuth();
  const [pendingBooks, setPendingBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingBookId, setProcessingBookId] = useState<number | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<FlashMessageType>("success");

  const isAdmin = auth.isAuthenticated && auth.user?.profile?.["market.admin"] === "1";

  const loadPendingBooks = useCallback(async () => {
    const token = auth.user?.access_token;

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const books = await getPendingBooks(token);
      setPendingBooks(books);
    } catch (error) {
      setFlashType("error");
      setFlashMessage(
        "Nepodařilo se načíst inzeráty ke schválení. " +
          (error instanceof Error ? error.message : "")
      );
    } finally {
      setIsLoading(false);
    }
  }, [auth.user?.access_token]);

  useEffect(() => {
    document.title = "Schvalování inzerátů | PSLIB Market";
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated || !isAdmin) {
      setIsLoading(false);
      return;
    }

    void loadPendingBooks();
  }, [auth.isAuthenticated, isAdmin, loadPendingBooks]);

  const handleDecision = async (bookId: number, action: "approve" | "reject") => {
    const token = auth.user?.access_token;

    if (!token) {
      setFlashType("error");
      setFlashMessage("Nejste přihlášený.");
      return;
    }

    try {
      setProcessingBookId(bookId);

      if (action === "approve") {
        await approveBook(bookId, token);
        setFlashType("success");
        setFlashMessage("Inzerát byl schválen.");
      } else {
        await rejectBook(bookId, token);
        setFlashType("success");
        setFlashMessage("Inzerát byl zamítnut.");
      }

      setPendingBooks((current) => current.filter((book) => book.id !== bookId));
    } catch (error) {
      setFlashType("error");
      setFlashMessage(
        "Nepodařilo se uložit rozhodnutí. " +
          (error instanceof Error ? error.message : "")
      );
    } finally {
      setProcessingBookId(null);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <main className={styles.page}>
        <h2>Schvalování inzerátů</h2>
        <p>Pro zobrazení této stránky se prosím přihlaste.</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <h2>Schvalování inzerátů</h2>
        <p>Tato stránka je dostupná pouze administrátorům.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h2 className={styles.title}>Čekající inzeráty ke schválení</h2>
      <AdminNav />

      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {isLoading ? (
        <p>Načítám inzeráty...</p>
      ) : pendingBooks.length === 0 ? (
        <p>Aktuálně nejsou žádné čekající inzeráty.</p>
      ) : (
        <div className={styles.list}>
          {pendingBooks.map((book) => {
            const isProcessing = processingBookId === book.id;

            return (
              <article key={book.id} className={styles.card}>
                <img
                  src={getImageUrl(book.id)}
                  alt={`Náhled knihy ${book.title}`}
                  className={styles.image}
                  loading="lazy"
                />

                <div className={styles.content}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.meta}>Autor inzerátu: {book.ownerName}</p>
                  <p className={styles.meta}>Email: {book.ownerEmail}</p>
                  <p className={styles.meta}>Cena: {book.price} Kč</p>
                  <p className={styles.meta}>Předmět: {(book.tags ?? []).join(", ") || "Neuvedeno"}</p>
                  <p className={styles.meta}>Popis: {book.description?.trim() || "Bez popisu"}</p>

                  <div className={styles.actions}>
                    <Button
                      text="Schválit"
                      onClick={() => handleDecision(book.id, "approve")}
                      disabled={isProcessing}
                    />
                    <Button
                      text="Zamítnout"
                      variant="secondary"
                      onClick={() => handleDecision(book.id, "reject")}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
