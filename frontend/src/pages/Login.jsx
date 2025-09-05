import React from "react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import { FiEye, FiEyeOff } from "react-icons/fi";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
          'error-callback': ()=> { setCaptcha(''); toast.error('Captcha failed, retry', { duration: 2000 }) },
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
    if (!emailOk) return toast.error("Enter a valid email", { duration: 2000 });
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters", { duration: 2000 });
    try {
      if ((import.meta.env.VITE_TURNSTILE_SITE_KEY) && !captcha){ toast.error('Complete captcha', { duration: 2000 }); return }
      await login(email, password, captcha);
      const params = new URLSearchParams(loc.search)
      const next = params.get('next')
      if (next) {
        nav(next.startsWith('/')? next : '/amazon', { replace:true })
      } else {
        nav('/electricity', { replace:true })
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || 'Login failed', { duration: 2000 })
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
            <div style={{ position: 'relative' }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>
          <div ref={widgetRef} className="cf-turnstile"></div>
          {!import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <small style={{opacity:.7}}>Captcha disabled (no site key configured)</small>
          )}
          <button disabled={loading} className="primary" type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <p style={{ opacity: 0.8, margin: 0 }}>
            New here? <Link to="/register">Create account</Link>
          </p>
          <button 
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-bg)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            Forgot password?
          </button>
        </div>
      </div>
      
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false)
          toast.success('Password reset successfully! Please sign in with your new password.')
        }}
      />
      
      <Toaster />
    </div>
  );
}
