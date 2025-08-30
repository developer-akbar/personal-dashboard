import styles from "./AccountCard.module.css";
import { Link } from "react-router-dom";
import { FiRefreshCcw, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function AccountCard({ account, onRefresh, onEdit, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.label}>
          <Link to={`/account/${account.id}`}>{account.label}</Link>
        </div>
        <div className={styles.region}>{account.region}</div>
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
      <div className={styles.footer}>
        <small>
          Last refreshed:{" "}
          {account.lastRefreshedAt
            ? new Date(account.lastRefreshedAt).toLocaleString()
            : "—"}
        </small>
        <div className={styles.actions}>
          <button onClick={(e) => { e.stopPropagation(); onRefresh(account) }} className={styles.primary}><FiRefreshCcw/> Refresh</button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(account) }} className={styles.muted}><FiEdit2/> Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(account) }} className={styles.danger}><FiTrash2/> Delete</button>
        </div>
      </div>
    </div>
  );
}

