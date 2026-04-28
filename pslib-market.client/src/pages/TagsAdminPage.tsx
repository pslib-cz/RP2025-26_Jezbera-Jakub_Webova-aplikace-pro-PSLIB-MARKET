// pages/TagsAdminPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import Button from '../components/Button';
import { createTag, getTags } from '../services/apiService';
import type { Tag } from '../types/models';
import AdminNav from '../components/AdminNav/AdminNav';
import styles from './TagsAdminPage.module.css';

const TagsAdminPage = () => {
  const auth = useAuth();
  
  const [name, setName] = useState('');
  const [bgColor, setBgColor] = useState('#4281CE');
  const [textColor, setTextColor] = useState('#FFFFFF');
  
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const token = auth.user?.access_token;
    if (!token) {
       alert('Nejste přihlášený nebo nemáte práva.');
       return;
    }

    try {
       await createTag({ name: name.trim(), bgColor, textColor }, token);
       
       alert('Tag byl úspěšně vytvořen!');
       setName(''); 
       
       loadTags(); 
    } catch (error) {
       console.error(error);
       alert(error instanceof Error ? error.message : 'Chyba při vytváření. Tag už možná existuje.');
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.noticeCard}>
          <h2 className={styles.title}>Správa tagů</h2>
          <p className={styles.noticeText}>Pro zobrazení této stránky se prosím přihlaste.</p>
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
          <h3 className={styles.cardTitle}>Vytvořit nový tag</h3>

          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tagName">
                Název tagu
                <span className={styles.required}>*</span>
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
                {name || 'Náhled tagu'}
              </span>
            </div>

            <div className={styles.buttonRow}>
              <Button text="Přidat tag do databáze" type="submit" />
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Aktuální tagy v databázi</h3>

          {isLoading ? (
            <p className={styles.stateText}>Načítám...</p>
          ) : existingTags.length === 0 ? (
            <p className={styles.stateText}>V databázi zatím nejsou žádné tagy.</p>
          ) : (
            <div className={styles.tagsList}>
              {existingTags.map((tag) => (
                <span
                  key={tag.name}
                  className={styles.tagPill}
                  style={{
                    backgroundColor: tag.bgColor,
                    color: tag.textColor,
                    borderColor: tag.bgColor,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default TagsAdminPage;