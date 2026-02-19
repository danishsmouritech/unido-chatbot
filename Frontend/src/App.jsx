import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import PrivateRoute from "./PrivateRoute";
import { ToastContainer } from 'react-toastify';
function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/page" element={ <AdminPanel />}/>
        {/* <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        /> */}
        </Routes>
      <ToastContainer
     position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  draggable
  theme="colored"   />
    </div>
  );
}

export default App;
