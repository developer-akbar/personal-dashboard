import React, { useEffect, useMemo, useState } from 'react'
import { useElectricity } from '../store/useElectricity'
import AddElectricityServiceModal from '../components/AddElectricityServiceModal'
import GlobalTabs from '../components/GlobalTabs'
import GlobalDebug from '../components/GlobalDebug'
import HeaderAvatar from '../components/HeaderAvatar'
import toast from 'react-hot-toast'
import ElectricityServiceCard from '../components/ElectricityServiceCard'

export default function Electricity(){
  const { services, fetchServices, addService, updateService, deleteService, refreshAll, refreshOne } = useElectricity()
  const [open,setOpen] = useState(false)
  const [editing,setEditing] = useState(null)
  const [health, setHealth] = useState({ ok:false, db:'unknown' })

  useEffect(()=>{ fetchServices() },[])
  useEffect(()=>{ (async()=>{ try{ const api=(await import('../api/client')).default; const { data } = await api.get('/health'); setHealth({ ok: !!data?.ok, db: data?.db||'unknown' }) }catch{} })() },[])

  const summary = useMemo(()=>{
    const pending = services.filter(s=> s.lastStatus==='DUE' && (s.lastAmountDue||0)>0)
    const paid = services.filter(s=> s.lastStatus==='PAID')
    const noDues = services.filter(s=> s.lastStatus==='NO_DUES')
    return {
      totalPending: pending.reduce((sum,s)=> sum + (s.lastAmountDue||0), 0),
      pendingCount: pending.length,
      paidCount: paid.length,
      noDuesCount: noDues.length,
    }
  },[services])

  return (
    <div className="container">
      <header className="topbar">
        <h2>Personal Dashboard</h2>
        <div className="spacer" />
        <HeaderAvatar />
      </header>
      <GlobalTabs/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'6px 0'}}>
        <small style={{opacity:.8}}>Backend: <b style={{color: health.ok? '#10b981':'#ef4444'}}>{health.ok? 'up':'down'}</b> • DB: <b>{health.db}</b></small>
        <a className="muted" href="https://github.com/developer-akbar/personal-dashboard/blob/main/SESSIONS.md" target="_blank" rel="noreferrer" title="Help: sessions and scraping" style={{textDecoration:'none',padding:'4px 8px',borderRadius:8}}>?</a>
      </div>
      <div className="action-buttons" style={{display:'flex',gap:8,marginBottom:8}}>
        <button className="muted" onClick={()=> { setEditing(null); setOpen(true) }}>Add Service</button>
        <button className="primary" onClick={async()=>{ await toast.promise(refreshAll(), { loading:'Refreshing all services…', success:'All services refreshed', error:'Refresh failed' }) }}>Refresh All</button>
      </div>
      <GlobalDebug/>

      <section className="totals">
        <div className="pill">Total Pending: ₹ {Number(summary.totalPending||0).toLocaleString('en-IN')}</div>
        <div className="pill">Pending Bills: {summary.pendingCount}</div>
        <div className="pill">Paid Bills: {summary.paidCount}</div>
        <div className="pill">Yet to be Paid: {summary.noDuesCount}</div>
      </section>

      <section className="grid">
        {services.map(s=> (
          <ElectricityServiceCard key={s.id} item={s} onRefresh={async()=>{ await toast.promise(refreshOne(s.id), { loading:`Refreshing ${s.label||s.serviceNumber}…`, success:'Refreshed', error:'Refresh failed' }) }} onEdit={()=> { setEditing(s); setOpen(true) }} onDelete={()=> deleteService(s.id)} />
        ))}
      </section>

      <AddElectricityServiceModal open={open} initial={editing} onClose={()=> { setOpen(false); setEditing(null) }} onSubmit={async (serviceNumber,label)=>{
        try{
          if (editing) await updateService(editing.id, { serviceNumber, label })
          else await addService(serviceNumber, label)
          setEditing(null)
        }catch(e){ toast.error(e.message) }
      }} />
    </div>
  )
}

