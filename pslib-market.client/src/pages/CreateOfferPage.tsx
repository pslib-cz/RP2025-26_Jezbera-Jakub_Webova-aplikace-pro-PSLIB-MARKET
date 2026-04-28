import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { Tag } from '../types/models'
import AdForm from '../components/AdForm/AdForm'
import styles from './CreateOfferPage.module.css'

type CreateOfferLocationState = {
  book?: {
    id: number
    title?: string
    tags?: Tag[]
    condition?: number | string
    price?: number | string
    description?: string
  }
}

const CreateOfferPage = () => {
  const location = useLocation() as { state?: CreateOfferLocationState }
  const initialData = location.state?.book

  useEffect(() => {
    document.title = initialData ? 'Upravit inzerát | PSLIB Market' : 'Vytvořit inzerát | PSLIB Market'
  }, [initialData])

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.title}>
          {initialData ? 'Upravit inzerát' : 'Vytvořit inzerát'}
        </h2>
        <AdForm initialData={initialData} />
      </section>
    </main>
  )
}

export default CreateOfferPage