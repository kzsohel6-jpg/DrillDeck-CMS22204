import { BarChart3, BookOpenCheck, History, LogOut, Settings2, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  const links = user.role === "admin"
    ? [
        { to: "/admin", label: "Performance overview", icon: BarChart3 },
        { to: "/admin/scenarios", label: "Scenario studio", icon: Settings2 },
        { to: "/admin/trainees", label: "Trainee records", icon: Users },
      ]
    : [
        { to: "/dashboard", label: "Training dashboard", icon: BarChart3 },
        { to: "/scenarios", label: "Scenario library", icon: BookOpenCheck },
        { to: "/history", label: "Performance history", icon: History },
      ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand brand-sidebar" to={user.role === "admin" ? "/admin" : "/dashboard"}>
          <img src="/brand/drilldeck-logo.svg" alt="DrillDeck" />
        </NavLink>

        <div className="user-chip">
          <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.role === "admin" ? "Trainer administrator" : "Trainee account"}</span>
          </div>
        </div>

        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span>SQL-backed platform</span>
          <strong>React · Express · SQLite</strong>
        </div>
        <button className="nav-link logout" onClick={logout}><LogOut size={19} /> Sign out</button>
      </aside>
      <main className="page-area">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <Outlet />
      </main>
    </div>
  );
}
