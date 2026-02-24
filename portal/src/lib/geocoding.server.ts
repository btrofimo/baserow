const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'TCR-Client-Portal/1.0 (tcrprojects.com)'
const THROTTLE_MS = 1100

let throttleChain = Promise.resolve<Response>(new Response())

async function throttledFetch(url: string): Promise<Response> {
  const request = throttleChain.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS))
    return fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
  })
  throttleChain = request.catch(() => new Response())
  return request
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

function abbreviateState(fullName: string): string {
  return STATE_ABBREVIATIONS[fullName] ?? fullName
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    postcode?: string
    country_code?: string
  }
}

export interface GeocodingResult {
  displayName: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
}

export async function searchAddress(
  query: string
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) return []

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    countrycodes: 'us',
    addressdetails: '1',
    limit: '5',
  })

  const response = await throttledFetch(`${NOMINATIM_URL}?${params}`)

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`)
  }

  const results = (await response.json()) as NominatimResult[]

  return results.map((r) => {
    const city =
      r.address.city ??
      r.address.town ??
      r.address.village ??
      r.address.municipality ??
      ''

    return {
      displayName: r.display_name,
      street: [r.address.house_number, r.address.road]
        .filter(Boolean)
        .join(' '),
      city,
      state: abbreviateState(r.address.state ?? ''),
      zipCode: r.address.postcode ?? '',
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    }
  })
}
