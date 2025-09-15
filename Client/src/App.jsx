import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import CandidatePage from "./pages/CandidatePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const linkStyle = ({ isActive }) =>
    ["tab", isActive ? "active" : ""].join(" ").trim();

  return (
    <BrowserRouter>
      <header className="header">
        <nav className="nav">
          <div className="brand">🎓 Centre de formation</div>
          <div className="tabs">
            <NavLink to="/" end className={linkStyle}>
              Espace Candidat
            </NavLink>
            <NavLink to="/admin" className={linkStyle}>
              Espace Admin
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="container stack">
        <Routes>
          <Route path="/" element={<CandidatePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} – Mini projet CRUD (React + Node +
        Supabase)
      </footer>
    </BrowserRouter>
  );
}
