'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlobeAltIcon, PlusIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface AllowedIP {
  id: string
  ip: string
  location: string
  notes: string | null
  addedBy: string
  addedAt: string
}

interface IPManagementPanelProps {
  userRole: 'superadmin' | 'approver' | 'editor'
}

const KNOWN_LOCATIONS = ['Athens', 'Tyler', 'Gun Barrel City', 'Longview']

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(part => {
    const num = parseInt(part, 10)
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function IPManagementPanel({ userRole }: IPManagementPanelProps) {
  const [ips, setIps] = useState<AllowedIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newIP, setNewIP] = useState({ ip: '', location: KNOWN_LOCATIONS[0], customLocation: '', notes: '' })
  const [useCustomLocation, setUseCustomLocation] = useState(false)
  const [ipError, setIpError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = userRole === 'superadmin'

  const loadIPs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ips')
      if (response.ok) {
        const data = await response.json()
        setIps(data)
      } else {
        console.error('Failed to load IPs:', response.status)
      }
    } catch (error) {
      console.error('Error loading IPs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIPs()
  }, [loadIPs])

  const handleAddIP = async () => {
    const resolvedLocation = useCustomLocation ? newIP.customLocation.trim() : newIP.location

    if (!newIP.ip.trim()) {
      alert('Please enter an IP address')
      return
    }

    if (!isValidIPv4(newIP.ip.trim())) {
      setIpError('Invalid IPv4 format (e.g. 192.168.1.1)')
      return
    }

    if (!resolvedLocation) {
      alert('Please select or enter a location')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: newIP.ip.trim(),
          location: resolvedLocation,
          notes: newIP.notes.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Successfully added ${newIP.ip.trim()}`)
        setNewIP({ ip: '', location: KNOWN_LOCATIONS[0], customLocation: '', notes: '' })
        setUseCustomLocation(false)
        setIpError('')
        setShowAddForm(false)
        loadIPs()
      } else {
        alert(result.error || 'Failed to add IP')
      }
    } catch (error) {
      alert('Error adding IP address')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteIP = async (record: AllowedIP) => {
    if (!confirm(`Remove IP ${record.ip} (${record.location}) from the allow list?`)) return

    try {
      const response = await fetch(`/api/admin/ips?id=${record.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Removed ${record.ip}`)
        loadIPs()
      } else {
        alert(result.error || 'Failed to remove IP')
      }
    } catch (error) {
      alert('Error removing IP address')
    }
  }

  // Group IPs by location
  const groupedByLocation = ips.reduce<Record<string, AllowedIP[]>>((acc, ip) => {
    const loc = ip.location || 'Unknown'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(ip)
    return acc
  }, {})

  // Sort locations: known locations first (in order), then any custom ones alphabetically
  const sortedLocations = Object.keys(groupedByLocation).sort((a, b) => {
    const aIdx = KNOWN_LOCATIONS.indexOf(a)
    const bIdx = KNOWN_LOCATIONS.indexOf(b)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return a.localeCompare(b)
  })

  // Stats per location
  const locationCounts = sortedLocations.map(loc => ({
    location: loc,
    count: groupedByLocation[loc].length
  }))

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '16px', color: 'var(--secondary-text-color)' }}>
          Loading IP allow list...
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>
            IP Allow List ({ips.length})
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
            {isSuperAdmin
              ? 'Manage which IP addresses can access the public directory'
              : 'IP addresses allowed to access the public directory'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-medium)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <PlusIcon style={{ width: '18px', height: '18px' }} />
            Add IP
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {locationCounts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {locationCounts.map(({ location, count }) => (
            <div
              key={location}
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: 'var(--border-radius-large)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-small)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>
                {count}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginTop: '4px' }}>
                {location}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IP Groups by Location */}
      {ips.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'white',
          borderRadius: 'var(--border-radius-large)',
          border: '1px solid var(--border-color)'
        }}>
          <GlobeAltIcon style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            color: 'var(--secondary-text-color)',
            opacity: 0.5
          }} />
          <p style={{ fontSize: '16px', color: 'var(--secondary-text-color)', margin: 0 }}>
            No IP addresses in the allow list
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedLocations.map(location => (
            <div key={location}>
              {/* Location Group Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <GlobeAltIcon style={{ width: '18px', height: '18px', color: 'var(--accent-color)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--primary-text-color)' }}>
                  {location}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgba(49, 130, 206, 0.1)',
                  color: 'var(--accent-color)'
                }}>
                  {groupedByLocation[location].length}
                </span>
              </div>

              {/* IP Cards for this location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedByLocation[location].map(record => (
                  <div
                    key={record.id}
                    style={{
                      background: 'white',
                      padding: '16px 20px',
                      borderRadius: 'var(--border-radius-large)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-small)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(49, 130, 206, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ShieldCheckIcon style={{ width: '18px', height: '18px', color: 'var(--accent-color)' }} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: 'var(--primary-text-color)',
                            fontFamily: 'monospace'
                          }}>
                            {record.ip}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
                            Added {formatDate(record.addedAt)} by {record.addedBy}
                            {record.notes && (
                              <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                                — {record.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteIP(record)}
                        style={{
                          padding: '8px',
                          background: 'white',
                          border: '1px solid var(--error-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--error-color)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove IP"
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add IP Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--border-radius-large)',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '20px', fontWeight: '700' }}>Add IP Address</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* IP Address */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  IP Address
                </label>
                <input
                  type="text"
                  value={newIP.ip}
                  onChange={(e) => {
                    setNewIP({ ...newIP, ip: e.target.value })
                    setIpError('')
                  }}
                  placeholder="192.168.1.1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${ipError ? 'var(--error-color)' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                {ipError ? (
                  <p style={{ fontSize: '12px', color: 'var(--error-color)', margin: '6px 0 0 0' }}>
                    {ipError}
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--secondary-text-color)', margin: '6px 0 0 0' }}>
                    IPv4 format only (e.g. 10.0.0.1)
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Location
                </label>
                {!useCustomLocation ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={newIP.location}
                      onChange={(e) => setNewIP({ ...newIP, location: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {KNOWN_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustomLocation(true)}
                      style={{
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--secondary-text-color)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Custom
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newIP.customLocation}
                      onChange={(e) => setNewIP({ ...newIP, customLocation: e.target.value })}
                      placeholder="Enter custom location"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomLocation(false)
                        setNewIP({ ...newIP, customLocation: '' })
                      }}
                      style={{
                        padding: '10px 14px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--secondary-text-color)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Preset
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Notes <span style={{ fontWeight: '400', color: 'var(--secondary-text-color)' }}>(optional)</span>
                </label>
                <textarea
                  value={newIP.notes}
                  onChange={(e) => setNewIP({ ...newIP, notes: e.target.value })}
                  placeholder="e.g. Main office router, Dr. Smith's home"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddIP}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: submitting ? 'var(--secondary-text-color)' : 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                {submitting ? 'Adding...' : 'Add IP Address'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewIP({ ip: '', location: KNOWN_LOCATIONS[0], customLocation: '', notes: '' })
                  setUseCustomLocation(false)
                  setIpError('')
                }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
