import React from "react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login, loading, user } = useAuth();
  useEffect(()=>{
    if (user){
      nav('/electricity', { replace:true })
    }
  }, [user])
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
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

  async function onSubmit(e) {
    e.preventDefault();
    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) return toast.error("Enter a valid email");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");
    try {
      if ((import.meta.env.VITE_TURNSTILE_SITE_KEY) && !captcha){ toast.error('Complete captcha'); return }
      await login(email, password, captcha);
      const params = new URLSearchParams(loc.search)
      const next = params.get('next')
      if (next) {
        nav(next.startsWith('/')? next : '/dashboard', { replace:true })
      } else {
        nav('/electricity', { replace:true })
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Login failed')
    }
  }

  return (
    <div className="centered">
      <div
        className="panel"
        style={{ minWidth: 320, maxWidth: 420, width: "100%" }}
      >
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              placeholder="you@example.com"
              id="email"
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              required
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div ref={widgetRef} className="cf-turnstile"></div>
          {!import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <small style={{opacity:.7}}>Captcha disabled (no site key configured)</small>
          )}
          <button disabled={loading} className="primary" type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
      <Toaster />
    </div>
  );
}
