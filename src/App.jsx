// แก้บรรทัดบนสุด
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminCreateCase from './pages/admin/AdminCreateCase';
import AdminDashboard from './pages/admin/AdminDashboard';
import GuestPortal from './pages/guest/GuestPortal'; 

function App() {
  return (
    // เปลี่ยนแท็กนี้เป็น HashRouter
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/create" />} />
        <Route path="/admin/create" element={<AdminCreateCase />} />
        <Route path="/admin/dashboard/:caseId" element={<AdminDashboard />} />
        <Route path="/guest/:token" element={<GuestPortal />} />
      </Routes>
    </HashRouter>
  );
}

export default App;