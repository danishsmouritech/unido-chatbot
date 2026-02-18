import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import PrivateRoute from "./PrivateRoute";

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
   
    </div>
  );
}

export default App;
