import React from 'react'
import { Link } from 'react-router-dom'
import AppFooter from '../components/AppFooter'
import GlobalHeader from '../components/GlobalHeader'
import { useAuth } from '../store/useAuth'

export default function Home(){
  const { user } = useAuth()
  return (
    <div className="container" style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <GlobalHeader>
        {!user && <Link to="/login" className="primary" style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Sign in</Link>}
      </GlobalHeader>

      <section className="panel" style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
        <h3 style={{margin:'0 0 8px 0'}}>See your balances and bills in one place</h3>
        <p>Track Amazon Pay wallet balances and APSPDCL electricity bills with simple, privacy-friendly workflows.</p>
        <ul style={{margin:0,paddingLeft:'1.1rem'}}>
          <li>One-time local session seeding for Amazon (your device; your control)</li>
          <li>Real-time refresh with smart caching and rate limiting</li>
          <li>Mobile-optimized UI with global navigation and responsive design</li>
          <li>Secure profile management with forgot password and OTP support</li>
        </ul>
        <div>
          <Link to="/login" className="primary" style={{textDecoration:'none',padding:'10px 14px',borderRadius:10}}>Get started</Link>
        </div>
      </section>

      <section className="panel" style={{background:'var(--muted-bg)', border:'1px solid var(--pill-border)', borderRadius:'12px', padding:'16px', margin:'12px 0'}}>
        <h4 style={{margin:'0 0 12px 0', color:'var(--primary-bg)', display:'flex', alignItems:'center', gap:'8px'}}>
          <span style={{fontSize:'20px'}}>🎓</span>
          Educational Purpose
        </h4>
        <p style={{margin:'0 0 8px 0', fontSize:'14px', lineHeight:'1.5'}}>
          This project is created for <strong>learning and educational purposes</strong>. The rate limits and restrictions are intentionally implemented to demonstrate how standard applications work in the real world, including:
        </p>
        <ul style={{margin:'0 0 8px 0', paddingLeft:'1.2rem', fontSize:'14px', lineHeight:'1.5'}}>
          <li>User role management and access control</li>
          <li>Rate limiting and subscription models</li>
          <li>API security and authentication patterns</li>
          <li>Frontend-backend integration best practices</li>
        </ul>
        <p style={{margin:'0', fontSize:'13px', opacity:0.8, fontStyle:'italic'}}>
          This is <strong>not intended for monetization</strong> from any users. It's a demonstration of modern web development practices and real-world application architecture.
        </p>
      </section>

      <section className="grid">
        <article className="panel" style={{display:'flex', flexDirection:'column', gap:10, alignItems:'center'}}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" style={{height:32}}/>
          <div>
            <h4 style={{marginTop:0}}>Amazon Pay</h4>
            <p style={{margin:'6px 0'}}>Connect multiple Amazon accounts and view balances at a glance. Rewards view included.</p>
            <p style={{margin:'6px 0'}}>Role-based access control with admin/subscriber restrictions for account management.</p>
          </div>
        </article>
        <article className="panel" style={{display:'flex', flexDirection:'column', gap:10, alignItems:'center'}}>
          <img src="https://apspdcl.in/ConsumerDashboard/assets/images/logo-new.png" alt="APSPDCL" style={{height:36, background:'#fff', borderRadius:6, padding:2}}/>
          <div>
            <h4 style={{marginTop:0}}>Electricity (APSPDCL)</h4>
            <p style={{margin:'6px 0'}}>Monitor dues, billed units, and last three bills with one click refresh.</p>
            <p style={{margin:'6px 0'}}>Mobile-optimized with long-press selection and responsive design.</p>
          </div>
        </article>
        <article className="panel">
          <h4 style={{marginTop:0}}>Modern UX Features</h4>
          <p>Loading skeletons, error boundaries, input validation, and Instagram-style avatar borders for a polished experience.</p>
        </article>
      </section>

      <div style={{marginTop:'auto'}}>
        <AppFooter/>
      </div>
    </div>
  )
}

