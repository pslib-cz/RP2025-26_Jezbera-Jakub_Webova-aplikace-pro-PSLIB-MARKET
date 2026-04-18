import { useEffect, useState } from 'react'
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

  useEffect(() => {
    document.title = 'Nabídka knih | PSLIB Market'

    getBooks().then(data =>  setBooks(data));
  }, [])

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



  return (
    <main>
      {flashMessage && (
        <FlashMessage
          message={flashMessage}
          type={flashType}
          onClose={() => setFlashMessage(null)}
        />
      )}
      <div className={styles.bookGrid}>
        {filteredBooks.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            description={book.description}
            price={book.price}
            ownerName={book.ownerName}
            ownerEmail={book.ownerEmail}
            condition={book.condition}
            tags={book.tags}
          />
        ))}
      </div>
    </main>
  )
}

export default HomePage