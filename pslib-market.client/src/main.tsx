import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const oidcConfig = {
    authority: import.meta.env.VITE_OIDC_AUTHORITY,
    client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
    // client_secret: 'marketpslibcloudviaoauth', // dnes už ne, jde o public clienta, místo secret použijeme PKCE flow
    redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
    scope: 'openid email pslib market',
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
 }


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...oidcConfig}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>,
);