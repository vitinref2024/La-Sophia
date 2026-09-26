/**
 * Delivery Fee Calculation & Real Driving Distance Routing Utility
 * Official Distance Table:
 * Até 1 km  -> R$ 7,00
 * Até 2 km  -> R$ 10,00
 * Até 3 km  -> R$ 13,00
 * Até 4 km  -> R$ 15,00
 * Até 5 km  -> R$ 17,00
 * Até 6 km  -> R$ 19,00
 * Até 7 km  -> R$ 21,00
 * Até 8 km  -> R$ 23,00
 * Até 9 km  -> R$ 25,00
 * Acima de 9 km -> Fora da área padrão de entrega
 */

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDmahRmG6Lq1Lq88dODmPg49Vu0gmwdbGo';

export interface DeliveryFeeCalculation {
  distanceKm: number;
  fee: number;
  isOutOfRange: boolean;
  message?: string;
}

export interface RouteDistanceResult {
  success: boolean;
  distanceKm?: number;
  distanceMeters?: number;
  durationText?: string;
  routeSummary?: string;
  error?: string;
}

export interface PizzeriaOriginAddress {
  address: string;
  neighborhood?: string;
  city: string;
  state?: string;
  cep?: string;
}

export interface CustomerDestinationAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

/**
 * Format the official pizzeria address for routing origin
 */
