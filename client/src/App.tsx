import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login"; //Import Login Pages
import SignupPage from "./pages/signup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} /> 
        <Route path="/login" element={<LoginPage />} /> 
        <Route path="/signup" element={<SignupPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}
