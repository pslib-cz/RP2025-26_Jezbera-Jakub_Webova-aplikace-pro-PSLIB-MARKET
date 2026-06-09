import { Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import { useAuth } from 'react-oidc-context';
import AuditLogPage from './pages/AuditLogPage';
import MyOffersPage from './pages/MyOffersPage';
import CreateOfferPage from './pages/CreateOfferPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import Loader from './components/Loader';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import TagsAdminPage from './pages/TagsAdminPage';



function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/*" element={<HomePage />} />

        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin/schvalovani" element={<PendingApprovalsPage />} />
          <Route path="/admin/audit-log" element={<AuditLogPage />} />
          <Route path="/admin/tagy" element={<TagsAdminPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/moje-inzeraty" element={<MyOffersPage />} />
          <Route path="/vytvorit-inzerat" element={<CreateOfferPage />} />
          <Route path="/upravit-inzerat/:id" element={<CreateOfferPage />} />
        </Route>
      </Route>
    </Routes>
  );
}


export default App;