/**
 * Serviço Oficial de Rotas e Geocodificação Google Maps
 * 
 * Regras Estritas:
 * 1. Ponto de origem fixo e imutável: La Sophia Pizzaria (Rua Nossa Senhora Aparecida, 214 - Vila Fátima, Guarulhos - SP, CEP 07191-190)
 * 2. Destino: Endereço completo informado pelo cliente (Rua, Número OBRIGATÓRIO, Bairro, Cidade, Estado, CEP texto)
 * 3. Validação prévia de endereço com Google Maps Geocoding API
 * 4. Cálculo rodoviário veicular real pelas vias com Google Maps Routes API (turn-by-turn DRIVE)
 * 5. Sem distâncias em linha reta, sem estimativas fictícias, sem inversão de origem/destino
 * 6. Distância em quilômetros com 2 casas decimais (ex: "XX,XX km")
 */

export interface CustomerAddressInput {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

export interface GoogleDistanceResult {
  success: boolean;
  distanceMeters?: number;
  distanceKm?: number;
  formattedDistanceKm?: string;
  displayText?: string;
  formattedAddress?: string;
  foundAddress?: string;
  viaRoad?: string;
  origin?: {
    lat: number;
    lng: number;
    address: string;
  };
  destination?: {
    lat: number;
    lng: number;
    address: string;
  };
  inputAddress?: string;
  error?: string;
}

// Origem Oficial e Imutável da Pizzaria em Guarulhos - SP
export const PIZZERIA_FIXED_ORIGIN = {
  name: 'La Sophia Pizzaria e Esfiharia',
  street: 'Rua Nossa Senhora Aparecida',
  number: '214',
  neighborhood: 'Vila Fátima',
  city: 'Guarulhos',
  state: 'SP',
  cep: '07191-190',
  country: 'Brasil',
  lat: -23.4606341,
  lng: -46.5081334,
  fullAddress: 'Rua Nossa Senhora Aparecida, 214, Vila Fátima, Guarulhos - SP, 07191-190, Brasil',
  formattedAddress: 'Rua Nossa Senhora Aparecida, 214 - Vila Fátima, Guarulhos - SP, 07191-190, Brasil',
};

// Formata valor de KM no padrão brasileiro (ex: 2.7 -> "2,70 km")
export function formatDistanceKmBR(km: number): string {
  if (typeof km !== 'number' || isNaN(km)) return '';
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
}

// Obter a chave da API do Google Maps de forma segura no ambiente
export function getGoogleMapsApiKey(): string {
  const candidates = [
    process.env.VITE_GOOGLE_MAPS_API_KEY,
    process.env.GOOGLE_MAPS_API_KEY,
    'AIzaSyDmahRmG6Lq1Lq88dODmPg49Vu0gmwdbGo',
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().startsWith('AIza')) {
      return c.trim();
    }
  }

  return 'AIzaSyDmahRmG6Lq1Lq88dODmPg49Vu0gmwdbGo';
}

/**
 * Normaliza e valida o CEP mantendo como texto e preservando zeros à esquerda
 */
