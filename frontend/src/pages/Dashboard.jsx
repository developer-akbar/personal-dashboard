import React from "react";
import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCcw, FiFilter, FiHelpCircle } from "react-icons/fi";
import api from '../api/client'
import HeaderAvatar from "../components/HeaderAvatar";
import AppFooter from "../components/AppFooter";
import GlobalTabs from "../components/GlobalTabs";
// import GlobalDebug from "../components/GlobalDebug";
import toast from 'react-hot-toast'
// DnD removed per request to ensure buttons work reliably
import { useAccounts } from "../store/useAccounts";
import { useBalances } from "../store/useBalances";
import { useSettings } from "../store/useSettings";
import AccountCard from "../components/AccountCard";
import RewardsList from "../components/RewardsList";
import { useRewards } from "../store/useRewards";
import AddAccountModal from "../components/AddAccountModal";
import RefreshProgress from "../components/RefreshProgress";
import Loader from "../components/Loader";
import ConfirmDialog from "../components/ConfirmDialog";
import InfoModal from "../components/InfoModal";

export default function Dashboard() {
  const { accounts, fetchAccounts, addAccount, deleteAccount } = useAccounts();
  const { refreshing, progress, refreshOne, refreshAll } = useBalances();
  const { baseCurrency, exchangeRates, fetchSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount"); // order | amount | label | refreshed
  const [filterTag, setFilterTag] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // '', ok, error, never
  const [confirm, setConfirm] = useState({ open:false, id:null });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState('balance');
  const [showAmazonInfo, setShowAmazonInfo] = useState(false)
  const { byAccount, fetchForAccount, refreshAll: refreshAllRewards } = useRewards();
  const [health, setHealth] = useState({ ok:false, db:'unknown' })
  const [debugOpen, setDebugOpen] = useState(localStorage.getItem('debugPanel')==='1')
  const [jwtExp, setJwtExp] = useState(null)
  // moved the logo info panel to Home page
  // DnD sensors removed

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
    ;(async()=>{ try{ const { data } = await api.get('/health'); setHealth({ ok: !!data?.ok, db: data?.db||'unknown' }) }catch{} })()
    // Keyboard shortcuts
    function onKey(e){
      if (e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA')) return;
      if (e.key==='a'){ setEditing(null); setOpen(true) }
      if (e.key==='r'){ (async()=>{ await refreshAll(accounts); await fetchAccounts() })() }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, []);

  useEffect(()=>{
    const t = setInterval(()=>{
      try{
        const token = localStorage.getItem('accessToken');
        if(!token){ setJwtExp(null); return }
        const payload = JSON.parse(atob(token.split('.')[1]||''))
        setJwtExp(payload?.exp ? payload.exp*1000 : null)
      }catch{ setJwtExp(null) }
    }, 1000)
    return ()=> clearInterval(t)
  },[])

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

  function computeSelectedTotal(){
    let sum = 0;
    for (const a of accounts) {
      if (!selectedIds.has(a.id)) continue;
      const amount = Number(a.lastBalance || 0);
      const cur = a.lastCurrency || baseCurrency;
      let inBase = amount;
      if (cur !== baseCurrency) {
        const rate = exchangeRates?.[cur];
        if (rate && rate > 0) inBase = amount / rate; else continue;
      }
      sum += inBase;
    }
    return Number(sum || 0).toLocaleString('en-IN');
  }

  return (
    <div className={`container ${selectMode? 'select-mode' : ''}`} style={{minHeight:'calc(var(--vh, 1vh) * 100)', display:'flex', flexDirection:'column'}}>
      <header className="topbar">
        <h2>Personal Dashboard</h2>
        <div className="spacer" />
        <HeaderAvatar />
      </header>
      <GlobalTabs/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'6px 0'}}>
        <small style={{opacity:.8}}>Backend: <b style={{color: health.ok? '#10b981':'#ef4444'}}>{health.ok? 'up':'down'}</b> • DB: <b>{health.db}</b></small>
        <span />
      </div>
      <div className="action-buttons" style={{display:'flex', gap:10, padding:'8px 4px'}}>
        <button
          className="muted"
          onClick={() => {
            setEditing(null);
            setOpen(true);
            setShowAmazonInfo(true)
          }}
          disabled={refreshing}
        >
          <FiPlus /> Add account
        </button>
        <button className="muted" onClick={()=> setShowAmazonInfo(true)} style={{display:'inline-flex',alignItems:'center',gap:6}}><FiHelpCircle/> How to use</button>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:8,margin:'4px 0 8px'}}>
        <div style={{fontSize:14,opacity:.8}}>Accounts: {accounts.length}</div>
        <div style={{fontSize:14,opacity:.8,marginLeft:12}}>Total ({baseCurrency==='INR'?'₹':baseCurrency}):</div>
        <div style={{fontSize:22,fontWeight:700}}>{Number(baseTotal||0).toLocaleString('en-IN')}</div>
      </div>

      {/* Info panel moved to Home */}

      {jwtExp && (jwtExp - Date.now() < 5*60*1000) && (
        <div className="panel" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>Session expires in <b>{Math.max(0, Math.floor((jwtExp - Date.now())/1000))}s</b></div>
          <button className="primary" onClick={async()=>{
            const api=(await import('../api/client')).default;
            try{ const { data } = await api.post('/auth/refresh'); localStorage.setItem('accessToken', data?.accessToken||'') }catch{}
          }}>Refresh session</button>
        </div>
      )}
      <div className="panel" role="tablist" aria-label="View switch" style={{display:'inline-flex',gap:10, padding:10, marginTop:4, marginBottom:4}}>
        <button className={tab==='balance'? 'primary':'muted'} role="tab" aria-selected={tab==='balance'} onClick={()=> setTab('balance')}>Balance</button>
        <button className={tab==='rewards'? 'primary':'muted'} role="tab" aria-selected={tab==='rewards'} onClick={()=> setTab('rewards')}>Rewards</button>
      </div>

      <div className="action-buttons" style={{position:'sticky', top:0, zIndex:10, display:'flex', gap:10, padding:'8px 4px', background:'var(--toolbar-bg, transparent)', backdropFilter:'saturate(180%) blur(8px)'}}>
        {accounts.length >= 2 && (
          <button
            className="primary"
            onClick={async () => {
              await toast.promise((async()=>{ await refreshAll(accounts); await fetchAccounts() })(), { loading: 'Queued…', success: 'Done', error: (e)=> e?.response?.status===429? '429 - wait and retry' : 'Failed' })
            }}
            disabled={refreshing}
          >
            <FiRefreshCcw className={refreshing? 'spin':''}/> Refresh All
          </button>
        )}
        <button className="muted" style={{display:'none'}} onClick={async ()=>{
          // Export current view to CSV
          const rows = [['Label','Email','Region','Balance','Currency','Last Refreshed']]
          for(const a of sortedFiltered){ rows.push([a.label, a.email, a.region, String(a.lastBalance||0), a.lastCurrency||'', a.lastRefreshedAt? new Date(a.lastRefreshedAt).toISOString(): '' ]) }
          const csv = rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
          const blob = new Blob([csv], {type:'text/csv'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href=url; a.download='accounts.csv'; a.click(); URL.revokeObjectURL(url)
        }}>Export View CSV</button>
        <button className="muted" onClick={()=> setShowAmazonInfo(true)} style={{display:'inline-flex',alignItems:'center',gap:6}}><FiHelpCircle/> How to use</button>
        <button className="muted" style={{display:'none'}} onClick={async ()=>{
          const { data } = await api.get('/accounts')
          const rows = [["Label","Email","Region","Balance","Currency","Last Refreshed","Pinned","Tags"]]
          for(const a of data){ rows.push([a.label, a.email, a.region, String(a.lastBalance||0), a.lastCurrency||'', a.lastRefreshedAt? new Date(a.lastRefreshedAt).toISOString(): '', a.pinned? 'yes':'no', (a.tags||[]).join('|') ]) }
          const csv = rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
          const blob = new Blob([csv], {type:'text/csv'})
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href=url; a.download='accounts-full.csv'; a.click(); URL.revokeObjectURL(url)
        }}>Export All CSV</button>
        {selectedIds.size>0 && (
          <div style={{marginLeft:'auto', display:'inline-flex', gap:12, alignItems:'baseline'}}>
            <span style={{opacity:.8}}>Selected: {selectedIds.size}</span>
            <span style={{opacity:.8}}>Amount ({baseCurrency==='INR'?'₹':baseCurrency}):</span>
            <strong>{computeSelectedTotal()}</strong>
            <button className="muted" onClick={()=>{ setSelectedIds(new Set()); setSelectMode(false) }}>Clear selection</button>
          </div>
        )}
      </div>

      {tab==='balance' && (
      <section className="totals">
        {Object.entries(total).map(([cur, amount]) => (
          <div className="pill" key={cur}>
            Total {cur === "INR" ? "₹" : cur} {Number(amount).toLocaleString("en-IN")}
          </div>
        ))}
      </section>
      )}
      {tab==='balance' && tagTotalsBase.length > 0 && (
        <section className="totals">
          {tagTotalsBase.map(([tag, amt]) => (
            <div className="pill" key={tag}>{tag}: {baseCurrency==='INR'?"₹":baseCurrency} {Number(amt||0).toLocaleString('en-IN')}</div>
          ))}
        </section>
      )}

      {/* <GlobalDebug/> */}

      <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8, margin:'8px 0'}}>
        <div style={{position:'relative'}}>
          <input placeholder="Search accounts..." aria-label="Search accounts" value={query} onChange={(e)=> setQuery(e.target.value)} style={{width:'100%',paddingRight:36}} />
          {query && (
            <button aria-label="Clear search" onClick={()=> setQuery('')} className="clear-btn">×</button>
          )}
        </div>
        <button className="muted" onClick={()=> setShowFilters(v=>!v)} aria-expanded={showFilters} aria-controls="filters-panel" title={showFilters? 'Hide filters' : 'Show filters'}>
          <FiFilter /> {showFilters? 'Hide' : 'Filters'}
        </button>
      </div>
      {tab==='balance' && showFilters && (
      <div className="filters" id="filters-panel">
        <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="order">Default order</option>
          <option value="amount">Amount (desc)</option>
          <option value="label">Label (A→Z)</option>
          <option value="refreshed">Last refreshed (newest)</option>
        </select>
        <select aria-label="Filter by region" value={filterRegion} onChange={(e)=> setFilterRegion(e.target.value)}>
          <option value="">All regions</option>
          {Array.from(new Set(accounts.map(a=>a.region))).map(r=> (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select aria-label="Filter by status" value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="ok">OK</option>
          <option value="error">Error</option>
          <option value="never">Never refreshed</option>
        </select>
        <select aria-label="Filter by tag" value={filterTag} onChange={(e)=> setFilterTag(e.target.value)}>
          <option value="">All tags</option>
          {Array.from(new Set(accounts.flatMap(a=> Array.isArray(a.tags)? a.tags : []))).map(t=> (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(filterRegion || filterStatus || filterTag || query) && (
          <button className="muted" aria-label="Clear filters" onClick={()=>{ setFilterRegion(''); setFilterStatus(''); setFilterTag(''); setQuery('') }}>Clear</button>
        )}
      </div>
      )}

      {tab==='balance' && (!accounts.length ? (
        <div className="panel" style={{textAlign:'center'}}>
          <p style={{margin:'6px 0'}}>No Amazon accounts yet.</p>
          <button className="primary" onClick={()=>{ setEditing(null); setOpen(true); setShowAmazonInfo(true) }}>Add your first account</button>
        </div>
      ) : (
        <section className="grid">
          {sortedFiltered.map((a) => (
            <div key={a.id} className="card-wrapper">
            <AccountCard
              account={a}
              selected={selectedIds.has(a.id)}
              showCheckboxes={selectMode}
              onLongPressActivate={()=> setSelectMode(true)}
              onRefresh={async () => {
                await toast.promise((async()=>{ await refreshOne(a.id); await fetchAccounts() })(), { loading: `Refreshing ${a.label||'account'}…`, success: 'Refreshed', error: 'Refresh failed' })
              }}
              onEdit={() => {
                setEditing(a);
                setOpen(true);
              }}
              onDelete={async () => { setConfirm({ open:true, id:a.id }) }}
              onTogglePin={async ()=>{ await api.put(`/accounts/${a.id}`, { pinned: !a.pinned }); await fetchAccounts() }}
              onToggleSelect={(acc,checked)=>{ setSelectedIds(prev=>{ const next=new Set(prev); if(checked){ next.add(acc.id); setSelectMode(true) } else { next.delete(acc.id); if(next.size===0) setSelectMode(false) } return next }) }}
            />
            </div>
          ))}
        </section>
      ))}

      {tab==='rewards' && (
        <div className="panel" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
          <div style={{opacity:.8}}>Rewards are fetched live from your accounts. Click Refresh to update all.</div>
          <button className="primary" onClick={async()=>{ await toast.promise(refreshAllRewards(), { loading:'Refreshing rewards…', success:'Rewards updated', error:'Rewards refresh failed' }) }}>Refresh</button>
        </div>
      )}
      {tab==='rewards' && (
        !accounts.length ? <Loader text="Loading accounts…"/> : (
          <section className="grid">
            {accounts.map(a=>{
              const st = byAccount[a.id] || { items: [], loading:false, error:null }
              return (
                <article key={a.id} className="panel" style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <strong>{a.label}</strong>
                    <button className="muted" onClick={()=> fetchForAccount(a.id)}>{st.loading? 'Loading…' : 'Fetch'}</button>
                  </div>
                  <RewardsList items={st.items} loading={st.loading} error={st.error} onRefresh={()=> fetchForAccount(a.id)} />
                </article>
              )
            })}
          </section>
        )
      )}

      <AddAccountModal
        open={open}
        initial={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async (payload) => {
          try{
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
          }catch(e){
            toast.error(e?.response?.data?.error || e?.message || 'Failed to save account')
          }
        }}
      />
      <InfoModal
        open={showAmazonInfo}
        title="How to use Amazon account balances"
        onClose={()=> setShowAmazonInfo(false)}
        primaryActionLabel="View guide"
        onPrimaryAction={()=>{ window.open('https://github.com/developer-akbar/personal-dashboard/blob/main/SESSIONS.md', '_blank', 'noopener,noreferrer') }}
      >
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:8}}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" style={{height:26}}/>
          <strong>Amazon Pay Balance</strong>
        </div>
        <p>We fetch your balance by opening Amazon Pay in a browser session.</p>
        <p style={{marginBottom:6}}><b>Your main step:</b> generate a storageState (session) file once on your computer and provide it to the app (see guide).</p>
        <ul style={{marginTop:0}}>
          <li>Install Node + Chromium/Playwright locally and run the seed script from the guide to login to Amazon.</li>
          <li>This stores a session (storageState) locally; upload/use it so scraping won’t ask you to login every time.</li>
          <li>We keep only encrypted credentials and session. No sharing outside your account.</li>
          <li>If Amazon re-prompts (OTP/CAPTCHA), just refresh the session by re-running the seed step.</li>
        </ul>
        <p style={{marginTop:6}}>Why manual? Login requires OTP/CAPTCHA and your device context. Automating this entirely on the server is unreliable and risky.</p>
      </InfoModal>
      <RefreshProgress refreshing={refreshing} progress={progress} />
      <ConfirmDialog
        open={confirm.open}
        title="Delete account?"
        message="This will soft-delete the account. You can restore it later."
        onCancel={()=> setConfirm({ open:false, id:null })}
        onConfirm={async ()=>{ await deleteAccount(confirm.id); await fetchAccounts(); setConfirm({ open:false, id:null }) }}
      />
      <div style={{marginTop:'auto'}}>
        <AppFooter/>
      </div>
    </div>
  );
}
