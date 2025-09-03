import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Register(){
  const nav = useNavigate()
  const { register, loading } = useAuth()
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [captcha,setCaptcha]=useState('')
  const widgetRef = useRef(null)

  useEffect(()=>{
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) return
    function render(){
      if (window.turnstile && widgetRef.current && !widgetRef.current._rendered){
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (t)=> setCaptcha(t),
          'error-callback': ()=> { setCaptcha(''); toast.error('Captcha failed, retry') },
          'expired-callback': ()=> { setCaptcha(''); toast('Captcha expired', { icon: '⚠️' }) }
        })
        widgetRef.current._rendered = true
      } else {
        setTimeout(render, 300)
      }
    }
    render()
  },[])

  async function onSubmit(e){
    e.preventDefault()
    const emailOk = /.+@.+\..+/.test(email)
    if(!emailOk) return toast.error('Enter a valid email')
    if(password.length < 6) return toast.error('Password must be at least 6 characters')
    const confirm = e.target?.confirm?.value
    if(confirm !== password) return toast.error('Passwords do not match')
    try{
      if ((import.meta.env.VITE_TURNSTILE_SITE_KEY) && !captcha){ toast.error('Complete captcha'); return }
      await register({ name, email, password, captchaToken: captcha })
      nav('/amazon')
    }catch(e){
      toast.error(e?.response?.data?.error || e?.message || 'Registration failed')
    }
  }

  return (
    <div className="centered">
      <div className="panel" style={{minWidth:320, maxWidth:420, width:'100%'}}>
        <h2 style={{marginTop:0}}>Create account</h2>
        <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>Name<input value={name} onChange={e=>setName(e.target.value)} required type="text" placeholder="Your name"/></label>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com"/></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="At least 6 characters"/></label>
          <label>Confirm Password<input name="confirm" required type="password" placeholder="Re-enter password"/></label>
          <div ref={widgetRef} className="cf-turnstile"></div>
          {!import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <small style={{opacity:.7}}>Captcha disabled (no site key configured)</small>
          )}
          <button disabled={loading} className="primary" type="submit">{loading? 'Creating...' : 'Create account'}</button>
        </form>
        <p style={{opacity:.8,marginTop:8}}>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
      <Toaster/>
    </div>
  )
}

