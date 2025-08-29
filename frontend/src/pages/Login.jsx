import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function Login(){
  const nav = useNavigate()
  const { login, loading } = useAuth()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')

  return (
    <div className="centered">
      <div className="panel">
        <h2>Sign in</h2>
        <form onSubmit={async (e)=>{e.preventDefault();await login(email,password);nav('/dashboard')}}>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email"/></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} required type="password"/></label>
          <button disabled={loading} className="primary" type="submit">{loading? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p>New here? <Link to="/register">Create account</Link></p>
      </div>
    </div>
  )
}

