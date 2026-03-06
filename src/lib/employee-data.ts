import { Employee } from '@/types/employee'

/** Fields included in version snapshots and employee create/update operations */
const SNAPSHOT_FIELDS = {
  id: true, firstName: true, lastName: true, email: true,
  extension: true, phoneNumber: true, did: true, location: true,
  team: true, title: true, jobTitle: true, department: true,
  photoUrl: true, avatarUrl: true,
} as const

export const employeeSnapshotSelect = SNAPSHOT_FIELDS

/** Convert Employee-like data to Prisma create/update input with null coalescing */
export function toEmployeeData(emp: Employee) {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email || null,
    extension: emp.extension || null,
    phoneNumber: emp.phoneNumber || null,
    did: emp.did || null,
    location: emp.location,
    team: emp.team || '',
    title: emp.title || null,
    jobTitle: emp.jobTitle || null,
    department: emp.department || null,
    photoUrl: emp.photoUrl || null,
    avatarUrl: emp.avatarUrl || null,
  }
}
