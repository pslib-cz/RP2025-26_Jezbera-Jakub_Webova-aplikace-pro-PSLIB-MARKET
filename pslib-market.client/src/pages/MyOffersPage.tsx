import { useEffect } from 'react'

const MyOffersPage = () => {
  useEffect(() => {
    document.title = 'Moje inzeráty | PSLIB Market'
  }, [])

  return (
    <main>
      <h2>Moje inzeráty</h2>
    </main>
  )
}

export default MyOffersPage