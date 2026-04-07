import { createContext } from 'react';

export const AuthContext = createContext({
  user: {
    id: "user1",
    name: "Testovaci uzivatel",
    email: "student@pslib.cz",
    isAdmin: true
  }
});