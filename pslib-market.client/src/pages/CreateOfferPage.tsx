import { useEffect } from 'react'
import AdForm from '../components/AdForm/AdForm'
import styles from './CreateOfferPage.module.css'

const CreateOfferPage = () => {
  useEffect(() => {
    document.title = 'Vytvořit inzerát | PSLIB Market'
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.title}>Vytvořit inzerát</h2>
        <AdForm />
      </section>
    </main>
  )
}

export default CreateOfferPage