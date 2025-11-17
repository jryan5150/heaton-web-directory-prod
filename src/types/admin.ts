import { Employee } from './employee'

export type ChangeType = 'add' | 'edit' | 'delete'
export type UserRole = 'superadmin' | 'approver' | 'editor'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string
  addedAt: string
  addedBy: string
}

export interface PendingChange {
  id: string
  type: ChangeType
  employeeId?: string  // For edit/delete
  before?: Employee    // For edit/delete - original data
  after?: Employee     // For add/edit - new data
  proposedBy: string
  proposedAt: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string  // Who approved/rejected
  approvedAt?: string  // When it was approved/rejected
  notes?: string
}

export interface Comment {
  id: string
  employeeId?: string  // If comment is about specific employee
  text: string
  author: string
  createdAt: string
  type: 'feedback' | 'note' | 'issue'
}

export interface FeatureRequest {
  id: string
  title: string
  description: string
  author: string
  createdAt: string
  status: 'requested' | 'in-progress' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  details: string
  author: string
  timestamp: string
  type: 'change' | 'publish' | 'rollback' | 'comment' | 'feature'
}

export interface Version {
  id: string
  timestamp: string
  employeeCount: number
  changes: string[]
  author: string
}
