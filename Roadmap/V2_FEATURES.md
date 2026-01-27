# SpeakYour.site V2 Features Roadmap

This document outlines future features to be implemented after the MVP launch.

---

## Table of Contents
1. [Twilio SMS Notifications](#1-twilio-sms-notifications)
2. [Multilingual Support (Spanish)](#2-multilingual-support-spanish)
3. [Vanity Phone Number & Inbound Voice Calls](#3-vanity-phone-number--inbound-voice-calls)

---

## 1. Twilio SMS Notifications

### Overview
Add automated SMS notifications alongside email notifications after website creation. This provides a faster, more immediate touchpoint with customers who may not check email regularly.

### Business Value
- Higher engagement rates (98% SMS open rate vs 20% email)
- Faster response times from customers
- Better suited for on-the-go tradespeople
- Backup communication channel if emails go to spam

### Architecture
Mirror the existing Resend email system:
- Collect phone numbers during site generation (voice call + modal)
- Send SMS at same trigger points as emails (preview, reminder, claimed)
- Use existing `generated_sites.phone` column
- Create `/api/send-sms` endpoint parallel to `/api/send-email`

### Implementation Steps

#### 1.1 Setup & Dependencies
```bash
npm install twilio
```

**Environment Variables** (`.env.local`):
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### 1.2 Create SMS API Endpoint
**File:** `/app/api/send-sms/route.js`

Three message types:
- **Preview**: "Your website is ready! View it at: [URL]. This link expires in 24h."
- **Reminder**: "⏰ Only 4 hours left! Your website expires soon. Claim it now: [URL]"
- **Claimed**: "🎉 Congrats! Your site is live at [URL]"

#### 1.3 Phone Collection Points

**Homepage Modal** (`app/page.js`, lines 154-236):
- Add phone input below email field
- Format: (XXX) XXX-XXXX with input masking
- Optional field (email required, phone optional)

**VAPI Voice Conversation**:
Update assistant prompt to ask:
> "What's the best phone number to reach you at? I'll text you the link."

Extract phone from speech (similar to email extraction).

**Claim Flow** (`app/preview/[id]/page.js`):
Add phone field if not collected during initial flow.

#### 1.4 Update Notification Triggers

**Preview** (`app/page.js`):
```javascript
// Send email
await fetch('/api/send-email', { ... })

// Send SMS if phone provided
if (phone) {
  await fetch('/api/send-sms', {
    method: 'POST',
    body: JSON.stringify({ siteId, phone, type: 'preview' })
  })
}
```

**Reminder Cron** (`app/api/cron/send-reminders/route.js`):
- Query sites with phone numbers
- Send SMS + email reminders
- Track with `reminder_sms_sent_at`

**Claimed** (both endpoints):
- `/api/claim-site/route.js`
- `/api/webhook/route.js`

#### 1.5 Database Migration
```sql
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS reminder_sms_sent_at TIMESTAMPTZ;
```

### Testing Checklist
- [ ] Twilio account setup with test credentials
- [ ] Test `/api/send-sms` endpoint with your phone
- [ ] Verify SMS delivery for all three types
- [ ] Test phone collection in modal
- [ ] Test phone extraction from VAPI
- [ ] Verify cron sends both email and SMS
- [ ] Test claimed SMS after free and paid claims

### Cost Considerations
- **Twilio SMS**: ~$0.0075 per SMS in US
- **Monthly estimate**: 1000 users × 3 SMS each = $22.50/month

### Compliance Requirements
- **TCPA Compliance**: Get explicit consent before sending SMS
- **Opt-out mechanism**: Include "Reply STOP to unsubscribe"
- **Privacy Policy**: Update with SMS data collection notice

---

## 2. Multilingual Support (Spanish)

### Overview
Enable Spanish-speaking contractors (HVAC, roofing, plumbing) to converse with Vapi in Spanish while generating English websites for their English-speaking customers.

### Use Case Example
**Scenario**: Spanish-speaking HVAC contractor in Tucson, Arizona
- **User speaks**: Spanish (their native language)
- **VAPI responds**: Spanish (natural conversation)
- **Generated website**: English (for English-speaking customers)
- **Notifications**: Spanish (emails and SMS in Spanish)

### Architecture

#### Database Schema
```sql
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS user_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS site_language TEXT DEFAULT 'en';
```

**Fields**:
- `user_language`: Language user speaks ('es', 'en')
- `site_language`: Language of generated website (usually 'en')

#### Dual VAPI Assistants
Create two separate assistants in VAPI Dashboard:

1. **English Assistant** (existing)
   - ID: `NEXT_PUBLIC_VAPI_ASSISTANT_ID_EN`
   - Current system prompt

2. **Spanish Assistant** (new)
   - ID: `NEXT_PUBLIC_VAPI_ASSISTANT_ID_ES`
   - Spanish voice/TTS model
   - Spanish system prompt (see below)

### Implementation Steps

#### 2.1 Homepage Language Selector
**File**: `app/page.js`

Add before "Start Speaking" button:
```jsx
<div style={styles.languageSelector}>
  <label>Select your language / Seleccione su idioma:</label>
  <select onChange={(e) => setUserLanguage(e.target.value)}>
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</div>
```

#### 2.2 Spanish VAPI Assistant System Prompt

```
Eres Sarah, una asistente de IA amigable y profesional que ayuda a contratistas
y dueños de negocios a crear sitios web.

IMPORTANTE: Vas a crear un sitio web EN INGLÉS para los clientes de habla
inglesa de este negocio, aunque el dueño hable español.

FLUJO DE CONVERSACIÓN:

1. SALUDO Y CONFIRMACIÓN
"¡Hola! Soy Sarah. Voy a ayudarte a crear un sitio web profesional para tu
negocio. Voy a hacerte algunas preguntas en español, pero el sitio web será
en inglés para tus clientes. ¿Suena bien?"

2. RECOPILACIÓN DE INFORMACIÓN
Haz estas preguntas de forma natural:

a) "¿Cuál es el nombre de tu negocio?"
b) "¿A qué te dedicas? Por ejemplo, plomería, HVAC, techado, limpieza..."
c) "¿Qué servicios principales ofreces a tus clientes?"
d) "¿Quiénes son tus clientes ideales? Por ejemplo, dueños de casas, negocios..."
e) "¿Qué te hace diferente de otros negocios similares?"
f) "¿Qué acción quieres que tomen tus clientes? Por ejemplo, llamar, enviar
   email, pedir presupuesto..."
g) "¿Hay alguna información adicional importante? Por ejemplo, años en el
   negocio, premios, garantías..."

3. RECOPILACIÓN DE CONTACTO
"Perfecto. ¿Cuál es tu correo electrónico para enviarte el enlace?"
"¿Y tu número de teléfono?"

4. CONFIRMACIÓN ANTES DE GENERAR
"Excelente. Voy a crear un sitio web profesional EN INGLÉS con toda esta
información. Tus clientes de habla inglesa lo verán en inglés, pero tú
recibirás todas las notificaciones en español. ¿Listo para crear tu sitio?"

5. GENERACIÓN
Llama la herramienta generateWebsite con TODOS los detalles traducidos al inglés.

6. ENTREGA
"¡Listo! Tu sitio web está creado. Te envié el enlace por email y mensaje
de texto. El sitio está en inglés para tus clientes y tienes 24 horas para
revisarlo gratis."

REGLAS:
- Habla siempre en español con el usuario
- Traduce toda la información al inglés antes de llamar generateWebsite
- Confirma que el sitio será en inglés pero las notificaciones en español
- Sé amigable, profesional y eficiente
- No uses jerga técnica
```

#### 2.3 Frontend Language Routing
**File**: `app/page.js`

Update VAPI initialization:
```javascript
const loadVapi = async () => {
  const assistantId = userLanguage === 'es'
    ? process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_ES
    : process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_EN

  const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
  await vapi.start(assistantId)
}
```

#### 2.4 Spanish Email Templates
**File**: `app/api/send-email/route.js`

Create Spanish versions:
- `buildPreviewEmailEs()` - "¡Tu sitio está listo!"
- `buildReminderEmailEs()` - "¡Solo 4 horas!"
- `buildClaimedEmailEs()` - "¡Felicidades! Tu sitio está en vivo"

Route based on `user_language` from database.

#### 2.5 Spanish SMS Templates
**File**: `app/api/send-sms/route.js`

```javascript
const spanishMessages = {
  preview: `¡Tu sitio web está listo! Véelo aquí: ${url}. Expira en 24 horas.`,
  reminder: `⏰ ¡Solo 4 horas! Tu sitio expira pronto. Reclámalo: ${url}`,
  claimed: `🎉 ¡Felicidades! Tu sitio está en vivo: ${url}`
}
```

#### 2.6 Update UI for Spanish Users
**Homepage** (`app/page.js`):
- Hero section: Bilingual toggle
- How it works: Spanish translations
- Pricing: Spanish copy
- CTAs: "Empezar" instead of "Start Speaking"

**Modals**:
- Email gate: Spanish copy if `userLanguage === 'es'`
- Claim modal: Spanish instructions
- Countdown: "Expira en X horas"

#### 2.7 Gemini Prompt Adjustment
**File**: `app/api/generate-site/route.js`

Add to prompt:
```javascript
const prompt = `Generate a complete, professional marketing website IN ENGLISH
for a ${industry} business...

IMPORTANT: The business owner speaks Spanish, but this website is for
English-speaking customers in the United States. All content must be in clear,
professional English.

${requirements}...
`
```

### Testing Checklist
- [ ] Create Spanish VAPI assistant
- [ ] Test language selector on homepage
- [ ] Verify Spanish conversation flow
- [ ] Confirm generated site is in English
- [ ] Verify Spanish emails received
- [ ] Verify Spanish SMS received
- [ ] Test English flow still works

### Future Language Expansion
- Chinese (Mandarin/Cantonese)
- Vietnamese
- Korean
- Portuguese
- French

---

## 3. Vanity Phone Number & Inbound Voice Calls

### Overview
Enable customers to call a memorable vanity phone number (like **1-888-GIT-SITE**) from physical billboards, radio ads, or print materials. The call connects to a Vapi voice agent that walks them through creating their website, then texts and emails them the link.

### Business Value
- **Brand recall**: Easy-to-remember number increases conversions
- **Offline marketing**: Enables billboards, radio, print ads, vehicle wraps
- **Accessibility**: Phone calls remove barrier for non-tech users
- **Trust**: Talking to AI feels more personal than website form
- **24/7 availability**: Inbound calls work anytime

### Use Cases
- Billboard on I-10: "Need a Website? Call 1-888-GIT-SITE"
- Radio ad: "Call 1-888-GIT-SITE and speak your business into existence"
- Business card: "Get online today: 1-888-GIT-SITE"
- Vehicle wrap: "Build your website by phone: 1-888-GIT-SITE"

### Architecture

```
Customer dials 1-888-GIT-SITE
         ↓
   Twilio Phone Number
         ↓
   Vapi Inbound Call Handler
         ↓
   Voice conversation (collect requirements)
         ↓
   Call /api/generate-site (create website)
         ↓
   Send SMS + Email with link
         ↓
   Customer receives link via text & email
```

### Implementation Steps

#### 3.1 Acquire Vanity Phone Number

**Option 1: Twilio (Recommended)**
- Search for toll-free vanity numbers: https://www.twilio.com/console/phone-numbers/search
- Filter: Toll-free (888, 877, 866, 855, 844, 833)
- Search pattern: "GIT-SITE" or similar
- Cost: ~$2-4/month for toll-free number
- Note: Popular vanity numbers may not be available

**Option 2: Specialty Vanity Number Providers**
If Twilio doesn't have your desired number:
- **RingBoost**: https://www.ringboost.com (premium vanity numbers)
- **Toll Free Numbers**: https://www.tollfreenumbers.com
- **800.com**: https://www.800.com

**How it works**:
1. Purchase vanity number from provider
2. Port number to Twilio
3. Configure Twilio to forward to Vapi

**Alternative Numbers to Consider**:
- 1-888-GIT-SITE (primary choice)
- 1-888-WEB-SITE
- 1-888-SAY-SITE
- 1-844-TALK-WEB
- 1-855-WEB-TALK

#### 3.2 Configure Twilio Phone Number

**Twilio Console Steps**:
1. Go to Phone Numbers → Manage → Active Numbers
2. Select your vanity number
3. Under "Voice & Fax", configure:
   - **When a call comes in**: Webhook (HTTP POST)
   - **URL**: Your Vapi inbound endpoint (see 3.3)
   - **HTTP Method**: POST

4. Under "Messaging", configure:
   - **When a message comes in**: Webhook
   - **URL**: Your SMS fallback endpoint (optional)

#### 3.3 Create Vapi Inbound Call Handler

**Vapi Dashboard Configuration**:
1. Go to: https://dashboard.vapi.ai
2. Navigate to: Phone Numbers → Add Phone Number
3. Select: "Import from Twilio"
4. Enter your Twilio credentials
5. Select your vanity number
6. Assign to Assistant (create new inbound assistant)

**Vapi Inbound Assistant Configuration**:
- **Name**: "SpeakYourSite Inbound"
- **First Message**: "Hi! You've reached Speak Your Site. I'm Sarah, and I'll help you create a professional website just by talking. This will take about 2 minutes. Sound good?"
- **Voice**: Select natural-sounding voice (e.g., "en-US-Wavenet-F")
- **Model**: GPT-4 or Claude
- **Tools**: Connect `generateWebsite` tool

#### 3.4 Inbound Assistant System Prompt

```
You are Sarah, a friendly and professional AI assistant for SpeakYour.site.
You help business owners create websites over the phone.

IMPORTANT CONTEXT:
- The caller dialed in from a phone number (billboard, radio ad, etc.)
- They want to create a website by talking to you
- Keep the conversation efficient (under 5 minutes)
- Be encouraging and supportive

CONVERSATION FLOW:

1. GREETING & CONTEXT SETTING
"Hi! You've reached Speak Your Site. I'm Sarah, and I'll help you create a
professional website just by talking. This will take about 2 minutes. What's
your business called?"

2. BUSINESS INFORMATION COLLECTION
Ask these questions naturally and conversationally:

a) "Great! What type of business is [BUSINESS_NAME]? For example, plumbing,
   landscaping, catering..."

b) "Perfect. What are the main services you offer?"

c) "Who are your ideal customers? Homeowners, businesses, or both?"

d) "What makes you different from your competitors?"

e) "What action do you want customers to take on your website? Call you,
   request a quote, book online?"

f) "Any other important details? Like years in business, certifications,
   service areas?"

3. CONTACT INFORMATION
"Awesome! I'm going to build your website now. To send you the link, I need
your email address. What's a good email for you?"

[Get email address - spell it back for confirmation]

"Perfect. And your phone number so I can text you the link?"

[Get phone number - confirm format]

4. CONFIRMATION & GENERATION
"Excellent! I have everything I need. I'm going to create a professional
website for [BUSINESS_NAME] right now. You'll receive the link via text
and email in just a moment. The preview is free for 24 hours. Sound good?"

[Call generateWebsite tool with all collected information]

5. SUCCESS MESSAGE
"Done! I just sent you the link via text and email. Check your phone in the
next minute. You have 24 hours to review it for free. If you love it, you can
claim it and make it live. Any questions before we hang up?"

6. CLOSING
"Great! Thanks for calling Speak Your Site. If you need help, just reply to
the text or email. Have a great day!"

RULES:
- Keep it conversational, not robotic
- Don't use technical jargon
- If they seem confused, reassure them it's simple
- If they ask about pricing, say: "Preview is free for 24 hours. After that,
  you can publish for free or upgrade to a premium plan for $29/month or $49
  one-time code export."
- If they're skeptical, emphasize: "No credit card needed, just give me 2
  minutes and you'll have a real website."
- Always confirm email and phone by spelling/repeating back
```

#### 3.5 Create Backend Endpoint for Inbound Calls

**File**: `/app/api/inbound-call/route.js` (NEW)

```javascript
import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.json()

  // Log inbound call metadata
  console.log('Inbound call received:', {
    from: body.caller,
    timestamp: new Date().toISOString()
  })

  // Track analytics (optional)
  // e.g., increment "calls_received" counter in database

  return NextResponse.json({
    success: true,
    message: 'Call connected to Vapi'
  })
}
```

This endpoint is primarily for logging/analytics. Vapi handles the actual call flow.

#### 3.6 Modify Site Generation to Support Inbound Calls

**File**: `/app/api/generate-site/route.js`

Update to accept phone number from inbound call:
```javascript
const {
  businessName,
  industry,
  email,
  phone,  // NEW: from inbound call
  callSource = 'web'  // NEW: 'web' or 'phone'
} = toolCallData

// Store call source in database
const { data: site } = await supabase
  .from('generated_sites')
  .insert({
    // ... existing fields
    phone: phone,
    source: callSource  // NEW COLUMN
  })
```

Database migration:
```sql
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
-- Values: 'web', 'phone', 'sms'
```

#### 3.7 Update SMS/Email to Reference Phone Call

**File**: `/app/api/send-email/route.js` & `/app/api/send-sms/route.js`

Personalize messages based on source:
```javascript
const greeting = site.source === 'phone'
  ? "Thanks for calling! Your website is ready."
  : "Your website is ready!"
```

#### 3.8 Marketing Message Examples

**Billboard**:
```
NEED A WEBSITE?
Just call and talk.

1-888-GIT-SITE

SpeakYour.site
```

**Radio Ad Script (30 seconds)**:
```
Need a website but hate computers? Just pick up your phone and call
1-888-GIT-SITE. Talk about your business for 2 minutes, and we'll build
your website while you're on the phone. No typing, no tech skills.
1-888-GIT-SITE. That's 1-888-GIT-SITE.
```

**Business Card**:
```
[FRONT]
Get Your Business Online
CALL: 1-888-GIT-SITE
SpeakYour.site

[BACK]
1. Call the number
2. Talk about your business
3. Get your website in minutes
```

### Technical Details

#### Call Flow Diagram
```
1. Customer dials 1-888-GIT-SITE
2. Twilio receives call
3. Twilio webhooks to Vapi inbound endpoint
4. Vapi connects call to inbound assistant
5. Assistant greets caller
6. Assistant asks questions, collects info
7. Assistant calls generateWebsite tool
8. Server creates website via Gemini
9. Server stores in Supabase
10. Server triggers SMS + email
11. Assistant confirms: "Check your phone!"
12. Call ends
13. Customer receives text + email with link
```

#### Call Duration & Cost
- **Average call**: 3-5 minutes
- **Twilio inbound**: ~$0.013/min ($0.04-0.065 per call)
- **Vapi usage**: Check Vapi pricing (per-minute charges)
- **Total estimated**: ~$0.10-0.25 per inbound call

#### Handling Call Volume
- Vapi can handle concurrent calls (no queue needed)
- Monitor call volume in Twilio Console
- Set up alerts for unusual spike in calls
- Consider adding call recording for quality assurance

#### Edge Cases to Handle

**1. Incomplete Calls (Caller Hangs Up Early)**
- Store partial data with status: "incomplete"
- Send follow-up SMS: "We got disconnected! Call back anytime: 1-888-GIT-SITE"

**2. Invalid Email/Phone**
- Assistant should validate format during call
- Repeat back for confirmation
- If invalid, ask again politely

**3. Caller Wants to Edit/Redo**
- Allow "Let's start over" command
- Reset conversation context

**4. Multiple Businesses**
- Ask: "Creating another site for a different business?"
- Track in database with same email/phone

**5. Spanish Speakers**
- Detect language: "Para español, presione dos"
- Route to Spanish assistant (from Feature 2)

### Testing Checklist
- [ ] Purchase/acquire vanity number
- [ ] Configure Twilio phone number
- [ ] Connect Twilio to Vapi
- [ ] Create Vapi inbound assistant
- [ ] Test inbound call end-to-end
- [ ] Verify website generated from call
- [ ] Confirm SMS + email sent
- [ ] Test with real phone (not just simulator)
- [ ] Record sample call for training
- [ ] Test edge cases (hang up, invalid email, etc.)

### Analytics to Track
- **Calls received**: Total inbound calls
- **Calls completed**: Full conversation to website generation
- **Conversion rate**: Calls → websites created
- **Average call duration**: Optimize for efficiency
- **Drop-off points**: Where do callers hang up?
- **Cost per acquisition**: Call costs vs conversions

### Future Enhancements
- **Call recording**: For quality assurance
- **Voicemail**: "Leave a message and we'll text you a link"
- **Callback queue**: "High call volume, we'll call you back"
- **Multi-language IVR**: "Press 1 for English, 2 para español"
- **Regional numbers**: Different numbers for different markets
- **SMS shortcode**: Text-to-start option

---

## V2 Implementation Priority

### Phase 1: Twilio SMS (Highest Impact, Lowest Effort)
**Priority**: HIGH
**Effort**: Medium (6-9 hours)
**Impact**: High engagement increase
**Dependencies**: None

### Phase 2: Vanity Phone + Inbound Calls (Biggest Differentiator)
**Priority**: HIGH
**Effort**: High (15-20 hours)
**Impact**: Unlocks offline marketing, unique positioning
**Dependencies**: Twilio SMS should be implemented first

### Phase 3: Multilingual Support (Market Expansion)
**Priority**: MEDIUM
**Effort**: High (11-15 hours)
**Impact**: Opens new market segment (Spanish speakers)
**Dependencies**: Can be parallel with Phase 2

---

## Cost Summary (Monthly)

### Twilio SMS
- 1000 users × 3 SMS each = **$22.50/month**

### Vanity Phone Number
- Toll-free vanity number = **$2-4/month**
- 200 inbound calls × 4 min avg × $0.013/min = **$10.40/month**

### Vapi
- Check current Vapi pricing for inbound calls
- Estimate: **$20-50/month** (varies by usage)

### Total V2 Monthly Cost
**~$55-87/month** (excluding Vapi, depends on volume)

---

## Success Metrics

### SMS Metrics
- Delivery rate > 95%
- Click-through rate > 40%
- Opt-out rate < 2%

### Inbound Call Metrics
- Call completion rate > 70%
- Website generation rate > 80%
- Average call time < 5 min

### Multilingual Metrics
- Spanish conversation completion > 60%
- English site quality from Spanish input > 90%
- Spanish user conversion vs English users

---

## Notes & Considerations

1. **Regulatory Compliance**
   - TCPA: Get explicit consent for SMS
   - GDPR: Handle international data properly
   - FTC: Disclose AI voice interactions

2. **Quality Assurance**
   - Record sample calls (with consent)
   - Monitor Vapi conversation quality
   - A/B test different prompts

3. **Scalability**
   - Twilio can handle high volume
   - Vapi concurrent call limits
   - Database indexing for phone lookups

4. **Brand Consistency**
   - All touchpoints (web, SMS, phone) use same brand voice
   - Spanish communications maintain brand tone
   - Phone scripts follow brand guidelines

5. **Customer Support**
   - How to handle calls that need human support?
   - Escalation path for complex requests
   - Refund policy for dissatisfied customers

---

## Future Feature Ideas (V3+)

- **WhatsApp integration**: Website creation via WhatsApp chat
- **Voice cloning**: "Use your own voice for the call"
- **Multi-site management**: Dashboard for customers with multiple businesses
- **White label**: Let agencies rebrand the service
- **API access**: Let developers integrate voice-to-site
- **QR codes**: Scan to start voice conversation
- **Offline kiosks**: Voice-activated kiosks at trade shows
- **SMS keywords**: Text "WEBSITE" to short code to start

---

*Last Updated: January 2026*
