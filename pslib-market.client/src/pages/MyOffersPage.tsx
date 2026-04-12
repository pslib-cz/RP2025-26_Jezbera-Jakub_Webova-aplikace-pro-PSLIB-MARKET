import { useEffect } from 'react'

const MyOffersPage = () => {
  useEffect(() => {
    document.title = 'Moje inzeráty | PSLIB Market'
  }, [])

  return (
    <main>
      <h1>Moje inzeráty</h1>
    </main>
  )
}

export default MyOffersPage