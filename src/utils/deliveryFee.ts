/**
 * TABELA OFICIAL DE TAXA DE ENTREGA POR QUILOMETRAGEM (GOOGLE MAPS)
 * 
 * Regra:
 * A distância em KM já calculada pelo Google Maps é utilizada para determinar a taxa de entrega.
 * 
 * Tabela Oficial:
 * - Até 1 km: R$ 7,00
 * - Até 2 km: R$ 10,00
 * - Até 3 km: R$ 13,00
 * - Até 4 km: R$ 15,00
 * - Até 5 km: R$ 17,00 (Corrigido conforme especificação)
 * - Até 6 km: R$ 19,00
 * - Até 7 km: R$ 21,00
 * - Até 8 km: R$ 23,00
 * - Até 9 km: R$ 25,00
 * 
 * Arredondamento:
 * Taxa = faixa imediatamente correspondente à distância calculada (próximo limite inteiro).
 * Valores inteiros exatos (ex: 1,00 km, 2,00 km) não avançam de faixa.
 * 
 * Limite de 9 km:
 * Se a distância for superior a 9,00 km, não inventar taxa:
 * Exibir: "Consulte a taxa de entrega"
 */

export interface DeliveryFeeTier {
  maxKm: number;
  fee: number;
}

export const DELIVERY_FEE_TIERS: DeliveryFeeTier[] = [
  { maxKm: 1, fee: 7.0 },
  { maxKm: 2, fee: 10.0 },
  { maxKm: 3, fee: 13.0 },
  { maxKm: 4, fee: 15.0 },
  { maxKm: 5, fee: 17.0 },
  { maxKm: 6, fee: 19.0 },
  { maxKm: 7, fee: 21.0 },
  { maxKm: 8, fee: 23.0 },
  { maxKm: 9, fee: 25.0 },
];

export const MAX_SUPPORTED_KM = 9.0;

export interface DeliveryFeeResult {
  distanceKm: number;
  formattedDistanceKm: string;
  bracketKm: number | null;
  fee: number | null; // number if <= 9.00 km, null if > 9.00 km
  formattedFee: string; // "R$ 17,00" ou "Consulte a taxa de entrega"
  isAboveLimit: boolean;
  statusText: string;
}

/**
 * Calcula a taxa de entrega oficial com base na quilometragem real do Google Maps.
 */
export function calculateDeliveryFee(distanceKm: number): DeliveryFeeResult {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
    return {
      distanceKm: 0,
      formattedDistanceKm: '0,00 km',
      bracketKm: null,
      fee: null,
      formattedFee: 'Consulte a taxa de entrega',
      isAboveLimit: false,
      statusText: 'Distância não disponível',
    };
  }

  // Normaliza com 2 casas decimais para evitar desvios de precisão de ponto flutuante
  const normalizedKm = Math.round(distanceKm * 100) / 100;
  const formattedDistanceKm = `${normalizedKm.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;

  const maxSupportedTierKm = DELIVERY_FEE_TIERS[DELIVERY_FEE_TIERS.length - 1]?.maxKm ?? 9.0;

  // Superior a 9 km: não inventar uma taxa
  if (normalizedKm > maxSupportedTierKm) {
    return {
      distanceKm: normalizedKm,
      formattedDistanceKm,
      bracketKm: null,
      fee: null,
      formattedFee: 'Consulte a taxa de entrega',
      isAboveLimit: true,
      statusText: 'Consulte a taxa de entrega',
    };
  }

  // Faixa inteira: 0 ou até 1.00 -> 1; 1.01 a 2.00 -> 2; etc.
  const bracketKm = normalizedKm <= 0 ? 1 : Math.ceil(normalizedKm);
  const tier = DELIVERY_FEE_TIERS.find((t) => bracketKm <= t.maxKm);

  if (!tier) {
    return {
      distanceKm: normalizedKm,
      formattedDistanceKm,
      bracketKm: null,
      fee: null,
      formattedFee: 'Consulte a taxa de entrega',
      isAboveLimit: true,
      statusText: 'Consulte a taxa de entrega',
    };
  }

  const formattedFee = `R$ ${tier.fee.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return {
    distanceKm: normalizedKm,
    formattedDistanceKm,
    bracketKm: tier.maxKm,
    fee: tier.fee,
    formattedFee,
    isAboveLimit: false,
    statusText: `Até ${tier.maxKm} km: ${formattedFee}`,
  };
}
