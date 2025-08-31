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
  const [sortBy, setSortBy] = useState("order"); // order | amount | label | refreshed
  const [filterTag, setFilterTag] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '', ok, error, never
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
  const tagTotalsBase = useMemo(() => {
    const out = new Map();
    for (const a of accounts) {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      const amount = Number(a.lastBalance || 0);
      if (!amount) continue;
      const cur = a.lastCurrency || baseCurrency;
      let inBase = amount;
      if (cur !== baseCurrency) {
        const rate = exchangeRates?.[cur];
        if (rate && rate > 0) inBase = amount / rate; else continue;
      }
      for (const t of tags) {
        out.set(t, (out.get(t) || 0) + inBase);
      }
    }
    return Array.from(out.entries()).sort((a,b)=> b[1]-a[1]);
  }, [accounts, baseCurrency, exchangeRates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = accounts;
    if (q) {
      list = list.filter(
        (a) =>
          (a.label || "").toLowerCase().includes(q) ||
          (a.email || "").toLowerCase().includes(q)
      );
    }
    if (filterRegion) {
      list = list.filter((a) => a.region === filterRegion);
    }
    if (filterStatus) {
      if (filterStatus === 'ok') list = list.filter((a) => !a.lastError && !!a.lastRefreshedAt);
      if (filterStatus === 'error') list = list.filter((a) => !!a.lastError);
      if (filterStatus === 'never') list = list.filter((a) => !a.lastRefreshedAt);
    }
    if (filterTag) {
      list = list.filter((a) => Array.isArray(a.tags) && a.tags.includes(filterTag));
    }
    return list;
  }, [accounts, query, filterRegion, filterStatus, filterTag]);

  const sortedFiltered = useMemo(() => {
    const list = [...filtered];
    if (sortBy === "amount") {
      list.sort((a, b) => (b.lastBalance || 0) - (a.lastBalance || 0));
    } else if (sortBy === "label") {
      list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    } else if (sortBy === "refreshed") {
      list.sort((a, b) => new Date(b.lastRefreshedAt || 0) - new Date(a.lastRefreshedAt || 0));
    }
    return list;
  }, [filtered, sortBy]);

  return (
    <div className="container">
      <header className="topbar">
        <h3>Amazon Wallet Monitor</h3>
        <div className="spacer" />
        <HeaderAvatar />
      </header>
      <div style={{display:'flex',alignItems:'baseline',gap:8,margin:'4px 0 8px'}}>
        <div style={{fontSize:14,opacity:.8}}>Total ({baseCurrency==='INR'?'₹':baseCurrency}):</div>
        <div style={{fontSize:22,fontWeight:700}}>{Number(baseTotal||0).toLocaleString('en-IN')}</div>
      </div>

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
        }}>Export View CSV</button>
        <button className="muted" onClick={async ()=>{
          const api=(await import('../api/client')).default; const { data } = await api.get('/accounts')
          const rows = [["Label","Email","Region","Balance","Currency","Last Refreshed","Pinned","Tags"]]
          for(const a of data){ rows.push([a.label, a.email, a.region, String(a.lastBalance||0), a.lastCurrency||'', a.lastRefreshedAt? new Date(a.lastRefreshedAt).toISOString(): '', a.pinned? 'yes':'no', (a.tags||[]).join('|') ]) }
          const csv = rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
          const blob = new Blob([csv], {type:'text/csv'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href=url; a.download='accounts-full.csv'; a.click(); URL.revokeObjectURL(url)
        }}>Export All CSV</button>
      </div>

      <section className="totals">
        {Object.entries(total).map(([cur, amount]) => (
          <div className="pill" key={cur}>
            Total {cur === "INR" ? "₹" : cur} {Number(amount).toLocaleString("en-IN")}
          </div>
        ))}
      </section>
      {tagTotalsBase.length > 0 && (
        <section className="totals">
          {tagTotalsBase.map(([tag, amt]) => (
            <div className="pill" key={tag}>{tag}: {baseCurrency==='INR'?'₹':baseCurrency} {Number(amt||0).toLocaleString('en-IN')}</div>
          ))}
        </section>
      )}

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
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort by">
          <option value="order">Default order</option>
          <option value="amount">Amount (desc)</option>
          <option value="label">Label (A→Z)</option>
          <option value="refreshed">Last refreshed (newest)</option>
        </select>
        <select value={filterRegion} onChange={(e)=> setFilterRegion(e.target.value)} title="Region">
          <option value="">All regions</option>
          {Array.from(new Set(accounts.map(a=>a.region))).map(r=> (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value)} title="Status">
          <option value="">All status</option>
          <option value="ok">OK</option>
          <option value="error">Error</option>
          <option value="never">Never refreshed</option>
        </select>
        <select value={filterTag} onChange={(e)=> setFilterTag(e.target.value)} title="Tag">
          <option value="">All tags</option>
          {Array.from(new Set(accounts.flatMap(a=> Array.isArray(a.tags)? a.tags : []))).map(t=> (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(filterRegion || filterStatus || filterTag || query) && (
          <button className="muted" onClick={()=>{ setFilterRegion(''); setFilterStatus(''); setFilterTag(''); setQuery('') }}>Clear</button>
        )}
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
