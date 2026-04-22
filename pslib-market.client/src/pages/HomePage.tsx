import { useCallback, useEffect, useState } from 'react'
import { getBooks } from '../services/apiService'
import BookCard from '../components/BookCard/BookCard'
import type { Book } from '../types/models'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FlashMessage, { type FlashMessageType } from '../components/FlashMessage'
import styles from './HomePage.module.css'

type FlashMessageState = {
  flashMessage?: string
  flashType?: FlashMessageType
}

const HomePage = () => {

  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [flashMessage, setFlashMessage] = useState<string | null>(() => {
    const state = location.state as FlashMessageState | null
    return state?.flashMessage ?? null
  })
  const [flashType] = useState<FlashMessageType>(() => {
    const state = location.state as FlashMessageState | null
    return state?.flashType ?? 'success'
  })

  const loadBooks = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await getBooks()
      setBooks(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Nepodařilo se načíst knihy.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Nabídka knih | PSLIB Market'
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const state = location.state as FlashMessageState | null
    if (!state?.flashMessage) {
      return
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase()

  const filteredBooks = !searchQuery
    ? books
    : books.filter((book) => {
      const searchableValues = [
        book.title,
        book.description ?? '',
        book.ownerName,
        (book.tags ?? []).join(' '),
      ]

      return searchableValues.some((value) =>
        value.toLowerCase().includes(searchQuery),
      )
    })

  const hasNoBooksAtAll = !isLoading && !loadError && books.length === 0
  const hasNoSearchResults = !isLoading && !loadError && books.length > 0 && filteredBooks.length === 0

  return (
    <main className={styles.page}>
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {isLoading && (
        <section className={styles.statePanel} aria-live='polite' aria-busy='true'>
          <div className={styles.loader} aria-hidden='true' />
          <p className={styles.stateTitle}>Načítám inzeráty</p>
          <p className={styles.stateText}>Chvilku strpení, připravujeme nabídku knih.</p>
        </section>
      )}

      {!isLoading && loadError && (
        <section className={`${styles.statePanel} ${styles.statePanelError}`} role='alert'>
          <p className={styles.stateTitle}>Načtení se nepovedlo</p>
          <p className={styles.stateText}>{loadError}</p>
          <button type='button' className={styles.retryButton} onClick={loadBooks}>
            Zkusit znovu
          </button>
        </section>
      )}

      {hasNoBooksAtAll && (
        <section className={styles.statePanel} aria-live='polite'>
          <p className={styles.stateTitle}>Zatím tu nejsou žádné knihy</p>
          <p className={styles.stateText}>Buď první, kdo přidá inzerát.</p>
        </section>
      )}

      {hasNoSearchResults && (
        <section className={styles.statePanel} aria-live='polite'>
          <p className={styles.stateTitle}>Žádná kniha neodpovídá hledání</p>
          <p className={styles.stateText}>Zkus upravit vyhledávací výraz.</p>
        </section>
      )}

      {!isLoading && !loadError && filteredBooks.length > 0 && (
        <div className={styles.bookGrid}>
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              description={book.description}
              price={book.price}
              ownerName={book.ownerName}
              saleStatus={book.saleStatus}
              condition={book.condition}
              tags={book.tags}
            />
          ))}
        </div>
      )}
    </main>
  )
}

export default HomePage