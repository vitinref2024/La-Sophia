import { CartItem, OrderCustomer, PizzeriaInfo } from '../types';
import { formatBRL } from '../data/menuData';

/**
 * Generate a clean sequential order number (e.g. 1021, 1022, 1023...)
 */
export function getNextOrderNumber(): string {
  try {
    const key = 'la_sophia_order_seq';
    const current = parseInt(localStorage.getItem(key) || '1020', 10);
    const next = current >= 9999 ? 1001 : current + 1;
    localStorage.setItem(key, String(next));
    return String(next);
  } catch {
    return String(Math.floor(1000 + Math.random() * 9000));
  }
}

/**
 * Generate a professional kitchen ticket (comanda) for WhatsApp
 * Strict rules:
 * - Order: CLIENTE -> PEDIDO -> VALORES -> ENTREGA -> PAGAMENTO -> OBSERVAÇÕES
 * - Zero emojis
 * - Products in exact order
 * - Under each pizza: Tamanho, Borda (only if selected), Extras (only if selected)
 * - Half-and-half format: [QUANTIDADE]x Pizza 1/2 [SABOR 1] + 1/2 [SABOR 2] — R$ [VALOR]
 * - Prominent TOTAL
 * - No unnecessary promotional text
 */
export function generateWhatsAppMessage(
  customer: OrderCustomer,
  items: CartItem[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  pizzeria: PizzeriaInfo,
  orderNumber?: string
): string {
  const orderNum = orderNumber || getNextOrderNumber();
  const separator = '━━━━━━━━━━━━━━━━━━';

  const sections: string[] = [];

  // 1. CABEÇALHO COM NÚMERO DO PEDIDO
  sections.push(`NOVO PEDIDO #${orderNum}\n${separator}`);

  // 2. CLIENTE
  sections.push(`CLIENTE\nNome: ${customer.name}\nWhatsApp: ${customer.phone}`);

  // 3. PEDIDO
  const itemsFormatted = items.map((item) => {
    const itemTotalFormatted = formatBRL(item.unitPrice * item.quantity);
    const isPizza = Boolean(
      item.product.isPizza ||
      item.product.isSweetPizza ||
      item.size ||
      item.isHalfHalf ||
      (item.flavors && item.flavors.length > 0)
    );

    // Extract all flavors chosen for the pizza
    const flavors = item.flavors && item.flavors.length > 0
      ? item.flavors
      : (item.isHalfHalf && item.secondFlavor ? [item.product, item.secondFlavor] : [item.product]);

    let mainLine = '';
    const sizeTitle = item.size === 'broto' ? 'Broto (4 fatias)' : '8 Fatias';

    if (isPizza) {
      if (flavors.length >= 3) {
        mainLine = `${item.quantity}x Pizza ${sizeTitle} — ${flavors.length} sabores — ${itemTotalFormatted}`;
      } else if (flavors.length === 2) {
        mainLine = `${item.quantity}x Pizza ${sizeTitle} — 2 sabores — ${itemTotalFormatted}`;
      } else {
        mainLine = `${item.quantity}x Pizza ${item.product.name} — ${itemTotalFormatted}`;
      }
    } else {
      mainLine = `${item.quantity}x ${item.product.name} — ${itemTotalFormatted}`;
    }

    const details: string[] = [];

    // Personalizações de pizza
    if (isPizza) {
      // Se houver mais de 1 sabor, lista todos os sabores escolhidos obrigatoriamente
      if (flavors.length > 1) {
        details.push(`• Sabores:`);
        flavors.forEach((f) => {
          details.push(`  * ${f.name}`);
        });
      }

      // Tamanho
      const sizeLabel = item.size === 'broto' ? 'Broto (4 fatias)' : 'Pizza Grande (8 fatias)';
      details.push(`• Tamanho: ${sizeLabel}`);

      // Borda (apenas se selecionada e com valor / diferente de tradicional)
      if (item.crust && item.crust.id !== 'tradicional' && item.crust.price > 0) {
        details.push(`• Borda: ${item.crust.name} (+${formatBRL(item.crust.price)})`);
      }

      // Extras (apenas se houver adicionais)
      if (item.extraToppings && item.extraToppings.length > 0) {
        const extrasStr = item.extraToppings
          .map((e) => `${e.name} (+${formatBRL(e.price)})`)
          .join(', ');
        details.push(`• Extras: ${extrasStr}`);
      } else if (item.extraTopping) {
        details.push(`• Extras: ${item.extraTopping.name} (+${formatBRL(item.extraTopping.price)})`);
      }
    }

    // Observações do item (se houver)
    if (item.notes && item.notes.trim()) {
      details.push(`• Obs: ${item.notes.trim()}`);
    }

    if (details.length > 0) {
      return `${mainLine}\n${details.join('\n')}`;
    }

    return mainLine;
  });

  sections.push(`PEDIDO\n\n${itemsFormatted.join('\n\n')}`);

  // 4. VALORES
  const feeLabel = deliveryFee > 0
    ? (customer.deliveryDistanceKm ? `${formatBRL(deliveryFee)} (Distância: ${customer.deliveryDistanceKm} km)` : formatBRL(deliveryFee))
    : (customer.deliveryType === 'retirada' ? 'R$ 0,00 (Retirada no Balcão)' : 'R$ 0,00');

  const valuesLines: string[] = [
    separator,
    `SUBTOTAL: ${formatBRL(subtotal)}`,
    `TAXA DE ENTREGA: ${feeLabel}`,
    '',
    `TOTAL DO PEDIDO: ${formatBRL(total)}`,
    separator,
  ];
  sections.push(valuesLines.join('\n'));

  // 5. ENTREGA
  if (customer.deliveryType === 'entrega') {
    const deliveryLines = [
      'ENTREGA',
      '',
      `Endereço: ${customer.street}, ${customer.number}`,
    ];
    if (customer.complement && customer.complement.trim()) {
      deliveryLines.push(`Complemento: ${customer.complement.trim()}`);
    }
    deliveryLines.push(`Bairro: ${customer.neighborhood}`);
    if (customer.city || customer.state) {
      deliveryLines.push(`Cidade: ${customer.city || 'São Paulo'}/${customer.state || 'SP'}`);
    }
    if (customer.cep && customer.cep.trim()) {
      deliveryLines.push(`CEP: ${customer.cep.trim()}`);
    }
    if (customer.deliveryDistanceKm !== undefined && customer.deliveryDistanceKm > 0) {
      deliveryLines.push(`Distância: ${customer.deliveryDistanceKm} km`);
      deliveryLines.push(`Taxa de entrega: ${formatBRL(deliveryFee)}`);
    }
    if (customer.reference && customer.reference.trim()) {
      deliveryLines.push(`Referência: ${customer.reference.trim()}`);
    }
    sections.push(deliveryLines.join('\n'));
  } else {
    sections.push(`ENTREGA\n\nTipo: Retirada no Balcão da Pizzaria\nEndereço: ${pizzeria.address}`);
  }

  // 6. PAGAMENTO
  let paymentMethodLabel = '';
  let paymentStatus = '';

  switch (customer.paymentMethod) {
    case 'pix':
      paymentMethodLabel = 'Pix (Chave CNPJ: 66708233000151)';
      if (customer.pixReceipt && customer.pixReceipt.fileName) {
        paymentStatus = `Pago via Pix\nComprovante: ${customer.pixReceipt.fileName} (Anexado pelo cliente — segue nesta conversa do WhatsApp)`;
      } else {
        paymentStatus = 'Aguardando envio do comprovante de pagamento';
      }
      break;
    case 'cartao':
      paymentMethodLabel = 'Cartão';
      paymentStatus = customer.deliveryType === 'entrega'
        ? 'Pagar na entrega (Levar maquininha de cartão)'
        : 'Pagar na retirada (Maquininha de cartão)';
      break;
    case 'vale_refeicao':
      paymentMethodLabel = 'Vale-Refeição';
      paymentStatus = customer.deliveryType === 'entrega'
        ? 'Pagar na entrega (Levar maquininha de Vale-Refeição)'
        : 'Pagar na retirada (Maquininha de Vale-Refeição)';
      break;
    case 'cartao_credito':
      paymentMethodLabel = 'Cartão de Crédito';
      paymentStatus = customer.deliveryType === 'entrega'
        ? 'Pagar na entrega (Levar maquininha)'
        : 'Pagar na retirada';
      break;
    case 'cartao_debito':
      paymentMethodLabel = 'Cartão de Débito';
      paymentStatus = customer.deliveryType === 'entrega'
        ? 'Pagar na entrega (Levar maquininha)'
        : 'Pagar na retirada';
      break;
    case 'dinheiro':
      paymentMethodLabel = 'Dinheiro';
      if (customer.changeFor && customer.changeFor.trim()) {
        paymentStatus = customer.deliveryType === 'entrega'
          ? `Pagar na entrega (Troco para ${customer.changeFor.trim()})`
          : `Pagar na retirada (Troco para ${customer.changeFor.trim()})`;
      } else {
        paymentStatus = customer.deliveryType === 'entrega'
          ? 'Pagar na entrega (Sem troco)'
          : 'Pagar na retirada (Sem troco)';
      }
      break;
  }

  sections.push(`PAGAMENTO\n\nForma: ${paymentMethodLabel}\nStatus: ${paymentStatus}`);

  // 7. OBSERVAÇÕES (Apenas se houver observações)
  if (customer.orderNotes && customer.orderNotes.trim()) {
    sections.push(`OBSERVAÇÕES\n\n${customer.orderNotes.trim()}`);
  }

  // 8. RODAPÉ
  sections.push(`${separator}\nPEDIDO REALIZADO PELO SITE`);

  return sections.join('\n\n');
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
}
