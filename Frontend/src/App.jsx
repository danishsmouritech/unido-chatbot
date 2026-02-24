import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import PrivateRoute from "./PrivateRoute";
import ChatWidget from "./components/ChatWidget";
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={ <AdminPanel />}/>
       {/* <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        /> */}
        <Route path="/chat-preview" element={<ChatWidget />} />
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
