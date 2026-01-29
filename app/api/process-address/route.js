/**
 * Process Address API
 *
 * Takes a business address and fetches:
 * 1. Geocoding data (lat/lng) from Google Geocoding API
 * 2. Business info from Google Places API
 * 3. Business photos from Google Places Photos API
 * 4. Static map image URL
 * 5. Street View image (if available)
 */

export const dynamic = 'force-dynamic'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

// Industries that typically have visible storefronts
const STOREFRONT_INDUSTRIES = [
  'restaurant', 'cafe', 'bakery', 'bar', 'pub', 'brewery',
  'retail', 'store', 'shop', 'boutique', 'market',
  'salon', 'barbershop', 'spa', 'beauty',
  'gym', 'fitness', 'yoga', 'pilates',
  'dental', 'dentist', 'medical', 'clinic', 'doctor', 'hospital',
  'auto', 'mechanic', 'car wash', 'garage',
  'hotel', 'motel', 'inn', 'lodge',
  'bank', 'credit union',
  'pharmacy', 'drugstore',
  'florist', 'flower',
  'pet', 'grooming', 'veterinary', 'vet',
  'laundry', 'dry cleaning',
  'jewelry', 'jeweler',
  'optician', 'optical', 'eye',
  'tattoo', 'piercing',
  'coffee', 'tea', 'juice',
  'ice cream', 'dessert', 'candy',
  'pizza', 'burger', 'sushi', 'mexican', 'chinese', 'italian'
]

