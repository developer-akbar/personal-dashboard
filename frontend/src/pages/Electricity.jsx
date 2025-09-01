import React, { useEffect, useMemo, useState } from 'react'
import { useElectricity } from '../store/useElectricity'
import AddElectricityServiceModal from '../components/AddElectricityServiceModal'
import ElectricityServiceCard from '../components/ElectricityServiceCard'

export default function Electricity(){
  const { services, fetchServices, addService, updateService, deleteService, refreshAll, refreshOne } = useElectricity()
  const [open,setOpen] = useState(false)
  const [editing,setEditing] = useState(null)

  useEffect(()=>{ fetchServices() },[])

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
        <h2>Electricity</h2>
        <div className="spacer" />
        <a className="muted" href="#/dashboard" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Amazon</a>
        <button className="muted" onClick={()=> { setEditing(null); setOpen(true) }}>Add Service</button>
        <button className="primary" onClick={refreshAll}>Refresh All</button>
      </header>

      <section className="totals">
        <div className="pill">Total Pending: ₹ {Number(summary.totalPending||0).toLocaleString('en-IN')}</div>
        <div className="pill">Pending Bills: {summary.pendingCount}</div>
        <div className="pill">Paid Bills: {summary.paidCount}</div>
        <div className="pill">Yet to be Paid: {summary.noDuesCount}</div>
      </section>

      <section className="grid">
        {services.map(s=> (
          <ElectricityServiceCard key={s.id} item={s} onRefresh={()=> refreshOne(s.id)} onEdit={()=> { setEditing(s); setOpen(true) }} onDelete={()=> deleteService(s.id)} />
        ))}
      </section>

      <AddElectricityServiceModal open={open} initial={editing} onClose={()=> { setOpen(false); setEditing(null) }} onSubmit={async (serviceNumber,label)=>{
        if (editing) await updateService(editing.id, { serviceNumber, label })
        else await addService(serviceNumber, label)
        setEditing(null)
      }} />
    </div>
  )
}

