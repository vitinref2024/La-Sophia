import { calculateDrivingDistanceWithGoogle } from '../src/server/googleMapsService.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await calculateDrivingDistanceWithGoogle(body || {});
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro ao processar /api/calculate-distance:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao calcular a distância com o Google Maps.',
    });
  }
}
