import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Goals from "./pages/Goals";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RoadmapInput from "./pages/RoadmapInput";
import RoadmapResult from "./pages/RoadmapResult";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/roadmap" element={<RoadmapInput />} /> {/* ✅ FIXED */}
        <Route path="/roadmap/result" element={<RoadmapResult />} /> {/* ✅ New */}
      </Routes>
      <Footer />
    </Router>
  );
}
