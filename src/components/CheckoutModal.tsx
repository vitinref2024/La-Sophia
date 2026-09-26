import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  CheckCircle,
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  Banknote,
  QrCode,
  Send,
  Copy,
  Check,
  AlertCircle,
  Upload,
  Paperclip,
  FileCheck,
  Search,
  Loader2,
  UtensilsCrossed,
  MapPin,
  Bike,
  RefreshCw,
  Sparkles,
  Plus
} from 'lucide-react';
import { CartItem, OrderCustomer, PaymentMethod, PizzeriaInfo, Product } from '../types';
import { formatBRL, OFFICIAL_PIX_KEY } from '../data/menuData';
import { generateWhatsAppMessage, openWhatsApp, getNextOrderNumber } from '../utils/whatsapp';
import { saveRecentOrder } from '../utils/storage';
import { calculateRouteDistance, calculateDeliveryFeeFromDistance } from '../utils/deliveryFee';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  pizzeria: PizzeriaInfo;
  onOrderCompleted: () => void;
  allProducts?: Product[];
  onAddComplement?: (product: Product) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DistanceState {
  isCalculating: boolean;
  distanceKm?: number;
  fee?: number;
  isOutOfRange: boolean;
  error?: string;
  hasCalculated: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  pizzeria,
  onOrderCompleted,
  allProducts = [],
  onAddComplement,
}) => {
  if (!isOpen) return null;

  // State for Sweet Esfihas Upsell during Finalização
  const [addedEsfihaIds, setAddedEsfihaIds] = useState<string[]>([]);
  const [showAllSweets, setShowAllSweets] = useState(false);
  const addressSectionRef = useRef<HTMLDivElement>(null);

  // Upsell exclusivo de Esfihas Doces na etapa de finalização do pedido
  const sweetEsfihas = useMemo<Product[]>(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts.filter((p: Product) => p.category === 'esfihas-doces');
  }, [allProducts]);

  // Não repetir produtos: se o cliente já tiver a esfiha doce no carrinho (e não foi adicionada aqui nesta sessão), não exibe novamente
  const availableSweetEsfihas = useMemo<Product[]>(() => {
    return sweetEsfihas.filter((p: Product) => {
      const isInCart = items.some((it) => it.product.id === p.id);
      const wasAddedHere = addedEsfihaIds.includes(p.id);
      if (isInCart && !wasAddedHere) return false;
      return true;
    });
  }, [sweetEsfihas, items, addedEsfihaIds]);

  const handleAddSweetEsfiha = (product: Product) => {
    if (addedEsfihaIds.includes(product.id)) return;
    if (onAddComplement) {
      onAddComplement(product);
      setAddedEsfihaIds((prev) => [...prev, product.id]);
    }
  };

  // Form State
  const [customer, setCustomer] = useState<OrderCustomer>({
    name: '',
    phone: '',
    deliveryType: 'entrega',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    reference: '',
    paymentMethod: 'pix',
    changeFor: '',
    orderNotes: '',
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CEP Lookup & Reverse Geocode State
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isCalculatingCep, setIsCalculatingCep] = useState(false);
  const [cepNotice, setCepNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Distance & Delivery Fee State
  const [distanceState, setDistanceState] = useState<DistanceState>({
    isCalculating: false,
    isOutOfRange: false,
    hasCalculated: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Phone masking
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    // Format (XX) XXXXX-XXXX
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setCustomer((prev) => ({ ...prev, phone: val }));
  };

  // OPÇÃO 1 — INFORMAR CEP MANUALMENTE (máscara e busca automática)
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);

    let masked = raw;
    if (raw.length > 5) {
      masked = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }

    setCustomer((prev) => ({ ...prev, cep: masked }));
    setCepNotice(null);

    // Quando digitar os 8 dígitos válidos, busca automaticamente
    if (raw.length === 8) {
      lookupAddressByCep(raw);
    }
  };

  const lookupAddressByCep = async (cleanCep: string) => {
    setIsCepLoading(true);
    setCepNotice(null);

    try {
      let res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      let data = await res.json();

      if (data.erro) {
        try {
          const res2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
          if (res2.ok) {
            data = await res2.json();
          }
        } catch {
          // ignore
        }
      }

      if (data && !data.erro && (data.logradouro || data.street || data.bairro || data.neighborhood)) {
        setCustomer((prev) => ({
          ...prev,
          street: data.logradouro || data.street || prev.street,
          neighborhood: data.bairro || data.neighborhood || prev.neighborhood,
          city: data.localidade || data.city || prev.city || 'São Paulo',
          state: data.uf || data.state || prev.state || 'SP',
        }));
        setCepNotice({
          text: `Endereço localizado: ${data.logradouro || data.street || ''} (${data.bairro || data.neighborhood || ''})`,
          type: 'success',
        });
      } else {
        setCepNotice({
          text: 'CEP não encontrado. Confira o número digitado ou preencha o endereço manualmente.',
          type: 'error',
        });
      }
    } catch {
      setCepNotice({
        text: 'Não foi possível consultar o CEP no momento. Preencha os campos manualmente.',
        type: 'info',
      });
    } finally {
      setIsCepLoading(false);
    }
  };

  // OPÇÃO 2 — CALCULAR CEP AUTOMATICAMENTE
  const handleCalculateCep = async () => {
    const rawStreet = (customer.street || '').trim();
    if (rawStreet.length < 3) {
      setCepNotice({
        text: 'Informe a Rua / Endereço para calcular o CEP automaticamente.',
        type: 'error',
      });
      return;
    }

    const city = (customer.city || 'São Paulo').trim();
    const uf = (customer.state || 'SP').trim().toUpperCase();

    if (city.length < 3 || uf.length !== 2) {
      setCepNotice({
        text: 'Informe a Cidade e UF corretamente para calcular o CEP.',
        type: 'error',
      });
      return;
    }

    setIsCalculatingCep(true);
    setCepNotice(null);

    try {
      const cleanStreetQuery = rawStreet.replace(/\d+/g, '').replace(/,/g, '').trim();
      const searchTerms = [cleanStreetQuery];
      const withoutPrefix = cleanStreetQuery
        .replace(/^(rua|avenida|av\.|alameda|travessa|praça|rodovia)\s+/i, '')
        .trim();
      if (withoutPrefix && withoutPrefix !== cleanStreetQuery && withoutPrefix.length >= 3) {
        searchTerms.push(withoutPrefix);
      }

      let foundCep: string | null = null;
      let matchedRecord: any = null;

      for (const term of searchTerms) {
        if (term.length < 3) continue;
        try {
          const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(
            city
          )}/${encodeURIComponent(term)}/json/`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const userBairro = (customer.neighborhood || '').toLowerCase().trim();
              if (userBairro) {
                const match = data.find(
                  (r: any) =>
                    r.bairro &&
                    (r.bairro.toLowerCase().includes(userBairro) ||
                      userBairro.includes(r.bairro.toLowerCase()))
                );
                if (match) {
                  matchedRecord = match;
                  foundCep = match.cep;
                  break;
                }
              }
              matchedRecord = data[0];
              foundCep = data[0].cep;
              break;
            }
          }
        } catch {
          // tentar próximo termo
        }
      }

      if (foundCep && matchedRecord) {
        setCustomer((prev) => ({
          ...prev,
          cep: foundCep!,
          neighborhood: prev.neighborhood || matchedRecord.bairro || '',
          city: prev.city || matchedRecord.localidade || city,
          state: prev.state || matchedRecord.uf || uf,
        }));
        setCepNotice({
          text: `CEP identificado com sucesso: ${foundCep} (${matchedRecord.bairro || ''})`,
          type: 'success',
        });
      } else {
        setCepNotice({
          text: 'Não foi possível identificar o CEP automaticamente. Confira o endereço ou informe o CEP manualmente.',
          type: 'error',
        });
      }
    } catch {
      setCepNotice({
        text: 'Não foi possível identificar o CEP automaticamente. Confira o endereço ou informe o CEP manualmente.',
        type: 'error',
      });
    } finally {
      setIsCalculatingCep(false);
    }
  };

  // 4, 6, 8, 9 — CÁLCULO AUTOMÁTICO DA DISTÂNCIA E TAXA EM TEMPO REAL
  // Recalcula automaticamente sempre que o cliente alterar CEP, Rua, Número, Bairro ou Cidade
  const recalculateDistance = useCallback(async () => {
    if (customer.deliveryType !== 'entrega') {
      setDistanceState({
        isCalculating: false,
        isOutOfRange: false,
        hasCalculated: false,
      });
      return;
    }

    const street = customer.street.trim();
    const number = customer.number.trim();
    const city = customer.city?.trim() || 'São Paulo';
    const state = customer.state?.trim() || 'SP';
    const neighborhood = customer.neighborhood.trim();
    const cep = customer.cep?.trim() || '';

    // Precisa de pelo menos rua e número para traçar rota precisa
    if (street.length < 3 || number.length < 1) {
      setDistanceState({
        isCalculating: false,
        isOutOfRange: false,
        hasCalculated: false,
        distanceKm: undefined,
        fee: undefined,
        error: undefined,
      });
      return;
    }

    setDistanceState((prev) => ({
      ...prev,
      isCalculating: true,
      error: undefined,
    }));

    const result = await calculateRouteDistance(pizzeria, {
      street,
      number,
      complement: customer.complement,
      neighborhood,
      city,
      state,
      cep,
    });

    if (result.success && result.distanceKm !== undefined) {
      const calc = calculateDeliveryFeeFromDistance(result.distanceKm);
      setDistanceState({
        isCalculating: false,
        distanceKm: calc.distanceKm,
        fee: calc.fee,
        isOutOfRange: calc.isOutOfRange,
        hasCalculated: true,
        error: calc.isOutOfRange ? calc.message : undefined,
      });
    } else {
      setDistanceState({
        isCalculating: false,
        isOutOfRange: false,
        hasCalculated: true,
        distanceKm: undefined,
        fee: undefined,
        error:
          result.error ||
          'Não foi possível localizar o endereço ou calcular a rota. Verifique se o CEP, rua, número e cidade estão corretos ou consulte a pizzaria.',
      });
    }
  }, [
    customer.deliveryType,
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.cep,
    pizzeria,
  ]);

  // Debounced effect para cálculo em tempo real sem sobrecarregar chamadas
  useEffect(() => {
    if (customer.deliveryType !== 'entrega') return;

    const timer = setTimeout(() => {
      recalculateDistance();
    }, 650);

    return () => clearTimeout(timer);
  }, [
    customer.deliveryType,
    customer.street,
    customer.number,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.cep,
    recalculateDistance,
  ]);

  // Taxa de entrega calculada dinamicamente
  const deliveryFee =
    customer.deliveryType === 'entrega' ? (distanceState.fee !== undefined ? distanceState.fee : 0) : 0;
  const grandTotal = subtotal + deliveryFee;

  // Handle receipt upload
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.receipt;
        return next;
      });

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setReceiptPreview(url);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Copy Pix Key to clipboard
  const handleCopyPixKey = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(OFFICIAL_PIX_KEY);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = OFFICIAL_PIX_KEY;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setPixKeyCopied(true);
      setTimeout(() => setPixKeyCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar chave pix:', err);
    }
  };

  // Regras de Bloqueio & Finalização:
  const isPix = customer.paymentMethod === 'pix';
  const isPixMissingReceipt = isPix && !receiptFile;

  // Bloqueio de entrega:
  // Se entrega: precisa de endereço válido, taxa calculada, e NÃO pode estar fora da área (> 9 km)
  const isDeliveryCalculating = customer.deliveryType === 'entrega' && distanceState.isCalculating;
  const isDeliveryOutOfRange = customer.deliveryType === 'entrega' && distanceState.isOutOfRange;
  const isDeliveryIncomplete =
    customer.deliveryType === 'entrega' &&
    (!customer.street.trim() || !customer.number.trim() || !customer.neighborhood.trim() || !customer.cep?.trim());
  const isDeliveryFeeMissing =
    customer.deliveryType === 'entrega' && (!distanceState.hasCalculated || distanceState.fee === undefined);
  const isDeliveryHasError = customer.deliveryType === 'entrega' && Boolean(distanceState.error);

  const isSubmitDisabled =
    isPixMissingReceipt ||
    isDeliveryCalculating ||
    isDeliveryOutOfRange ||
    isDeliveryIncomplete ||
    isDeliveryFeeMissing ||
    isDeliveryHasError;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim()) {
      errs.name = 'Informe seu nome completo';
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Informe um telefone WhatsApp válido com DDD';
    }

    if (customer.deliveryType === 'entrega') {
      const cleanCep = (customer.cep || '').replace(/\D/g, '');
      if (!cleanCep || cleanCep.length !== 8) {
        errs.cep = 'Informe um CEP válido com 8 dígitos';
      }
      if (!customer.street.trim()) errs.street = 'Informe a rua / avenida';
      if (!customer.number.trim()) errs.number = 'Informe o número';
      if (!customer.neighborhood.trim()) errs.neighborhood = 'Informe o bairro';
      if (!customer.city?.trim()) errs.city = 'Informe a cidade';
      if (!customer.state?.trim()) errs.state = 'Informe o estado';

      if (distanceState.isOutOfRange) {
        errs.distance =
          'Esse endereço está fora da nossa área padrão de entrega. Consulte a pizzaria para verificar a disponibilidade da entrega.';
      } else if (distanceState.error) {
        errs.distance = distanceState.error;
      } else if (distanceState.fee === undefined) {
        errs.distance = 'Aguarde o cálculo automático da taxa de entrega.';
      }
    }

    if (customer.paymentMethod === 'pix' && !receiptFile) {
      errs.receipt = 'Envie o comprovante do Pix para continuar.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (customer.deliveryType === 'entrega' && (distanceState.isOutOfRange || distanceState.fee === undefined)) {
      return;
    }

    if (customer.paymentMethod === 'pix' && !receiptFile) {
      return;
    }

    const assignedOrderNumber = getNextOrderNumber();
    setOrderNumber(assignedOrderNumber);

    const updatedCustomer: OrderCustomer = {
      ...customer,
      deliveryDistanceKm: distanceState.distanceKm,
      pixReceipt: receiptFile
        ? {
            fileName: receiptFile.name,
            fileSize: receiptFile.size,
            fileType: receiptFile.type,
          }
        : null,
    };

    const message = generateWhatsAppMessage(
      updatedCustomer,
      items,
      subtotal,
      deliveryFee,
      grandTotal,
      pizzeria,
      assignedOrderNumber
    );

    setGeneratedMessage(message);
    setIsSuccess(true);

    try {
      saveRecentOrder({
        items,
        subtotal,
        deliveryFee,
        deliveryDistanceKm: distanceState.distanceKm,
        total: grandTotal,
        deliveryType: customer.deliveryType,
        paymentMethod: customer.paymentMethod,
        customerName: customer.name,
        orderNumber: assignedOrderNumber,
      });
    } catch (e) {
      console.warn('Erro ao salvar histórico de pedido:', e);
    }

    openWhatsApp(pizzeria.whatsappNumber, message);
    onOrderCompleted();
  };

  const copyMessageToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      {/* Modal Container: Branco-gelo #FBF9F6, borda #E8E0D5 */}
      <div className="relative w-full max-w-2xl max-w-[100vw] max-h-[96dvh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 pr-10 sm:pr-12 bg-white border-b border-[#E8E0D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#FBE4E1] text-[#E4171E] shrink-0">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1C1C1C]">
                Finalizar Pedido
              </h2>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B]">
                Preencha os dados abaixo para envio direto ao WhatsApp da {pizzeria.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isSuccess ? (
          <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
            {/* UPSELL EXCLUSIVO NA FINALIZAÇÃO: ESFIHAS DOCES */}
            {availableSweetEsfihas.length > 0 && onAddComplement && (
              <div className="bg-gradient-to-br from-[#FFF9F2] to-white border border-[#E8D0BD] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4D7] pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#E4171E] font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sobremesa</span>
                    </div>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-[#1C1C1C] mt-0.5">
                      Que tal uma sobremesa?
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">
                      Finalize seu pedido com uma de nossas esfihas doces.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addressSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="self-start sm:self-auto text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] hover:underline flex items-center gap-1 py-1 cursor-pointer transition-colors"
                  >
                    <span>Continuar para o endereço ↓</span>
                  </button>
                </div>

                {/* Cards das Esfihas Doces */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {(showAllSweets ? availableSweetEsfihas : availableSweetEsfihas.slice(0, 3)).map((prod: Product) => {
                    const isAdded = addedEsfihaIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="bg-white p-3 rounded-xl border border-[#E8E0D5] flex flex-col justify-between gap-3 shadow-2xs hover:border-[#D8CEBF] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F0EAE1] shrink-0 border border-[#E8E0D5]">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#1C1C1C] leading-snug line-clamp-2">
                              {prod.name}
                            </h4>
                            {prod.description && (
                              <p className="text-[11px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                                {prod.description}
                              </p>
                            )}
                            <span className="font-bold text-xs sm:text-sm text-[#E4171E] font-mono block mt-1">
                              {formatBRL(prod.price)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSweetEsfiha(prod)}
                          disabled={isAdded}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                            isAdded
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-[#E4171E] hover:bg-[#B80F16] active:scale-98 text-white cursor-pointer'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Adicionado ✓</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {availableSweetEsfihas.length > 3 && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllSweets((prev) => !prev)}
                      className="text-xs font-bold text-[#E4171E] hover:underline cursor-pointer"
                    >
                      {showAllSweets
                        ? 'Mostrar menos opções'
                        : `Ver mais opções (${availableSweetEsfihas.length - 3})`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1. SEUS DADOS */}
            <div ref={addressSectionRef}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4171E] mb-3">
                1. Seus Dados de Contato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className={`w-full p-3 bg-white border rounded-xl text-xs sm:text-sm text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] shadow-xs ${
                      errors.name ? 'border-red-500' : 'border-[#E8E0D5]'
                    }`}
                  />
                  {errors.name && (
                    <span className="text-[11px] text-red-500 mt-1 block">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                    WhatsApp para confirmação *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className={`w-full p-3 bg-white border rounded-xl text-xs sm:text-sm text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] shadow-xs ${
                      errors.phone ? 'border-red-500' : 'border-[#E8E0D5]'
                    }`}
                  />
                  {errors.phone && (
                    <span className="text-[11px] text-red-500 mt-1 block">
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. FORMA DE ENTREGA & ENDEREÇO COM CÁLCULO DE DISTÂNCIA */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4171E]">
                  2. Como deseja receber?
                </h3>
                <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 flex-wrap">
                  <span>Origem: <strong>{pizzeria.address}, {pizzeria.neighborhood ? `${pizzeria.neighborhood}, ` : ''}{pizzeria.city}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, deliveryType: 'entrega' })}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                    customer.deliveryType === 'entrega'
                      ? 'bg-[#FBE4E1] border-[#E4171E] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                      : 'bg-white border-[#E8E0D5] text-[#6B6B6B] hover:text-[#1C1C1C]'
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#E4171E]" />
                  <span>Entrega em Domicílio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomer({ ...customer, deliveryType: 'retirada' })}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs ${
                    customer.deliveryType === 'retirada'
                      ? 'bg-[#FBE4E1] border-[#E4171E] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                      : 'bg-white border-[#E8E0D5] text-[#6B6B6B] hover:text-[#1C1C1C]'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#E4171E]" />
                  <span>Retirada no Balcão</span>
                </button>
              </div>

              {/* Endereço de Entrega */}
              {customer.deliveryType === 'entrega' ? (
                <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E8E0D5] space-y-3.5 shadow-xs">
                  {/* SEÇÃO CEP (Opção 1 e Opção 2) */}
                  <div className="p-3 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#1C1C1C]">
                        CEP *
                      </label>
                      <span className="text-[10px] text-[#6B6B6B]">
                        Digite o CEP ou calcule pelo endereço
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* OPÇÃO 1 — DIGITAR CEP */}
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={customer.cep || ''}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          maxLength={9}
                          className={`w-full p-2.5 bg-white border rounded-lg text-xs font-mono text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] ${
                            errors.cep ? 'border-red-500' : 'border-[#E8E0D5]'
                          }`}
                        />
                        {isCepLoading && (
                          <div className="absolute right-2.5 top-2.5 text-[#E4171E] animate-spin">
                            <Loader2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* OPÇÃO 2 — CALCULAR CEP AUTOMATICAMENTE */}
                      <button
                        type="button"
                        onClick={handleCalculateCep}
                        disabled={isCalculatingCep}
                        className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-[#F5EFE6] border border-[#E8E0D5] text-[#1C1C1C] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isCalculatingCep ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-[#E4171E] animate-spin" />
                            <span>Calculando CEP...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5 text-[#E4171E]" />
                            <span>CALCULAR CEP AUTOMATICAMENTE</span>
                          </>
                        )}
                      </button>
                    </div>

                    {errors.cep && (
                      <span className="text-[11px] text-red-500 block">
                        {errors.cep}
                      </span>
                    )}

                    {/* Feedback CEP */}
                    {cepNotice && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                          cepNotice.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : cepNotice.type === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {cepNotice.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-snug">{cepNotice.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Campos de Rua e Número */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Rua / Avenida *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.street}
                        onChange={(e) => setCustomer({ ...customer, street: e.target.value })}
                        placeholder="Ex: Rua das Flores"
                        className={`w-full p-2.5 bg-[#FBF9F6] border rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] ${
                          errors.street ? 'border-red-500' : 'border-[#E8E0D5]'
                        }`}
                      />
                      {errors.street && (
                        <span className="text-[11px] text-red-500 mt-0.5 block">{errors.street}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.number}
                        onChange={(e) => setCustomer({ ...customer, number: e.target.value })}
                        placeholder="123"
                        className={`w-full p-2.5 bg-[#FBF9F6] border rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] ${
                          errors.number ? 'border-red-500' : 'border-[#E8E0D5]'
                        }`}
                      />
                      {errors.number && (
                        <span className="text-[11px] text-red-500 mt-0.5 block">{errors.number}</span>
                      )}
                    </div>
                  </div>

                  {/* Campos de Bairro e Complemento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.neighborhood}
                        onChange={(e) =>
                          setCustomer({ ...customer, neighborhood: e.target.value })
                        }
                        placeholder="Ex: Centro"
                        className={`w-full p-2.5 bg-[#FBF9F6] border rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] ${
                          errors.neighborhood ? 'border-red-500' : 'border-[#E8E0D5]'
                        }`}
                      />
                      {errors.neighborhood && (
                        <span className="text-[11px] text-red-500 mt-0.5 block">{errors.neighborhood}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Complemento (Opcional)
                      </label>
                      <input
                        type="text"
                        value={customer.complement}
                        onChange={(e) =>
                          setCustomer({ ...customer, complement: e.target.value })
                        }
                        placeholder="Ex: Apto 42, Bloco B"
                        className="w-full p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                      />
                    </div>
                  </div>

                  {/* Campos de Cidade e Estado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.city || 'São Paulo'}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        placeholder="Ex: São Paulo"
                        className="w-full p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                        Estado / UF *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.state || 'SP'}
                        onChange={(e) => setCustomer({ ...customer, state: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                      />
                    </div>
                  </div>

                  {/* Ponto de Referência */}
                  <div>
                    <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                      Ponto de Referência (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customer.reference}
                      onChange={(e) =>
                        setCustomer({ ...customer, reference: e.target.value })
                      }
                      placeholder="Ex: Próximo à padaria central"
                      className="w-full p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                    />
                  </div>

                  {/* CARD DE CÁLCULO AUTOMÁTICO DA TAXA POR DISTÂNCIA */}
                  <div className="pt-2 border-t border-[#E8E0D5]">
                    {distanceState.isCalculating ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-3 animate-pulse">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                          <span>Calculando distância e rota do endereço...</span>
                        </div>
                        <span className="text-[10px] text-amber-700">Tabela oficial</span>
                      </div>
                    ) : distanceState.isOutOfRange ? (
                      /* ACIMA DE 9 KM */
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs space-y-1.5 shadow-xs">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <strong className="block font-bold text-red-950">
                              Distância calculada: {distanceState.distanceKm} km
                            </strong>
                            <p className="text-red-800 text-[11px] leading-relaxed mt-0.5">
                              Esse endereço está fora da nossa área padrão de entrega. Consulte a pizzaria para verificar a disponibilidade da entrega.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const consultMsg = `Olá! Gostaria de consultar se vocês fazem entrega para o endereço: ${customer.street}, ${customer.number} - ${customer.neighborhood}, ${customer.city}/${customer.state} (Distância estimada: ${distanceState.distanceKm} km).`;
                                openWhatsApp(pizzeria.whatsappNumber, consultMsg);
                              }}
                              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>Consultar Disponibilidade no WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : distanceState.error ? (
                      /* ERRO NO CÁLCULO */
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start justify-between gap-3 shadow-xs">
                        <div className="flex items-start gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-semibold block">Não foi possível calcular a taxa:</span>
                            <span className="text-[11px] text-amber-800 block leading-snug">
                              {distanceState.error}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => recalculateDistance()}
                          className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Recalcular</span>
                        </button>
                      </div>
                    ) : distanceState.distanceKm !== undefined && distanceState.fee !== undefined ? (
                      /* SUCESSO NO CÁLCULO */
                      <div className="p-3.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#FBE4E1] text-[#E4171E] shrink-0">
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#1C1C1C] block">
                              Distância estimada: <strong className="font-mono font-bold text-sm text-[#1C1C1C]">{distanceState.distanceKm} km</strong>
                            </span>
                            <span className="text-[11px] text-[#6B6B6B]">
                              Calculada automaticamente por rota a partir da pizzaria
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">
                            Taxa de entrega
                          </span>
                          <span className="text-base font-bold text-[#E4171E] font-mono tabular-nums">
                            {formatBRL(distanceState.fee)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* AGUARDANDO PREENCHIMENTO */
                      <div className="p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#6B6B6B] flex items-center justify-between">
                        <span>Preencha o CEP, rua e número para calcular a taxa de entrega automaticamente.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-[#E8E0D5] text-xs text-[#1C1C1C] space-y-1 shadow-xs">
                  <span className="font-bold text-[#1C1C1C] block">Endereço para Retirada:</span>
                  <p className="text-[#6B6B6B]">{pizzeria.address} · {pizzeria.city}</p>
                  <p className="text-[#6B6B6B]">Tempo estimado de preparo: 25 a 35 minutos. Taxa de entrega: <strong>Grátis</strong>.</p>
                </div>
              )}
            </div>

            {/* 3. FORMAS DE PAGAMENTO: Pix, Dinheiro, Cartão, Vale-Refeição */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4171E] mb-3">
                3. Forma de Pagamento
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {[
                  { id: 'pix', label: 'Pix', icon: QrCode },
                  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                  { id: 'cartao', label: 'Cartão', icon: CreditCard },
                  { id: 'vale_refeicao', label: 'Vale-Refeição', icon: UtensilsCrossed },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = customer.paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCustomer({ ...customer, paymentMethod: item.id as PaymentMethod });
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.receipt;
                          return copy;
                        });
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[56px] ${
                        isSelected
                          ? 'bg-[#FBE4E1] border-[#E4171E] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'bg-white border-[#E8E0D5] text-[#6B6B6B] hover:text-[#1C1C1C] hover:border-[#1C1C1C]/20'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-[#E4171E]" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* QUANDO O CLIENTE ESCOLHER PIX: Somente depois de selecionar Pix, exibir a seção */}
              {customer.paymentMethod === 'pix' && (
                <div className="mt-4 p-4 sm:p-5 rounded-xl bg-white border border-[#E8E0D5] space-y-4 shadow-xs">
                  <div className="border-b border-[#E8E0D5] pb-2.5">
                    <h4 className="text-sm font-bold text-[#1C1C1C] flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#E4171E]" />
                      Pagamento via Pix
                    </h4>
                  </div>

                  {/* Valor do pedido */}
                  <div className="flex items-center justify-between bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E0D5]">
                    <span className="text-xs font-semibold text-[#1C1C1C]">Valor do pedido:</span>
                    <span className="text-base sm:text-lg font-bold text-[#E4171E] tabular-nums font-mono">
                      {formatBRL(grandTotal)}
                    </span>
                  </div>

                  {/* Chave Pix — CNPJ */}
                  <div>
                    <span className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">
                      Chave Pix — CNPJ
                    </span>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl font-mono text-xs sm:text-sm font-bold text-[#1C1C1C] tracking-wide select-all flex items-center justify-between">
                        <span>{OFFICIAL_PIX_KEY}</span>
                        <span className="text-[10px] text-[#6B6B6B] font-sans font-normal uppercase bg-[#E8E0D5]/50 px-1.5 py-0.5 rounded">
                          CNPJ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className="px-4 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#333333] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[44px]"
                      >
                        {pixKeyCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>COPIADO</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>COPIAR CHAVE PIX</span>
                          </>
                        )}
                      </button>
                    </div>

                    {pixKeyCopied && (
                      <p className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                        <Check className="w-3.5 h-3.5" />
                        <span>Chave Pix copiada.</span>
                      </p>
                    )}
                  </div>

                  {/* Texto de orientação */}
                  <p className="text-xs text-[#6B6B6B] leading-relaxed bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E0D5]">
                    Realize o pagamento no valor exato do seu pedido e, depois, envie o comprovante para continuar.
                  </p>

                  {/* COMPROVANTE OBRIGATÓRIO */}
                  <div className="pt-2 border-t border-[#E8E0D5] space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#E4171E]" />
                        Envie o comprovante
                      </h5>
                      <p className="text-xs text-[#6B6B6B]">
                        Após realizar o pagamento, anexe o comprovante para continuar com o pedido.
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptChange}
                      accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />

                    {!receiptFile ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-[#E4171E]/40 hover:border-[#E4171E] bg-[#FBE4E1]/30 hover:bg-[#FBE4E1]/60 text-[#E4171E] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[48px]"
                        >
                          <Upload className="w-4 h-4" />
                          <span>ANEXAR COMPROVANTE</span>
                        </button>

                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Envie o comprovante do Pix para continuar.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-emerald-800 block">
                                Comprovante anexado com sucesso.
                              </span>
                              <span className="text-xs text-emerald-700 font-medium truncate block font-mono">
                                {receiptFile.name}
                              </span>
                              <span className="text-[10px] text-emerald-600">
                                {formatFileSize(receiptFile.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer p-1"
                            >
                              Trocar
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveReceipt}
                              className="text-[11px] font-semibold text-red-600 hover:text-red-700 underline cursor-pointer p-1"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        {receiptPreview && (
                          <div className="flex items-center gap-3 p-2 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl">
                            <img
                              src={receiptPreview}
                              alt="Prévia do comprovante"
                              className="w-14 h-14 object-cover rounded-lg border border-[#E8E0D5]"
                            />
                            <div className="text-xs text-[#6B6B6B]">
                              <span className="font-semibold text-[#1C1C1C] block">Pré-visualização do comprovante</span>
                              <span>Tudo pronto para envio do pedido com comprovante.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dinheiro - Troco */}
              {customer.paymentMethod === 'dinheiro' && (
                <div className="mt-3 p-3 bg-white border border-[#E8E0D5] rounded-xl shadow-xs space-y-1.5">
                  <label className="block text-xs font-medium text-[#1C1C1C]">
                    Precisa de troco para quanto? (Deixe em branco se não precisar)
                  </label>
                  <input
                    type="text"
                    value={customer.changeFor}
                    onChange={(e) => setCustomer({ ...customer, changeFor: e.target.value })}
                    placeholder="Ex: R$ 100,00"
                    className="w-full p-2.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                  />
                  <p className="text-[11px] text-[#6B6B6B]">
                    O pagamento em dinheiro será realizado no momento da entrega ou retirada.
                  </p>
                </div>
              )}

              {/* Cartão Info */}
              {(customer.paymentMethod === 'cartao' ||
                customer.paymentMethod === 'cartao_credito' ||
                customer.paymentMethod === 'cartao_debito') && (
                <div className="mt-3 p-3 bg-white border border-[#E8E0D5] rounded-xl shadow-xs text-xs text-[#1C1C1C] space-y-1">
                  <span className="font-semibold block">Pagamento com Cartão</span>
                  <p className="text-[#6B6B6B]">
                    {customer.deliveryType === 'entrega'
                      ? 'O motoboy levará a maquininha de cartão até o seu endereço (Crédito ou Débito).'
                      : 'O pagamento será realizado diretamente na maquininha no balcão da pizzaria (Crédito ou Débito).'}
                  </p>
                </div>
              )}

              {/* VALE-REFEIÇÃO INFO */}
              {customer.paymentMethod === 'vale_refeicao' && (
                <div className="mt-3 p-3.5 bg-white border border-[#E8E0D5] rounded-xl shadow-xs text-xs text-[#1C1C1C] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#1C1C1C]">
                    <UtensilsCrossed className="w-4 h-4 text-[#E4171E]" />
                    <span>Pagamento com Vale-Refeição</span>
                  </div>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    {customer.deliveryType === 'entrega'
                      ? 'O motoboy levará a maquininha compatível com Vale-Refeição até o seu endereço (aceitamos Alelo Refeição, Ticket Restaurante, VR Benefícios, Pluxee/Sodexo e Ben Visa Vale).'
                      : 'O pagamento será realizado diretamente na maquininha no balcão da pizzaria (aceitamos Alelo Refeição, Ticket Restaurante, VR Benefícios, Pluxee/Sodexo e Ben Visa Vale).'}
                  </p>
                </div>
              )}
            </div>

            {/* 4. OBSERVAÇÕES DO PEDIDO */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                4. Observações Adicionais
              </label>
              <textarea
                value={customer.orderNotes}
                onChange={(e) => setCustomer({ ...customer, orderNotes: e.target.value })}
                placeholder="Ex: Tocar a campainha, talheres descartáveis, etc."
                rows={2}
                className="w-full p-3 bg-white border border-[#E8E0D5] rounded-xl text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] shadow-xs"
              />
            </div>

            {/* RESUMO COMPLETO PARA CONFERÊNCIA COM ENDEREÇO, DISTÂNCIA E TAXA EXATA */}
            <div className="p-4 rounded-xl bg-white border border-[#E8E0D5] space-y-3 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C] border-b border-[#E8E0D5] pb-2">
                Resumo do Pedido para Conferência
              </h4>

              {/* ITENS */}
              <div className="space-y-2 text-xs">
                {items.map((it) => {
                  const flavors = it.flavors && it.flavors.length > 0
                    ? it.flavors
                    : (it.isHalfHalf && it.secondFlavor ? [it.product, it.secondFlavor] : [it.product]);
                  const isMulti = flavors.length > 1;
                  const sizeTitle = it.size === 'broto' ? 'Broto' : '8 Fatias';

                  let itTitle = it.product.name;
                  if (isMulti) {
                    itTitle = `Pizza ${sizeTitle} — ${flavors.length} sabores (${flavors.map(f => f.name).join(' + ')})`;
                  } else if (it.size) {
                    itTitle += ` (${it.size.charAt(0).toUpperCase() + it.size.slice(1)})`;
                  }
                  return (
                    <div key={it.cartItemId} className="flex justify-between items-start gap-2 text-[#1C1C1C]">
                      <div>
                        <span>
                          {it.quantity}x {itTitle}
                        </span>
                        {isMulti && (
                          <div className="text-[10px] text-[#6B6B6B] pl-2 mt-0.5">
                            Sabores: {flavors.map(f => f.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="tabular-nums font-semibold font-mono shrink-0">
                        {formatBRL(it.unitPrice * it.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ENDEREÇO DE ENTREGA COMPLETO */}
              {customer.deliveryType === 'entrega' && (
                <div className="p-3 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl space-y-1.5 text-xs">
                  <h5 className="font-bold text-[#1C1C1C] text-[11px] uppercase tracking-wider border-b border-[#E8E0D5] pb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#E4171E]" />
                      ENDEREÇO DE ENTREGA
                    </span>
                    {distanceState.distanceKm !== undefined && (
                      <span className="font-mono text-[#E4171E] font-bold">
                        {distanceState.distanceKm} km
                      </span>
                    )}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[#1C1C1C]">
                    <p><span className="text-[#6B6B6B]">Rua:</span> {customer.street || 'Não informada'}</p>
                    <p><span className="text-[#6B6B6B]">Número:</span> {customer.number || 'Não informado'}</p>
                    <p><span className="text-[#6B6B6B]">Complemento:</span> {customer.complement || '-'}</p>
                    <p><span className="text-[#6B6B6B]">Bairro:</span> {customer.neighborhood || 'Não informado'}</p>
                    <p><span className="text-[#6B6B6B]">Cidade/UF:</span> {customer.city || 'São Paulo'} - {customer.state || 'SP'}</p>
                    <p><span className="text-[#6B6B6B]">CEP:</span> {customer.cep || 'Não informado'}</p>
                  </div>

                  {distanceState.distanceKm !== undefined && distanceState.fee !== undefined && !distanceState.isOutOfRange && (
                    <div className="mt-2 pt-2 border-t border-[#E8E0D5] flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#6B6B6B]">Distância estimada:</span>
                      <span className="text-[#1C1C1C] font-mono">{distanceState.distanceKm} km</span>
                    </div>
                  )}

                  {distanceState.fee !== undefined && !distanceState.isOutOfRange && (
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#6B6B6B]">Taxa de entrega:</span>
                      <span className="text-[#E4171E] font-mono font-bold">{formatBRL(distanceState.fee)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAIS */}
              <div className="pt-2 border-t border-[#E8E0D5] space-y-1 text-xs">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums text-[#1C1C1C] font-mono">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Taxa de Entrega:</span>
                  <span className="tabular-nums text-[#1C1C1C] font-mono">
                    {customer.deliveryType === 'retirada'
                      ? 'Grátis (Retirada no Balcão)'
                      : distanceState.isCalculating
                      ? 'Calculando por rota...'
                      : distanceState.fee !== undefined && !distanceState.isOutOfRange
                      ? `${formatBRL(distanceState.fee)}`
                      : distanceState.isOutOfRange
                      ? 'Fora da área padrão (> 9 km)'
                      : 'Aguardando endereço'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1C1C1C] pt-1 border-t border-[#E8E0D5]">
                  <span>TOTAL:</span>
                  <span className="text-[#E4171E] text-base tabular-nums font-bold font-mono">
                    {formatBRL(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button & Security Enforcement */}
            {isSubmitDisabled ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#E8E0D5] text-[#9E9E9E] font-bold text-sm tracking-wide shadow-none flex items-center justify-center gap-2 cursor-not-allowed border border-[#D5CCC0]"
                >
                  <Send className="w-4 h-4" />
                  <span>ENVIAR PEDIDO NO WHATSAPP</span>
                </button>

                {/* Avisos explicativos de bloqueio */}
                {isDeliveryCalculating ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 shrink-0 text-amber-600 animate-spin" />
                    <span>Calculando rota e taxa de entrega com base na distância...</span>
                  </div>
                ) : isDeliveryOutOfRange ? (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>Esse endereço está fora da nossa área padrão de entrega. Consulte a pizzaria para verificar a disponibilidade da entrega.</span>
                  </div>
                ) : isDeliveryHasError ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Confira o endereço digitado para o cálculo da rota ou consulte a pizzaria.</span>
                  </div>
                ) : isDeliveryIncomplete ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Preencha o CEP, rua e número para calcular a taxa de entrega.</span>
                  </div>
                ) : isPixMissingReceipt ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Envie o comprovante do Pix para continuar.</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                type="submit"
                className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-98 text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ENVIAR PEDIDO NO WHATSAPP</span>
              </button>
            )}
          </form>
        ) : (
          /* Success Screen */
          <div className="p-6 sm:p-8 text-center flex flex-col items-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-heading text-2xl font-bold text-[#1C1C1C] mb-1">
                {orderNumber ? `Pedido #${orderNumber} Enviado!` : 'Pedido Enviado!'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-md mx-auto">
                O seu pedido foi preparado e a janela do WhatsApp foi iniciada. Caso a conversa não tenha aberto automaticamente, utilize as opções abaixo:
              </p>
            </div>

            {/* Aviso especial para Pix comprovante */}
            {isPix && receiptFile && (
              <div className="w-full max-w-md p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-900 flex items-start gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-950 font-bold mb-0.5">
                    Comprovante anexado: {receiptFile.name}
                  </strong>
                  <span className="text-emerald-800">
                    Lembre-se de anexar a imagem/documento do comprovante também na conversa aberta do WhatsApp para a pizzaria conferir imediatamente.
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="w-full max-w-md space-y-3">
              <button
                onClick={() => openWhatsApp(pizzeria.whatsappNumber, generatedMessage)}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp Novamente</span>
              </button>

              <button
                onClick={copyMessageToClipboard}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-white hover:bg-[#F5EFE6] text-[#1C1C1C] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#E8E0D5] transition-colors cursor-pointer shadow-xs"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6B6B6B]" />}
                <span>{copiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto do Pedido'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 text-xs text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer flex items-center justify-center"
              >
                Concluir e Voltar ao Cardápio
              </button>
            </div>

            {/* Preview of message */}
            <div className="w-full max-w-md text-left bg-white p-4 rounded-xl border border-[#E8E0D5] text-[11px] font-mono text-[#1C1C1C] whitespace-pre-line max-h-48 overflow-y-auto shadow-inner">
              {generatedMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
