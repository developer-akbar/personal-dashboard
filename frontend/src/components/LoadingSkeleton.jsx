import React from 'react'
import styles from './LoadingSkeleton.module.css'

export function AccountCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonCheckbox}></div>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonActions}>
          <div className={styles.skeletonButton}></div>
          <div className={styles.skeletonButton}></div>
          <div className={styles.skeletonButton}></div>
        </div>
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonLabel}></div>
          <div className={styles.skeletonValue}></div>
        </div>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonLabel}></div>
          <div className={styles.skeletonValue}></div>
        </div>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonLabel}></div>
          <div className={styles.skeletonValue}></div>
        </div>
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonText}></div>
      </div>
    </div>
  )
}

export function ElectricityCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonActions}>
          <div className={styles.skeletonButton}></div>
          <div className={styles.skeletonButton}></div>
          <div className={styles.skeletonButton}></div>
        </div>
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonItem}></div>
          <div className={styles.skeletonItem}></div>
          <div className={styles.skeletonItem}></div>
          <div className={styles.skeletonItem}></div>
        </div>
      </div>
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonText}></div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonAvatar}></div>
      </div>
      <div className={styles.skeletonActions}>
        <div className={styles.skeletonButton}></div>
        <div className={styles.skeletonButton}></div>
        <div className={styles.skeletonButton}></div>
      </div>
      <div className={styles.skeletonStats}>
        <div className={styles.skeletonStat}></div>
        <div className={styles.skeletonStat}></div>
      </div>
      <div className={styles.skeletonGrid}>
        <AccountCardSkeleton />
        <AccountCardSkeleton />
        <AccountCardSkeleton />
      </div>
    </div>
  )
}

export function ElectricitySkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonAvatar}></div>
      </div>
      <div className={styles.skeletonActions}>
        <div className={styles.skeletonButton}></div>
        <div className={styles.skeletonButton}></div>
      </div>
      <div className={styles.skeletonTabs}>
        <div className={styles.skeletonTab}></div>
        <div className={styles.skeletonTab}></div>
      </div>
      <div className={styles.skeletonGrid}>
        <ElectricityCardSkeleton />
        <ElectricityCardSkeleton />
        <ElectricityCardSkeleton />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className={styles.skeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonListItem}>
          <div className={styles.skeletonCheckbox}></div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonSubtitle}></div>
          </div>
          <div className={styles.skeletonActions}>
            <div className={styles.skeletonButton}></div>
            <div className={styles.skeletonButton}></div>
          </div>
        </div>
      ))}
    </div>
  )
}