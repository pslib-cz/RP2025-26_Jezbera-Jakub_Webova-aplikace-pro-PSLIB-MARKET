import styles from './SearchBar.module.css'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const SearchBarIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.2 16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const SearchBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('q') ?? ''

  const updateSearch = (value: string) => {
    const params = new URLSearchParams()
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set('q', normalizedValue)
    }

    navigate(
      {
        pathname: '/',
        search: params.toString() ? `?${params.toString()}` : '',
      },
      {
        replace: location.pathname === '/',
      },
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    updateSearch(nextValue)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearch(searchTerm)
  }

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit} role='search' aria-label='Vyhledávání knih'>
      <input
        className={styles.input}
        type='search'
        placeholder='Vyhledat'
        aria-label='Vyhledat'
        value={searchTerm}
        onChange={handleInputChange}
      />
      <button type='submit' className={styles.iconButton} aria-label='Spustit vyhledávání'>
        <span className={styles.icon} aria-hidden='true'>
          <SearchBarIcon />
        </span>
      </button>
    </form>
  )
}

export default SearchBar