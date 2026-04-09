import { Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import { useAuth } from 'react-oidc-context';
import AuditLogPage from './pages/AuditLogPage';
import MyOffersPage from './pages/MyOffersPage';
import CreateOfferPage from './pages/CreateOfferPage';
import Loader from './components/Loader';
import Layout from './components/Layout';



function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return  <Loader />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/*" element={<HomePage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/moje-inzeraty" element={<MyOffersPage />} />
        <Route path="/vytvorit-inzerat" element={<CreateOfferPage />} />
      </Route>
    </Routes>
  );
}



export default App;