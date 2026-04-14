import React from 'react'
import { useAuth } from 'react-oidc-context';
import styles from './Layout.module.css';
import Header from './Header/Header';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    const auth = useAuth();
    
    // if (auth.isLoading) return <div>Načítám...</div>;
    // if (!auth.isAuthenticated) {
    //     return (
    //         <div className={styles.loginPrompt}>
    //             <h2>Vítejte v PSLIB Marketu</h2>
    //             <p>Pro zobrazení inzerátů se musíte přihlásit svým školním účtem.</p>
    //             <button onClick={() => auth.signinRedirect()}>Přihlásit se</button>
    //         </div>
    //     )
    // }

  return (
    <div className={styles.App__container}>
        <Header />
        <Outlet />
    
    </div>
  )
}

export default Layout