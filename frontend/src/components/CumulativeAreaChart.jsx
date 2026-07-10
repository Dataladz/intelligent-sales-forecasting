import React, { useState, useMemo } from 'react'
import { parseLocalDate } from '../utils/dateUtils'

export default function CumulativeAreaChart({ forecastData }) {
  const [activeCumTooltip, setActiveCumTooltip] = useState(null)

  // Chronologically sort and compute running totals
  const cumulativeData = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return []

    // Sort to avoid errors if API response dates are jumbled
    const sorted = [...forecastData].sort(
      (a, b) => parseLocalDate(a.date) - parseLocalDate(b.date)
    )

    let runningTotal = 0
    return sorted.map(item => {
      runningTotal += item.sales
      return {
        date: item.date,
        sales: item.sales,
        cumulativeSales: runningTotal
      }
    })
  }, [forecastData])

  if (cumulativeData.length === 0) {
    return (
      <div className="placeholder-card" style={{ minHeight: '200px' }}>
        <p>No forecast data available.</p>
      </div>
    )
  }

  const svgWidth = 400
  const svgHeight = 240
  const paddingLeft = 60
  const paddingRight = 20
  const paddingTop = 25
  const paddingBottom = 40

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const maxVal = cumulativeData[cumulativeData.length - 1].cumulativeSales
  const yMax = maxVal * 1.05

  // Map points
  const points = cumulativeData.map((item, index) => {
    const x = paddingLeft + (cumulativeData.length > 1 ? (index / (cumulativeData.length - 1)) * chartWidth : chartWidth / 2)
    const y = paddingTop + chartHeight - (item.cumulativeSales / yMax) * chartHeight
    return { x, y, date: item.date, value: item.cumulativeSales, index }
  })

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = cumulativeData.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : ''

  const gridValues = [0, yMax * 0.33, yMax * 0.66, yMax]
  const labelInterval = cumulativeData.length > 20 ? 8 : cumulativeData.length > 10 ? 4 : 2

  return (
    <div className="chart-container-inner" style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="svg-chart" style={{ width: '100%', height: '220px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="cum-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4568dc" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {gridValues.map((val, idx) => {
          const y = paddingTop + chartHeight - (val / yMax) * chartHeight
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} className="chart-grid-line" />
              <text x={paddingLeft - 8} y={y + 3} className="chart-axis-text y-axis">
                ${Math.round(val / 1000).toLocaleString()}k
              </text>
            </g>
          )
        })}

        <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight} className="chart-axis-line" />

        {/* Area & Line */}
        {cumulativeData.length > 1 && <path d={areaPath} fill="url(#cum-gradient)" />}
        <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" />

        {/* Labels */}
        {points.map((p, idx) => {
          if (idx % labelInterval === 0 || idx === points.length - 1) {
            return (
              <text key={idx} x={p.x} y={paddingTop + chartHeight + 16} className="chart-axis-text x-axis">
                {p.date.substring(5)}
              </text>
            )
          }
          return null
        })}

        {/* Target Nodes */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={idx === points.length - 1 ? 5 : 2}
            fill={idx === points.length - 1 ? '#8b5cf6' : '#ffffff'}
            stroke="#8b5cf6"
            strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setActiveCumTooltip({
                x: p.x,
                y: p.y - 10,
                date: p.date,
                value: p.value
              })
            }}
            onMouseLeave={() => setActiveCumTooltip(null)}
          />
        ))}
      </svg>

      {activeCumTooltip && (
        <div 
          className="chart-tooltip"
          style={{ 
            left: `${((activeCumTooltip.x - paddingLeft) / chartWidth) * 100 + 10}%`,
            top: `${((activeCumTooltip.y - paddingTop) / chartHeight) * 100 - 15}%` 
          }}
        >
          <span className="tooltip-date">Cumulative ({activeCumTooltip.date})</span>
          <span className="tooltip-sales">${activeCumTooltip.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      )}
    </div>
  )
}
