'use client'

import { useState, useRef } from 'react'
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { parseCSVFile, generateSampleCSV, convertToEmployees } from '@/lib/csvImport'
import { CSVImportResult } from '@/types/csv'
import { Employee } from '@/types/employee'

interface CSVImportProps {
  onImportComplete: (employees: Employee[]) => void
  onClose: () => void
}

export default function CSVImport({ onImportComplete, onClose }: CSVImportProps) {
  const [dragActive, setDragActive] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<CSVImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setResult({
        success: false,
        data: [],
        errors: ['Please select a CSV file'],
        warnings: []
      })
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const importResult = await parseCSVFile(file)
      setResult(importResult)
    } catch (error) {
      setResult({
        success: false,
        data: [],
        errors: [`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = () => {
    if (result && result.success) {
      const employees = convertToEmployees(result.data)
      onImportComplete(employees)
    }
  }

  const downloadSample = () => {
    const csv = generateSampleCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nextiva-sample.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-modern-lg border border-white/50 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-heaton rounded-xl flex items-center justify-center">
                <CloudArrowUpIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-heaton-gray font-heading">Import Nextiva Data</h2>
                <p className="text-sm text-heaton-gray-light">Upload CSV export from Nextiva</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-heaton-gray-light" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Upload Area */}
          {!result && (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-heaton-blue bg-blue-50/50'
                  : 'border-gray-300 hover:border-heaton-blue hover:bg-blue-50/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importing}
              />

              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto">
                  <DocumentTextIcon className="w-8 h-8 text-heaton-blue" />
                </div>

                {importing ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-4 border-heaton-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-heaton-gray font-medium">Processing CSV file...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-heaton-gray">
                      Drop your CSV file here or click to browse
                    </p>
                    <p className="text-sm text-heaton-gray-light">
                      Supports CSV exports from Nextiva with user, team, and number data
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className={`flex items-center space-x-3 p-4 rounded-xl ${
                result.success
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className={`font-semibold ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.success
                      ? `Found ${result.data.length} valid employees`
                      : `${result.errors.length} error(s) found`
                    }
                  </p>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-800 mb-2">Warnings</p>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-800 mb-2">Errors</p>
                      <ul className="space-y-1 text-sm text-red-700 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {result.success && result.data.length > 0 && (
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <p className="font-semibold text-heaton-gray mb-3">Data Preview</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.data.slice(0, 3).map((user, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                        <span className="font-medium">{user.firstName} {user.lastName}</span>
                        <span className="text-heaton-gray-light">{user.team} • {user.location}</span>
                      </div>
                    ))}
                    {result.data.length > 3 && (
                      <p className="text-xs text-heaton-gray-light text-center">
                        +{result.data.length - 3} more employees
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50/50 rounded-xl p-4">
            <p className="font-semibold text-heaton-blue mb-2">CSV Format Requirements</p>
            <ul className="text-sm text-heaton-gray space-y-1">
              <li>• <strong>Required:</strong> Name (full name in single column)</li>
              <li>• <strong>Recommended:</strong> Team/Group, Location/Office</li>
              <li>• <strong>Optional:</strong> Email, Extension, DID, Department, Job Title</li>
            </ul>
            <button
              onClick={downloadSample}
              className="mt-3 text-sm text-heaton-blue hover:text-heaton-blue-dark font-medium underline"
            >
              Download sample CSV template
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100/50 flex items-center justify-between">
          <button
            onClick={() => {
              setResult(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="btn-modern bg-gray-100 text-heaton-gray hover:bg-gray-200"
            disabled={importing}
          >
            Try Another File
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-modern bg-gray-100 text-heaton-gray hover:bg-gray-200"
            >
              Cancel
            </button>
            {result?.success && (
              <button
                onClick={handleImport}
                className="btn-modern bg-gradient-heaton text-white hover:shadow-modern-lg"
              >
                Import {result.data.length} Employees
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}