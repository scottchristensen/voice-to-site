import { NextResponse } from 'next/server'

// Test endpoint to verify generate-site works
export async function GET() {
  try {
    // Call the generate-site endpoint with test data
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-site`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'Test Plumbing',
        industry: 'Plumbing',
        mainOffering: 'Residential plumbing services',
        targetAudience: 'Homeowners',
        valueProposition: 'Fast, reliable service',
        callToAction: 'Call now',
        tone: 'Professional',
      })
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test successful!',
      generatedData: data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
