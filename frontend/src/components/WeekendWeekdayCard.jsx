import React, { useMemo } from 'react'
import { getMondayBasedDayIndex } from '../utils/dateUtils'

export default function WeekendWeekdayCard({ forecastData }) {
  const comparison = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return null

    let weekdayTotal = 0, weekdayCount = 0
    let weekendTotal = 0, weekendCount = 0

    forecastData.forEach(item => {
      const idx = getMondayBasedDayIndex(item.date)
      if (idx !== null) {
        const isWeekend = idx === 5 || idx === 6 // Saturday = 5, Sunday = 6
        if (isWeekend) {
          weekendTotal += item.sales
          weekendCount += 1
        } else {
          weekdayTotal += item.sales
          weekdayCount += 1
        }
      }
    })

    const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0
    const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0

    const diffPct = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : null

    // Determine bar percentages for rendering
    const maxAvg = Math.max(weekdayAvg, weekendAvg) || 1
    const weekdayPct = (weekdayAvg / maxAvg) * 100
    const weekendPct = (weekendAvg / maxAvg) * 100

    // Dynamic copy description
    let summaryText = 'Not enough data to calculate the comparison.'
    if (diffPct !== null) {
      if (Math.abs(diffPct) < 0.01) {
        summaryText = 'Weekend and weekday sales are forecasted to be nearly equal.'
      } else {
        const direction = diffPct > 0 ? 'higher' : 'lower'
        summaryText = `Weekend sales are forecasted to be ${Math.abs(diffPct).toFixed(1)}% ${direction} than weekday sales.`
      }
    }

    return { weekdayAvg, weekendAvg, diffPct, weekdayPct, weekendPct, summaryText }
  }, [forecastData])

  if (!comparison) return null

  const { weekdayAvg, weekendAvg, diffPct, weekdayPct, weekendPct, summaryText } = comparison

  return (
    <div className="comparison-bar-container" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '1.25rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
        Weekend vs Weekday Average
      </h3>
      
      <div className="comparison-bar-item" style={{ marginBottom: '1rem' }}>
        <div className="comparison-bar-label">
          <span>Weekday Average (Mon-Fri)</span>
          <strong>${Math.round(weekdayAvg).toLocaleString()}</strong>
        </div>
        <div className="comparison-bar-bg">
          <div className="comparison-bar-fill" style={{ width: `${weekdayPct}%` }}></div>
        </div>
      </div>

      <div className="comparison-bar-item" style={{ marginBottom: '1rem' }}>
        <div className="comparison-bar-label">
          <span>Weekend Average (Sat-Sun)</span>
          <strong>${Math.round(weekendAvg).toLocaleString()}</strong>
        </div>
        <div className="comparison-bar-bg">
          <div className="comparison-bar-fill purple" style={{ width: `${weekendPct}%` }}></div>
        </div>
      </div>

      {diffPct !== null && (
        <div className="summary-box" style={{ fontSize: '0.8rem', padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.04)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
          {summaryText}
        </div>
      )}
    </div>
  )
}
