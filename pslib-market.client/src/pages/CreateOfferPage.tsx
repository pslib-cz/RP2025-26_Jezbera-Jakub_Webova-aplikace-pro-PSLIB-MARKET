import { useEffect } from 'react'

const CreateOfferPage = () => {
  useEffect(() => {
    document.title = 'Vytvořit inzerát | PSLIB Market'
  }, [])

  return (
    <main>
      <h1>Vytvořit inzerát</h1>
    </main>
  )
}

export default CreateOfferPage