import { createClient } from '@supabase/supabase-js'

// Note: In a real app, you'd want to handle this more securely
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function PreviewPage({ params }) {
  const { id } = params
  
  // Fetch the site from database
  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !site) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Site not found</h1>
        <p>This preview may have expired or doesn't exist.</p>
      </div>
    )
  }

  // Render the HTML in an iframe
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Upsell Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'system-ui'
      }}>
        <div>
          <strong>Your website preview for {site.business_name}</strong>
          <span style={{ opacity: 0.9, marginLeft: '12px' }}>
            Like what you see? Claim your site!
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Export Code - $49
          </button>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Host With Us - $29/mo
          </button>
          <button style={{
            background: '#ffd700',
            color: '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Premium Design - $499+
          </button>
        </div>
      </div>
      
      {/* Website Preview */}
      <iframe
        srcDoc={site.html_code}
        style={{
          flex: 1,
          border: 'none',
          width: '100%'
        }}
        title="Website Preview"
      />
    </div>
  )
}
```

---

### 2.4 Deploy to Vercel

1. Go to **vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Find your `voice-site-builder` repo and click **"Import"**
4. **Important:** Before deploying, add your environment variables:
   - Click **"Environment Variables"**
   - Add these (one at a time):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `GEMINI_API_KEY` | (We'll get this next) |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now |

5. Click **"Deploy"**
6. Wait a couple minutes for it to build
7. Once deployed, you'll get a URL like `https://voice-site-builder-abc123.vercel.app`
8. Go back to **Settings** → **Environment Variables** and set `NEXT_PUBLIC_APP_URL` to that URL

---

## Step 3: Get Your Gemini API Key

1. Go to **aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API key"** in the left sidebar
4. Click **"Create API key"**
5. Copy the key
6. Go back to Vercel → **Settings** → **Environment Variables**
7. Add it as `GEMINI_API_KEY`
8. Click **"Redeploy"** (in Deployments tab) to pick up the new variable

---

## Step 4: Set Up Vapi

Now let's create the voice agent that talks to users.

### 4.1 Create Account
1. Go to **vapi.ai** and sign up
2. You'll land on the dashboard

### 4.2 Create Your Assistant

1. Click **"Assistants"** in the sidebar
2. Click **"Create Assistant"**
3. Give it a name: "Website Builder Agent"

### 4.3 Configure the Assistant

In the assistant settings:

**Model Settings:**
- Choose your LLM provider (you can use Gemini here too, or GPT-4)
- We'll use the conversation model to gather info, not generate websites

**System Prompt:**
```
You are a friendly, professional website design consultant named Alex. Your job is to gather information from the caller to create their perfect marketing website.

CONVERSATION FLOW:
1. Greet them warmly and ask what kind of business they have
2. Ask about their industry and what they offer
3. Ask who their ideal customer is
4. Ask what makes them different from competitors
5. Ask what they want visitors to do (book a call, buy something, etc.)
6. Ask about color preferences or any brands they like the look of
7. Ask if there's anything else they'd like to include

STYLE GUIDELINES:
- Be conversational and warm, not robotic
- Ask ONE question at a time
- Acknowledge their answers before moving on
- If they're unsure about something, offer suggestions
- Keep it moving—aim for a 3-5 minute conversation

When you have gathered ALL the required information, call the generateWebsite function with the collected data.

REQUIRED INFO BEFORE CALLING FUNCTION:
- Business name
- Industry
- Main offering/service
- Target audience
- Value proposition (what makes them special)
- Call to action
- Color preference
