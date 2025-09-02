import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useElectricity } from '../store/useElectricity'
import AddElectricityServiceModal from '../components/AddElectricityServiceModal'
import GlobalTabs from '../components/GlobalTabs'
// import GlobalDebug from '../components/GlobalDebug'
import HeaderAvatar from '../components/HeaderAvatar'
import toast from 'react-hot-toast'
import ElectricityServiceCard from '../components/ElectricityServiceCard'
import InfoModal from '../components/InfoModal'

export default function Electricity(){
  const { services, fetchServices, addService, updateService, deleteService, refreshAll, refreshOne } = useElectricity()
  const [open,setOpen] = useState(false)
  const [editing,setEditing] = useState(null)
  const [health, setHealth] = useState({ ok:false, db:'unknown' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const longPressRef = useRef(null)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(()=>{
    (async()=>{
      const p = fetchServices()
      await toast.promise(p, { loading: 'Loading services…', success: 'Loaded', error: 'Failed to load' }, { success: { duration: 1500 }, error: { duration: 2000 } })
    })()
  },[])
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

  const selectedSummary = useMemo(()=>{
    let total = 0; let count = 0
    for (const id of selectedIds){
      const s = services.find(x=> x.id===id)
      if (s){ count++; total += Number(s.lastAmountDue||0) }
    }
    return { total, count }
  }, [selectedIds, services])

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
        <button className="muted" onClick={()=> setShowInfo(true)} aria-label="How to use" title="How to use" style={{display:'inline-flex',alignItems:'center',gap:6}}>
          <span>How to use</span>
        </button>
      </div>
      <div className="action-buttons" style={{display:'flex',gap:8,marginBottom:8}}>
        <button className="muted" onClick={()=> { setEditing(null); setOpen(true) }} style={{display:'inline-flex',alignItems:'center',gap:6}}>➕ Add Service</button>
        <button className="primary" onClick={async()=>{ await toast.promise(refreshAll(), { loading:'Refreshing all services…', success:'All services refreshed', error:(e)=> e?.response?.data?.error || 'Refresh failed' }, { success: { duration: 2000 }, error: { duration: 2000 }, loading: { duration: 2000 } }) }} style={{display:'inline-flex',alignItems:'center',gap:6}}>⟳ Refresh All</button>
      </div>
      {/* <GlobalDebug/> */}

      <section className="totals">
        <div className="pill">Total Pending: ₹ {Number(summary.totalPending||0).toLocaleString('en-IN')}</div>
        <div className="pill">Pending Bills: {summary.pendingCount}</div>
        <div className="pill">Paid Bills: {summary.paidCount}</div>
        <div className="pill">Yet to be Paid: {summary.noDuesCount}</div>
      </section>

      {selectedIds.size>0 && (
        <div className="panel" style={{display:'flex',gap:12,alignItems:'baseline',marginBottom:8}}>
          <span>Selected: <b>{selectedSummary.count}</b></span>
          <span>Total: <b>₹ {Number(selectedSummary.total||0).toLocaleString('en-IN')}</b></span>
          <button className="muted" onClick={()=>{ setSelectedIds(new Set()); setSelectMode(false) }}>Clear selection</button>
        </div>
      )}

      <section className={`grid ${selectMode? 'select-mode':''}`}>
        {services.map(s=> (
          <div key={s.id} className="card-wrapper" onMouseEnter={()=> setSelectMode(true)} onMouseLeave={()=>{ if(selectedIds.size===0) setSelectMode(false) }} onTouchStart={()=>{ if (longPressRef.current) clearTimeout(longPressRef.current); longPressRef.current = setTimeout(()=> setSelectMode(true), 500) }} onTouchEnd={()=>{ if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current=null } }}>
            {selectMode && (
              <input type="checkbox" className="checkbox" checked={selectedIds.has(s.id)} onChange={()=>{
                const next=new Set(selectedIds); if(next.has(s.id)) next.delete(s.id); else next.add(s.id); setSelectedIds(next); if(next.size===0) setSelectMode(false)
              }} style={{position:'absolute', margin:8}} />
            )}
            <ElectricityServiceCard item={s} onRefresh={async()=>{ await toast.promise(refreshOne(s.id), { loading:`Refreshing ${s.label||s.serviceNumber}…`, success:'Refreshed', error:(e)=> e?.response?.data?.error || 'Refresh failed' }, { success: { duration: 2000 }, error: { duration: 2000 }, loading: { duration: 2000 } }) }} onEdit={()=> { setEditing(s); setOpen(true) }} onDelete={async()=>{ try{ await deleteService(s.id); toast.success('Service deleted', { duration: 2000 }) }catch(e){ toast.error(e?.response?.data?.error || e.message, { duration: 2000 }) } }} />
          </div>
        ))}
      </section>

      <AddElectricityServiceModal open={open} initial={editing} onClose={()=> { setOpen(false); setEditing(null) }} onSubmit={async (serviceNumber,label)=>{
        const promise = editing ? updateService(editing.id, { serviceNumber, label }) : addService(serviceNumber, label)
        try{
          await toast.promise(
            promise,
            {
              loading: editing ? 'Updating service…' : 'Adding service…',
              success: editing ? 'Service updated' : 'Service added',
              error: (e)=> e?.response?.data?.error || e?.message || 'Failed to save service',
            },
            { success: { duration: 2000 }, error: { duration: 2000 } }
          )
          setEditing(null)
        }catch(_){}
      }} />
      
      <InfoModal open={showInfo} onClose={()=> setShowInfo(false)} />
    </div>
  )
}

