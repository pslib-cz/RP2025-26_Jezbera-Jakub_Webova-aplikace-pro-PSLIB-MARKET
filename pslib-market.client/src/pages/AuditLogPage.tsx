import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import AdminNav from '../components/AdminNav/AdminNav'
import FlashMessage from '../components/FlashMessage'
import { getAuditLogs } from '../services/apiService'
import type { BookActivityLog } from '../types/models'
import styles from './AuditLogPage.module.css'

const hasAdminAccess = (profile: Record<string, unknown> | undefined): boolean => {
  if (!profile) return false
  const adminClaim = profile['market.admin']
  const claimValues = Array.isArray(adminClaim) ? adminClaim : [adminClaim]
  return claimValues.some((value) => value === 1 || value === '1')
}

const truncateTitle = (title: string) => 
  title.length > 20 ? `${title.slice(0, 17)}...` : title;

const AuditLogPage = () => {
  const auth = useAuth()
  const [logs, setLogs] = useState<BookActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null) 

  const isAdmin = auth.isAuthenticated && hasAdminAccess(auth.user?.profile as Record<string, unknown> | undefined)

  useEffect(() => {
    document.title = 'Audit log | PSLIB Market'
  }, [])

  useEffect(() => {
    const loadLogs = async () => {
      const token = auth.user?.access_token
      if (!token || !isAdmin) {
        setIsLoading(false)
        return
      }

      try {
        const data = await getAuditLogs(token)
        setLogs(data)
      } catch (error) {
        setErrorMsg('Nepodařilo se načíst audit log. ' + (error instanceof Error ? error.message : ''))
      } finally {
        setIsLoading(false)
      }
    }

    void loadLogs()
  }, [auth.user?.access_token, isAdmin])

  if (!auth.isAuthenticated || !isAdmin) {
    return (
      <main className={styles.page}>
        <h2 className={styles.title}>Audit log</h2>
        <p>{!auth.isAuthenticated ? 'Pro zobrazení této stránky se prosím přihlaste.' : 'Tato stránka je dostupná pouze administrátorům.'}</p>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <h2 className={styles.title}>Audit log</h2>
      <AdminNav />

      {errorMsg && (
        <FlashMessage
          message={errorMsg}
          type="error"
          onClose={() => setErrorMsg(null)}
        />
      )}

      {isLoading ? (
        <p>Načítám audit log...</p>
      ) : logs.length === 0 ? (
        <p>Zatím tu nejsou žádné záznamy.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Čas</th>
                <th>Uživatel</th>
                <th>Akce</th>
                <th>Inzerát</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timeStamp).toLocaleString('cs-CZ')}</td>
                  <td>{log.userId || 'Neznámý uživatel'}</td>
                  <td>{log.action}</td>
                  <td title={log.book?.title || `#${log.bookId}`}>
                    {log.book?.title
                      ? `${truncateTitle(log.book.title)} (#${log.bookId})`
                      : `#${log.bookId}`}
                  </td>
                  <td>{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default AuditLogPage