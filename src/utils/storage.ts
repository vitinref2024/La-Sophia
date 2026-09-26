import { CartItem, DeliveryType, PaymentMethod, RecentOrder } from '../types';

const FAVORITES_STORAGE_KEY = 'la_sophia_favorites_v1';
const RECENT_ORDERS_STORAGE_KEY = 'la_sophia_recent_orders_v1';

/**
 * Load list of favorite product IDs
 */
export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Erro ao carregar favoritos:', err);
    return [];
  }
}

/**
 * Save list of favorite product IDs
 */
export function saveFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Erro ao salvar favoritos:', err);
  }
}

/**
 * Toggle favorite product ID and return updated list
 */
export function toggleFavoriteId(productId: string): { updatedList: string[]; isFavorited: boolean } {
  const current = getFavoriteIds();
  const exists = current.includes(productId);
  const updatedList = exists ? current.filter((id) => id !== productId) : [...current, productId];
  saveFavoriteIds(updatedList);
  return { updatedList, isFavorited: !exists };
}

/**
 * Load list of recent orders (sorted newest first)
 */
export function getRecentOrders(): RecentOrder[] {
  try {
    const raw = localStorage.getItem(RECENT_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('Erro ao carregar últimos pedidos:', err);
    return [];
  }
}

/**
 * Save a finalized order to recent orders
 */
export function saveRecentOrder(orderData: {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryDistanceKm?: number;
  total: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  customerName?: string;
  orderNumber?: string;
}): RecentOrder {
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const newOrder: RecentOrder = {
    id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    orderNumber: orderData.orderNumber,
    createdAt: now.toISOString(),
    formattedDate,
    items: orderData.items,
    subtotal: orderData.subtotal,
    deliveryFee: orderData.deliveryFee,
    deliveryDistanceKm: orderData.deliveryDistanceKm,
    total: orderData.total,
    deliveryType: orderData.deliveryType,
    paymentMethod: orderData.paymentMethod,
    customerName: orderData.customerName,
  };

  try {
    const existing = getRecentOrders();
    // Keep max 20 recent orders
    const updated = [newOrder, ...existing.filter((o) => o.id !== newOrder.id)].slice(0, 20);
    localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar último pedido:', err);
  }

  return newOrder;
}

/**
 * Clear recent orders
 */
export function clearRecentOrders(): void {
  try {
    localStorage.removeItem(RECENT_ORDERS_STORAGE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar histórico:', err);
  }
}
