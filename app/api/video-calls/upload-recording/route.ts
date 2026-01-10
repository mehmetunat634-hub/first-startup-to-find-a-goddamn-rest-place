import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string
    const duration = formData.get('duration') as string

    if (!file || !sessionId) {
      return NextResponse.json(
        { error: 'Missing file or sessionId' },
        { status: 400 }
      )
    }

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings')
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true })
    }

    // Save file to filesystem
    const filename = `recording-${sessionId}-${Date.now()}.webm`
    const filepath = path.join(recordingsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    fs.writeFileSync(filepath, buffer)

    // Return relative path for database storage
    const recordingPath = `/recordings/${filename}`

    console.log(`✅ Recording saved: ${recordingPath}`)

    return NextResponse.json({
      success: true,
      recordingPath,
      filename,
      fileSize: buffer.length,
      duration: parseInt(duration) || 0,
    })
  } catch (error) {
    console.error('Error uploading recording:', error)
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    )
  }
}