export function formatPizzeriaOriginAddress(origin: PizzeriaOriginAddress | string): string {
  if (typeof origin === 'string') {
    const trimmed = origin.trim();
    return trimmed.toLowerCase().includes('brasil') ? trimmed : `${trimmed}, Brasil`;
  }

  const parts = [
    origin.address?.trim(),
    origin.neighborhood?.trim(),
    origin.city ? (origin.state ? `${origin.city.trim()} - ${origin.state.trim()}` : origin.city.trim()) : 'São Paulo - SP',
    origin.cep ? `CEP ${origin.cep.trim().replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
    'Brasil',
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Format the customer destination address for routing
 * Omits complement to prevent geocoding errors while including street, number, neighborhood, city, state and CEP.
 */
export function formatCustomerDestinationAddress(
  dest: CustomerDestinationAddress | string,
  includeCep: boolean = true
): string {
  if (typeof dest === 'string') {
    const trimmed = dest.trim();
    return trimmed.toLowerCase().includes('brasil') ? trimmed : `${trimmed}, Brasil`;
  }

  const cleanStreet = dest.street.trim();
  const cleanNumber = dest.number.trim();
  const cleanNeighborhood = dest.neighborhood?.trim() || '';
  const cleanCity = dest.city?.trim() || 'São Paulo';
  const cleanState = dest.state?.trim() || 'SP';
  const cleanCep = dest.cep ? dest.cep.trim().replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';

  const streetNumber = `${cleanStreet}, ${cleanNumber}`;
  const parts = [
    streetNumber,
    cleanNeighborhood,
    `${cleanCity} - ${cleanState}`,
    includeCep && cleanCep ? `CEP ${cleanCep}` : '',
    'Brasil',
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Applies the official delivery fee table based on distance in kilometers.
 * Enquadra na próxima faixa conforme os exemplos:
 * 0.5 km -> R$ 7,00
 * 1.0 km -> R$ 7,00
 * 1.1 km -> R$ 10,00
 * 2.0 km -> R$ 10,00
 * 2.4 km -> R$ 13,00
 * 3.7 km -> R$ 15,00
 * 5.2 km -> R$ 19,00
 * 7.8 km -> R$ 23,00
 * 8.9 km -> R$ 25,00
 * > 9.0 km -> Fora da área padrão de entrega
 */
export function calculateDeliveryFeeFromDistance(distanceKm: number): DeliveryFeeCalculation {
  if (distanceKm <= 0) {
    return { distanceKm: 0, fee: 7.0, isOutOfRange: false };
  }

  // Exact rounded distance to 1 decimal place (e.g. 1.1 km, 2.4 km)
  const roundedDistance = Math.round(distanceKm * 10) / 10;

  if (roundedDistance <= 1.0) {
    return { distanceKm: roundedDistance, fee: 7.0, isOutOfRange: false };
  }
  if (roundedDistance <= 2.0) {
    return { distanceKm: roundedDistance, fee: 10.0, isOutOfRange: false };
  }
  if (roundedDistance <= 3.0) {
    return { distanceKm: roundedDistance, fee: 13.0, isOutOfRange: false };
  }
  if (roundedDistance <= 4.0) {
    return { distanceKm: roundedDistance, fee: 15.0, isOutOfRange: false };
  }
  if (roundedDistance <= 5.0) {
    return { distanceKm: roundedDistance, fee: 17.0, isOutOfRange: false };
  }
  if (roundedDistance <= 6.0) {
    return { distanceKm: roundedDistance, fee: 19.0, isOutOfRange: false };
  }
  if (roundedDistance <= 7.0) {
    return { distanceKm: roundedDistance, fee: 21.0, isOutOfRange: false };
  }
  if (roundedDistance <= 8.0) {
    return { distanceKm: roundedDistance, fee: 23.0, isOutOfRange: false };
  }
  if (roundedDistance <= 9.0) {
    return { distanceKm: roundedDistance, fee: 25.0, isOutOfRange: false };
  }

  return {
    distanceKm: roundedDistance,
    fee: 0,
    isOutOfRange: true,
    message:
      'Esse endereço está fora da nossa área padrão de entrega. Consulte a pizzaria para verificar a disponibilidade da entrega.',
  };
}

/**
 * Executes a route request to Google Maps Routes API v2
 */
async function queryRoutesApi(originStr: string, destStr: string): Promise<RouteDistanceResult | null> {
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.description',
    },
    body: JSON.stringify({
      origin: { address: originStr },
      destination: { address: destStr },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Google Routes API returned error status:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const distanceMeters = route.distanceMeters ?? 0;
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    return {
      success: true,
      distanceKm,
      distanceMeters,
      durationText: route.duration,
      routeSummary: route.description,
    };
  }

  return null;
}

/**
 * Calculates the exact real driving route distance between the pizzeria's registered address
 * and the customer's full address using Google Maps Routes API (Directions v2).
 *
 * Adheres strictly to the user constraints:
 * - Origin: exactly the registered pizzeria location
 * - Destination: full address (Street, Number, Neighborhood, City, State, CEP)
 * - Calculation: real street route returned by the API (no linear distances, no centroid estimations)
 */
export async function calculateRouteDistance(
  originInput: PizzeriaOriginAddress | string,
  destinationInput: CustomerDestinationAddress | string
): Promise<RouteDistanceResult> {
  const originStr = formatPizzeriaOriginAddress(originInput);

  // 1. Try with full destination including CEP
  const destWithCep =
    typeof destinationInput === 'string'
      ? destinationInput
      : formatCustomerDestinationAddress(destinationInput, true);

  try {
    const primaryResult = await queryRoutesApi(originStr, destWithCep);
    if (primaryResult && primaryResult.success) {
      return primaryResult;
    }
  } catch (err) {
    console.warn('Erro ao consultar rota principal:', err);
  }

  // 2. If destination with CEP failed, try without CEP to avoid geocoding boundary mismatch
  if (typeof destinationInput !== 'string') {
    try {
      const destWithoutCep = formatCustomerDestinationAddress(destinationInput, false);
      const secondaryResult = await queryRoutesApi(originStr, destWithoutCep);
      if (secondaryResult && secondaryResult.success) {
        return secondaryResult;
      }
    } catch (err) {
      console.warn('Erro ao consultar rota secundária:', err);
    }

    // 3. Try with Street, Number, City, State (without neighborhood if unusual neighborhood name)
    try {
      const simplifiedDest = `${destinationInput.street.trim()}, ${destinationInput.number.trim()}, ${destinationInput.city?.trim() || 'São Paulo'} - ${destinationInput.state?.trim() || 'SP'}, Brasil`;
      const tertiaryResult = await queryRoutesApi(originStr, simplifiedDest);
      if (tertiaryResult && tertiaryResult.success) {
        return tertiaryResult;
      }
    } catch (err) {
      console.warn('Erro ao consultar rota simplificada:', err);
    }
  }

  return {
    success: false,
    error:
      'Não foi possível calcular a rota com precisão para o endereço informado. Confira se a rua, número, bairro e cidade estão corretos ou consulte a pizzaria.',
  };
}
