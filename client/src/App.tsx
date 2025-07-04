import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login"; //Import Login Pages
import SignupPage from "./pages/Signup"; //Import Signup Pages
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} /> 
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/signup" element={<SignupPage />} /> 
        <Route path="/login" element={<LoginPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}
