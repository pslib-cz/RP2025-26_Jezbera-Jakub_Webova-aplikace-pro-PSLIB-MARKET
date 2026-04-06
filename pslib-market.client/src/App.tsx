import { useEffect, useState } from 'react';
import './App.css';

type Book = {
  id: number;
  title: string;
  price: number;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetch('https://localhost:7049/api/books')
      .then(response => response.json())
      .then(data => setBooks(data))
      .catch(error => console.error("Chyba při stahování dat:", error));
  }, []);

  return (
    <div>
      <h1>Pslib Market - Test API</h1>
      {books.length === 0 ? (
        <p>Načítám data z databáze...</p>
      ) : (
        <ul>
          {books.map(book => (
            <li key={book.id}>
              {book.title} - {book.price} Kč
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;