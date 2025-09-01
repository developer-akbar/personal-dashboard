import React, { useEffect, useMemo, useState } from 'react'
import { useElectricity } from '../store/useElectricity'
import AddElectricityServiceModal from '../components/AddElectricityServiceModal'
import ElectricityServiceCard from '../components/ElectricityServiceCard'

export default function Electricity(){
  const { services, fetchServices, addService, refreshAll, refreshOne } = useElectricity()
  const [open,setOpen] = useState(false)

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
        <button className="muted" onClick={()=> setOpen(true)}>Add Service</button>
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
          <ElectricityServiceCard key={s.id} item={s} onRefresh={()=> refreshOne(s.id)} />
        ))}
      </section>

      <AddElectricityServiceModal open={open} onClose={()=> setOpen(false)} onSubmit={addService} />
    </div>
  )
}

