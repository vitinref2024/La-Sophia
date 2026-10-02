import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Check,
  Search,
  Layers,
  Pizza as PizzaIcon,
  Info,
  GlassWater,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CrustOption, ExtraToppingOption, PizzaSize, Product } from '../types';
import { resolveCardImage, getCleanFlavorName } from './ProductCard';
import { ProductImage } from './ProductImage';
import {
  CRUST_OPTIONS,
  EXTRA_TOPPING_OPTIONS,
  MENU_PRODUCTS,
  SIZES,
  calculateMultiFlavorPizzaPrice,
  getFlavorPriceForSize,
  getHighestPricedFlavor,
  formatBRL,
} from '../data/menuData';
import { safeImageUrl } from '../utils/imageUrl';

export interface ConfiguredPizzaPayload {
  product: Product;
  size?: PizzaSize;
  isHalfHalf?: boolean;
  secondFlavor?: Product;
  flavors?: Product[];
  crust?: CrustOption;
  extraTopping?: ExtraToppingOption;
  extraToppings?: ExtraToppingOption[];
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface PizzaModalProps {
  product: Product;
  onClose: () => void;
  allProducts?: Product[];
  onAddToCart: (
    configuredItem: ConfiguredPizzaPayload,
    selectedBeverages?: Array<{ product: Product; quantity: number }>
  ) => void;
}

export const PizzaModal: React.FC<PizzaModalProps> = ({
  product,
  onClose,
  allProducts,
  onAddToCart,
}) => {
  const isPizza = product.isPizza || product.isSweetPizza;
  const productSource = allProducts && allProducts.length > 50 ? allProducts : MENU_PRODUCTS;

  // Selected customization states
  // Default is 'pizza' (Pizza Grande Tradicional 8 fatias)
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('pizza');

  // Multi-flavor selection state
  // For 8 slices: supports 1, 2, or 3 flavors!
  // For broto (4 slices): supports 1 or 2 flavors.
  const [selectedFlavors, setSelectedFlavors] = useState<Product[]>([product]);
  const [flavorMode, setFlavorMode] = useState<1 | 2 | 3>(1);
  const [flavorSearch, setFlavorSearch] = useState<string>('');
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const [selectedCrust, setSelectedCrust] = useState<CrustOption>(CRUST_OPTIONS[0]);
  const [selectedExtraToppings, setSelectedExtraToppings] = useState<ExtraToppingOption[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Selected beverages upsell: { [productId]: quantity }
  const [selectedBeverages, setSelectedBeverages] = useState<Record<string, number>>({});

  // Max flavors allowed for the current size: 3 for 8 slices, 2 for broto
  const maxFlavorsAllowed = selectedSize === 'pizza' ? 3 : 2;

  // List of beverages from the pizzeria menu
  const availableBeverages = useMemo(() => {
    return productSource.filter((p) => p.category === 'bebidas' || p.category === 'cervejas');
  }, [productSource]);

  // Available pizzas for additional flavors (matching savory vs sweet)
  const availableFlavorsList = useMemo(() => {
    return productSource.filter((p) => {
      if (product.isSweetPizza) return p.isSweetPizza;
      return p.isPizza && !p.isSweetPizza;
    }).filter((p) => {
      if (!flavorSearch.trim()) return true;
      const term = flavorSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.code && p.code.includes(term))
      );
    });
  }, [productSource, product, flavorSearch]);

  // Highest priced flavor among the selected ones
  const highestPricedFlavorInfo = useMemo(() => {
    return getHighestPricedFlavor(selectedFlavors, selectedSize);
  }, [selectedFlavors, selectedSize]);

  // Base price calculation: strictly the HIGHEST price among all chosen flavors
  const basePrice = useMemo(() => {
    if (!isPizza) {
      return product.price;
    }
    return calculateMultiFlavorPizzaPrice(selectedFlavors, selectedSize);
  }, [isPizza, product, selectedFlavors, selectedSize]);

