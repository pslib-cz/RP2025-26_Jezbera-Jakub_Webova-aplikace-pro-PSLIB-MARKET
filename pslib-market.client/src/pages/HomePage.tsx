import { useEffect } from 'react'

const HomePage = () => {
  useEffect(() => {
    document.title = 'Nabídka knih | PSLIB Market'
  }, [])

  return (
    <main>
      <h2>Nabídka knih</h2>
    </main>
  )
}

export default HomePage