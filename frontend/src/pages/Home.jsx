import React from 'react'
import { Link } from 'react-router-dom'
import AppFooter from '../components/AppFooter'

export default function Home(){
  return (
    <div className="container" style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <header className="topbar">
        <h2 style={{margin:0}}>Personal Dashboard</h2>
        <div className="spacer" />
        <Link to="/login" className="primary" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Sign in</Link>
      </header>

      <section className="panel" style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
        <h3 style={{margin:'0 0 8px 0'}}>See your balances and bills in one place</h3>
        <p>Track Amazon Pay wallet balances and APSPDCL electricity bills with simple, privacy-friendly workflows.</p>
        <ul style={{margin:0,paddingLeft:'1.1rem'}}>
          <li>One-time local session seeding for Amazon (your device; your control)</li>
          <li>Refresh on demand; recent results cached to reduce load</li>
          <li>Clean, mobile-friendly UI with light/dark themes</li>
        </ul>
        <div>
          <Link to="/login" className="primary" style={{textDecoration:'none',padding:'10px 14px',borderRadius:10}}>Get started</Link>
        </div>
      </section>

      <section className="grid">
        <article className="panel" style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" style={{height:28, marginTop:2}}/>
          <div>
            <h4 style={{marginTop:0}}>Amazon Pay</h4>
            <p>Connect multiple Amazon accounts and view balances at a glance. Rewards view included.</p>
            <ul style={{margin:'6px 0 0 16px'}}>
              <li>Refresh single/all, see totals and rewards.</li>
              <li>Pin, tag, and filter accounts for focus.</li>
            </ul>
          </div>
        </article>
        <article className="panel" style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <img src="https://apspdcl.in/ConsumerDashboard/assets/images/logo-new.png" alt="APSPDCL" style={{height:30, background:'#fff', borderRadius:6, padding:2}}/>
          <div>
            <h4 style={{marginTop:0}}>Electricity (APSPDCL)</h4>
            <p>Monitor dues, billed units, and last three bills with one click refresh.</p>
            <ul style={{margin:'6px 0 0 16px'}}>
              <li>Validated 13‑digit Service Number, refresh locks, admin bypass.</li>
              <li>Trash with restore/permanent delete options.</li>
            </ul>
          </div>
        </article>
        <article className="panel">
          <h4 style={{marginTop:0}}>Privacy & Security</h4>
          <p>Credentials are encrypted. Sessions are local-seeded by you. No third-party sharing.</p>
        </article>
      </section>

      <div style={{marginTop:'auto'}}>
        <AppFooter/>
      </div>
    </div>
  )
}

