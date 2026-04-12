import styles from './SearchBar.module.css'

const SearchBarIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.2 16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const SearchBar = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit} role='search' aria-label='Vyhledávání knih'>
      <input className={styles.input} type='search' placeholder='Vyhledat' aria-label='Vyhledat' />
      <button type='submit' className={styles.iconButton} aria-label='Spustit vyhledávání'>
        <span className={styles.icon} aria-hidden='true'>
          <SearchBarIcon />
        </span>
      </button>
    </form>
  )
}

export default SearchBar