import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import './App.css';
import type { Book } from './types/models';

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const auth = useAuth();

  useEffect(() => {
    fetch('http://localhost:5263/api/books')
      .then(response => response.json())
      .then(data => setBooks(data))
      .catch(error => console.error("Chyba při stahování dat:", error));
  }, []);

  return (
    <div className="app">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <h1>PSLIB Market</h1>
        
        <div>
          {auth.isLoading && <span>Ověřuji...</span>}
          {auth.error && <div style={{ color: 'red', fontWeight: 'bold' }}>Chyba: {auth.error.message}</div>}
          {auth.isAuthenticated && (
            <div>
              <span style={{ marginRight: '1rem' }}>Ahoj, {auth.user?.profile.email}</span>
              <button onClick={() => auth.removeUser()}>Odhlásit</button>
            </div>
          )}
          {!auth.isAuthenticated && !auth.isLoading && (
            <button onClick={() => auth.signinRedirect()}>Přihlásit se školním účtem</button>
          )}
        </div>
      </header>

      <main>
        <h2>Knihy v nabídce</h2>
        {books.length === 0 ? (
          <p>Načítám data z databáze...</p>
        ) : (
          <ul>
            {books.map(book => (
              <li key={book.id}>{book.title} - {book.price} Kč</li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;