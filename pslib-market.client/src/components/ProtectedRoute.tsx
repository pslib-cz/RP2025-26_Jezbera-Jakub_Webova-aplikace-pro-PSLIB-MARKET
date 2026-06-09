import { Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import styles from './ProtectedRoute.module.css';
import Button from './Button';

export default function ProtectedRoute({requireAdmin = false}: {requireAdmin?: boolean}) {
    const auth = useAuth();
    const claim = auth.user?.profile?.["market.admin"];
    const isAdmin = auth.isAuthenticated && (claim === "true" || claim === "1");

    if (!auth.isAuthenticated) {
        return (
            <main className={styles.container}>
                <div className={styles.block}>
                    <p className={styles.title}>Nemáte oprávnění</p>
                    <p className={styles.text}>Pro zobrazení této stránky musíte být přihlášeni.</p>
                    <Button onClick={() => auth.signinRedirect()} text="Přihlásit se" />
                </div>
            </main>
        );
    }

    if (requireAdmin && !isAdmin) {
        return (
            <main className={styles.container}>
                <div className={styles.block}>
                    <p className={styles.title}>Nemáte oprávnění</p>
                    <p className={styles.text}>Pro zobrazení této stránky musíte být administrátorem.</p>
                </div>
            </main>
        );
    }

    return <Outlet />;
    
}
