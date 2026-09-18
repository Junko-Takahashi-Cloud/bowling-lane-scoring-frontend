import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { API_BASE, STAFF_TOKEN } from './apiConfig'

function StaffDashboard() {
  const [overview, setOverview] = useState(null)
  const [lanes, setLanes] = useState([])
  const [conditions, setConditions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${STAFF_TOKEN}` }

    Promise.all([
      axios.get(`${API_BASE}/api/v1/dashboard/center/overview`, { headers }),
      axios.get(`${API_BASE}/api/v1/dashboard/lanes/performance`, { headers }),
      axios.get(`${API_BASE}/api/v1/dashboard/conditions/performance`, { headers }),
    ])
      .then(([o, l, c]) => {
        setOverview(o.data)
        setLanes(l.data.entries || [])
        setConditions(c.data.entries || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(
          err.response
            ? `APIエラー (${err.response.status}): ${JSON.stringify(err.response.data)}`
            : 'サーバーに接続できませんでした。バックエンドが起動しているか確認してください。'
        )
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="loading">読み込み中...</div>
  if (error) return <div className="loading" style={{ color: '#dc2626' }}>{error}</div>

  return (
    <div className="page">
      <header className="page-header">
        <h1>スタッフ向けダッシュボード</h1>
        <p className="subtitle">第五弾 スコアリング分析システム</p>
      </header>

      <section className="section">
        <h2>センター全体サマリー</h2>
        <div className="card-grid">
          <SummaryCard label="総会員数" value={overview.total_members} />
          <SummaryCard label="総ゲーム数" value={overview.total_games} unit="ゲーム" />
          <SummaryCard label="全体平均スコア" value={overview.center_average_score} />
          <SummaryCard label="最も稼働の多いレーン" value={overview.most_active_lane ?? '-'} />
        </div>
      </section>

      <section className="section">
        <h2>レーン別成績</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lanes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="lane_number" tickFormatter={(v) => `レーン${v}`} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average_score" fill="#4f46e5" name="平均スコア" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="gear-table">
          <thead>
            <tr><th>レーン</th><th>ゲーム数</th><th>平均スコア</th><th>ストライク率</th></tr>
          </thead>
          <tbody>
            {lanes.map((l) => (
              <tr key={l.lane_number}>
                <td>レーン{l.lane_number}</td>
                <td>{l.games_played}</td>
                <td>{l.average_score}</td>
                <td>{l.strike_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>コンディション別成績</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conditions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pattern_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average_score" fill="#059669" name="平均スコア" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="gear-table">
          <thead>
            <tr><th>オイルパターン</th><th>ゲーム数</th><th>平均スコア</th></tr>
          </thead>
          <tbody>
            {conditions.map((c) => (
              <tr key={c.pattern_name}>
                <td>{c.pattern_name}</td>
                <td>{c.games_played}</td>
                <td>{c.average_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function SummaryCard({ label, value, unit }) {
  return (
    <div className="card summary-card">
      <div className="card-label">{label}</div>
      <div className="card-value">
        {value}
        {unit && <span className="card-unit">{unit}</span>}
      </div>
    </div>
  )
}

export default StaffDashboard