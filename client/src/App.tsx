import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login"; //Import Login Pages

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} /> //Route Path from Login
      </Routes>
    </BrowserRouter>
  );
}
