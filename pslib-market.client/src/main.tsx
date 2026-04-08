import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App.tsx';
import './index.css';

const oidcConfig = {
    authority: 'https://oauth.pslib.cz',
    client_id: 'market',
    client_secret: 'marketpslibcloudviaoauth', 
    redirect_uri: 'http://localhost:51572/callback',
    scope: 'openid email pslib',
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
 }


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...oidcConfig}>
            <App />
        </AuthProvider>
    </StrictMode>,
);