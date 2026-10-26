import { SafetyAlertModal } from "./SafetyAlertModal";
import { alertAPI, SafetyAlert } from "@/services/alert";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState, useEffect } from "react";
import { authAPI } from '@/services/auth';
import { useSafetyAlerts } from "@/hooks/useSafetyAlerts";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/timer", label: "Ping" },
  { to: "/vault", label: "Red Mode" },
  { to: "/support", label: "Support" },
] as const;

const serviceLinks = [
  { to: "/contacts", label: "Trusted Contacts" },
  { to: "/check-in-history", label: "Check-in History" },
  { to: "/discreet-mode", label: "Discreet Mode Guide" },
];

export function AppShell({
  title,
  eyebrow,
  children,
  red,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  red?: boolean;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [activeAlerts, setActiveAlerts] = useState<SafetyAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<SafetyAlert | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem("safepath_token");
    setIsLoggedIn(!!token);

    if (!token) return;

    // Poll for active alerts every 15 seconds
    const fetchAlerts = async () => {
      try {
        const alerts = await alertAPI.getActiveAlerts();
        if (alerts && alerts.length > 0) {
          setActiveAlerts(alerts);
          if (!currentAlert) {
            setCurrentAlert(alerts[0]); // Pop up the latest alert modal
          }
        }
      } catch (err) {
        // Silently catch background poll errors
      }
    };

    //fetchAlerts();
    const interval = setInterval(fetchAlerts, 75000);
    return () => clearInterval(interval);
  }, [currentAlert]);
  
  useEffect(() => {
    // Check authentication state on client side
    const token = localStorage.getItem("safepath_token");
    setIsLoggedIn(!!token);
  }, []);
// Load in-app safety alerts
  const { alerts, unreadCount, activeModalAlert, dismissModal } = useSafetyAlerts(12000);

  const handleLogout = async () => {
    localStorage.removeItem("safepath_token");
    localStorage.removeItem("userid");
    localStorage.removeItem("challenge_id");
    localStorage.removeItem("temp_email");
    setIsLoggedIn(false);
    const data = await authAPI.logout();
    navigate({ to: "/home" });
  };

  return (
    <div className={`mx-auto flex min-h-screen max-w-md flex-col relative ${red ? "red-mode" : ""}`}>
      
      {/* Top Header with Hamburger & Auth / User Profile */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">
            <span className="brand-wordmark font-bold">ONE 2 MANY</span>{" "}
            <span className="text-muted-foreground">· {eyebrow}</span>
          </p>
          <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell with Dynamic Unread Badge */}
          {isLoggedIn && (
            <button
              onClick={() => alerts.length > 0 && dismissModal()}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-foreground"
              aria-label="Safety Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

        </div>
      
        <div className="flex items-center gap-3">
          {/* Auth-aware User Area / Logout */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20"
                title="Logged in user"
              >
                👤
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
            >
              Sign In
            </Link>
          )}

          {
          
          /* Hamburger Menu Trigger for Services */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle services menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Expandable Services Hamburger Drawer / Dropdown */}
      {menuOpen && (
        <div className="absolute top-20 right-6 z-50 w-64 rounded-2xl border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Safety Services
          </p>
          <div className="flex flex-col gap-1">
            {serviceLinks.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-6 pb-28">{children}</main>
       
      
          {/* Global Safety Alert Modal Triggered by Polling */}
          <SafetyAlertModal
            alert={currentAlert}
            onClose={() => {
              setCurrentAlert(null);
            }}
          />
    
          {/* ... your bottom nav ... */}
       
      
  
      {/* Cleaned-up Bottom Navigation (Tabs Only) */}
      <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-md grid-cols-4 border-t bg-card/95 backdrop-blur z-40">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="py-4 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}