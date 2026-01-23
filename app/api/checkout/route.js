import Stripe from 'stripe'

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic'

// Product pricing configuration
const PRODUCTS = {
  custom_url: {
    name: 'Custom URL',
    price: 2900, // $29.00 in cents
    description: 'Choose your own custom URL for your website',
  },
  export_code: {
    name: 'Export Code',
    price: 4900, // $49.00 in cents
    description: 'Download the complete HTML/CSS/JS code',
  },
  hosting: {
    name: 'Hosted Website',
    price: 2900, // $29.00/month in cents
    description: 'We host your website with a custom domain',
    recurring: true,
  },
  premium: {
    name: 'Premium Design',
    price: 49900, // $499.00 in cents
    description: 'Professional designer refinements',
  },
}

export async function POST(request) {
  try {
    // Initialize Stripe at runtime
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const body = await request.json()
    const { siteId, productType, email, customSlug } = body

    if (!siteId || !productType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = PRODUCTS[productType]
    if (!product) {
      return Response.json({ error: 'Invalid product type' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Build line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.price,
        ...(product.recurring && {
          recurring: {
            interval: 'month',
          },
        }),
      },
      quantity: 1,
    }]

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: product.recurring ? 'subscription' : 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/preview/${siteId}?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        siteId,
        productType,
        customSlug: customSlug || '',
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    })

    return Response.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
