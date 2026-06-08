import { NextResponse } from 'next/server'

async function testAuth(label: string, headers: Record<string, string>, method = 'GET', body?: object) {
  const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  let parsed: unknown = null
  try { parsed = JSON.parse(text) } catch { parsed = text.slice(0, 300) }
  return { label, status: res.status, body: parsed }
}

export async function GET() {
  const apiKey    = process.env.GENIUSPAY_API_KEY ?? ''
  const apiSecret = process.env.GENIUSPAY_API_SECRET ?? ''

  const postBody = {
    amount: 500, currency: 'XOF',
    customer_name: 'Test', customer_email: 'test@test.com',
    description: 'Test SikaPoints',
    return_url: 'https://sika-mobile.vercel.app/paiement/succes',
    cancel_url:  'https://sika-mobile.vercel.app/paiement/echec',
    callback_url:'https://sika-mobile.vercel.app/api/webhooks/geniuspay',
  }

  const results = await Promise.all([
    // Format actuel
    testAuth('GET x-api-key+secret', { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }),
    // Bearer avec sk_live
    testAuth('GET bearer sk', { 'Authorization': `Bearer ${apiSecret}` }),
    // Bearer avec pk_live
    testAuth('GET bearer pk', { 'Authorization': `Bearer ${apiKey}` }),
    // POST format actuel
    testAuth('POST x-api-key+secret', { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret }, 'POST', postBody),
    // POST bearer sk
    testAuth('POST bearer sk', { 'Authorization': `Bearer ${apiSecret}` }, 'POST', postBody),
  ])

  return NextResponse.json({
    keys: {
      api_key:    apiKey    ? `${apiKey.slice(0, 15)}...`    : 'MANQUANT',
      api_secret: apiSecret ? `${apiSecret.slice(0, 15)}...` : 'MANQUANT',
    },
    results,
  })
}
