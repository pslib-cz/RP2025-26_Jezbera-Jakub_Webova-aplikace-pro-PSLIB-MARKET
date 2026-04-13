import { useEffect } from 'react'

const AuditLogPage = () => {
  useEffect(() => {
    document.title = 'Audit log | PSLIB Market'
  }, [])

  return (
    <main>
      <h2>Audit log</h2>
    </main>
  )
}

export default AuditLogPage