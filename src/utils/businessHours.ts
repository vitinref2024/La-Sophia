export interface PizzeriaStatus {
  isOpen: boolean;
  statusText: string;      // 'Aberta agora' | 'Fechada no momento'
  badgeLabel: string;      // 'Aberta' | 'Fechada'
  details: string;         // 'Recebendo pedidos até 00:00' | 'Abre hoje às 18:00' | 'Abre terça às 18:00'
  closeTime: string;       // '00:00' | '23:30'
  scheduleSummary: string; // 'Ter a Qui e Dom: 18h às 23h30 | Sex e Sáb: 18h às 00h'
}

/**
 * Returns the current operational status of the pizzeria based on Brasília / São Paulo time.
 * Standard hours:
 * - Terça, Quarta, Quinta e Domingo: 18:00 às 23:30
 * - Sexta e Sábado: 18:00 às 00:00
 * - Segunda-feira: Fechado
 */
export function getPizzeriaStatus(referenceDate: Date = new Date()): PizzeriaStatus {
  const scheduleSummary = 'Ter a Qui e Dom: 18h00 às 23h30 | Sex e Sáb: 18h00 às 00h00';

  try {
    // Parse parts from Intl.DateTimeFormat in America/Sao_Paulo
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'narrow',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(referenceDate);
    let hour = referenceDate.getHours();
    let minute = referenceDate.getMinutes();

    for (const part of parts) {
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }

    // Use full weekday in pt-BR
    const dayOfWeek = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
    }).format(referenceDate).toLowerCase();

    const isMonday = dayOfWeek.startsWith('segunda');
    const isSunday = dayOfWeek.startsWith('domingo');
    const isFriday = dayOfWeek.startsWith('sexta');
    const isSaturday = dayOfWeek.startsWith('sábado') || dayOfWeek.startsWith('sabado');
    const isLateNight = isFriday || isSaturday; // Sexta e Sábado vão até 00:00

    const currentTimeInMinutes = hour * 60 + minute;
    const openTimeInMinutes = 18 * 60; // 18:00
    const closeTimeInMinutes = isLateNight ? 24 * 60 : 23 * 60 + 30; // 00:00 vs 23:30
    const closeTimeStr = isLateNight ? '00:00' : '23:30';

    // Segunda-feira: Fechado o dia todo
    if (isMonday) {
      return {
        isOpen: false,
        statusText: 'Fechada no momento',
        badgeLabel: 'Fechada',
        details: 'Abre terça-feira às 18:00',
        closeTime: '23:30',
        scheduleSummary,
      };
    }

    // Dentro do horário de funcionamento
    if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
      return {
        isOpen: true,
        statusText: 'Aberta agora',
        badgeLabel: 'Aberta',
        details: `Recebendo pedidos até ${closeTimeStr}`,
        closeTime: closeTimeStr,
        scheduleSummary,
      };
    }

    // Antes do horário de abertura (00:00 até 17:59)
    if (currentTimeInMinutes < openTimeInMinutes) {
      return {
        isOpen: false,
        statusText: 'Fechada no momento',
        badgeLabel: 'Fechada',
        details: 'Abre hoje às 18:00',
        closeTime: closeTimeStr,
        scheduleSummary,
      };
    }

    // Após o horário de fechamento
    // Se hoje é domingo à noite, amanhã é segunda (fechado), então reabre terça
    const nextOpen = isSunday ? 'Abre terça-feira às 18:00' : 'Abre amanhã às 18:00';

    return {
      isOpen: false,
      statusText: 'Fechada no momento',
      badgeLabel: 'Fechada',
      details: nextOpen,
      closeTime: closeTimeStr,
      scheduleSummary,
    };
  } catch {
    // Fallback in case Intl fails
    return {
      isOpen: true,
      statusText: 'Aberta agora',
      badgeLabel: 'Aberta',
      details: 'Horário: 18:00 às 23:30 (Sex e Sáb até 00:00)',
      closeTime: '23:30',
      scheduleSummary,
    };
  }
}
