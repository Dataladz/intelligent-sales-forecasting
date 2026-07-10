import React, { useState, useMemo } from 'react'
import { getMondayBasedDayIndex } from '../utils/dateUtils'

export default function WeekdayBarChart({ forecastData, horizon }) {
  const [activeBarTooltip, setActiveBarTooltip] = useState(null)

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Memoize Day of Week Sales Calculations
  const dowStats = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return []

    const stats = Array.from({ length: 7 }, (_, i) => ({
      dayIndex: i,
      dayName: dayNames[i],
      shortName: shortDayNames[i],
      total: 0,
      count: 0,
      average: null
    }))

    forecastData.forEach(item => {
      const idx = getMondayBasedDayIndex(item.date)
      if (idx !== null && idx >= 0 && idx < 7) {
        stats[idx].total += item.sales
        stats[idx].count += 1
      }
    })

    // Compute average for each day
    stats.forEach(item => {
      item.average = item.count > 0 ? item.total / item.count : null
    })

    return stats
  }, [forecastData])

  if (dowStats.length === 0) {
    return (
      <div className="placeholder-card" style={{ minHeight: '200px' }}>
        <p>No forecast data available.</p>
      </div>
    )
  }

  const svgWidth = 400
  const svgHeight = 240
  const paddingLeft = 55
  const paddingRight = 15
  const paddingTop = 25
  const paddingBottom = 40

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  // Find max value for scaling, default to 1 if all are null/0
  const validAverages = dowStats.map(d => d.average).filter(v => v !== null)
  const maxVal = validAverages.length > 0 ? Math.max(...validAverages) : 1
  const yMax = maxVal * 1.1

  const barWidth = (chartWidth / 7) * 0.6
  const barSpacing = (chartWidth / 7) * 0.4

  const gridValues = [0, yMax * 0.33, yMax * 0.66, yMax]

  return (
    <div className="chart-container-inner" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="svg-chart" style={{ width: '100%', height: '220px', overflow: 'visible' }}>
        {/* Grid Lines */}
        {gridValues.map((val, idx) => {
          const y = paddingTop + chartHeight - (val / yMax) * chartHeight
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} className="chart-grid-line" />
              <text x={paddingLeft - 8} y={y + 3} className="chart-axis-text y-axis">
                ${Math.round(val).toLocaleString()}
              </text>
            </g>
          )
        })}

        <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight} className="chart-axis-line" />

        {/* Draw Bars / Placeholders */}
        {dowStats.map((item, idx) => {
          const hasData = item.average !== null
          const h = hasData ? (item.average / yMax) * chartHeight : 0
          const x = paddingLeft + idx * (barWidth + barSpacing) + barSpacing / 2
          const y = paddingTop + chartHeight - h

          return (
            <g key={idx}>
              {hasData ? (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, h)}
                  rx="4"
                  className="chart-bar"
                  onMouseEnter={() => {
                    setActiveBarTooltip({
                      x: x + barWidth / 2,
                      y: y - 10,
                      day: item.dayName,
                      average: item.average,
                      count: item.count,
                      total: item.total
                    })
                  }}
                  onMouseLeave={() => setActiveBarTooltip(null)}
                />
              ) : (
                <g>
                  {/* Empty state marker instead of height 0 bar */}
                  <text
                    x={x + barWidth / 2}
                    y={paddingTop + chartHeight - 12}
                    className="chart-axis-text"
                    style={{ fontSize: '6px', fill: 'var(--text-muted)', textAnchor: 'middle' }}
                  >
                    No Data
                  </text>
                  <circle
                    cx={x + barWidth / 2}
                    cy={paddingTop + chartHeight - 5}
                    r="1.5"
                    fill="var(--text-muted)"
                    opacity="0.3"
                  />
                </g>
              )}
              <text x={x + barWidth / 2} y={paddingTop + chartHeight + 16} className="chart-axis-text x-axis">
                {item.shortName}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Warning message for short horizons */}
      {horizon < 14 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic', textAlign: 'center' }}>
          * Weekday analysis is more reliable for horizons of 14 days or longer.
        </div>
      )}

      {activeBarTooltip && (
        <div 
          className="chart-tooltip"
          style={{ 
            left: `${((activeBarTooltip.x - paddingLeft) / chartWidth) * 100 + 10}%`,
            top: `${((activeBarTooltip.y - paddingTop) / chartHeight) * 100 - 15}%` 
          }}
        >
          <span className="tooltip-date" style={{ fontWeight: 'bold' }}>{activeBarTooltip.day}</span>
          <span className="tooltip-sales">Avg: ${activeBarTooltip.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Days: {activeBarTooltip.count}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total: ${activeBarTooltip.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      )}
    </div>
  )
}
