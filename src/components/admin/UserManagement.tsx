'use client'

import { useState, useEffect } from 'react'
import { User, UserRole } from '@/types/admin'
import { UserPlusIcon, TrashIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline'

interface UserManagementProps {
  currentUserRole: UserRole
}

export default function UserManagement({ currentUserRole }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'approver' as UserRole })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Successfully added ${newUser.name}!`)
        setNewUser({ email: '', name: '', role: 'approver' })
        setShowAddForm(false)
        loadUsers()
      } else {
        alert(result.error || 'Failed to add user')
      }
    } catch (error) {
      alert('Error adding user')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Remove ${user.name} from the admin portal?`)) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Removed ${user.name}`)
        loadUsers()
      } else {
        alert(result.error || 'Failed to remove user')
      }
    } catch (error) {
      alert('Error removing user')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getRoleIcon = (role: UserRole) => {
    return role === 'superadmin' ? (
      <ShieldCheckIcon style={{ width: '18px', height: '18px', color: 'var(--accent-color)' }} />
    ) : (
      <UserIcon style={{ width: '18px', height: '18px', color: 'var(--secondary-text-color)' }} />
    )
  }

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      superadmin: { bg: 'rgba(49, 130, 206, 0.1)', border: 'rgba(49, 130, 206, 0.3)', text: 'var(--accent-color)' },
      approver: { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: 'var(--secondary-text-color)' }
    }

    const style = colors[role]

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {getRoleIcon(role)}
        {role === 'superadmin' ? 'Super Admin' : 'Approver'}
      </span>
    )
  }

  if (currentUserRole !== 'superadmin') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        background: 'white',
        borderRadius: 'var(--border-radius-large)',
        border: '1px solid var(--border-color)'
      }}>
        <ShieldCheckIcon style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          color: 'var(--secondary-text-color)',
          opacity: 0.5
        }} />
        <p style={{ fontSize: '16px', color: 'var(--secondary-text-color)', margin: 0 }}>
          Super Admin access required
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '16px', color: 'var(--secondary-text-color)' }}>
          Loading users...
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
            Authorized Users ({users.length})
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
            Manage who can access the admin portal
          </p>
        </div>
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
          <UserPlusIcon style={{ width: '18px', height: '18px' }} />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: 'var(--border-radius-large)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-small)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover-color))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <div style={{ paddingLeft: '52px', fontSize: '12px', color: 'var(--secondary-text-color)' }}>
                Added {formatDate(user.addedAt)} by {user.addedBy}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {getRoleBadge(user.role)}
              <button
                onClick={() => handleDeleteUser(user)}
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
                title="Remove user"
              >
                <TrashIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
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
            <h3 style={{ marginTop: 0, fontSize: '20px', fontWeight: '700' }}>Add New User</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john.doe@heatoneye.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--secondary-text-color)', margin: '6px 0 0 0' }}>
                  Must match the email used for Microsoft/Google sign-in
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="approver">Approver - Can approve/reject changes</option>
                  <option value="superadmin">Super Admin - Full access including publish</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddUser}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Add User
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewUser({ email: '', name: '', role: 'approver' })
                }}
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
