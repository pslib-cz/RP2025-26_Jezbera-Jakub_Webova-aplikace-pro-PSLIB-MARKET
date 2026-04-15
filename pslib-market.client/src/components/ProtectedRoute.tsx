import { Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import styles from './ProtectedRoute.module.css';
import Button from './Button';

export default function ProtectedRoute() {
    const auth = useAuth();

    if (auth.isAuthenticated) {
        return <Outlet />;
    }

    return (
        <main className={styles.container}>
            <div className={styles.block}>
                <p className={styles.title}>Nejste přihlášený</p>
                <p className={styles.text}>Pro zobrazení této stránky se prosím přihlaste.</p>

                <Button
                    text='Přihlásit se'
                    onClick={() => auth.signinRedirect()}

                />
            </div>
        </main>
    );
}
