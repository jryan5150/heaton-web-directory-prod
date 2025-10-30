import { getAllEmployees } from '@/lib/database'
import AppleDirectoryView from '@/components/AppleDirectoryView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HeatonDirectoryPage() {
  const employees = await getAllEmployees()

  return <AppleDirectoryView employees={employees} />
}