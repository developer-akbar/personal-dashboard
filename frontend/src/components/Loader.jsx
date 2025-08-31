import React from 'react'
import styles from './Loader.module.css'

export default function Loader({ text = 'Loading…' }){
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <div className={styles.text}>{text}</div>
    </div>
  )
}

