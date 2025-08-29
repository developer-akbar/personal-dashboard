import styles from './AccountCard.module.css'
import { Link } from 'react-router-dom'

export default function AccountCard({ account, onRefresh, onEdit, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.label}><Link to={`/account/${account.id}`}>{account.label}</Link></div>
        <div className={styles.region}>{account.region}</div>
      </div>
      <div className={styles.email}>{account.email}</div>
      <div className={styles.balance}>
        <span>{account.lastCurrency}</span>
        <strong>{Number(account.lastBalance || 0).toLocaleString()}</strong>
      </div>
      <div className={styles.footer}>
        <small>Last refreshed: {account.lastRefreshedAt ? new Date(account.lastRefreshedAt).toLocaleString() : '—'}</small>
        <div className={styles.actions}>
          <button onClick={() => onRefresh(account)} className={styles.primary}>Refresh</button>
          <button onClick={() => onEdit(account)} className={styles.muted}>Edit</button>
          <button onClick={() => onDelete(account)} className={styles.danger}>Delete</button>
        </div>
      </div>
    </div>
  )
}