  // Crust and extra toppings price calculation
  const crustPrice = isPizza && selectedCrust ? selectedCrust.price : 0;
  const extraToppingsPrice = isPizza
    ? selectedExtraToppings.reduce((acc, item) => acc + item.price, 0)
    : 0;

  // Dynamic unit price for pizza
  const unitPrice = basePrice + crustPrice + extraToppingsPrice;
  const pizzaTotal = unitPrice * quantity;

  // Dynamic beverages total calculation
  const beveragesList = useMemo(() => {
    const list: Array<{ product: Product; quantity: number }> = [];
    Object.entries(selectedBeverages).forEach(([id, qty]) => {
      if (qty > 0) {
        const prod = availableBeverages.find((b) => b.id === id);
        if (prod) {
          list.push({ product: prod, quantity: qty });
        }
      }
    });
    return list;
  }, [selectedBeverages, availableBeverages]);

  const beveragesTotal = useMemo(() => {
    return beveragesList.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [beveragesList]);

  // Total of the entire order (Pizza + Beverages)
  const totalOrderPrice = pizzaTotal + beveragesTotal;

  // Change pizza size handler
  const handleSelectSize = (size: PizzaSize) => {
    setSelectedSize(size);
    setLimitWarning(null);
    if (size === 'broto' && selectedFlavors.length > 2) {
      setSelectedFlavors((prev) => prev.slice(0, 2));
      setFlavorMode((prev) => (prev > 2 ? 2 : prev));
    }
  };

  // Change flavor mode (1, 2, or 3 flavors)
  const handleSelectFlavorMode = (targetCount: 1 | 2 | 3) => {
    setFlavorMode(targetCount);
    setLimitWarning(null);
    if (targetCount === 1) {
      setSelectedFlavors([selectedFlavors[0] || product]);
    } else if (selectedFlavors.length > targetCount) {
      setSelectedFlavors((prev) => prev.slice(0, targetCount));
    }
  };

  // Add or toggle a flavor from the catalog
  const handleSelectFlavor = (flavor: Product) => {
    const isAlreadySelected = selectedFlavors.some((f) => f.id === flavor.id);

    if (isAlreadySelected) {
      // If already selected and more than 1 flavor, allow removing
      if (selectedFlavors.length > 1) {
        const filtered = selectedFlavors.filter((f) => f.id !== flavor.id);
        setSelectedFlavors(filtered);
        setFlavorMode(filtered.length as 1 | 2 | 3);
        setLimitWarning(null);
      }
      return;
    }

    // Checking max limit
    if (selectedFlavors.length >= maxFlavorsAllowed) {
      setLimitWarning(
        selectedSize === 'pizza'
          ? 'Você pode escolher até 3 sabores nesta pizza.'
          : 'No tamanho Broto (4 fatias), você pode escolher até 2 sabores.'
      );
      return;
    }

    // Add new flavor
    const updated = [...selectedFlavors, flavor];
    setSelectedFlavors(updated);
    setFlavorMode(updated.length as 1 | 2 | 3);
    setLimitWarning(null);
  };

  // Remove a specific flavor by index
  const handleRemoveFlavor = (index: number) => {
    if (selectedFlavors.length <= 1) return;
    const updated = selectedFlavors.filter((_, i) => i !== index);
    setSelectedFlavors(updated);
    setFlavorMode(updated.length as 1 | 2 | 3);
    setLimitWarning(null);
  };

  const handleToggleExtraTopping = (extra: ExtraToppingOption) => {
    setSelectedExtraToppings((prev) => {
      const exists = prev.some((item) => item.id === extra.id);
      if (exists) {
        return prev.filter((item) => item.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleAddBeverage = (productId: string) => {
    setSelectedBeverages((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrementBeverage = (productId: string) => {
    setSelectedBeverages((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  // Add pizza AND selected beverages to cart
  const handleConfirmWithBeverages = () => {
    if (selectedFlavors.length === 0) return;

    onAddToCart(
      {
        product: selectedFlavors[0] || product,
        size: isPizza ? selectedSize : undefined,
        isHalfHalf: isPizza ? selectedFlavors.length === 2 : false,
        secondFlavor: isPizza && selectedFlavors.length >= 2 ? selectedFlavors[1] : undefined,
        flavors: isPizza ? selectedFlavors : undefined,
        crust: isPizza ? selectedCrust : undefined,
        extraTopping: selectedExtraToppings[0] || undefined,
        extraToppings: selectedExtraToppings,
        quantity,
        unitPrice,
        notes,
      },
      beveragesList
    );
  };

  // Add only the pizza (skipping beverages)
  const handleConfirmWithoutBeverages = () => {
    if (selectedFlavors.length === 0) return;

    onAddToCart(
      {
        product: selectedFlavors[0] || product,
        size: isPizza ? selectedSize : undefined,
        isHalfHalf: isPizza ? selectedFlavors.length === 2 : false,
        secondFlavor: isPizza && selectedFlavors.length >= 2 ? selectedFlavors[1] : undefined,
        flavors: isPizza ? selectedFlavors : undefined,
        crust: isPizza ? selectedCrust : undefined,
        extraTopping: selectedExtraToppings[0] || undefined,
        extraToppings: selectedExtraToppings,
        quantity,
        unitPrice,
        notes,
      },
      [] // No beverages
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      {/* Modal Container: Branco-gelo #FBF9F6 com borda #E8E0D5 */}
      <div className="relative w-full max-w-2xl max-h-[94dvh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header Image */}
        <div className="relative h-36 sm:h-44 md:h-48 w-full bg-[#111111] overflow-hidden shrink-0">
          <ProductImage
            product={product}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            width={672}
            height={192}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer border border-neutral-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {product.code && (
                <span className="inline-block text-[10px] sm:text-[11px] font-mono font-bold text-[#E4171E] bg-[#FBE4E1] px-1.5 sm:px-2 py-0.5 rounded border border-[#E8E0D5]">
                  Nº {product.code}
                </span>
              )}
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 text-neutral-200 border border-neutral-700">
                Personalização da Pizza
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 [overflow-wrap:anywhere] leading-tight">
              {product.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-200 [overflow-wrap:anywhere] line-clamp-2">
              {product.description}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          {/* STEP 1: Escolha o Tamanho da Pizza (Broto | Pizza Grande 8 fatias) */}
          {isPizza && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase font-bold tracking-wider text-[#E4171E] flex items-center gap-1.5">
                  <PizzaIcon className="w-3.5 h-3.5" />
                  1. Tamanho da Pizza
                </span>
                <span className="text-[11px] text-[#6B6B6B] font-medium">Obrigatório</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SIZES.map((size) => {
                  const isSelected = selectedSize === size.id;
                  const priceForSize = product.pricesBySize
                    ? product.pricesBySize[size.id]
                    : product.price;

                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleSelectSize(size.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                        isSelected
                          ? 'border-[#E4171E] bg-[#FBE4E1] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-white hover:border-[#D8CEBF]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-[#1C1C1C]">
                            {size.name}
                          </div>
                          <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                            {size.description}
                          </div>
                          {size.id === 'pizza' && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-[#E4171E] bg-white px-1.5 py-0.5 rounded border border-[#E8E0D5]">
                              Até 3 Sabores
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#E4171E] bg-[#E4171E]'
                              : 'border-[#E8E0D5]'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E8E0D5]/70">
                        <span className="text-[11px] text-[#6B6B6B]">Valor a partir de:</span>
                        <div className="font-bold text-base text-[#E4171E] tabular-nums">
                          {product.uninformedPrice ? 'Consulte' : formatBRL(priceForSize)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: ESCOLHA DOS SABORES (PIZZA 8 FATIAS — ATÉ 3 SABORES) */}
          {isPizza && (
            <section className="bg-white border border-[#E8E0D5] rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#E4171E] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    2. Sabores da Pizza
                  </span>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {selectedSize === 'pizza'
                      ? 'Pizza 8 Fatias — Escolha até 3 sabores diferentes'
                      : 'Pizza Broto — Escolha até 2 sabores'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#E4171E] bg-[#FBE4E1] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                  {selectedFlavors.length} de {maxFlavorsAllowed} {selectedFlavors.length === 1 ? 'sabor' : 'sabores'}
                </span>
              </div>

              {/* Mode Selector Buttons */}
              <div>
                <div className="text-[11px] font-bold text-[#1C1C1C] mb-2 uppercase tracking-wider">
                  Quantos sabores deseja?
                </div>
                {selectedSize === 'pizza' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectFlavorMode(1)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        flavorMode === 1 && selectedFlavors.length === 1
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                      }`}
                    >
                      <span className="text-xs font-bold">1 Sabor</span>
                      <span className="text-[10px] text-[#6B6B6B]">Pizza Inteira</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectFlavorMode(2)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        flavorMode === 2 || selectedFlavors.length === 2
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                      }`}
                    >
                      <span className="text-xs font-bold">2 Sabores</span>
                      <span className="text-[10px] text-[#6B6B6B]">Meio a Meio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectFlavorMode(3)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        flavorMode === 3 || selectedFlavors.length === 3
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                      }`}
                    >
                      <span className="text-xs font-bold">3 Sabores</span>
                      <span className="text-[10px] text-[#6B6B6B]">Até 3 Sabores</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectFlavorMode(1)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        flavorMode === 1 && selectedFlavors.length === 1
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                      }`}
                    >
                      <span className="text-xs font-bold">1 Sabor</span>
                      <span className="text-[10px] text-[#6B6B6B]">Broto Inteiro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectFlavorMode(2)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        flavorMode === 2 || selectedFlavors.length === 2
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                      }`}
                    >
                      <span className="text-xs font-bold">2 Sabores</span>
                      <span className="text-[10px] text-[#6B6B6B]">Broto Meio a Meio</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Limit warning message (shown when client attempts to select more than 3 flavors) */}
              {limitWarning && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-semibold">{limitWarning}</span>
                </div>
              )}

              {/* Selected Flavors List / Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#1C1C1C]">
                  <span>Sabores Escolhidos:</span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    {selectedFlavors.length < maxFlavorsAllowed
                      ? `Você pode adicionar mais ${maxFlavorsAllowed - selectedFlavors.length} ${
                          maxFlavorsAllowed - selectedFlavors.length === 1 ? 'sabor' : 'sabores'
                        }`
                      : 'Limite máximo atingido (3 sabores)'}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedFlavors.map((flv, idx) => {
                    const flvPrice = getFlavorPriceForSize(flv, selectedSize);
                    const isHighest =
                      highestPricedFlavorInfo &&
                      highestPricedFlavorInfo.flavor.id === flv.id &&
                      selectedFlavors.length > 1;

                    return (
                      <div
                        key={flv.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          isHighest
                            ? 'bg-[#FBE4E1] border-[#E4171E] shadow-2xs'
                            : 'bg-[#FBF9F6] border-[#E8E0D5]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-full bg-[#E4171E] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#E8E0D5] shrink-0 bg-[#F0EAE1]">
                            <ProductImage
                              product={flv}
                              className="w-full h-full object-cover object-center"
                              loading="lazy"
                              width={36}
                              height={36}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#1C1C1C] truncate flex items-center gap-1.5 flex-wrap">
                              <span>{flv.name}</span>
                              {isHighest && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#E4171E] bg-white px-1.5 py-0.2 rounded border border-[#E8E0D5]">
                                  Sabor mais caro
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B6B6B] truncate">
                              {flv.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="font-bold text-xs text-[#E4171E] tabular-nums block font-mono">
                              {formatBRL(flvPrice)}
                            </span>
                            {selectedFlavors.length > 1 && (
                              <span className="text-[9px] text-[#6B6B6B]">preço avulso</span>
                            )}
                          </div>

                          {selectedFlavors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFlavor(idx)}
                              className="p-1.5 text-[#6B6B6B] hover:text-[#E4171E] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#E8E0D5]"
                              title="Remover este sabor"
                              aria-label={`Remover sabor ${flv.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty slot placeholder if user wants more flavors */}
                  {selectedFlavors.length < maxFlavorsAllowed && (
                    <div className="p-2.5 rounded-xl border border-dashed border-[#D8CEBF] bg-[#FBF9F6]/60 text-xs text-[#6B6B6B] flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#E4171E]" />
                        <span>
                          {selectedFlavors.length === 1
                            ? 'Selecione abaixo o 2º sabor'
                            : 'Selecione abaixo o 3º sabor'}
                        </span>
                      </span>
                      <span className="text-[10px] text-[#E4171E] font-semibold">
                        Escolha na lista
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative Price Rule Banner (Strict highest flavor rule) */}
              {selectedFlavors.length > 1 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <Info className="w-4 h-4 text-[#E4171E] shrink-0" />
                      <span>Regra de Preço: valor do sabor mais caro</span>
                    </span>
                    <span className="font-mono font-bold text-sm text-[#E4171E] tabular-nums">
                      {formatBRL(basePrice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {selectedFlavors.length} sabores selecionados. O valor da pizza é definido pelo sabor de maior preço:{' '}
                    <strong className="text-amber-950 underline decoration-amber-400">
                      {highestPricedFlavorInfo?.flavor.name} ({formatBRL(highestPricedFlavorInfo?.price)})
                    </strong>
                    . Não somamos nem dividimos valores.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5EFE6] border border-[#E8E0D5] text-[#6B6B6B] text-xs">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#E4171E] shrink-0" />
                    <span>Pizza de 1 sabor: valor cobrado é o preço padrão deste sabor.</span>
                  </div>
                  <strong className="text-[#1C1C1C] font-mono tabular-nums">{formatBRL(basePrice)}</strong>
                </div>
              )}

              {/* Catalog list for choosing/adding additional flavors */}
              <div className="pt-2 border-t border-[#E8E0D5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1C1C]">
                    Cardápio de Sabores:
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    Clique em um sabor para adicionar
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                  <input
                    type="text"
                    placeholder="Pesquisar sabor por nome, número ou ingrediente..."
                    value={flavorSearch}
                    onChange={(e) => setFlavorSearch(e.target.value)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {availableFlavorsList.map((flv) => {
                    const isSelected = selectedFlavors.some((f) => f.id === flv.id);
                    const flvPrice = getFlavorPriceForSize(flv, selectedSize);
                    const isAtMax = selectedFlavors.length >= maxFlavorsAllowed;

                    return (
                      <button
                        key={flv.id}
                        type="button"
                        onClick={() => handleSelectFlavor(flv)}
                        className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                            : isAtMax
                            ? 'border-[#E8E0D5] bg-[#FBF9F6] opacity-75 hover:border-amber-400 text-[#1C1C1C]'
                            : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white text-[#1C1C1C]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E8E0D5] shrink-0 bg-[#F0EAE1]">
                            <ProductImage
                              product={flv}
                              className="w-full h-full object-cover object-center"
                              loading="lazy"
                              width={40}
                              height={40}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[#1C1C1C] truncate flex items-center gap-1.5">
                              {flv.code && (
                                <span className="text-[10px] font-mono font-bold text-[#E4171E]">
                                  #{flv.code}
                                </span>
                              )}
                              <span className="truncate">{flv.name}</span>
                            </div>
                            <div className="text-[11px] text-[#6B6B6B] truncate">
                              {flv.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="font-mono text-xs font-bold tabular-nums text-right">
                            <span className="text-[#E4171E]">{formatBRL(flvPrice)}</span>
                            {flvPrice > basePrice && (
                              <span className="text-[9px] text-[#E4171E] block uppercase font-bold">
                                Maior valor
                              </span>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#E4171E] border-[#E4171E] text-white'
                                : 'border-[#E8E0D5] bg-white text-[#6B6B6B]'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: BORDA RECHEADA */}
          {isPizza && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#E4171E]">
                  3. Borda Recheada
                </h3>
                <span className="text-[11px] text-[#6B6B6B]">Escolha 1 opção</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mb-2.5">
                Escolha uma borda para sua pizza:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CRUST_OPTIONS.map((crust) => {
                  const isCrustSelected = selectedCrust.id === crust.id;
                  return (
                    <button
                      key={crust.id}
                      type="button"
                      onClick={() => setSelectedCrust(crust)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                        isCrustSelected
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-white hover:border-[#D8CEBF] text-[#1C1C1C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isCrustSelected
                              ? 'border-[#E4171E] bg-[#E4171E]'
                              : 'border-[#E8E0D5]'
                          }`}
                        >
                          {isCrustSelected && (
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#1C1C1C] truncate">
                          {crust.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#E4171E] tabular-nums shrink-0">
                        {crust.price === 0 ? 'Incluso' : `+ ${formatBRL(crust.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 4: COBERTURA EXTRA */}
          {isPizza && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#E4171E]">
                  4. Cobertura Extra (Opcional)
                </h3>
                <span className="text-[11px] text-[#6B6B6B]">Escolha quantas desejar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXTRA_TOPPING_OPTIONS.map((extra) => {
                  const isExtraSelected = selectedExtraToppings.some((item) => item.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => handleToggleExtraTopping(extra)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                        isExtraSelected
                          ? 'border-[#E4171E] bg-[#FBE4E1] text-[#1C1C1C] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-white hover:border-[#D8CEBF] text-[#1C1C1C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isExtraSelected
                              ? 'border-[#E4171E] bg-[#E4171E]'
                              : 'border-[#E8E0D5]'
                          }`}
                        >
                          {isExtraSelected && (
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#1C1C1C] truncate">
                          {extra.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#E4171E] tabular-nums shrink-0">
                        + {formatBRL(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 5: Observações da Pizza */}
          <section>
            <label
              htmlFor="order-notes"
              className="text-xs uppercase font-bold tracking-wider text-[#6B6B6B] block mb-1.5"
            >
              5. Observações (Opcional)
            </label>
            <textarea
              id="order-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, bem assada, fatiar em 8 pedaços, etc."
              className="w-full bg-white border border-[#E8E0D5] rounded-xl p-3 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E] shadow-xs"
            />
          </section>

          {/* STEP 6: UPSELL DE BEBIDAS — "QUE TAL UMA BEBIDA?" */}
          {isPizza && (
            <section className="bg-white border border-[#E8E0D5] rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-[#E8E0D5]">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#E4171E] flex items-center gap-1.5">
                    <GlassWater className="w-3.5 h-3.5" />
                    QUE TAL UMA BEBIDA?
                  </h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Complete seu pedido com uma bebida gelada.
                  </p>
                </div>
                <span className="text-[11px] text-[#6B6B6B] font-medium bg-[#F5EFE6] px-2 py-0.5 rounded border border-[#E8E0D5] shrink-0">
                  Opcional
                </span>
              </div>

              {/* Grid / List of Available Beverages */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availableBeverages.map((bev) => {
                  const qty = selectedBeverages[bev.id] || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={bev.id}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                        isSelected
                          ? 'border-[#E4171E] bg-[#FBE4E1] ring-1 ring-[#E4171E]'
                          : 'border-[#E8E0D5] bg-[#FBF9F6] hover:bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E8E0D5] flex items-center justify-center p-1">
                        {safeImageUrl(bev.image) ? (
                          <img
                            src={safeImageUrl(bev.image)}
                            alt={bev.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            decoding="async"
                            width="48"
                            height="48"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <GlassWater className="w-5 h-5 text-[#A89F95]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm text-[#1C1C1C] truncate">
                          {bev.name}
                        </h4>
                        <div className="font-bold text-xs sm:text-sm text-[#E4171E] tabular-nums mt-0.5">
                          {formatBRL(bev.price)}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAddBeverage(bev.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADICIONAR</span>
                          </button>
                        ) : (
                          <div className="flex items-center bg-white border border-[#E8E0D5] rounded-lg p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleDecrementBeverage(bev.id)}
                              className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                              aria-label="Diminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#1C1C1C] tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddBeverage(bev.id)}
                              className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 7: RESUMO DO PRODUTO (Item 6 da especificação: Antes de adicionar ao carrinho) */}
          <section className="bg-white border-2 border-[#E8E0D5] rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D5]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B6B6B]">
                  Resumo do Produto
                </span>
                <h4 className="font-heading font-bold text-base text-[#1C1C1C]">
                  {selectedSize === 'broto' ? 'Pizza Broto (4 Fatias)' : 'Pizza 8 Fatias'}
                  {selectedFlavors.length > 1 && (
                    <span className="ml-2 text-xs font-bold text-[#E4171E] bg-[#FBE4E1] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                      {selectedFlavors.length} sabores
                    </span>
                  )}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6B6B6B] block">Valor da pizza:</span>
                <span className="font-mono font-bold text-base sm:text-lg text-[#E4171E] tabular-nums">
                  {formatBRL(unitPrice)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-[#1C1C1C] block">Sabores:</span>
              <ul className="space-y-1 pl-1">
                {selectedFlavors.map((f, idx) => {
                  const isHighest =
                    highestPricedFlavorInfo &&
                    highestPricedFlavorInfo.flavor.id === f.id &&
                    selectedFlavors.length > 1;
                  const fPrice = getFlavorPriceForSize(f, selectedSize);

                  return (
                    <li key={f.id} className="text-xs flex items-center justify-between text-[#1C1C1C]">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="text-[#E4171E] font-bold">•</span>
                        <span className="font-medium truncate">{f.name}</span>
                        {isHighest && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                            Mais caro (define o preço)
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-[#6B6B6B] tabular-nums shrink-0">
                        {formatBRL(fPrice)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {selectedFlavors.length > 1 && (
                <div className="pt-1.5 border-t border-[#E8E0D5]/60 text-[11px] text-amber-800 flex items-center justify-between">
                  <span>Preço cobrado: maior valor entre os sabores</span>
                  <strong className="font-mono font-bold text-[#E4171E]">
                    {formatBRL(basePrice)}
                  </strong>
                </div>
              )}
            </div>

            {/* Crust and Extras if any */}
            {(selectedCrust?.price > 0 || selectedExtraToppings.length > 0) && (
              <div className="pt-2 border-t border-[#E8E0D5]/60 text-xs text-[#6B6B6B] space-y-1">
                {selectedCrust?.price > 0 && (
                  <div className="flex justify-between">
                    <span>Borda: {selectedCrust.name}</span>
                    <span className="text-[#E4171E] font-semibold tabular-nums">+{formatBRL(selectedCrust.price)}</span>
                  </div>
                )}
                {selectedExtraToppings.map((extra) => (
                  <div key={extra.id} className="flex justify-between">
                    <span>{extra.name}</span>
                    <span className="text-[#E4171E] font-semibold tabular-nums">+{formatBRL(extra.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* STEP 8: PREÇO DINÂMICO (Resumo Financeiro em Tempo Real) */}
          <section className="bg-[#F5EFE6] border border-[#E8E0D5] rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="font-bold text-[#1C1C1C] uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between border-b border-[#E8E0D5] pb-1.5">
              <span>Demonstrativo do Total</span>
              <span className="text-[#E4171E] font-mono text-sm">{formatBRL(totalOrderPrice)}</span>
            </div>

            <div className="flex justify-between items-center text-[#6B6B6B]">
              <span>
                Pizza ({selectedSize === 'broto' ? 'Broto' : '8 Fatias'}
                {selectedFlavors.length > 1 ? ` - ${selectedFlavors.length} Sabores` : ''}
                {quantity > 1 ? ` x${quantity}` : ''}):
              </span>
              <span className="font-semibold text-[#1C1C1C] tabular-nums font-mono">{formatBRL(basePrice * quantity)}</span>
            </div>

            {selectedCrust && selectedCrust.price > 0 ? (
              <div className="flex justify-between items-center text-[#6B6B6B]">
                <span>Borda ({selectedCrust.name}):</span>
                <span className="font-semibold text-[#E4171E] tabular-nums font-mono">+ {formatBRL(selectedCrust.price * quantity)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[#6B6B6B]">
                <span>Borda:</span>
                <span className="font-medium text-[#6B6B6B]">Sem borda recheada (R$ 0,00)</span>
              </div>
            )}

            {selectedExtraToppings.length > 0 ? (
              selectedExtraToppings.map((extra) => (
                <div key={extra.id} className="flex justify-between items-center text-[#6B6B6B]">
                  <span>{extra.name}:</span>
                  <span className="font-semibold text-[#E4171E] tabular-nums font-mono">+ {formatBRL(extra.price * quantity)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-[#6B6B6B]">
                <span>Coberturas extras:</span>
                <span className="font-medium text-[#6B6B6B]">Nenhuma</span>
              </div>
            )}

            {/* Selected Beverages in Real-time Breakdown */}
            {beveragesList.length > 0 && (
              <div className="pt-1.5 border-t border-[#E8E0D5]/70 space-y-1">
                {beveragesList.map((bev) => (
                  <div key={bev.product.id} className="flex justify-between items-center text-[#6B6B6B]">
                    <span>Bebida ({bev.quantity}x {bev.product.name}):</span>
                    <span className="font-semibold text-[#E4171E] tabular-nums font-mono">
                      + {formatBRL(bev.product.price * bev.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[#E8E0D5] flex justify-between items-center font-bold text-sm text-[#1C1C1C]">
              <span>TOTAL DO PEDIDO:</span>
              <span className="text-[#E4171E] text-base tabular-nums font-mono">{formatBRL(totalOrderPrice)}</span>
            </div>
          </section>
        </div>

        {/* Footer with Quantity & Actions */}
        <div className="p-3 sm:p-5 bg-white border-t border-[#E8E0D5] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
          {/* Quantity Controls for the pizza */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center bg-[#F5EFE6] border border-[#E8E0D5] rounded-xl p-1 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="p-1.5 sm:p-2 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                aria-label="Diminuir quantidade de pizza"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-bold text-[#1C1C1C] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="p-1.5 sm:p-2 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                aria-label="Aumentar quantidade de pizza"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <span className="text-[11px] text-[#6B6B6B] sm:hidden font-medium">Qtd. de pizza</span>
          </div>

          {/* Action buttons: Secondary "Continuar sem bebida" + Primary "ADICIONAR AO PEDIDO" */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto flex-1 sm:justify-end">
            {isPizza && beveragesList.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmWithoutBeverages}
                className="px-4 py-3 rounded-xl border border-[#E8E0D5] hover:bg-[#F5EFE6] text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center"
              >
                Continuar sem bebida
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmWithBeverages}
              className="flex-1 sm:flex-initial sm:min-w-[280px] min-h-[48px] py-3.5 px-4 sm:px-6 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-98 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-between gap-2 sm:gap-3 cursor-pointer uppercase tracking-wide"
            >
              <span>ADICIONAR AO PEDIDO</span>
              <span className="font-mono text-xs sm:text-base tabular-nums shrink-0">
                — {formatBRL(totalOrderPrice)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
