'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@/types/admin'
import { ArrowPathIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

interface Version {
  id: string
  timestamp: string
  employeeCount: number
  changes: string[]
}

interface ActivityLogEntry {
  id: string
  action: string
  details: string
  author: string
  timestamp: string
  type: string
}

interface VersionHistoryPanelProps {
  onDataChange: () => void
  userRole: UserRole
}

export default function VersionHistoryPanel({ onDataChange, userRole }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [rollingBack, setRollingBack] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [versionsRes, activityRes] = await Promise.all([
        fetch('/api/admin/versions'),
        fetch('/api/admin/activity')
      ])

      const versionsData = await versionsRes.json()
      const activityData = await activityRes.json()

      setVersions(versionsData)
      setActivityLog(activityData)
    } catch (error) {
      console.error('Error loading version history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (versionId: string) => {
    if (!confirm(`Are you sure you want to rollback to version ${versionId}?\n\nThis will restore the employee directory to this exact state. A backup of the current state will be created automatically.`)) {
      return
    }

    setRollingBack(true)
    try {
      const response = await fetch('/api/admin/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId, author: 'Admin' })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Successfully rolled back to ${versionId}!\nCurrent backup saved as: ${result.backupId}\nRestored ${result.employeeCount} employees`)
        onDataChange()
        loadData()
      } else {
        alert(result.error || 'Failed to rollback')
      }
    } catch (error) {
      alert('Error performing rollback')
    } finally {
      setRollingBack(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'publish':
        return '📤'
      case 'rollback':
        return '⏪'
      default:
        return '📝'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '16px', color: 'var(--secondary-text-color)' }}>
          Loading version history...
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Version History */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <DocumentTextIcon style={{ width: '20px', height: '20px' }} />
            Version Snapshots ({versions.length})
          </h2>

          {versions.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              background: 'white',
              borderRadius: 'var(--border-radius-large)',
              border: '1px solid var(--border-color)'
            }}>
              <DocumentTextIcon style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                color: 'var(--secondary-text-color)',
                opacity: 0.5
              }} />
              <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
                No version snapshots yet
              </p>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginTop: '8px' }}>
                Snapshots are created automatically when you publish changes
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {versions.map((version) => (
                <div
                  key={version.id}
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: 'var(--border-radius-large)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-small)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-text-color)', marginBottom: '4px' }}>
                        {version.id}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>
                        {formatDate(version.timestamp)}
                      </div>
                    </div>
                    {userRole === 'superadmin' && (
                      <button
                        onClick={() => handleRollback(version.id)}
                        disabled={rollingBack}
                        style={{
                          padding: '6px 12px',
                          background: 'white',
                          color: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                          borderRadius: '6px',
                          cursor: rollingBack ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Rollback to this version"
                      >
                        <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                        Rollback
                      </button>
                    )}
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'var(--background-color)',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '4px' }}>
                      Employee Count: <strong style={{ color: 'var(--primary-text-color)' }}>{version.employeeCount}</strong>
                    </div>
                    {version.changes && version.changes.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--secondary-text-color)' }}>
                          Changes:
                        </div>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '20px',
                          fontSize: '12px',
                          color: 'var(--primary-text-color)'
                        }}>
                          {version.changes.slice(0, 5).map((change, idx) => (
                            <li key={idx}>{change}</li>
                          ))}
                          {version.changes.length > 5 && (
                            <li style={{ color: 'var(--secondary-text-color)', fontStyle: 'italic' }}>
                              +{version.changes.length - 5} more changes
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ClockIcon style={{ width: '20px', height: '20px' }} />
            Activity Log ({activityLog.length})
          </h2>

          {activityLog.length === 0 ? (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              background: 'white',
              borderRadius: 'var(--border-radius-large)',
              border: '1px solid var(--border-color)'
            }}>
              <ClockIcon style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                color: 'var(--secondary-text-color)',
                opacity: 0.5
              }} />
              <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
                No activity yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activityLog.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: 'var(--border-radius-medium)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'start'
                  }}
                >
                  <div style={{ fontSize: '20px', marginTop: '2px' }}>
                    {getActionIcon(entry.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--primary-text-color)', marginBottom: '4px' }}>
                      <strong>{entry.action.toUpperCase()}</strong>: {entry.details}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)' }}>
                      {entry.author} • {formatDate(entry.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
