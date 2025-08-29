import styles from './RefreshProgress.module.css'

export default function RefreshProgress({ refreshing, progress }) {
  if (!refreshing) return null
  const percent = progress.total ? Math.round((progress.current / progress.total) * 100) : 0
  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.text}>{progress.message || `Refreshing ${progress.current} of ${progress.total}...`}</div>
    </div>
  )
}

