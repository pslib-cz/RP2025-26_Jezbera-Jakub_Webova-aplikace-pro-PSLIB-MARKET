import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App.tsx';
import './index.css';

const oidcConfig = {
    authority: 'https://oauth.pslib.cz',
    clientId: 'market',
    redirectUri: 'http://localhost:51572/callback',
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...oidcConfig}>
            <App />
        </AuthProvider>
    </StrictMode>,
);