import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCcw } from "react-icons/fi";
import HeaderAvatar from "../components/HeaderAvatar";
// DnD removed per request to ensure buttons work reliably
import { useAccounts } from "../store/useAccounts";
import { useBalances } from "../store/useBalances";
import { useAuth } from "../store/useAuth";
import { useSettings } from "../store/useSettings";
import AccountCard from "../components/AccountCard";
import AddAccountModal from "../components/AddAccountModal";
import RefreshProgress from "../components/RefreshProgress";
import Loader from "../components/Loader";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, fetchAccounts, addAccount, deleteAccount } = useAccounts();
  const { refreshing, progress, refreshOne, refreshAll } = useBalances();
  const { baseCurrency, exchangeRates, fetchSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [confirm, setConfirm] = useState({ open:false, id:null });
  // DnD sensors removed

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
  }, []);

  const total = useMemo(() => {
    const byCurrency = accounts.reduce((acc, a) => {
      const cur = a.lastCurrency || "INR";
      acc[cur] = (acc[cur] || 0) + (a.lastBalance || 0);
      return acc;
    }, {});
    return byCurrency;
  }, [accounts]);

  const baseTotal = useMemo(() => {
    // exchangeRates map: currency -> rate relative to base (1.0 for base)
    // amount_in_base = amount_in_currency / rate
    return Object.entries(total).reduce((sum, [cur, amount]) => {
      if (cur === baseCurrency) return sum + amount;
      const rate = exchangeRates?.[cur];
      if (!rate || rate <= 0) return sum;
      return sum + amount / rate;
    }, 0);
  }, [total, baseCurrency, exchangeRates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        (a.label || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const sortedFiltered = useMemo(() => {
    if (sortBy === "amount") {
      return [...filtered].sort(
        (a, b) => (b.lastBalance || 0) - (a.lastBalance || 0)
      );
    }
    return filtered;
  }, [filtered, sortBy]);

  return (
    <div className="container">
      <header className="topbar">
        <h3>Amazon Wallet Monitor</h3>
        <div className="spacer" />
        <HeaderAvatar />
      </header>

      <div className="action-buttons" style={{position:'sticky', top:0, zIndex:10, background:'transparent', display:'flex', gap:8, paddingBottom:8}}>
        <button
          className="muted"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <FiPlus /> Add account
        </button>
        <button
          className="primary"
          onClick={async () => {
            await refreshAll(accounts);
            await fetchAccounts();
          }}
        >
          <FiRefreshCcw /> Refresh All
        </button>
        <button className="muted" onClick={async ()=>{
          // Export current view to CSV
          const rows = [['Label','Email','Region','Balance','Currency','Last Refreshed']]
          for(const a of sortedFiltered){ rows.push([a.label, a.email, a.region, String(a.lastBalance||0), a.lastCurrency||'', a.lastRefreshedAt? new Date(a.lastRefreshedAt).toISOString(): '' ]) }
          const csv = rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
          const blob = new Blob([csv], {type:'text/csv'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href=url; a.download='accounts.csv'; a.click(); URL.revokeObjectURL(url)
        }}>Export CSV</button>
      </div>

      <section className="totals">
        {Object.entries(total).map(([cur, amount]) => (
          <div className="pill" key={cur}>
            Total {cur === "INR" ? "₹" : cur} {Number(amount).toLocaleString("en-IN")}
          </div>
        ))}
      </section>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          margin: "4px 0 8px",
        }}
      >
        <input
          placeholder="Search accounts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="order">Order</option>
          <option value="amount">Amount</option>
        </select>
      </div>

      {!accounts.length ? (
        <Loader text="Loading accounts…" />
      ) : (
        <section className="grid">
          {sortedFiltered.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onRefresh={async () => {
                await refreshOne(a.id);
                await fetchAccounts();
              }}
              onEdit={() => {
                setEditing(a);
                setOpen(true);
              }}
              onDelete={async () => { setConfirm({ open:true, id:a.id }) }}
              onTogglePin={async ()=>{ const api=(await import('../api/client')).default; await api.put(`/accounts/${a.id}`, { pinned: !a.pinned }); await fetchAccounts() }}
            />
          ))}
        </section>
      )}

      <AddAccountModal
        open={open}
        initial={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          if (editing) {
            const { label, email, password, region } = payload;
            const update = { label, email, region };
            if (password) update.password = password;
            await (await import("../store/useAccounts")).useAccounts
              .getState()
              .updateAccount(editing.id, update);
          } else {
            await addAccount(payload);
          }
          await fetchAccounts();
          setOpen(false);
          setEditing(null);
        }}
      />
      <RefreshProgress refreshing={refreshing} progress={progress} />
      <ConfirmDialog
        open={confirm.open}
        title="Delete account?"
        message="This will soft-delete the account. You can restore it later."
        onCancel={()=> setConfirm({ open:false, id:null })}
        onConfirm={async ()=>{ await deleteAccount(confirm.id); await fetchAccounts(); setConfirm({ open:false, id:null }) }}
      />
    </div>
  );
}