export async function POST(request) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY not configured')
      return Response.json({
        valid: false,
        error: 'Google Maps API key not configured'
      }, { status: 500 })
    }

    const { address, businessName, industry } = await request.json()

    if (!address) {
      return Response.json({
        valid: false,
        error: 'Address is required'
      }, { status: 400 })
    }

    console.log(`Processing address for "${businessName}": ${address}`)

    // Step 1: Geocode the address
    const geocodeResult = await geocodeAddress(address)

    if (!geocodeResult.valid) {
      console.log('Geocoding failed:', geocodeResult.error)
      return Response.json({
        valid: false,
        error: geocodeResult.error || 'Could not validate address',
        geocode: null,
        place: null,
        imagery: getPlaceholderImagery(businessName)
      })
    }

    console.log(`Geocoded to: ${geocodeResult.formattedAddress}`)

    // Step 2: Search for the business on Google Places
    const placeResult = await findBusinessPlace(businessName, geocodeResult.location)

    if (placeResult) {
      console.log(`Found place: ${placeResult.name} (${placeResult.placeId})`)
    } else {
      console.log('No matching place found on Google')
    }

    // Step 3: Determine if this is a storefront business
    const hasStorefront = isStorefrontBusiness(industry)
    console.log(`Industry "${industry}" is storefront: ${hasStorefront}`)

    // Step 4: Fetch imagery
    const imagery = await fetchBusinessImagery({
      placeId: placeResult?.placeId,
      location: geocodeResult.location,
      hasStorefront,
      businessName
    })

    console.log(`Imagery source: ${imagery.source}, photos: ${imagery.photos.length}`)

    return Response.json({
      valid: true,
      geocode: geocodeResult,
      place: placeResult,
      imagery: imagery
    })

  } catch (error) {
    console.error('Error processing address:', error)
    return Response.json({
      valid: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Geocode an address using Google Geocoding API
 */
async function geocodeAddress(address) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results[0]) {
      return {
        valid: false,
        error: data.status === 'ZERO_RESULTS'
          ? 'Address not found'
          : `Geocoding error: ${data.status}`
      }
    }

    const result = data.results[0]
    return {
      valid: true,
      formattedAddress: result.formatted_address,
      location: result.geometry.location, // { lat, lng }
      placeId: result.place_id,
      addressComponents: result.address_components,
      locationType: result.geometry.location_type
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Find a business on Google Places using name and location
 */
async function findBusinessPlace(businessName, location) {
  try {
    // Use Nearby Search with keyword
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${location.lat},${location.lng}` +
      `&radius=150` + // 150 meters radius
      `&keyword=${encodeURIComponent(businessName)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(searchUrl)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results[0]) {
      // Try Text Search as fallback
      return await textSearchPlace(businessName, location)
    }

    const place = data.results[0]
    return {
      placeId: place.place_id,
      name: place.name,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      vicinity: place.vicinity,
      businessStatus: place.business_status
    }
  } catch (error) {
    console.error('Place search error:', error)
    return null
  }
}

/**
 * Fallback: Text Search for business
 */
async function textSearchPlace(businessName, location) {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(businessName)}` +
      `&location=${location.lat},${location.lng}` +
      `&radius=500` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(searchUrl)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results[0]) {
      return null
    }

    const place = data.results[0]
    return {
      placeId: place.place_id,
      name: place.name,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      vicinity: place.formatted_address,
      businessStatus: place.business_status
    }
  } catch (error) {
    console.error('Text search error:', error)
    return null
  }
}

/**
 * Fetch business photos from Google Places
 */
async function fetchBusinessPhotos(placeId, maxPhotos = 5) {
  try {
    // Get place details with photos field
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}` +
      `&fields=photos,name,formatted_address,types,editorial_summary` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(detailsUrl)
    const data = await response.json()

    if (data.status !== 'OK' || !data.result?.photos) {
      return []
    }

    // Generate photo URLs (these are proxied through Google)
    const photos = data.result.photos.slice(0, maxPhotos).map(photo => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?` +
        `maxwidth=800` +
        `&photo_reference=${photo.photo_reference}` +
        `&key=${GOOGLE_MAPS_API_KEY}`,
      attribution: photo.html_attributions?.[0] || '',
      width: photo.width,
      height: photo.height
    }))

    return photos
  } catch (error) {
    console.error('Photo fetch error:', error)
    return []
  }
}

/**
 * Generate a static Google Maps image URL
 */
function generateMapImageUrl(location, options = {}) {
  const {
    width = 600,
    height = 400,
    zoom = 15,
    markerColor = 'red',
    mapStyle = 'roadmap'
  } = options

  return `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${location.lat},${location.lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&maptype=${mapStyle}` +
    `&markers=color:${markerColor}%7C${location.lat},${location.lng}` +
    `&key=${GOOGLE_MAPS_API_KEY}`
}

/**
 * Fetch Street View image if available
 */
async function fetchStreetViewImage(location, options = {}) {
  const {
    width = 600,
    height = 400,
    pitch = 10,
    fov = 90
  } = options

  try {
    // First check if Street View is available
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
      `location=${location.lat},${location.lng}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const metaResponse = await fetch(metadataUrl)
    const metadata = await metaResponse.json()

    if (metadata.status !== 'OK') {
      return null
    }

    // Generate Street View image URL
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?` +
      `size=${width}x${height}` +
      `&location=${location.lat},${location.lng}` +
      `&pitch=${pitch}` +
      `&fov=${fov}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    return {
      url: imageUrl,
      panoId: metadata.pano_id,
      date: metadata.date,
      location: metadata.location
    }
  } catch (error) {
    console.error('Street View error:', error)
    return null
  }
}

/**
 * Check if an industry typically has a visible storefront
 */
function isStorefrontBusiness(industry) {
  if (!industry) return false

  const lowercaseIndustry = industry.toLowerCase()
  return STOREFRONT_INDUSTRIES.some(type =>
    lowercaseIndustry.includes(type)
  )
}

/**
 * Fetch all available imagery for a business
 */
async function fetchBusinessImagery({ placeId, location, hasStorefront, businessName }) {
  const imagery = {
    photos: [],
    mapImage: null,
    streetView: null,
    source: 'placeholder'
  }

  // Always generate a map image if we have location
  if (location) {
    imagery.mapImage = generateMapImageUrl(location)
  }

  // Try to get business photos from Places API
  if (placeId) {
    const photos = await fetchBusinessPhotos(placeId, 5)
    if (photos.length > 0) {
      imagery.photos = photos
      imagery.source = 'google_places'
    }
  }

  // For storefront businesses, also try Street View
  if (hasStorefront && location) {
    const streetView = await fetchStreetViewImage(location)
    if (streetView) {
      imagery.streetView = streetView
      // If no business photos, Street View becomes the main source
      if (imagery.photos.length === 0) {
        imagery.source = 'street_view'
      }
    }
  }

  // If no real imagery found, provide placeholder config
  if (imagery.source === 'placeholder') {
    imagery.placeholderConfig = getPlaceholderImagery(businessName)
  }

  return imagery
}

/**
 * Generate placeholder imagery config when real images aren't available
 */
function getPlaceholderImagery(businessName) {
  const encodedName = encodeURIComponent(businessName || 'Business')
  const primaryColor = '667eea'
  const secondaryColor = 'ffffff'

  return {
    heroImage: `https://placehold.co/1200x600/${primaryColor}/${secondaryColor}?text=${encodedName}`,
    featureImages: [
      `https://placehold.co/400x300/${primaryColor}/${secondaryColor}?text=Our+Services`,
      `https://placehold.co/400x300/${primaryColor}/${secondaryColor}?text=Quality+Work`,
      `https://placehold.co/400x300/${primaryColor}/${secondaryColor}?text=Happy+Customers`
    ]
  }
}
