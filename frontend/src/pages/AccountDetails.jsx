import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Chart } from 'chart.js'
import { useBalances } from '../store/useBalances'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function AccountDetails(){
  const { id } = useParams()
  const { history } = useBalances()
  const [data,setData]=useState([])

  useEffect(()=>{ (async()=>{ setData(await history(id)) })() },[id])

  const chartData = {
    labels: data.map(d=> new Date(d.createdAt).toLocaleString()),
    datasets: [{ label: 'Balance', data: data.map(d=> d.amount), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.2)'}]
  }

  return (
    <div className="container">
      <h2>Balance history</h2>
      <Line data={chartData} options={{ responsive:true, plugins:{ legend:{ display:false }}}} />
    </div>
  )
}

