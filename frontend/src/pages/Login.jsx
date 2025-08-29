import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Login(){
  const nav = useNavigate()
  const { login, loading } = useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  async function onSubmit(e){
    e.preventDefault()
    const emailOk = /.+@.+\..+/.test(email)
    if(!emailOk) return toast.error('Enter a valid email')
    if(password.length < 6) return toast.error('Password must be at least 6 characters')
    await login(email,password)
    nav('/dashboard')
  }

  return (
    <div className="centered">
      <div className="panel" style={{minWidth:320, maxWidth:420, width:'100%'}}>
        <h2 style={{marginTop:0}}>Sign in</h2>
        <form onSubmit={onSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com"/></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="••••••••"/></label>
          <button disabled={loading} className="primary" type="submit">{loading? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p style={{opacity:.8,marginTop:8}}>New here? <Link to="/register">Create account</Link></p>
      </div>
      <Toaster/>
    </div>
  )
}

