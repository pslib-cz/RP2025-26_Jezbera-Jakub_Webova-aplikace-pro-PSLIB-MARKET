import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const currentOrigin = window.location.origin;
const configuredRedirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI as string | undefined;
const configuredPostLogoutRedirectUri = import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI as string | undefined;
const isLocalRuntime = /^(https?:\/\/(localhost|127\.0\.0\.1))(:\d+)?$/i.test(currentOrigin);

const redirectUri =
    !configuredRedirectUri || (!isLocalRuntime && configuredRedirectUri.includes('localhost'))
        ? `${currentOrigin}/callback`
        : configuredRedirectUri;

const postLogoutRedirectUri =
    !configuredPostLogoutRedirectUri || (!isLocalRuntime && configuredPostLogoutRedirectUri.includes('localhost'))
        ? `${currentOrigin}/`
        : configuredPostLogoutRedirectUri;

const oidcConfig = {
    authority: "https://oauth.pslib.cz",
    client_id: "market",
    // client_secret: 'marketpslibcloudviaoauth', // dnes už ne, jde o public clienta, místo secret použijeme PKCE flow
    redirect_uri: redirectUri,
    post_logout_redirect_uri: postLogoutRedirectUri,
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