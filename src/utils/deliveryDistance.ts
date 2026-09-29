/**
 * Utilitário Client-Side para Cálculo de Distância Rodoviária com Google Maps
 * 
 * Regras:
 * 1. Origem fixa e imutável na Pizzaria (Rua Nossa Senhora Aparecida, 214 - Vila Fátima, Guarulhos - SP, CEP 07191-190)
 * 2. Destino: Endereço completo informado pelo cliente (Rua, Número OBRIGATÓRIO, Bairro, Cidade, Estado, CEP)
 * 3. Número do imóvel OBRIGATÓRIO para precisão
 * 4. CEP tratado sempre como string, preservando zeros à esquerda
 * 5. Requisição segura via endpoint backend (/api/calculate-distance)
 * 6. Exibição padronizada com 2 casas decimais (ex: "Distância da pizzaria: 2,70 km")
 */

export interface CustomerAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

export interface RouteDistanceResult {
  success: boolean;
  distanceMeters?: number;
  distanceKm?: number;
  formattedKm?: string;
  formattedText?: string;
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

/**
 * Formata um valor numérico de KM no padrão brasileiro com 2 casas decimais (ex: 2.7 -> "2,70 km")
 */
export function formatDistanceKm(km: number): string {
  if (typeof km !== 'number' || isNaN(km)) return '';
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
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
 * Chama o endpoint seguro do backend para calcular a distância veicular real com Google Maps
 */
export async function calculateDrivingDistance(
  customer: CustomerAddress
): Promise<RouteDistanceResult> {
  const street = (customer.street || '').trim();
  const number = (customer.number || '').trim();
  const { cleanCep, formattedCep, isValid: isCepValid } = sanitizeCep(customer.cep);

  if (!street || street.length < 3) {
    return {
      success: false,
      error: 'Por favor, informe a rua ou logradouro completo.',
    };
  }

  if (!number) {
    return {
      success: false,
      error: 'O número do imóvel é obrigatório para calcular a distância exata.',
    };
  }

  if (!isCepValid) {
    return {
      success: false,
      error: 'Informe um CEP válido com 8 dígitos para calcular a distância.',
    };
  }

  try {
    const response = await fetch('/api/calculate-distance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        street,
        number,
        complement: customer.complement,
        neighborhood: customer.neighborhood,
        city: customer.city || 'Guarulhos',
        state: customer.state || 'SP',
        cep: formattedCep || cleanCep,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      return {
        success: false,
        error: errData?.error || 'Não foi possível localizar exatamente este endereço. Confira o CEP e o número.',
      };
    }

    const data = await response.json();

    if (!data.success || typeof data.distanceKm !== 'number') {
      return {
        success: false,
        error: data.error || 'Não foi possível localizar exatamente este endereço. Confira o CEP e o número.',
        inputAddress: data.inputAddress,
        foundAddress: data.foundAddress,
        formattedAddress: data.formattedAddress,
      };
    }

    const distanceKm = Number(data.distanceKm.toFixed(2));
    const formattedKm = formatDistanceKm(distanceKm);
    const displayText = data.displayText || `Distância da pizzaria: ${formattedKm}`;

    return {
      success: true,
      distanceMeters: data.distanceMeters,
      distanceKm,
      formattedKm,
      formattedText: displayText,
      displayText,
      formattedAddress: data.formattedAddress,
      foundAddress: data.foundAddress,
      viaRoad: data.viaRoad,
      origin: data.origin,
      destination: data.destination,
      inputAddress: data.inputAddress,
    };
  } catch (err) {
    console.error('Erro de requisição ao calcular distância:', err);
    return {
      success: false,
      error: 'Falha temporária ao conectar com o serviço do Google Maps. Tente novamente.',
    };
  }
}
