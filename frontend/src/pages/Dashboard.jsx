import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiRefreshCcw, FiLogOut } from 'react-icons/fi'
import { useAccounts } from '../store/useAccounts'
import { useBalances } from '../store/useBalances'
import { useAuth } from '../store/useAuth'
import { useSettings } from '../store/useSettings'
import AccountCard from '../components/AccountCard'
import AddAccountModal from '../components/AddAccountModal'
import RefreshProgress from '../components/RefreshProgress'

export default function Dashboard(){
  const { user, logout } = useAuth()
  const { accounts, fetchAccounts, addAccount, deleteAccount } = useAccounts()
  const { refreshing, progress, refreshOne, refreshAll } = useBalances()
  const { baseCurrency, exchangeRates, fetchSettings } = useSettings()
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState(null)

  useEffect(()=>{ fetchAccounts(); fetchSettings() },[])

  const total = useMemo(()=>{
    const byCurrency = accounts.reduce((acc,a)=>{ const cur=a.lastCurrency||'USD'; acc[cur]=(acc[cur]||0)+ (a.lastBalance||0); return acc },{})
    return byCurrency
  },[accounts])

  const baseTotal = useMemo(()=>{
    // exchangeRates map: currency -> rate relative to base (1.0 for base)
    // amount_in_base = amount_in_currency / rate
    return Object.entries(total).reduce((sum,[cur,amount])=>{
      if(cur === baseCurrency) return sum + amount
      const rate = exchangeRates?.[cur]
      if(!rate || rate <= 0) return sum
      return sum + (amount / rate)
    }, 0)
  },[total, baseCurrency, exchangeRates])

  return (
    <div className="container">
      <header className="topbar">
        <h1>Amazon Wallet Monitor</h1>
        <div className="spacer" />
        <span>{user?.email}</span>
        <button className="muted" onClick={()=>{ setEditing(null); setOpen(true) }}><FiPlus/> Add account</button>
        <button className="primary" onClick={async ()=>{ await refreshAll(accounts); await fetchAccounts(); }}><FiRefreshCcw/> Refresh All</button>
        <button className="danger" onClick={logout}><FiLogOut/> Logout</button>
      </header>

      <section className="totals">
        {Object.entries(total).map(([cur,amount])=> (
          <div className="pill" key={cur}>{cur} {Number(amount).toLocaleString()}</div>
        ))}
        <div className="pill">Total ({baseCurrency}) {Number(baseTotal||0).toLocaleString()}</div>
      </section>

      <section className="grid">
        {accounts.map(a => (
          <AccountCard
            key={a.id}
            account={a}
            onRefresh={async ()=>{ await refreshOne(a.id); await fetchAccounts(); }}
            onEdit={()=>{ setEditing(a); setOpen(true) }}
            onDelete={async ()=>{ await deleteAccount(a.id); await fetchAccounts(); }}
          />
        ))}
      </section>

      <AddAccountModal
        open={open}
        initial={editing}
        onClose={()=>{ setOpen(false); setEditing(null) }}
        onSubmit={async (payload)=>{
          if (editing) {
            const { label, email, password, region } = payload
            const update = { label, email, region }
            if (password) update.password = password
            await (await import('../store/useAccounts')).useAccounts.getState().updateAccount(editing.id, update)
          } else {
            await addAccount(payload)
          }
          await fetchAccounts();
          setOpen(false)
          setEditing(null)
        }}
      />
      <RefreshProgress refreshing={refreshing} progress={progress} />
    </div>
  )
}

