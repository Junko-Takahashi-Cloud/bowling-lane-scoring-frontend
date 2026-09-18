import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'
import { API_BASE, STAFF_TOKEN } from './apiConfig'
import StaffDashboard from './StaffDashboard'

const USER_ID = 1
const PIE_COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#94a3b8']

function App() {
  const [view, setView] = useState('member')

  return (
    <div>
      <nav className="view-switcher">
        <button className={view === 'member' ? 'active' : ''} onClick={() => setView('member')}>
          会員向け
        </button>
        <button className={view === 'staff' ? 'active' : ''} onClick={() => setView('staff')}>
          スタッフ向け
        </button>
      </nav>
      {view === 'member' ? <MemberDashboard /> : <StaffDashboard />}
    </div>
  )
}

function MemberDashboard() {
  const [memberToken, setMemberToken] = useState(localStorage.getItem('memberToken') || '')
  const [userId, setUserId] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [gearPerformance, setGearPerformance] = useState(null)
  const [lossFactors, setLossFactors] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // トークンがあれば、まず自分のuser_idを取得する
  useEffect(() => {
    if (!memberToken) return
    axios
      .get(`${API_BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      })
      .then((res) => setUserId(res.data.id))
      .catch(() => {
        // トークン切れなどの場合はログイン画面に戻す
        setMemberToken('')
        localStorage.removeItem('memberToken')
      })
  }, [memberToken])

  // user_idが分かったらダッシュボードデータを取得する
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    const headers = { Authorization: `Bearer ${memberToken}` }

    Promise.all([
      axios.get(`${API_BASE}/api/v1/dashboard/member/${userId}`, { headers }),
      axios.get(`${API_BASE}/api/v1/dashboard/member/${userId}/gear-performance`, { headers }),
      axios.get(`${API_BASE}/api/v1/dashboard/member/${userId}/loss-factors`, { headers }),
    ])
      .then(([d, g, l]) => {
        setDashboard(d.data)
        setGearPerformance(g.data)
        setLossFactors(l.data)
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
  }, [userId])

  const handleLoginSuccess = (token) => {
    localStorage.setItem('memberToken', token)
    setMemberToken(token)
  }

  const handleLogout = () => {
    localStorage.removeItem('memberToken')
    setMemberToken('')
    setUserId(null)
    setDashboard(null)
  }

  if (!memberToken) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

    if (!userId || loading || !dashboard || !gearPerformance || !lossFactors) {
    return <div className="loading">読み込み中...</div>
  }
  if (error) return <div className="loading" style={{ color: '#dc2626' }}>{error}</div>

  const pieData = [
    { name: 'ストライク', value: lossFactors.breakdown.strike_frames },
    { name: 'スペア', value: lossFactors.breakdown.spare_frames },
    { name: 'タップ', value: lossFactors.breakdown.open_tap_frames },
    { name: 'スプリット', value: lossFactors.breakdown.open_split_frames },
    { name: 'その他オープン', value: lossFactors.breakdown.open_other_frames },
  ]

  return (
    <div className="page">
      <header className="page-header">
        <h1>{dashboard.user_name} さんの成績ダッシュボード</h1>
        <p className="subtitle">第五弾 スコアリング分析システム</p>
        <button className="logout-button" onClick={handleLogout}>ログアウト</button>
      </header>

      <section className="card-grid">
        <SummaryCard label="総ゲーム数" value={dashboard.total_games} unit="ゲーム" />
        <SummaryCard label="平均スコア" value={dashboard.average_score} />
        <SummaryCard label="最高スコア" value={dashboard.high_score} highlight="good" />
        <SummaryCard label="最低スコア" value={dashboard.low_score} highlight="bad" />
      </section>

      <section className="section">
        <h2>投球傾向</h2>
        <div className="card-grid">
          <RateCard label="ストライク率" value={dashboard.strike_rate} />
          <RateCard label="スペア率" value={dashboard.spare_rate} />
          <RateCard label="10番ピン残り率" value={dashboard.pin10_leave_rate} />
          <RateCard label="スプリット率" value={dashboard.split_rate} />
          <RateCard label="タップ率" value={dashboard.single_pin_tap_rate} />
        </div>
      </section>

      <div className="two-col">
        <section className="section">
          <h2>フレーム内訳</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name} ${entry.value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="chart-note">全{lossFactors.breakdown.total_frames}フレーム中の内訳</p>
          </div>
        </section>

        <section className="section">
          <h2>ギア別成績</h2>
          {gearPerformance.entries.length === 0 ? (
            <p className="chart-note">登録されているギアがまだありません</p>
          ) : (
            <table className="gear-table">
              <thead>
                <tr>
                  <th>ギア名</th>
                  <th>使用回数</th>
                  <th>平均スコア</th>
                  <th>ストライク率</th>
                </tr>
              </thead>
              <tbody>
                {gearPerformance.entries.map((g) => (
                  <tr key={g.gear_id}>
                    <td>{g.gear_name}</td>
                    <td>{g.games_played}</td>
                    <td>{g.average_score}</td>
                    <td>{g.strike_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="section">
        <h2>直近のゲーム</h2>
        <ul className="recent-list">
          {dashboard.recent_games.map((g) => (
            <li key={g.game_id}>
              <span className="recent-date">
                {new Date(g.created_at).toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="recent-score">{g.total_score}点</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function LoginForm({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    axios
      .post(`${API_BASE}/api/v1/users/login`, { identifier, pin_code: pinCode })
      .then((res) => {
        onLoginSuccess(res.data.access_token)
      })
      .catch((err) => {
        setError(
          err.response?.data?.detail || 'ログインに失敗しました。会員コードとPINを確認してください。'
        )
        setSubmitting(false)
      })
  }

  return (
    <div className="page">
      <div className="login-box">
        <h1>会員ログイン</h1>
        <form onSubmit={handleSubmit}>
          <label>
            会員コード または 電話番号
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </label>
          <label>
            PINコード
            <input
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, unit, highlight }) {
  return (
    <div className={`card summary-card ${highlight ? `highlight-${highlight}` : ''}`}>
      <div className="card-label">{label}</div>
      <div className="card-value">
        {value}
        {unit && <span className="card-unit">{unit}</span>}
      </div>
    </div>
  )
}

function RateCard({ label, value }) {
  return (
    <div className="card rate-card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}%</div>
    </div>
  )
}

export default App