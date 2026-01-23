// Lazy client initialization to avoid build-time errors
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { GoogleGenerativeAI } from '@google/generative-ai'

export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
}

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export function getGemini() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}
