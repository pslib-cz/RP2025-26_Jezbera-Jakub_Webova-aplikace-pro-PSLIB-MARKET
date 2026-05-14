import styles from './Layout.module.css';
import Header from './Header/Header';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className={styles.App__container}>
        <Header />
        <Outlet />
    
    </div>
  )
}

export default Layout