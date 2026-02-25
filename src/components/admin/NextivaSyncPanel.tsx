'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowUpTrayIcon,
  ClockIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface NextivaSyncPanelProps {
  userRole: 'superadmin' | 'approver' | 'editor'
  employees: Array<{ id: string; firstName: string; lastName: string; email?: string | null }>
  onDataChange: () => void
}

interface UploadResult {
  matched: number
  updated: number
  created: number
  skipped: number
  errors: number
  details?: {
    autoUpdated?: Array<{ employeeId: string; name: string; changes: Record<string, { old: string; new: string }> }>
    pendingReview?: Array<{ name: string; email: string; reason: string }>
    skippedEntries?: Array<{ name: string; reason: string }>
    errorEntries?: Array<{ row: number; name: string; error: string }>
  }
}

interface SyncLog {
  id: string
  timestamp: string
  source: 'manual' | 'automated'
  totalRows: number
  matched: number
  updated: number
  created: number
  skipped: number
  errors: number
  triggeredBy: string
}

interface Mapping {
  id: string
  nextivaEmail: string
  employeeId: string
  employeeName: string
  notes?: string | null
  addedBy: string
  addedAt: string
}

export default function NextivaSyncPanel({ userRole, employees, onDataChange }: NextivaSyncPanelProps) {
  const isSuperAdmin = userRole === 'superadmin'

  // Section 1: CSV Upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Section 2: Sync History
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Section 3: Manual Mappings
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loadingMappings, setLoadingMappings] = useState(true)
  const [newMapping, setNewMapping] = useState({ nextivaEmail: '', employeeId: '', notes: '' })
  const [addingMapping, setAddingMapping] = useState(false)
  const [deletingMappingId, setDeletingMappingId] = useState<string | null>(null)

  useEffect(() => {
    loadSyncHistory()
    if (isSuperAdmin) {
      loadMappings()
    }
  }, [isSuperAdmin])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // --- Section 1: CSV Upload ---

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      alert('Please select a CSV file first')
      return
    }

    if (!file.name.endsWith('.csv')) {
      alert('Please select a valid .csv file')
      return
    }

    setUploading(true)
    setUploadResult(null)
    setExpandedSection(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/sync/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || `Upload failed (${response.status})`)
        return
      }

      setUploadResult(result)
      onDataChange()
      loadSyncHistory()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading CSV file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // --- Section 2: Sync History ---

  const loadSyncHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/admin/sync/status')
      if (response.ok) {
        const data = await response.json()
        setSyncLogs(Array.isArray(data.recentLogs) ? data.recentLogs : [])
      }
    } catch (error) {
      console.error('Error loading sync history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // --- Section 3: Manual Mappings ---

  const loadMappings = async () => {
    setLoadingMappings(true)
    try {
      const response = await fetch('/api/admin/sync/mappings')
      if (response.ok) {
        const data = await response.json()
        setMappings(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading mappings:', error)
    } finally {
      setLoadingMappings(false)
    }
  }

  const handleAddMapping = async () => {
    if (!newMapping.nextivaEmail || !newMapping.employeeId) {
      alert('Please provide both a Nextiva email and select an employee')
      return
    }

    setAddingMapping(true)
    try {
      const response = await fetch('/api/admin/sync/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextivaEmail: newMapping.nextivaEmail,
          employeeId: newMapping.employeeId,
          notes: newMapping.notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || `Failed to add mapping (${response.status})`)
        return
      }

      alert('Mapping added successfully')
      setNewMapping({ nextivaEmail: '', employeeId: '', notes: '' })
      loadMappings()
    } catch (error) {
      console.error('Error adding mapping:', error)
      alert('Error adding mapping. Please try again.')
    } finally {
      setAddingMapping(false)
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('Remove this manual mapping?')) return

    setDeletingMappingId(mappingId)
    try {
      const response = await fetch(`/api/admin/sync/mappings?id=${encodeURIComponent(mappingId)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        alert(result.error || `Failed to delete mapping (${response.status})`)
        return
      }

      alert('Mapping removed')
      loadMappings()
    } catch (error) {
      console.error('Error deleting mapping:', error)
      alert('Error deleting mapping. Please try again.')
    } finally {
      setDeletingMappingId(null)
    }
  }

  const toggleDetailSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // --- Render ---

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Section 1: CSV Upload */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: 'var(--border-radius-large)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-small)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ArrowUpTrayIcon style={{ width: '20px', height: '20px', color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            Nextiva CSV Upload
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: '0 0 20px 0' }}>
          Upload a Nextiva phone system CSV export to sync employee extensions and contact data
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-medium)',
              fontSize: '14px',
              background: 'var(--background-color)',
            }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: uploading ? 'var(--secondary-text-color)' : 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-medium)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {uploading ? (
              <>
                <ArrowPathIcon style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Uploading...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon style={{ width: '16px', height: '16px' }} />
                Upload & Sync
              </>
            )}
          </button>
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--background-color)',
            borderRadius: 'var(--border-radius-medium)',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
              Sync Results
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                padding: '12px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>
                  {uploadResult.matched}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                  Matched
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-color)' }}>
                  {uploadResult.updated}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                  Updated
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>
                  {uploadResult.created}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                  Created
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--secondary-text-color)' }}>
                  {uploadResult.skipped}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                  Skipped
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: 'white',
                borderRadius: '8px',
                border: uploadResult.errors > 0 ? '1px solid var(--error-color)' : '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: uploadResult.errors > 0 ? 'var(--error-color)' : 'var(--secondary-text-color)',
                }}>
                  {uploadResult.errors}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                  Errors
                </div>
              </div>
            </div>

            {/* Detailed Breakdowns */}
            {uploadResult.details && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Auto-Updated */}
                {uploadResult.details.autoUpdated && uploadResult.details.autoUpdated.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleDetailSection('autoUpdated')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--success-color)',
                        textAlign: 'left',
                      }}
                    >
                      <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                      Auto-Updated Employees ({uploadResult.details.autoUpdated.length})
                      <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                        {expandedSection === 'autoUpdated' ? 'Collapse' : 'Expand'}
                      </span>
                    </button>
                    {expandedSection === 'autoUpdated' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                      }}>
                        {uploadResult.details.autoUpdated.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 0',
                              borderBottom: idx < uploadResult.details!.autoUpdated!.length - 1
                                ? '1px solid var(--border-color)'
                                : 'none',
                              fontSize: '13px',
                            }}
                          >
                            <div style={{ fontWeight: '600' }}>{item.name}</div>
                            <div style={{ color: 'var(--secondary-text-color)', fontSize: '12px', marginTop: '2px' }}>
                              {Object.entries(item.changes).map(([field, { old: oldVal, new: newVal }]) =>
                                `${field}: ${oldVal || '(empty)'} → ${newVal}`
                              ).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Review */}
                {uploadResult.details.pendingReview && uploadResult.details.pendingReview.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleDetailSection('pendingReview')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--warning-color)',
                        textAlign: 'left',
                      }}
                    >
                      <ExclamationTriangleIcon style={{ width: '16px', height: '16px' }} />
                      Pending Review ({uploadResult.details.pendingReview.length})
                      <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                        {expandedSection === 'pendingReview' ? 'Collapse' : 'Expand'}
                      </span>
                    </button>
                    {expandedSection === 'pendingReview' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                      }}>
                        {uploadResult.details.pendingReview.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 0',
                              borderBottom: idx < uploadResult.details!.pendingReview!.length - 1
                                ? '1px solid var(--border-color)'
                                : 'none',
                              fontSize: '13px',
                            }}
                          >
                            <div style={{ fontWeight: '600' }}>{item.name}</div>
                            <div style={{ color: 'var(--warning-color)', fontSize: '12px', marginTop: '2px' }}>
                              {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skipped Entries */}
                {uploadResult.details.skippedEntries && uploadResult.details.skippedEntries.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleDetailSection('skipped')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(107, 114, 128, 0.1)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--secondary-text-color)',
                        textAlign: 'left',
                      }}
                    >
                      <ClockIcon style={{ width: '16px', height: '16px' }} />
                      Skipped Entries ({uploadResult.details.skippedEntries.length})
                      <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                        {expandedSection === 'skipped' ? 'Collapse' : 'Expand'}
                      </span>
                    </button>
                    {expandedSection === 'skipped' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                      }}>
                        {uploadResult.details.skippedEntries.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 0',
                              borderBottom: idx < uploadResult.details!.skippedEntries!.length - 1
                                ? '1px solid var(--border-color)'
                                : 'none',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: '600' }}>{item.name}:</span>{' '}
                            <span style={{ color: 'var(--secondary-text-color)' }}>{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Errors */}
                {uploadResult.details.errorEntries && uploadResult.details.errorEntries.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleDetailSection('errors')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--error-color)',
                        textAlign: 'left',
                      }}
                    >
                      <XCircleIcon style={{ width: '16px', height: '16px' }} />
                      Errors ({uploadResult.details.errorEntries.length})
                      <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                        {expandedSection === 'errors' ? 'Collapse' : 'Expand'}
                      </span>
                    </button>
                    {expandedSection === 'errors' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                      }}>
                        {uploadResult.details.errorEntries.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 0',
                              borderBottom: idx < uploadResult.details!.errorEntries!.length - 1
                                ? '1px solid var(--border-color)'
                                : 'none',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: '600' }}>Row {item.row}:</span>{' '}
                            <span style={{ color: 'var(--error-color)' }}>{item.error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Sync History */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: 'var(--border-radius-large)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-small)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClockIcon style={{ width: '20px', height: '20px', color: 'var(--accent-color)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              Sync History
            </h2>
          </div>
          <button
            onClick={loadSyncHistory}
            disabled={loadingHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: loadingHistory ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--secondary-text-color)',
            }}
          >
            <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: '0 0 20px 0' }}>
          Recent sync operations (last 10)
        </p>

        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '14px', color: 'var(--secondary-text-color)' }}>
              Loading sync history...
            </div>
          </div>
        ) : syncLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            background: 'var(--background-color)',
            borderRadius: 'var(--border-radius-medium)',
            border: '1px solid var(--border-color)',
          }}>
            <ClockIcon style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 12px',
              color: 'var(--secondary-text-color)',
              opacity: 0.5,
            }} />
            <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
              No sync history yet
            </p>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginTop: '8px' }}>
              Upload a Nextiva CSV to see sync logs here
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Source
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Total
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Matched
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Updated
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Created
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Skipped
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Errors
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--secondary-text-color)', whiteSpace: 'nowrap' }}>
                    Triggered By
                  </th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: log.source === 'automated'
                          ? 'rgba(49, 130, 206, 0.1)'
                          : 'rgba(107, 114, 128, 0.1)',
                        color: log.source === 'automated'
                          ? 'var(--accent-color)'
                          : 'var(--secondary-text-color)',
                        border: log.source === 'automated'
                          ? '1px solid rgba(49, 130, 206, 0.3)'
                          : '1px solid rgba(107, 114, 128, 0.3)',
                      }}>
                        {log.source === 'automated' ? 'AUTO' : 'MANUAL'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                      {log.totalRows}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--accent-color)' }}>
                      {log.matched}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--success-color)' }}>
                      {log.updated}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--accent-color)' }}>
                      {log.created}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--secondary-text-color)' }}>
                      {log.skipped}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      fontSize: '13px',
                      textAlign: 'right',
                      color: log.errors > 0 ? 'var(--error-color)' : 'var(--secondary-text-color)',
                      fontWeight: log.errors > 0 ? '600' : '400',
                    }}>
                      {log.errors}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--secondary-text-color)' }}>
                      {log.triggeredBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Manual Mappings (superadmin only) */}
      {isSuperAdmin && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: 'var(--border-radius-large)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-small)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <LinkIcon style={{ width: '20px', height: '20px', color: 'var(--accent-color)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              Manual Email Mappings
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: '0 0 20px 0' }}>
            Map Nextiva email addresses to employees when automatic matching fails
          </p>

          {/* Add Mapping Form */}
          <div style={{
            padding: '16px',
            background: 'var(--background-color)',
            borderRadius: 'var(--border-radius-medium)',
            border: '1px solid var(--border-color)',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Add New Mapping
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--secondary-text-color)' }}>
                    Nextiva Email
                  </label>
                  <input
                    type="email"
                    value={newMapping.nextivaEmail}
                    onChange={(e) => setNewMapping({ ...newMapping, nextivaEmail: e.target.value })}
                    placeholder="user@nextiva-domain.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--secondary-text-color)' }}>
                    Employee
                  </label>
                  <select
                    value={newMapping.employeeId}
                    onChange={(e) => setNewMapping({ ...newMapping, employeeId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: 'white',
                    }}
                  >
                    <option value="">Select employee...</option>
                    {employees
                      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}{emp.email ? ` (${emp.email})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--secondary-text-color)' }}>
                  Notes (optional)
                </label>
                <textarea
                  value={newMapping.notes}
                  onChange={(e) => setNewMapping({ ...newMapping, notes: e.target.value })}
                  placeholder="Reason for manual mapping, e.g. different email domain in Nextiva"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <button
                  onClick={handleAddMapping}
                  disabled={addingMapping}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: addingMapping ? 'var(--secondary-text-color)' : 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-medium)',
                    cursor: addingMapping ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  {addingMapping ? 'Adding...' : 'Add Mapping'}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Mappings */}
          {loadingMappings ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '14px', color: 'var(--secondary-text-color)' }}>
                Loading mappings...
              </div>
            </div>
          ) : mappings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              background: 'var(--background-color)',
              borderRadius: 'var(--border-radius-medium)',
              border: '1px solid var(--border-color)',
            }}>
              <LinkIcon style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 12px',
                color: 'var(--secondary-text-color)',
                opacity: 0.5,
              }} />
              <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
                No manual mappings configured
              </p>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginTop: '8px' }}>
                Add mappings above when Nextiva emails don't match employee records automatically
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--background-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--primary-text-color)',
                        fontFamily: 'monospace',
                        background: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                      }}>
                        {mapping.nextivaEmail}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>
                        &rarr;
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
                        {mapping.employeeName}
                      </span>
                    </div>
                    {mapping.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                        {mapping.notes}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--secondary-text-color)', marginTop: '4px', opacity: 0.7 }}>
                      Added {formatDate(mapping.addedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMapping(mapping.id)}
                    disabled={deletingMappingId === mapping.id}
                    style={{
                      padding: '8px',
                      background: 'white',
                      border: '1px solid var(--error-color)',
                      borderRadius: '6px',
                      cursor: deletingMappingId === mapping.id ? 'not-allowed' : 'pointer',
                      color: 'var(--error-color)',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: deletingMappingId === mapping.id ? 0.5 : 1,
                    }}
                    title="Remove mapping"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
