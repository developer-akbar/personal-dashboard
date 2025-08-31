import styles from "./AccountCard.module.css";
import { Link } from "react-router-dom";
import { FiRefreshCcw, FiEdit2, FiTrash2, FiStar } from "react-icons/fi";

export default function AccountCard({ account, onRefresh, onEdit, onDelete, onTogglePin, selected=false, onToggleSelect }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <input aria-label="Select account" className={styles.checkbox} type="checkbox" checked={!!selected} onChange={(e)=>{ e.stopPropagation(); onToggleSelect?.(account, e.target.checked) }} />
          <Link to={`/account/${account.id}`}>{account.label}</Link>
        </div>
        <div className={styles.region}>
          {account.region}
          <button type="button" onClick={(e)=>{ e.stopPropagation(); onTogglePin?.(account) }} title={account.pinned? 'Unpin' : 'Pin'} style={{marginLeft:8, background:'transparent', border:0, color: account.pinned? '#fbbf24' : '#888', cursor:'pointer'}}>
            <FiStar/>
          </button>
          {account.lastError && (
            <span title={account.lastError} style={{marginLeft:8, color:'#ef4444', fontSize:12}}>• Error</span>
          )}
        </div>
      </div>
      <div className="account-details">
        <div className={styles.email}>{account.email}</div>
        <div className={styles.balance}>
          <span>
            {account.lastCurrency === "INR" ? "₹" : account.lastCurrency}
          </span>
          <strong>
            {Number(account.lastBalance || 0).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>
      {Array.isArray(account.tags) && account.tags.length>0 && (
        <div className={styles.tags} aria-label="Account tags">
          {account.tags.map((t)=> (
            <span key={t} className={styles.tag} style={{background: tagColor(t)}}>{t}</span>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <small>
          Last refreshed:{" "}
          {account.lastRefreshedAt
            ? new Date(account.lastRefreshedAt).toLocaleString()
            : "—"}
        </small>
        <div className={styles.actions}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRefresh(account) }} className={styles.primary}><FiRefreshCcw/> Refresh</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(account) }} className={styles.muted}><FiEdit2/> Edit</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(account) }} className={styles.danger}><FiTrash2/> Delete</button>
        </div>
      </div>
    </div>
  );
}

function tagColor(label){
  // simple hash to HSL
  let h=0; for (let i=0;i<label.length;i++){ h = (h*31 + label.charCodeAt(i)) % 360 }
  return `hsl(${h} 60% 20% / 0.6)`
}

