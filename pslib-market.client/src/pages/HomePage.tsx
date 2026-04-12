import { useEffect } from 'react'

const HomePage = () => {
  useEffect(() => {
    document.title = 'Nabídka knih | PSLIB Market'
  }, [])

  return (
    <main>
      <h1>Nabídka knih</h1>
    </main>
  )
}

export default HomePage