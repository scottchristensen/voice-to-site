# Business Address & Imagery Feature - Implementation Plan

This document outlines the complete implementation plan for collecting business addresses via voice and using that data to fetch real imagery (Google Maps, Street View, business photos) for website generation.

## Table of Contents
1. [Overview](#overview)
2. [VAPI Voice Script Changes](#1-vapi-voice-script-changes)
3. [Address Processing & Validation](#2-address-processing--validation)
4. [Google APIs Integration](#3-google-apis-integration)
5. [Database Schema Updates](#4-database-schema-updates)
6. [Website Generation Changes](#5-website-generation-changes)
7. [Implementation Phases](#6-implementation-phases)
8. [Cost Considerations](#7-cost-considerations)
9. [Error Handling & Fallbacks](#8-error-handling--fallbacks)

---

## Overview

### Goal
Collect physical business addresses via voice conversation, then use that address to:
1. Identify if it's a physical retail/storefront location
2. Fetch real business photos from Google Places
3. Generate a Google Maps embed/static image for the contact section
4. Optionally fetch Google Street View imagery of the storefront
5. Use this real imagery in the generated website instead of placeholders

### Data Flow
```
VAPI Voice Call
    ↓
Collect Address (new question #7)
    ↓
POST /api/generate-site
    ↓
Geocode Address (Google Geocoding API)
    ↓
Detect Business Type (retail/service/online)
    ↓
Fetch Imagery (Google Places/Maps/Street View)
    ↓
Store Image URLs in Database
    ↓
Generate HTML with Real Images
    ↓
Return Preview URL to VAPI
```

---

## 1. VAPI Voice Script Changes

### New Question (Add as Question #7)

**English Version:**
```
7. "Do you have a physical location where customers visit you? If so, what's the address?"
   - If YES: Capture the full address
   - If NO (service-based/online): "No problem! We'll focus on your services instead."
```

**Spanish Version:**
```
7. "¿Tienes una ubicación física donde los clientes te visitan? Si es así, ¿cuál es la dirección?"
   - Si SÍ: Captura la dirección completa
   - Si NO: "¡No hay problema! Nos enfocaremos en tus servicios."
```

### Address Confirmation Flow

VAPI should confirm the address by reading it back:
```
"I have your address as [street], [city], [state] [zip]. Is that correct?"
```

This is important because:
- Addresses are complex and easy to mishear
- Incorrect addresses lead to wrong imagery
- Confirmation gives the caller a chance to correct errors

### Updated Tool Definition

The `generateWebsite` tool needs these new parameters:

```json
{
  "name": "generateWebsite",
  "parameters": {
    "type": "object",
    "properties": {
      "businessName": { "type": "string" },
      "industry": { "type": "string" },
      "mainOffering": { "type": "string" },
      "targetAudience": { "type": "string" },
      "valueProposition": { "type": "string" },
      "colorPreference": { "type": "string" },
      "businessAddress": {
        "type": "object",
        "description": "Physical business address if applicable",
        "properties": {
          "street": { "type": "string" },
          "city": { "type": "string" },
          "state": { "type": "string" },
          "zip": { "type": "string" },
          "fullAddress": { "type": "string", "description": "Complete address as spoken" }
        }
      },
      "hasPhysicalLocation": {
        "type": "boolean",
        "description": "Whether the business has a physical storefront customers visit"
      },
      "editPin": { "type": "string" },
      "editPassphrase": { "type": "string" },
      "ownerPhone": { "type": "string" },
      "ownerLanguage": { "type": "string" }
    }
  }
}
```

---

## 2. Address Processing & Validation

### New API Endpoint: `/api/process-address`

This endpoint handles address validation and imagery fetching.

```javascript
// app/api/process-address/route.js
export async function POST(request) {
  const { address, businessName, industry } = await request.json();

  // Step 1: Geocode the address
  const geocodeResult = await geocodeAddress(address);

  if (!geocodeResult.valid) {
    return Response.json({
      valid: false,
      error: 'Could not validate address'
    });
  }

  // Step 2: Search for business on Google Places
  const placeResult = await findBusinessPlace(
    businessName,
    geocodeResult.location
  );

  // Step 3: Fetch imagery based on what's available
  const imagery = await fetchBusinessImagery({
    placeId: placeResult?.placeId,
    location: geocodeResult.location,
    hasStorefront: isStorefrontBusiness(industry)
  });

  return Response.json({
    valid: true,
    geocode: geocodeResult,
    place: placeResult,
    imagery: imagery
  });
}
```

### Address Geocoding

Use Google Geocoding API to convert address to coordinates:

```javascript
async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
    `address=${encodeURIComponent(address)}` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results[0]) {
    return { valid: false };
  }

  const result = data.results[0];
  return {
    valid: true,
    formattedAddress: result.formatted_address,
    location: result.geometry.location, // { lat, lng }
    placeId: result.place_id,
    addressComponents: result.address_components
  };
}
```

### Business Type Detection

Determine if the business likely has a visible storefront:

```javascript
function isStorefrontBusiness(industry) {
  const storefrontIndustries = [
    'restaurant', 'cafe', 'bakery', 'bar',
    'retail', 'store', 'shop', 'boutique',
    'salon', 'barbershop', 'spa',
    'gym', 'fitness', 'yoga',
    'dental', 'medical', 'clinic',
    'auto', 'mechanic', 'car wash',
    'hotel', 'motel', 'inn',
    'bank', 'credit union',
    'pharmacy', 'drugstore'
  ];

  const lowercaseIndustry = industry.toLowerCase();
  return storefrontIndustries.some(type =>
    lowercaseIndustry.includes(type)
  );
}
```

---

## 3. Google APIs Integration

### Required APIs (Enable in Google Cloud Console)

1. **Geocoding API** - Convert addresses to coordinates
2. **Places API (New)** - Search for businesses, get photos
3. **Maps Static API** - Generate map images
4. **Street View Static API** - Fetch storefront images

### API Key Setup

```env
# .env.local
GOOGLE_MAPS_API_KEY=your_api_key_here
```

Restrict the API key in Google Cloud Console:
- Application restrictions: HTTP referrers (your domain)
- API restrictions: Only the 4 APIs above

### 3.1 Google Places API - Business Photos

```javascript
async function fetchBusinessPhotos(placeId, maxPhotos = 5) {
  // Step 1: Get place details with photos
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${placeId}` +
    `&fields=photos,name,formatted_address,types` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(detailsUrl);
  const data = await response.json();

  if (!data.result?.photos) {
    return [];
  }

  // Step 2: Generate photo URLs
  const photos = data.result.photos.slice(0, maxPhotos).map(photo => ({
    url: `https://maps.googleapis.com/maps/api/place/photo?` +
      `maxwidth=800` +
      `&photo_reference=${photo.photo_reference}` +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    attribution: photo.html_attributions?.[0] || '',
    width: photo.width,
    height: photo.height
  }));

  return photos;
}
```

### 3.2 Google Places - Find Business by Name + Location

```javascript
async function findBusinessPlace(businessName, location) {
  const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
    `location=${location.lat},${location.lng}` +
    `&radius=100` + // 100 meters
    `&keyword=${encodeURIComponent(businessName)}` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results[0]) {
    return null;
  }

  const place = data.results[0];
  return {
    placeId: place.place_id,
    name: place.name,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    types: place.types,
    vicinity: place.vicinity
  };
}
```

### 3.3 Google Maps Static API - Map Image

```javascript
function generateMapImageUrl(location, options = {}) {
  const {
    width = 600,
    height = 400,
    zoom = 15,
    markerColor = 'red'
  } = options;

  return `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${location.lat},${location.lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&maptype=roadmap` +
    `&markers=color:${markerColor}%7C${location.lat},${location.lng}` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;
}
```

### 3.4 Google Street View Static API

```javascript
async function fetchStreetViewImage(location, options = {}) {
  const {
    width = 600,
    height = 400,
    heading = null, // Auto-detect if null
    pitch = 0,
    fov = 90
  } = options;

  // First, check if Street View is available at this location
  const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
    `location=${location.lat},${location.lng}` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  const metaResponse = await fetch(metadataUrl);
  const metadata = await metaResponse.json();

  if (metadata.status !== 'OK') {
    return null; // No Street View available
  }

  // Generate the Street View image URL
  let imageUrl = `https://maps.googleapis.com/maps/api/streetview?` +
    `size=${width}x${height}` +
    `&location=${location.lat},${location.lng}` +
    `&pitch=${pitch}` +
    `&fov=${fov}` +
    `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  if (heading !== null) {
    imageUrl += `&heading=${heading}`;
  }

  return {
    url: imageUrl,
    panoId: metadata.pano_id,
    date: metadata.date // When the image was captured
  };
}
```

### 3.5 Combined Imagery Fetcher

```javascript
async function fetchBusinessImagery({ placeId, location, hasStorefront }) {
  const imagery = {
    photos: [],
    mapImage: null,
    streetView: null,
    source: 'placeholder' // Will update based on what we find
  };

  // Always generate a map image
  imagery.mapImage = generateMapImageUrl(location);

  // Try to get business photos from Places API
  if (placeId) {
    const photos = await fetchBusinessPhotos(placeId, 5);
    if (photos.length > 0) {
      imagery.photos = photos;
      imagery.source = 'google_places';
    }
  }

  // For storefront businesses, also try Street View
  if (hasStorefront) {
    const streetView = await fetchStreetViewImage(location);
    if (streetView) {
      imagery.streetView = streetView;
      // If we didn't get business photos, use Street View as hero
      if (imagery.photos.length === 0) {
        imagery.source = 'street_view';
      }
    }
  }

  return imagery;
}
```

---

## 4. Database Schema Updates

### New Columns for `generated_sites`

```sql
-- Address information
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  business_address JSONB;
-- Structure: { street, city, state, zip, fullAddress, formattedAddress }

ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  has_physical_location BOOLEAN DEFAULT false;

-- Geocoding results
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  geocode_data JSONB;
-- Structure: { lat, lng, placeId, addressComponents }

-- Google Places data
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  google_place_id TEXT;

ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  google_place_data JSONB;
-- Structure: { name, rating, userRatingsTotal, types }

-- Imagery URLs
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  business_imagery JSONB;
-- Structure: {
--   photos: [{ url, attribution, width, height }],
--   mapImage: "url",
--   streetView: { url, panoId, date },
--   source: "google_places" | "street_view" | "placeholder"
-- }

-- Index for location-based queries (future feature)
CREATE INDEX IF NOT EXISTS idx_generated_sites_has_location
ON generated_sites(has_physical_location)
WHERE has_physical_location = true;
```

### Updated Requirements JSONB Structure

```javascript
{
  // Existing fields
  businessName: "Mario's Pizza",
  industry: "Restaurant",
  mainOffering: "Authentic Italian pizza",
  targetAudience: "Families and pizza lovers",
  valueProposition: "Family recipes since 1985",
  colorPreference: "Red and white",
  ownerPhone: "+1-555-1234",
  ownerLanguage: "en",
  editPin: "1234",
  editPassphrase: "happy-tiger-42",

  // NEW fields
  hasPhysicalLocation: true,
  businessAddress: {
    street: "123 Main Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
    fullAddress: "123 Main Street, Austin, Texas 78701"
  }
}
```

---

## 5. Website Generation Changes

### Updated `buildWebsitePrompt` Function

```javascript
function buildWebsitePrompt(requirements, imagery) {
  // Base prompt (existing)
  let prompt = `Create a complete, production-ready single-page marketing website.

BUSINESS DETAILS:
- Business Name: ${requirements.businessName || 'My Business'}
- Industry: ${requirements.industry || 'General'}
- Main Service/Product: ${requirements.mainOffering || 'Professional services'}
- Target Audience: ${requirements.targetAudience || 'General public'}
- Unique Value Proposition: ${requirements.valueProposition || 'Quality and reliability'}
- Call to Action: ${requirements.callToAction || 'Contact us today'}
- Color Preference: ${requirements.colorPreference || 'Professional blue'}
`;

  // Add location info if available
  if (requirements.hasPhysicalLocation && requirements.businessAddress) {
    prompt += `
PHYSICAL LOCATION:
- Address: ${requirements.businessAddress.fullAddress}
- Include the address in the Contact section
- Add a "Get Directions" link to Google Maps
`;
  }

  // Add imagery instructions based on what we have
  prompt += buildImageryInstructions(imagery);

  // Rest of the prompt...
  return prompt;
}

function buildImageryInstructions(imagery) {
  if (!imagery || imagery.source === 'placeholder') {
    return `
IMAGE REQUIREMENTS:
- Use placeholder images from https://placehold.co
- Example: https://placehold.co/600x400/1a1a2e/ffffff?text=Hero+Image
`;
  }

  let instructions = `
IMAGE REQUIREMENTS:
`;

  // If we have real business photos
  if (imagery.photos && imagery.photos.length > 0) {
    instructions += `
USE THESE REAL BUSINESS PHOTOS (in order of preference):
${imagery.photos.map((photo, i) => `${i + 1}. ${photo.url}`).join('\n')}

- Use photo #1 as the hero image (full-width, prominent)
- Use remaining photos in the About, Services, or Gallery sections
- Add proper alt text describing the business
`;
  }

  // If we have Street View
  if (imagery.streetView) {
    instructions += `
STREET VIEW IMAGE (storefront):
- URL: ${imagery.streetView.url}
- Use this to show the physical location/storefront
- Good for the "Visit Us" or "Location" section
`;
  }

  // Map image for contact section
  if (imagery.mapImage) {
    instructions += `
MAP IMAGE (for Contact/Location section):
- URL: ${imagery.mapImage}
- Include this map in the Contact section
- Add a "Get Directions" button linking to Google Maps
`;
  }

  // Attribution requirements
  if (imagery.photos?.some(p => p.attribution)) {
    instructions += `
IMPORTANT: Include image attributions in the footer or near images where required.
`;
  }

  return instructions;
}
```

### Updated Generate Site Flow

```javascript
// app/api/generate-site/route.js (updated)
export async function POST(request) {
  // ... existing code to parse requirements ...

  // NEW: Process address if provided
  let imagery = null;
  if (requirements.hasPhysicalLocation && requirements.businessAddress) {
    const addressResult = await processAddress(
      requirements.businessAddress.fullAddress,
      requirements.businessName,
      requirements.industry
    );

    if (addressResult.valid) {
      // Store geocode data for database
      requirements.geocodeData = addressResult.geocode;
      requirements.googlePlaceId = addressResult.place?.placeId;
      requirements.googlePlaceData = addressResult.place;
      imagery = addressResult.imagery;
    }
  }

  // Build prompt with imagery data
  const prompt = buildWebsitePrompt(requirements, imagery);

  // ... rest of generation code ...

  // Save to database with new fields
  const { data, error } = await supabase
    .from('generated_sites')
    .insert({
      // ... existing fields ...
      business_address: requirements.businessAddress,
      has_physical_location: requirements.hasPhysicalLocation || false,
      geocode_data: requirements.geocodeData,
      google_place_id: requirements.googlePlaceId,
      google_place_data: requirements.googlePlaceData,
      business_imagery: imagery
    })
    .select()
    .single();
}
```

### Interactive Map Embed (Alternative to Static Image)

For a better user experience, we can use an embedded Google Map instead of a static image:

```javascript
function generateMapEmbed(location, businessName) {
  // Use embed API (no API key required for basic embed)
  return `<iframe
    width="100%"
    height="300"
    style="border:0"
    loading="lazy"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
    src="https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY}
      &q=${encodeURIComponent(businessName)}
      &center=${location.lat},${location.lng}
      &zoom=15">
  </iframe>`;
}
```

---

## 6. Implementation Phases

### Phase 1: Address Collection (1-2 days)
- [ ] Update VAPI prompt with Question #7 (English + Spanish)
- [ ] Update `generateWebsite` tool definition
- [ ] Test address collection flow via phone
- [ ] Update database schema with address columns

### Phase 2: Address Processing (2-3 days)
- [ ] Create `/api/process-address` endpoint
- [ ] Implement Google Geocoding integration
- [ ] Implement business type detection
- [ ] Add error handling for invalid addresses
- [ ] Test with various address formats

### Phase 3: Google Places Integration (2-3 days)
- [ ] Enable Places API in Google Cloud Console
- [ ] Implement business search by name + location
- [ ] Implement photo fetching
- [ ] Handle attributions properly
- [ ] Test with various business types

### Phase 4: Maps & Street View (1-2 days)
- [ ] Enable Maps Static API
- [ ] Enable Street View Static API
- [ ] Implement map image generation
- [ ] Implement Street View fetching
- [ ] Add availability checks

### Phase 5: Website Generation Updates (2-3 days)
- [ ] Update `buildWebsitePrompt` function
- [ ] Add imagery instructions to prompt
- [ ] Test HTML generation with real images
- [ ] Ensure responsive image handling
- [ ] Add fallback to placeholders

### Phase 6: Testing & Polish (2-3 days)
- [ ] End-to-end testing via phone calls
- [ ] Test various business types
- [ ] Test edge cases (no photos, no Street View)
- [ ] Performance optimization
- [ ] Monitor API costs

---

## 7. Cost Considerations

### Google API Pricing (as of 2025)

| API | Price | Monthly Free Tier |
|-----|-------|-------------------|
| Geocoding | $5.00 per 1,000 requests | $200 credit (~40K requests) |
| Places - Nearby Search | $32.00 per 1,000 requests | $200 credit (~6K requests) |
| Places - Place Details | $17.00 per 1,000 requests | $200 credit (~12K requests) |
| Places - Photo | $7.00 per 1,000 requests | $200 credit (~28K requests) |
| Maps Static | $2.00 per 1,000 requests | $200 credit (~100K requests) |
| Street View Static | $7.00 per 1,000 requests | $200 credit (~28K requests) |

### Estimated Cost Per Site Generation

Assuming full imagery fetch:
- 1 Geocode request: $0.005
- 1 Nearby Search: $0.032
- 1 Place Details: $0.017
- 5 Photo requests: $0.035
- 1 Static Map: $0.002
- 1 Street View: $0.007

**Total per site: ~$0.10** (with all features)

### Cost Optimization Strategies

1. **Cache results** - Store imagery URLs in database, don't re-fetch
2. **Conditional fetching** - Only fetch Street View for storefronts
3. **Batch where possible** - Use Place Details instead of multiple calls
4. **Set usage alerts** - Configure billing alerts in Google Cloud

---

## 8. Error Handling & Fallbacks

### Graceful Degradation

```javascript
async function fetchBusinessImageryWithFallbacks(params) {
  const { placeId, location, hasStorefront, businessName, colorPreference } = params;

  try {
    // Try full imagery fetch
    const imagery = await fetchBusinessImagery({ placeId, location, hasStorefront });

    if (imagery.photos.length > 0 || imagery.streetView) {
      return imagery;
    }
  } catch (error) {
    console.error('Imagery fetch failed:', error);
  }

  // Fallback: Generate high-quality placeholders
  const color = colorToHex(colorPreference) || '667eea';
  return {
    photos: [],
    mapImage: location ? generateMapImageUrl(location) : null,
    streetView: null,
    source: 'placeholder',
    placeholderConfig: {
      heroImage: `https://placehold.co/1200x600/${color}/ffffff?text=${encodeURIComponent(businessName)}`,
      featureImages: [
        `https://placehold.co/400x300/${color}/ffffff?text=Our+Services`,
        `https://placehold.co/400x300/${color}/ffffff?text=Quality+Work`,
        `https://placehold.co/400x300/${color}/ffffff?text=Happy+Customers`
      ]
    }
  };
}
```

### User Feedback

When imagery isn't available, inform the user:

```javascript
// In VAPI response
if (imagery.source === 'placeholder') {
  return {
    result: `Your website is ready at ${previewUrl}. ` +
      `I wasn't able to find photos of your business online, ` +
      `but you can upload your own photos later!`
  };
}
```

### Validation Errors

Handle address validation failures gracefully:

```javascript
if (!geocodeResult.valid) {
  // Don't fail the entire generation - just skip imagery
  console.log('Address validation failed, proceeding without location imagery');
  requirements.hasPhysicalLocation = false;
  // Continue with placeholder imagery
}
```

---

## Summary

This feature adds significant value by:
1. Making websites more authentic with real business imagery
2. Improving SEO with location data
3. Building trust with potential customers who can see the actual storefront
4. Reducing the need for manual image uploads

The implementation is designed to be:
- **Progressive** - Works without address, better with it
- **Fault-tolerant** - Falls back gracefully when APIs fail
- **Cost-effective** - Caches results and uses conditional fetching
- **User-friendly** - Natural voice conversation to collect address

Next step: Begin Phase 1 implementation with VAPI prompt updates.
