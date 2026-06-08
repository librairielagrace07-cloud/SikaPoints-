import { NextResponse } from 'next/server'

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://geniuspay.ci',
  'Referer': 'https://geniuspay.ci/',
  'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
}

async function testAuth(label: string, authHeaders: Record<string, string>, method = 'GET', body?: object) {
  const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method,
    headers: { 'Content-Type': 'application/json', ...BROWSER_HEADERS, ...authHeaders },
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
