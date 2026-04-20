import styles from './Loader.module.css'

const Loader = () => {
  return (
    <div className={styles.loaderWrap} role='status' aria-label='Načítání'>
      <div className={styles.loaderSpinner} aria-hidden='true' />
    </div>
  )
}

export default Loader