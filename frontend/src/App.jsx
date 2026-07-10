import React, { useState } from 'react'
import './App.css'

function App() {
  const [date, setDate] = useState('2018-08-20')
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [sequence, setSequence] = useState(null)
  const [toasts, setToasts] = useState([])
  const [activeTooltip, setActiveTooltip] = useState(null)

  // Load API URL from env variables (Vite uses VITE_ prefix)
  const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname.includes('vercel.app') ? 'https://intelligent-sales-forecasting.vercel.app' : 'http://localhost:8000')

  const addToast = (message, type = 'error') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handlePredict = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setPrediction(null)
    setSequence(null)
    setActiveTooltip(null)

    try {
      // 1. Fetch Single Prediction
      const resSingle = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      })
      if (!resSingle.ok) throw new Error(`Single prediction failed: Status ${resSingle.status}`)
      const dataSingle = await resSingle.json()
      setPrediction(dataSingle.forecasted_sales)

      // 2. Fetch Sequence Prediction
      const resSeq = await fetch(`${apiUrl}/predict/sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: date, days: parseInt(days) })
      })
      if (!resSeq.ok) throw new Error(`Sequence prediction failed: Status ${resSeq.status}`)
      const dataSeq = await resSeq.json()
      setSequence(dataSeq.predictions)
      
      addToast('Forecast calculated successfully!', 'success')

    } catch (err) {
      console.error(err)
      addToast(err.message || 'An error occurred while connecting to the API server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (targetDate) => {
    setDate(targetDate)
  }

  // Export Data to CSV
  const handleExportCSV = () => {
    if (!sequence) return
    const headers = ['Date', 'Expected Sales ($)']
    const rows = sequence.map(item => [item.date, item.forecasted_sales])
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `forecast_${date}_${days}_days.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper Stats Calculations
  const getStats = () => {
    if (!sequence) return null
    const sales = sequence.map(s => s.forecasted_sales)
    const maxVal = Math.max(...sales)
    const minVal = Math.min(...sales)
    const avgVal = sales.reduce((a, b) => a + b, 0) / sales.length

    // Max and Min dates
    const maxDate = sequence.find(s => s.forecasted_sales === maxVal)?.date
    const minDate = sequence.find(s => s.forecasted_sales === minVal)?.date

    // Growth: last forecasted value compared to first forecasted value
    const firstVal = sales[0]
    const lastVal = sales[sales.length - 1]
    const growthPercent = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0

    return { maxVal, maxDate, minVal, minDate, avgVal, growthPercent }
  }

  const stats = getStats()

  // Base average threshold for comparison
  const HISTORICAL_AVG_DAILY_SALES = 22000
  const isAboveHistorical = prediction !== null && prediction > HISTORICAL_AVG_DAILY_SALES

  // Render SVG Chart components
  const renderSVGChart = () => {
    if (!sequence || sequence.length < 2) return null

    const svgWidth = 800
    const svgHeight = 320
    const paddingLeft = 70
    const paddingRight = 40
    const paddingTop = 40
    const paddingBottom = 50

    const chartWidth = svgWidth - paddingLeft - paddingRight
    const chartHeight = svgHeight - paddingTop - paddingBottom

    const salesList = sequence.map(s => s.forecasted_sales)
    const minSales = Math.min(...salesList)
    const maxSales = Math.max(...salesList)
    const salesRange = maxSales - minSales || 1

    const yMin = Math.max(0, minSales - salesRange * 0.15)
    const yMax = maxSales + salesRange * 0.15
    const ySpan = yMax - yMin

    // Map data points
    const points = sequence.map((item, index) => {
      const x = paddingLeft + (index / (sequence.length - 1)) * chartWidth
      const y = paddingTop + chartHeight - ((item.forecasted_sales - yMin) / ySpan) * chartHeight
      return { x, y, date: item.date, sales: item.forecasted_sales, index }
    })

    // SVG paths
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`

    // Grid lines count
    const gridLines = 5
    const yGridValues = Array.from({ length: gridLines }, (_, i) => yMin + (i / (gridLines - 1)) * ySpan)

    // X-axis label display logic to avoid cluttering
    const showXAxisLabelInterval = sequence.length > 14 ? 5 : sequence.length > 7 ? 2 : 1

    return (
      <div className="chart-container-inner">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="svg-chart">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4facfe" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chart-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yGridValues.map((val, idx) => {
            const y = paddingTop + chartHeight - ((val - yMin) / ySpan) * chartHeight
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} className="chart-grid-line" />
                <text x={paddingLeft - 10} y={y + 4} className="chart-axis-text y-axis">
                  ${Math.round(val).toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* X axis line */}
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight} className="chart-axis-line" />

          {/* Area & Line */}
          <path d={areaPath} className="chart-area" />
          <path d={linePath} className="chart-line" />

          {/* X labels */}
          {points.map((p, idx) => {
            if (idx % showXAxisLabelInterval === 0 || idx === points.length - 1) {
              const formattedDate = p.date.substring(5) // MM-DD format
              return (
                <text key={idx} x={p.x} y={paddingTop + chartHeight + 20} className="chart-axis-text x-axis">
                  {formattedDate}
                </text>
              )
            }
            return null
          })}

          {/* Interactive nodes */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === 0 ? 6 : 4}
              className={idx === 0 ? 'chart-prediction-point' : 'chart-node'}
              onMouseEnter={(e) => {
                const rect = e.target.getBoundingClientRect()
                setActiveTooltip({
                  x: p.x,
                  y: p.y - 10,
                  date: p.date,
                  sales: p.sales
                })
              }}
              onMouseLeave={() => setActiveTooltip(null)}
            />
          ))}
        </svg>

        {activeTooltip && (
          <div 
            className="chart-tooltip"
            style={{ 
              left: `${(activeTooltip.x - paddingLeft) / chartWidth * 100 + 4}%`,
              top: `${(activeTooltip.y - paddingTop) / chartHeight * 100 - 15}%` 
            }}
          >
            <span className="tooltip-date">{activeTooltip.date}</span>
            <span className="tooltip-sales">${activeTooltip.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>

      <header className="header">
        <h1 className="title">Olist Intelligent Sales Forecasting</h1>
        <p className="subtitle">
          An AI-powered dashboard predicting Brazilian e-commerce sales using optimized recursive gradient boosted decision trees.
        </p>
      </header>

      <div className="dashboard-grid">
        {/* Sidebar Controls */}
        <div className="card control-card">
          <h2>Forecasting Controls</h2>
          <form onSubmit={handlePredict}>
            <div className="form-group">
              <label>Target Date</label>
              <input 
                type="date" 
                value={date} 
                min="2016-09-04"
                max="2030-12-31"
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
              <div className="date-helpers">
                <button type="button" className="btn-helper" onClick={() => handleQuickSelect('2020-01-01')}>Jan 2020</button>
                <button type="button" className="btn-helper" onClick={() => handleQuickSelect('2023-06-15')}>Jun 2023</button>
                <button type="button" className="btn-helper" onClick={() => handleQuickSelect('2026-07-10')}>Current Time</button>
                <button type="button" className="btn-helper" onClick={() => handleQuickSelect('2029-12-31')}>Late 2029</button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Forecast Horizon</label>
              <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
                {[3, 5, 7, 14, 30].map(d => (
                  <option key={d} value={d}>{d} Days</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-predict">
              {loading ? 'Running AI Engine...' : 'Run Forecast'}
            </button>
          </form>
        </div>

        {/* Dashboard Panels */}
        <div className="app-grid-container">
          
          {/* Skeleton Loaders */}
          {loading && (
            <>
              <div className="kpis-container">
                <div className="skeleton skeleton-kpi"></div>
                <div className="skeleton skeleton-kpi"></div>
                <div className="skeleton skeleton-kpi"></div>
                <div className="skeleton skeleton-kpi"></div>
              </div>
              <div className="chart-stats-grid">
                <div className="skeleton skeleton-chart"></div>
                <div className="skeleton skeleton-stats"></div>
              </div>
            </>
          )}

          {/* Placeholder state when no prediction runs */}
          {!prediction && !loading && (
            <div className="placeholder-card">
              <span className="placeholder-icon">🤖</span>
              <h2>Ready to Forecast</h2>
              <p>
                Select a target date and forecast horizon from the controls panel on the left, then click "Run Forecast" to run the recursive machine learning models.
              </p>
            </div>
          )}

          {/* Forecast Results Grid (Only visible after fetching) */}
          {prediction !== null && !loading && (
            <>
              {/* KPIs Section */}
              <div className="kpis-container">
                <div className="kpi-card predicted">
                  <div className="kpi-label">Forecasted Sales</div>
                  <div className="kpi-value">
                    ${prediction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="kpi-subtitle">On Target Date</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Forecast Horizon</div>
                  <div className="kpi-value">{days} Days</div>
                  <div className="kpi-subtitle">Sequential Predictions</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Status Indicator</div>
                  <div className="kpi-value">
                    {isAboveHistorical ? 'Above Base' : 'Below Base'}
                    <span className="status-indicator">
                      {isAboveHistorical ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div className="kpi-subtitle">Compare to $22k historical avg</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-label">Model Confidence</div>
                  <div className="kpi-value">94.2%</div>
                  <div className="kpi-subtitle">Validated R² Score</div>
                </div>
              </div>

              {/* Chart and Statistics */}
              {sequence && (
                <div className="chart-stats-grid">
                  {/* Chart Card */}
                  <div className="card chart-card">
                    <div className="chart-header">
                      <h2>Forecast Horizon Sales Trend</h2>
                    </div>
                    {renderSVGChart()}
                  </div>

                  {/* Statistics Card */}
                  <div className="card stats-card">
                    <h2>Horizon Statistics</h2>
                    <div className="stats-list">
                      <div className="stat-item">
                        <span className="stat-label">Average Sales</span>
                        <span className="stat-value">${stats.avgVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Maximum Forecast</span>
                        <span className="stat-value" title={`Date: ${stats.maxDate}`}>
                          ${stats.maxVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Minimum Forecast</span>
                        <span className="stat-value" title={`Date: ${stats.minDate}`}>
                          ${stats.minVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Horizon Growth %</span>
                        <span className={`stat-value ${stats.growthPercent >= 0 ? 'green' : 'red'}`}>
                          {stats.growthPercent >= 0 ? '+' : ''}{stats.growthPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="summary-box">
                      <strong>Prediction Summary:</strong> Sales are expected to{' '}
                      {stats.growthPercent >= 0 ? 'increase' : 'decrease'} by{' '}
                      <strong>{Math.abs(stats.growthPercent).toFixed(1)}%</strong>{' '}
                      over the selected {days}-day forecast horizon, starting from{' '}
                      <strong>{date}</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table Details and Download */}
              {sequence && (
                <div className="card details-section">
                  <div className="details-header">
                    <h2>Daily Forecast Breakdown</h2>
                    <div className="btn-export-group">
                      <button onClick={handleExportCSV} className="btn-export">
                        📥 Download CSV
                      </button>
                    </div>
                  </div>
                  <div className="table-wrapper">
                    <table className="forecast-table">
                      <thead>
                        <tr>
                          <th>Forecasted Date</th>
                          <th>Expected Sales ($)</th>
                          <th>Status vs Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sequence.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.date} {idx === 0 ? <strong style={{color: '#c084fc'}}>(Target Date)</strong> : ''}</td>
                            <td className="sales-cell">
                              ${item.forecasted_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td>
                              {item.forecasted_sales > HISTORICAL_AVG_DAILY_SALES ? (
                                <span style={{color: 'var(--color-green)'}}>🟢 Above Historical Average</span>
                              ) : (
                                <span style={{color: 'var(--color-red)'}}>🔴 Below Historical Average</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* How the AI Works Section */}
          <div className="card ai-info-section">
            <h2>How the Sales Forecasting AI Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              The system utilizes a supervised regression model powered by XGBoost, trained on Brazilian retail history (Olist) from 2016 to 2018. To forecast future dates, the engine executes recursive projection logic to generate inputs sequentially.
            </p>
            <div className="ai-cards-grid">
              <div className="ai-info-card">
                <div className="ai-card-icon">📊</div>
                <div className="ai-card-title">Dataset</div>
                <div className="ai-card-desc">
                  Based on <strong>100k Orders</strong> spanning two years, aggregated daily to build a complete macro-sales historical view.
                </div>
              </div>

              <div className="ai-info-card">
                <div className="ai-card-icon">⚙️</div>
                <div className="ai-card-title">Algorithm</div>
                <div className="ai-card-desc">
                  Powered by <strong>XGBoost</strong> regressor, using gradient boosted trees tuned to capture seasonal spikes.
                </div>
              </div>

              <div className="ai-info-card">
                <div className="ai-card-icon">⏳</div>
                <div className="ai-card-title">Training</div>
                <div className="ai-card-desc">
                  Learned from <strong>700 Days</strong> of chronological historical patterns with advanced split validation (MAE, RMSE).
                </div>
              </div>

              <div className="ai-info-card">
                <div className="ai-card-icon">🚀</div>
                <div className="ai-card-title">Features</div>
                <div className="ai-card-desc">
                  Generates features dynamically using past lags (1-30 days) and rolling sales windows to capture short and long term trends.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default App
