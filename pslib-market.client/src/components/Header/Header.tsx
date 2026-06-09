import styles from "./Header.module.css";
import SearchBar from "./SearchBar";
import Button from "../Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useState } from "react";

const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 6H11M6 1V11"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 20L16.2 16.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const HomeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 10.5L12 4L20 10.5V20H14.5V14H9.5V20H4V10.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SignInIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.014 8.46835C14.7204 8.17619 14.2455 8.17737 13.9533 8.47099C13.6612 8.76462 13.6624 9.23949 13.956 9.53165L15.014 8.46835ZM16.971 12.5317C17.2646 12.8238 17.7395 12.8226 18.0317 12.529C18.3238 12.2354 18.3226 11.7605 18.029 11.4683L16.971 12.5317ZM18.029 12.5317C18.3226 12.2395 18.3238 11.7646 18.0317 11.471C17.7395 11.1774 17.2646 11.1762 16.971 11.4683L18.029 12.5317ZM13.956 14.4683C13.6624 14.7605 13.6612 15.2354 13.9533 15.529C14.2455 15.8226 14.7204 15.8238 15.014 15.5317L13.956 14.4683ZM17.5 12.75C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25V12.75ZM3.5 11.25C3.08579 11.25 2.75 11.5858 2.75 12C2.75 12.4142 3.08579 12.75 3.5 12.75V11.25ZM13.956 9.53165L16.971 12.5317L18.029 11.4683L15.014 8.46835L13.956 9.53165ZM16.971 11.4683L13.956 14.4683L15.014 15.5317L18.029 12.5317L16.971 11.4683ZM17.5 11.25H3.5V12.75H17.5V11.25Z"
      fill="currentColor"
    />
    <path
      d="M9.5 15C9.5 17.2091 11.2909 19 13.5 19H17.5C19.7091 19 21.5 17.2091 21.5 15V9C21.5 6.79086 19.7091 5 17.5 5H13.5C11.2909 5 9.5 6.79086 9.5 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const SignOutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.04401 9.53165C7.33763 9.23949 7.33881 8.76462 7.04665 8.47099C6.75449 8.17737 6.27962 8.17619 5.98599 8.46835L7.04401 9.53165ZM2.97099 11.4683C2.67737 11.7605 2.67619 12.2354 2.96835 12.529C3.26051 12.8226 3.73538 12.8238 4.02901 12.5317L2.97099 11.4683ZM4.02901 11.4683C3.73538 11.1762 3.26051 11.1774 2.96835 11.471C2.67619 11.7646 2.67737 12.2395 2.97099 12.5317L4.02901 11.4683ZM5.98599 15.5317C6.27962 15.8238 6.75449 15.8226 7.04665 15.529C7.33881 15.2354 7.33763 14.7605 7.04401 14.4683L5.98599 15.5317ZM3.5 11.25C3.08579 11.25 2.75 11.5858 2.75 12C2.75 12.4142 3.08579 12.75 3.5 12.75V11.25ZM17.5 12.75C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25V12.75ZM5.98599 8.46835L2.97099 11.4683L4.02901 12.5317L7.04401 9.53165L5.98599 8.46835ZM2.97099 12.5317L5.98599 15.5317L7.04401 14.4683L4.02901 11.4683L2.97099 12.5317ZM3.5 12.75L17.5 12.75V11.25L3.5 11.25V12.75Z"
      fill="var(--black)"
    />
    <path
      d="M9.5 15C9.5 17.2091 11.2909 19 13.5 19H17.5C19.7091 19 21.5 17.2091 21.5 15V9C21.5 6.79086 19.7091 5 17.5 5H13.5C11.2909 5 9.5 6.79086 9.5 9"
      stroke="var(--black)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const isCreateOfferPage = location.pathname === "/vytvorit-inzerat";
  const isMyOffersPage = location.pathname === "/moje-inzeraty";
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldShowHomeFirst = isCreateOfferPage || isMyOffersPage || isAdminPage;

  const adminClaim = auth.user?.profile?.["market.admin"];
  const isAdmin = auth.isAuthenticated && (adminClaim === "1" || adminClaim === true);

  const handleLocalSignOut = async () => {
    await auth.removeUser();
    navigate("/");
  };

  return (
    <div className={styles.headerShell}>
      <div className={styles.header}>
        <Link
          to="/"
          className={`${styles.brand} ${styles.brandLink}`.trim()}
          aria-label="Přejít na domovskou stránku"
        >
          <img
            className={styles.logo}
            src="/logo.png"
            alt="Logo aplikace PSLIB Market"
            width="60"
            height="50"
          />
          <h1 className={styles.title}>
            PSLIB <span className={styles.highlight}>MARKET</span>
          </h1>
        </Link>
        <div className={styles.quickActions}>
          <button
            type="button"
            className={styles.searchToggle}
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label="Otevřít vyhledávání"
            aria-expanded={isMobileSearchOpen}
          >
            <SearchIcon />
          </button>

          {auth.isAuthenticated ? (
            <Button
              icon={<SignOutIcon />}
              iconOnly
              onClick={() => {
                void handleLocalSignOut();
              }}
              variant="secondary"
              ariaLabel="Odhlásit se"
            />
          ) : (
            <Button
              icon={<SignInIcon />}
              iconOnly
              onClick={() => {
                auth.signinRedirect().catch((err) => {
                  console.error("3. KRITICKÁ CHYBA PŘI OAUTH:", err);
                });
              }}
              ariaLabel="Přihlásit se"
            />
          )}
        </div>
        <div
          className={`${styles.searchRow} ${isMobileSearchOpen ? styles.searchRowOpen : ""}`.trim()}
        >
          <SearchBar />
        </div>
        <div className={styles.actionsRight}>
          <nav className={styles.nav} aria-label="Hlavní navigace">
            <menu className={styles.menu}>
              {isAdmin && (
                <li>
                  <Link className={`${styles.navLink} ${styles.navLinkPrimary}`.trim()}
                    to="/admin/schvalovani">
                    Admin
                  </Link>
                </li>
              )}
              <li>
                {shouldShowHomeFirst ? (
                  <Link
                    className={`${styles.navLink} ${styles.navLinkSecondary}`.trim()}
                    to="/"
                  >
                    Domů
                    <span className={styles.navIcon} aria-hidden="true">
                      <HomeIcon />
                    </span>
                  </Link>
                ) : (
                  <Link
                    className={`${styles.navLink} ${styles.navLinkSecondary}`.trim()}
                    to="/moje-inzeraty"
                  >
                    Moje inzeráty
                  </Link>
                )}
              </li>
              <li>
                {isCreateOfferPage ? (
                  <Link
                    className={`${styles.navLink} ${styles.navLinkPrimary}`.trim()}
                    to="/moje-inzeraty"
                  >
                    Moje inzeráty
                  </Link>
                ) : (
                  <Link
                    className={`${styles.navLink} ${styles.navLinkPrimary}`.trim()}
                    to="/vytvorit-inzerat"
                  >
                    Vytvořit inzerát
                    <span className={styles.navIcon} aria-hidden="true">
                      <PlusIcon />
                    </span>
                  </Link>
                )}
              </li>
            </menu>
          </nav>
          <div className={styles.desktopAuth}>
            {auth.isAuthenticated && (
              <span className={styles.userInfo}>
                {auth.user?.profile?.name ?? auth.user?.profile?.email}
              </span>
            )}
            {auth.isAuthenticated ? (
              <Button
                icon={<SignOutIcon />}
                iconOnly
                onClick={() => {
                  void handleLocalSignOut();
                }}
                variant="secondary"
                ariaLabel="Odhlásit se"
              />
            ) : (
              <Button
                icon={<SignInIcon />}
                iconOnly
                onClick={() => {
                  auth.signinRedirect().catch((err) => {
                    console.error("3. KRITICKÁ CHYBA PŘI OAUTH:", err);
                  });
                }}
                ariaLabel="Přihlásit se"
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Header;
