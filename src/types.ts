export type PizzaSize = 'broto' | 'pizza';

export interface SizeOption {
  id: PizzaSize;
  name: string;
  slices: number;
  description: string;
}

export interface CrustOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface ExtraToppingOption {
  id: string;
  name: string;
  price: number;
}

export type ProductCategory =
  | 'pizzas'
  | 'pizzas-especiais'
  | 'pizzas-doces'
  | 'esfihas'
  | 'esfihas-doces'
  | 'bebidas'
  | 'cervejas'
  | 'bordas'
  | 'cobertura-extra';

export interface Product {
  id: string;
  code?: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number; // Single price or base price
  pricesBySize?: {
    broto?: number;
    pizza?: number;
  };
  image: string;
  isPizza?: boolean;
  isSweetPizza?: boolean;
  isEsfiha?: boolean;
  tag?: string;
  ingredients?: string[];
  popular?: boolean;
  uninformedPrice?: boolean;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  size?: PizzaSize;
  isHalfHalf?: boolean;
  secondFlavor?: Product;
  flavors?: Product[]; // Array of chosen flavors (1, 2, or 3 flavors for 8-slice pizza)
  crust?: CrustOption;
  extraTopping?: ExtraToppingOption;
  extraToppings?: ExtraToppingOption[];
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type DeliveryType = 'entrega' | 'retirada';
export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'cartao'
  | 'vale_refeicao'
  | 'cartao_credito'
  | 'cartao_debito';

export interface PixReceiptData {
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  cep?: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city?: string;
  state?: string;
  reference: string;
  paymentMethod: PaymentMethod;
  pixReceipt?: PixReceiptData | null;
  deliveryDistanceKm?: number;
  deliveryFee?: number | null;
  deliveryFeeText?: string;
  changeFor: string;
  orderNotes: string;
}

export interface PizzeriaInfo {
  name: string;
  tagline: string;
  subtitle: string;
  whatsappNumber: string; // e.g., "5511998765432"
  displayPhone: string;  // e.g., "(11) 99876-5432"
  address: string;
  neighborhood?: string;
  city: string;
  state?: string;
  cep?: string;
  openingHours: string;
  heroImage: string;
  logoImage?: string;
  deliveryFee: number;
  pixKey: string;
}

export interface RecentOrder {
  id: string;
  orderNumber?: string;
  createdAt: string; // ISO string
  formattedDate: string; // e.g. "23/09/2026 às 19:45"
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryDistanceKm?: number;
  total: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  customerName?: string;
}
