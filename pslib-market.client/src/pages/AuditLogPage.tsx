import { useEffect } from 'react'

const AuditLogPage = () => {
  useEffect(() => {
    document.title = 'Audit log | PSLIB Market'
  }, [])

  return (
    <main>
      <h1>Audit log</h1>
    </main>
  )
}

export default AuditLogPage