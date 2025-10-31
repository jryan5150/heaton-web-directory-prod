'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Employee } from '@/types/employee'
import { PendingChange, UserRole } from '@/types/admin'
import EmployeeManagement from './EmployeeManagement'
import PendingChangesPanel from './PendingChangesPanel'
import VersionHistoryPanel from './VersionHistoryPanel'
import UserManagement from './UserManagement'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'employees' | 'pending' | 'versions' | 'users'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole } | null>(null)

  const userRole = (currentUser?.role || 'approver') as UserRole
  const isSuperAdmin = userRole === 'superadmin'

  useEffect(() => {
    loadUserInfo()
    loadData()
  }, [])

  const loadUserInfo = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      } else {
        // User not authenticated
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error loading user info:', error)
      router.push('/admin/login')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [employeesRes, pendingRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/admin/pending')
      ])

      const employeesData = await employeesRes.json()
      const pendingData = await pendingRes.json()

      setEmployees(employeesData)
      setPendingChanges(pendingData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = pendingChanges.filter(c => c.status === 'pending').length
  const approvedCount = pendingChanges.filter(c => c.status === 'approved').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-color)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-small)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--primary-text-color)',
              margin: '0 0 8px 0'
            }}>
              Admin Portal
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', margin: 0 }}>
              Manage employee directory, review changes, and track versions
            </p>
          </div>

          {/* User Info & Sign Out */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)' }}>
                  {currentUser.role === 'superadmin' ? 'Super Admin' : 
                   currentUser.role === 'approver' ? 'Approver' : 'Editor'}
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' })
                  router.push('/admin/login')
                }}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--secondary-text-color)'
                }}
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: '88px',
        zIndex: 99
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('employees')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === 'employees' ? '600' : '500',
                color: activeTab === 'employees' ? 'var(--accent-color)' : 'var(--secondary-text-color)',
                borderBottom: activeTab === 'employees' ? '3px solid var(--accent-color)' : '3px solid transparent',
                marginBottom: '-1px'
              }}
            >
              Employees ({employees.length})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === 'pending' ? '600' : '500',
                color: activeTab === 'pending' ? 'var(--accent-color)' : 'var(--secondary-text-color)',
                borderBottom: activeTab === 'pending' ? '3px solid var(--accent-color)' : '3px solid transparent',
                marginBottom: '-1px',
                position: 'relative'
              }}
            >
              Pending Changes ({pendingCount})
              {approvedCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'var(--success-color)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {approvedCount} ready
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('versions')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === 'versions' ? '600' : '500',
                color: activeTab === 'versions' ? 'var(--accent-color)' : 'var(--secondary-text-color)',
                borderBottom: activeTab === 'versions' ? '3px solid var(--accent-color)' : '3px solid transparent',
                marginBottom: '-1px'
              }}
            >
              Version History
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: activeTab === 'users' ? '600' : '500',
                  color: activeTab === 'users' ? 'var(--accent-color)' : 'var(--secondary-text-color)',
                  borderBottom: activeTab === 'users' ? '3px solid var(--accent-color)' : '3px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Users
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '16px', color: 'var(--secondary-text-color)' }}>
              Loading...
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'employees' && (
              <EmployeeManagement
                employees={employees}
                onDataChange={loadData}
              />
            )}

            {activeTab === 'pending' && (
              <PendingChangesPanel
                pendingChanges={pendingChanges}
                onDataChange={loadData}
                userRole={userRole}
              />
            )}

            {activeTab === 'versions' && (
              <VersionHistoryPanel
                onDataChange={loadData}
                userRole={userRole}
              />
            )}

            {activeTab === 'users' && (
              <UserManagement currentUserRole={userRole} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
