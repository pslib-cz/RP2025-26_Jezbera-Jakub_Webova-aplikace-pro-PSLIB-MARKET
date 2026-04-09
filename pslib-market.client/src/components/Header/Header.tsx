import styles from './Header.module.css'
import SearchBar from './SearchBar'
import Button from '../Button'
import { useNavigate } from 'react-router-dom'

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 6H11M6 1V11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>

)

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <img className={styles.logo} src='/logo.svg' alt='Logo' />
        <h1 className={styles.title}>Pslib Market</h1>
      </div>
      <SearchBar />
      <Button text='Moje inzeráty' onClick={() => {navigate('/moje-inzeraty')}} variant='secondary' />
      <Button text='Vytvořit inzerát' icon={<PlusIcon />} iconPosition='right' onClick={() => {navigate('/vytvorit-inzerat')}} />



    </div>
  )
}

export default Header