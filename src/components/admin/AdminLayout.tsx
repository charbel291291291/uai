import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package2,
  ShoppingBag,
  CreditCard,
  Wifi,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin', label: 'Products', icon: ShoppingBag, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Package2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/nfc', label: 'NFC Orders', icon: Wifi },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className="h-fit rounded-[28px] border border-white/5 bg-white/[0.02] p-4 lg:sticky lg:top-24">
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/[0.02] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-brand-accent">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Admin
              </p>
              <h1 className="text-base font-semibold text-white">Control Panel</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ── Content ──────────────────────────────── */}
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
