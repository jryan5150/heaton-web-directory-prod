import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Resend } from 'resend'

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    // Read approved changes from database
    const approvedChanges = await prisma.pendingChange.findMany({
      where: { status: 'approved' }
    })

    if (approvedChanges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No approved changes to notify about',
        sent: false
      })
    }

    // Count changes by type
    const changesByType = {
      add: approvedChanges.filter(c => c.type === 'add').length,
      edit: approvedChanges.filter(c => c.type === 'edit').length,
      delete: approvedChanges.filter(c => c.type === 'delete').length
    }

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approved Changes Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
        Heaton Eye Staff Directory
      </h1>
      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
        Admin Portal Notification
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">
        📋 Approved Changes Ready to Publish
      </h2>

      <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
        There are <strong>${approvedChanges.length}</strong> approved employee directory changes waiting to be published to production.
      </p>

      <!-- Change Summary -->
      <div style="background-color: #f8fafc; border-left: 4px solid #3182CE; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
          Change Summary:
        </h3>
        <ul style="margin: 0; padding-left: 24px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
          ${changesByType.add > 0 ? `<li><strong style="color: #10b981;">Add:</strong> ${changesByType.add} employee${changesByType.add > 1 ? 's' : ''}</li>` : ''}
          ${changesByType.edit > 0 ? `<li><strong style="color: #3182CE;">Edit:</strong> ${changesByType.edit} employee${changesByType.edit > 1 ? 's' : ''}</li>` : ''}
          ${changesByType.delete > 0 ? `<li><strong style="color: #ef4444;">Delete:</strong> ${changesByType.delete} employee${changesByType.delete > 1 ? 's' : ''}</li>` : ''}
        </ul>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://staff.heatoneye.com/admin"
           style="display: inline-block; background: linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3);">
          Review & Publish Changes
        </a>
      </div>

      <!-- Info -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
          💡 <strong>Next Steps:</strong><br>
          1. Login to the admin portal<br>
          2. Review the approved changes in the "Pending Changes" tab<br>
          3. Click "Publish" to apply changes to the live directory
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
        This is an automated notification from the Heaton Eye Staff Directory admin portal.
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
        You're receiving this because you're a Super Admin for the employee directory.
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Send email via Resend
    const notificationEmail = process.env.NOTIFICATION_EMAIL || 'jryan5150@gmail.com'

    const emailResponse = await resend.emails.send({
      from: 'Heaton Eye Directory <onboarding@resend.dev>',
      to: notificationEmail,
      subject: `📋 ${approvedChanges.length} Approved Changes Ready to Publish`,
      html: emailHtml
    })

    return NextResponse.json({
      success: true,
      message: `Notification email sent to ${notificationEmail}`,
      sent: true,
      approvedCount: approvedChanges.length,
      changesByType,
      emailId: emailResponse.data?.id
    })

  } catch (error) {
    console.error('Email notification error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sent: false
    }, { status: 500 })
  }
}
