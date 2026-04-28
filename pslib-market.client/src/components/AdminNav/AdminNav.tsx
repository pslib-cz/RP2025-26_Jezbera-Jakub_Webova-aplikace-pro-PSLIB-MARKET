import { NavLink } from "react-router-dom";
import styles from "./AdminNav.module.css";

const getClassName = ({ isActive }: { isActive: boolean }) =>
  `${styles.link} ${isActive ? styles.active : ""}`.trim();

export default function AdminNav() {
  return (
    <nav className={styles.nav} aria-label="Admin sekce">
      <NavLink className={getClassName} to="/admin/schvalovani">
        Schvalování
      </NavLink>
      <NavLink className={getClassName} to="/admin/audit-log">
        Audit log
      </NavLink>
      <NavLink className={getClassName} to="/admin/tagy">
        Správa tagů
      </NavLink>
    </nav>
  );
}