export function sanitizeCep(rawCep?: string): { cleanCep: string; formattedCep: string; isValid: boolean } {
  if (!rawCep || typeof rawCep !== 'string') {
    return { cleanCep: '', formattedCep: '', isValid: false };
  }
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return { cleanCep: clean, formattedCep: clean, isValid: false };
  }
  const formatted = `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return { cleanCep: clean, formattedCep: formatted, isValid: true };
}

/**
 * Geocodifica e valida o endereço do cliente utilizando Google Maps Geocoding API
 */
async function geocodeCustomerAddressWithGoogle(
  apiKey: string,
  customer: CustomerAddressInput
): Promise<{ lat: number; lng: number; formattedAddress: string; foundAddress: string } | null> {
  const { street, number, neighborhood, city, state, cep } = customer;
  const { formattedCep } = sanitizeCep(cep);

  const cityStr = (city || 'Guarulhos').trim();
  const stateStr = (state || 'SP').trim();
  const neighborhoodStr = (neighborhood || '').trim();

  // Query estruturada e rica para precisão
  const queriesToTry = [
    `${street.trim()}, ${number.trim()}, ${neighborhoodStr ? `${neighborhoodStr}, ` : ''}${cityStr} - ${stateStr}, ${formattedCep}, Brasil`,
    `${street.trim()}, ${number.trim()}, ${cityStr} - ${stateStr}, ${formattedCep}, Brasil`,
    `${street.trim()}, ${number.trim()}, ${neighborhoodStr ? `${neighborhoodStr}, ` : ''}${cityStr} - ${stateStr}, Brasil`,
    `${street.trim()}, ${number.trim()}, ${cityStr} - ${stateStr}, Brasil`,
  ];

  for (const query of queriesToTry) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const first = data.results[0];

        // Impedir que o Google Maps aceite apenas o centróide genérico de uma cidade, país ou CEP isolado
        const isGenericAreaOnly =
          first.types?.some((t: string) => ['locality', 'administrative_area_level_2', 'country', 'postal_code'].includes(t)) &&
          !first.types?.some((t: string) =>
            ['street_address', 'premise', 'subpremise', 'route', 'point_of_interest', 'establishment'].includes(t)
          );

        if (isGenericAreaOnly) {
          continue;
        }

        // Se for partial_match ou estabelecimento qualquer, verificar se a rua solicitada realmente bate
        const userCleanStreet = street
          .toLowerCase()
          .replace(/^(rua|avenida|av\.|alameda|travessa|praça|rodovia|estrada)\s+/i, '')
          .trim();
        const routeComp =
          first.address_components
            ?.find((c: any) => c.types?.includes('route'))
            ?.long_name?.toLowerCase() || '';
        const formatted = (first.formatted_address || '').toLowerCase();

        const keyWords = userCleanStreet.split(/\s+/).filter((w) => w.length >= 3);
        const hasMatchingWord = keyWords.length === 0 || keyWords.some(
          (w) => routeComp.includes(w) || formatted.includes(w)
        );

        if (!hasMatchingWord) {
          // Rejeita sugestão incorreta do Google
          continue;
        }

        const loc = first.geometry?.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          // Montar o endereço limpo para exibição ao cliente
          const routeName =
            first.address_components?.find((c: any) => c.types?.includes('route'))?.long_name ||
            street.trim();
          const streetNum =
            first.address_components?.find((c: any) => c.types?.includes('street_number'))?.long_name ||
            number.trim();
          const sublocality =
            first.address_components?.find((c: any) => c.types?.includes('sublocality') || c.types?.includes('sublocality_level_1'))?.long_name ||
            neighborhoodStr;
          const locality =
            first.address_components?.find((c: any) => c.types?.includes('administrative_area_level_2') || c.types?.includes('locality'))?.long_name ||
            cityStr;
          const adminState =
            first.address_components?.find((c: any) => c.types?.includes('administrative_area_level_1'))?.short_name ||
            stateStr;

          const foundAddress = `${routeName}, ${streetNum}${sublocality ? ` - ${sublocality}` : ''}, ${locality} - ${adminState}`;

          return {
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: first.formatted_address || query,
            foundAddress,
          };
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar Google Geocoding API:', err);
    }
  }

  return null;
}

/**
 * Calcula a distância rodoviária real entre a pizzaria e o cliente usando a Google Maps Routes API
 */
export async function calculateDrivingDistanceWithGoogle(
  customer: CustomerAddressInput
): Promise<GoogleDistanceResult> {
  const street = (customer.street || '').trim();
  const number = (customer.number || '').trim();
  const neighborhood = (customer.neighborhood || '').trim();
  const city = (customer.city || 'Guarulhos').trim();
  const state = (customer.state || 'SP').trim();
  const { cleanCep, formattedCep, isValid: isCepValid } = sanitizeCep(customer.cep);

  const inputAddress = `${street}, ${number}${neighborhood ? `, ${neighborhood}` : ''}, ${city} - ${state}, Brasil`;

  // 1. Validações estritas de entrada
  if (!street || street.length < 3) {
    return {
      success: false,
      error: 'Por favor, informe a rua ou logradouro completo.',
      inputAddress,
    };
  }

  if (!number) {
    return {
      success: false,
      error: 'O número do imóvel é obrigatório para calcular a distância exata.',
      inputAddress,
    };
  }

  if (!isCepValid) {
    return {
      success: false,
      error: 'Informe um CEP válido com 8 dígitos (ex: 07191-190).',
      inputAddress,
    };
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'Chave da API do Google Maps não configurada no servidor.',
      inputAddress,
    };
  }

  // 2. Geocodificação e validação prévia do endereço do cliente
  const geoResult = await geocodeCustomerAddressWithGoogle(apiKey, {
    street,
    number,
    complement: customer.complement,
    neighborhood,
    city,
    state,
    cep: formattedCep,
  });

  if (!geoResult) {
    return {
      success: false,
      error: 'Não foi possível localizar exatamente este endereço. Confira o CEP e o número.',
      inputAddress,
    };
  }

  // 3. Cálculo de rota rodoviária oficial via Google Maps Routes API
  const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const routeBody = {
    origin: {
      location: {
        latLng: {
          latitude: PIZZERIA_FIXED_ORIGIN.lat,
          longitude: PIZZERIA_FIXED_ORIGIN.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: geoResult.lat,
          longitude: geoResult.lng,
        },
      },
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
    computeAlternativeRoutes: false,
    languageCode: 'pt-BR',
    units: 'METRIC',
  };

  try {
    const routeRes = await fetch(routesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.description',
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
      },
      body: JSON.stringify(routeBody),
    });

    if (!routeRes.ok) {
      const errText = await routeRes.text();
      console.warn('Google Routes API retornou erro HTTP:', routeRes.status, errText);
      return {
        success: false,
        error: 'Não foi possível calcular a rota rodoviária até este endereço. Confira os dados.',
        inputAddress,
        foundAddress: geoResult.foundAddress,
        formattedAddress: geoResult.formattedAddress,
      };
    }

    const routeData = await routeRes.json();
    if (!routeData.routes || !Array.isArray(routeData.routes) || routeData.routes.length === 0) {
      return {
        success: false,
        error: 'Não foi possível calcular a rota rodoviária até este endereço. Confira o CEP e o número.',
        inputAddress,
        foundAddress: geoResult.foundAddress,
        formattedAddress: geoResult.formattedAddress,
      };
    }

    const firstRoute = routeData.routes[0];
    // Se a distância em metros não for enviada (ex: mesmo local ou muito perto), o valor padrão do protobuf é 0
    const distanceMeters = typeof firstRoute.distanceMeters === 'number' ? firstRoute.distanceMeters : 0;

    if (distanceMeters < 0) {
      return {
        success: false,
        error: 'Distância inválida retornada pelo Google Maps.',
        inputAddress,
        foundAddress: geoResult.foundAddress,
        formattedAddress: geoResult.formattedAddress,
      };
    }

    // Conversão estrita e exata: metros / 1000 = quilômetros
    // Ex: 500 metros = 0,50 km | 1.000 metros = 1,00 km | 2.700 metros = 2,70 km | 0 metros = 0,00 km
    const distanceKmRaw = distanceMeters / 1000;
    const distanceKmRounded = Number(distanceKmRaw.toFixed(2));
    const formattedDistance = formatDistanceKmBR(distanceKmRounded);

    return {
      success: true,
      distanceMeters,
      distanceKm: distanceKmRounded,
      formattedDistanceKm: formattedDistance,
      displayText: `Distância da pizzaria: ${formattedDistance}`,
      formattedAddress: geoResult.formattedAddress,
      foundAddress: geoResult.foundAddress,
      viaRoad: firstRoute.description || 'Vias locais',
      origin: {
        lat: PIZZERIA_FIXED_ORIGIN.lat,
        lng: PIZZERIA_FIXED_ORIGIN.lng,
        address: PIZZERIA_FIXED_ORIGIN.formattedAddress,
      },
      destination: {
        lat: geoResult.lat,
        lng: geoResult.lng,
        address: geoResult.foundAddress,
      },
      inputAddress,
    };
  } catch (err: any) {
    console.error('Erro ao conectar com Google Maps Routes API:', err);
    return {
      success: false,
      error: 'Falha temporária na comunicação com o Google Maps. Tente novamente.',
      inputAddress,
    };
  }
}
