'use client'

import { useState } from 'react'
import { PendingChange, UserRole } from '@/types/admin'
import { CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PendingChangesPanelProps {
  pendingChanges: PendingChange[]
  onDataChange: () => void
  userRole: UserRole
}

export default function PendingChangesPanel({ pendingChanges, onDataChange, userRole }: PendingChangesPanelProps) {
  const [publishing, setPublishing] = useState(false)
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set())
  const isEditor = userRole === 'editor'

  const pendingItems = pendingChanges.filter(c => c.status === 'pending')
  const approvedItems = pendingChanges.filter(c => c.status === 'approved')
  const rejectedItems = pendingChanges.filter(c => c.status === 'rejected')

  const handleApprove = async (changeId: string) => {
    try {
      await fetch('/api/admin/pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: changeId, status: 'approved' })
      })
      onDataChange()
    } catch (error) {
      alert('Error approving change')
    }
  }

  const handleReject = async (changeId: string) => {
    try {
      await fetch('/api/admin/pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: changeId, status: 'rejected' })
      })
      onDataChange()
    } catch (error) {
      alert('Error rejecting change')
    }
  }

  const handleBulkApprove = async () => {
    try {
      await Promise.all(
        Array.from(selectedChanges).map(id =>
          fetch('/api/admin/pending', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'approved' })
          })
        )
      )
      setSelectedChanges(new Set())
      onDataChange()
    } catch (error) {
      alert('Error bulk approving changes')
    }
  }

  const handlePublishApproved = async () => {
    if (!confirm(`Publish ${approvedItems.length} approved changes to production?`)) return

    setPublishing(true)
    try {
      const response = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'Admin' })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Successfully published ${result.publishedCount} changes!\nVersion: ${result.versionId}\nTotal employees: ${result.totalEmployees}`)
        onDataChange()
      } else {
        alert(result.error || 'Failed to publish changes')
      }
    } catch (error) {
      alert('Error publishing changes')
    } finally {
      setPublishing(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedChanges)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedChanges(newSelection)
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'var(--success-color)'
      case 'edit': return 'var(--accent-color)'
      case 'delete': return 'var(--error-color)'
      default: return 'var(--secondary-text-color)'
    }
  }

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'add': return 'ADD'
      case 'edit': return 'EDIT'
      case 'delete': return 'DELETE'
      default: return type.toUpperCase()
    }
  }

  const renderChangeDetails = (change: PendingChange) => {
    const typeColor = getChangeTypeColor(change.type)

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            color: 'white',
            background: typeColor
          }}>
            {getChangeTypeLabel(change.type)}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            {change.after ? `${change.after.firstName} ${change.after.lastName}` :
             change.before ? `${change.before.firstName} ${change.before.lastName}` : 'Unknown'}
          </span>
        </div>

        {change.type === 'add' && change.after && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Email:</strong> {change.after.email}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Extension:</strong> {change.after.extension}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Location:</strong> {change.after.location}
            </div>
            {change.after.title && (
              <div style={{ fontSize: '13px' }}>
                <strong>Title:</strong> {change.after.title}
              </div>
            )}
          </div>
        )}

        {change.type === 'edit' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--error-color)' }}>
                BEFORE
              </div>
              {change.before && (
                <>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Email:</strong> {change.before.email}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Ext:</strong> {change.before.extension}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Title:</strong> {change.before.title || '-'}
                  </div>
                </>
              )}
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--success-color)' }}>
                AFTER
              </div>
              {change.after && (
                <>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Email:</strong> {change.after.email}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Ext:</strong> {change.after.extension}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                    <strong>Title:</strong> {change.after.title || '-'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {change.type === 'delete' && change.before && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Email:</strong> {change.before.email}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Extension:</strong> {change.before.extension}
            </div>
            <div style={{ fontSize: '13px' }}>
              <strong>Location:</strong> {change.before.location}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--secondary-text-color)'
        }}>
          Proposed by {change.proposedBy} on {new Date(change.proposedAt).toLocaleString()}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Action Bar */}
      {(approvedItems.length > 0 || selectedChanges.size > 0) && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: 'white',
          borderRadius: 'var(--border-radius-large)',
          border: '1px solid var(--border-color)'
        }}>
          {selectedChanges.size > 0 && !isEditor && (
            <button
              onClick={handleBulkApprove}
              style={{
                padding: '10px 16px',
                background: 'var(--success-color)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckIcon style={{ width: '18px', height: '18px' }} />
              Approve Selected ({selectedChanges.size})
            </button>
          )}

          {approvedItems.length > 0 && userRole === 'superadmin' && (
            <button
              onClick={handlePublishApproved}
              disabled={publishing}
              style={{
                padding: '10px 16px',
                background: publishing ? 'var(--secondary-text-color)' : 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: publishing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                marginLeft: 'auto'
              }}
            >
              {publishing ? 'Publishing...' : `Publish ${approvedItems.length} Approved Change${approvedItems.length > 1 ? 's' : ''}`}
            </button>
          )}

          {approvedItems.length > 0 && userRole === 'approver' && (
            <div style={{
              padding: '10px 16px',
              background: 'rgba(107, 114, 128, 0.1)',
              border: '1px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--secondary-text-color)',
              marginLeft: 'auto',
              textAlign: 'center'
            }}>
              {approvedItems.length} change{approvedItems.length > 1 ? 's' : ''} ready for Super Admin to publish
            </div>
          )}
        </div>
      )}

      {/* Pending Changes */}
      {pendingItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ClockIcon style={{ width: '20px', height: '20px', color: 'var(--warning-color)' }} />
            Pending Review ({pendingItems.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingItems.map(change => (
              <div
                key={change.id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: 'var(--border-radius-large)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-small)'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    {renderChangeDetails(change)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!isEditor && (
                      <>
                        <input
                          type="checkbox"
                          checked={selectedChanges.has(change.id)}
                          onChange={() => toggleSelection(change.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <button
                          onClick={() => handleApprove(change.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--success-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(change.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'white',
                            color: 'var(--error-color)',
                            border: '1px solid var(--error-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {isEditor && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(107, 114, 128, 0.1)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--secondary-text-color)',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        Awaiting Approval
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Changes */}
      {approvedItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckIcon style={{ width: '20px', height: '20px', color: 'var(--success-color)' }} />
            Approved & Ready to Publish ({approvedItems.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {approvedItems.map(change => (
              <div
                key={change.id}
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '20px',
                  borderRadius: 'var(--border-radius-large)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                {renderChangeDetails(change)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Changes */}
      {rejectedItems.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'var(--error-color)' }} />
            Rejected ({rejectedItems.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rejectedItems.map(change => (
              <div
                key={change.id}
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  padding: '20px',
                  borderRadius: 'var(--border-radius-large)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  opacity: 0.7
                }}
              >
                {renderChangeDetails(change)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingChanges.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
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
          <p style={{ fontSize: '16px', color: 'var(--secondary-text-color)', margin: 0 }}>
            No pending changes
          </p>
          <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', marginTop: '8px' }}>
            Changes from the employee management tab will appear here for review
          </p>
        </div>
      )}
    </div>
  )
}
