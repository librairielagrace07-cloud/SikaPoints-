import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey    = process.env.GENIUSPAY_API_KEY ?? ''
  const apiSecret = process.env.GENIUSPAY_API_SECRET ?? ''

  const keyPreview    = apiKey    ? `${apiKey.slice(0, 12)}...` : 'MANQUANT'
  const secretPreview = apiSecret ? `${apiSecret.slice(0, 12)}...` : 'MANQUANT'

  // Test 1 : GET /payments (lister)
  const getRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
    },
    cache: 'no-store',
  })
  const getBody = await getRes.json().catch(() => null)

  // Test 2 : POST /payments avec données minimales
  const postRes = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
    },
    body: JSON.stringify({
      amount: 100,
      currency: 'XOF',
      customer_name: 'Test',
      customer_email: 'test@test.com',
      description: 'Test SikaPoints',
      return_url: 'https://sika-mobile.vercel.app/paiement/succes',
      cancel_url: 'https://sika-mobile.vercel.app/paiement/echec',
      callback_url: 'https://sika-mobile.vercel.app/api/webhooks/geniuspay',
    }),
  })
  const postBody = await postRes.json().catch(() => null)

  return NextResponse.json({
    keys: { api_key: keyPreview, api_secret: secretPreview },
    get_test:  { status: getRes.status,  body: getBody  },
    post_test: { status: postRes.status, body: postBody },
  })
}
