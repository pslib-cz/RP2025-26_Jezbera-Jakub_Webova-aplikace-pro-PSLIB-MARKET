import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import Button from "../components/Button";
import {
  createTag,
  getTags,
  updateTag,
  deleteTag,
} from "../services/apiService";
import type { Tag } from "../types/models";
import AdminNav from "../components/AdminNav/AdminNav";
import styles from "./TagsAdminPage.module.css";

const TagsAdminPage = () => {
  const auth = useAuth();

  const [name, setName] = useState("");
  const [bgColor, setBgColor] = useState("#4281CE");
  const [textColor, setTextColor] = useState("#FFFFFF");

  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      const tags = await getTags();
      setExistingTags(tags);
    } catch (error) {
      console.error("Chyba při načítání tagů:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Správa tagů | PSLIB Market";
    loadTags();
  }, [loadTags]);

  const resetForm = () => {
    setName("");
    setBgColor("#4281CE");
    setTextColor("#FFFFFF");
    setEditingTag(null);
  };

  const handleEditClick = (tag: Tag) => {
    setName(tag.name);
    setBgColor(tag.bgColor);
    setTextColor(tag.textColor);
    setEditingTag(tag.name);
  };

  const handleDelete = async (tagName: string) => {
    if (
      !window.confirm(
        `Opravdu chceš smazat předmět "${tagName}"? Všem inzerátům zmizí štítek.`,
      )
    )
      return;

    const token = auth.user?.access_token;
    if (!token) return;

    try {
      await deleteTag(tagName, token);
      alert("Předmět smazán.");
      if (editingTag === tagName) resetForm();
      loadTags();
    } catch (error) {
      alert("Chyba při mazání tagu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const token = auth.user?.access_token;
    if (!token) {
      alert("Nejste přihlášený nebo nemáte práva.");
      return;
    }

    try {
      if (editingTag) {
        await updateTag(
          editingTag,
          { name: name.trim(), bgColor, textColor },
          token,
        );
        alert("Tag byl úspěšně upraven!");
      } else {
        await createTag({ name: name.trim(), bgColor, textColor }, token);
        alert("Tag byl úspěšně vytvořen!");
      }
      resetForm();
      loadTags();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Chyba serveru. Tag už možná existuje.",
      );
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.noticeCard}>
          <h2 className={styles.title}>Správa tagů</h2>
          <p className={styles.noticeText}>
            Pro zobrazení této stránky se prosím přihlaste.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Správa tagů</h2>
      </div>

      <AdminNav />

      <div className={styles.layout}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>
            {editingTag ? "Upravit existující tag" : "Vytvořit nový tag"}
          </h3>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tagName">
                Název tagu <span className={styles.required}>*</span>
              </label>
              <input
                id="tagName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={styles.input}
                placeholder="Např. Matematika"
              />
            </div>

            <div className={styles.colorRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bgColor">
                  Barva pozadí
                </label>
                <input
                  id="bgColor"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="textColor">
                  Barva textu
                </label>
                <input
                  id="textColor"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className={styles.colorInput}
                />
              </div>
            </div>

            <div className={styles.previewBlock}>
              <p className={styles.previewLabel}>Živý náhled</p>
              <span
                className={styles.previewPill}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: bgColor,
                }}
              >
                {name || "Náhled tagu"}
              </span>
            </div>

            <div className={styles.buttonRow}>
              <Button
                text={editingTag ? "Uložit změny" : "Přidat tag do databáze"}
                type="submit"
              />
              {editingTag && (
                <Button
                  text="Zrušit"
                  variant="secondary"
                  onClick={resetForm}
                  type="button"
                />
              )}
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Aktuální tagy v databázi</h3>

          {isLoading ? (
            <p className={styles.stateText}>Načítám...</p>
          ) : existingTags.length === 0 ? (
            <p className={styles.stateText}>
              V databázi zatím nejsou žádné tagy.
            </p>
          ) : (
            <div className={styles.tagsList}>
              {existingTags.map((tag) => (
                <div
                  key={tag.name}
                  className={styles.adminTagPill}
                  style={{
                    backgroundColor: tag.bgColor,
                    color: tag.textColor,
                    borderColor: tag.bgColor,
                  }}
                >
                  <span className={styles.adminTagText}>{tag.name}</span>

                  <div className={styles.tagActions}>
                    <button
                      type="button"
                      onClick={() => handleEditClick(tag)}
                      className={styles.iconBtn}
                      aria-label="Upravit"
                      title="Upravit"
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
                        <path d="M4 20h4l10-10-4-4L4 16v4zM15 5l4 4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(tag.name)}
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      aria-label="Smazat"
                      title="Smazat"
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
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default TagsAdminPage;
