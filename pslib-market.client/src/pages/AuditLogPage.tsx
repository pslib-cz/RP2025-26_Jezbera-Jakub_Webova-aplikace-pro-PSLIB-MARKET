import { useEffect } from 'react'
import AdminNav from '../components/AdminNav/AdminNav'
import styles from './AuditLogPage.module.css'

const AuditLogPage = () => {
  useEffect(() => {
    document.title = 'Audit log | PSLIB Market'
  }, [])

  return (
    <main className={styles.page}>
      <h2 className={styles.title}>Audit log</h2>
      <AdminNav />
    </main>
  )
}

export default AuditLogPage