import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchBar } from './components/SearchBar';
import { CategoryNav, PrimaryFilter } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { LazyCategorySection } from './components/LazyCategorySection';
import { PizzaModal, ConfiguredPizzaPayload } from './components/PizzaModal';
import { BeveragesUpsellModal } from './components/BeveragesUpsellModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { MobileCartBar } from './components/MobileCartBar';
import { CompareDrawer } from './components/CompareDrawer';
import { FloatingCategoriesButton } from './components/FloatingCategoriesButton';
import { CategoriesSheetModal } from './components/CategoriesSheetModal';
import { Footer } from './components/Footer';
import { FavoritesModal } from './components/FavoritesModal';
import { RecentOrdersModal } from './components/RecentOrdersModal';
import { MenuImporterModal } from './components/MenuImporterModal';
import { MENU_PRODUCTS, PIZZERIA_DEFAULT_INFO, CATEGORIES, calculateMultiFlavorPizzaPrice } from './data/menuData';
import { CartItem, PizzeriaInfo, Product, RecentOrder } from './types';
import { LayoutList, LayoutGrid, SearchX, AlertCircle, MessageCircle, Flame, Heart, Clock, AlertTriangle } from 'lucide-react';
import { openWhatsApp } from './utils/whatsapp';
import { getFavoriteIds, toggleFavoriteId, getRecentOrders, clearRecentOrders } from './utils/storage';
import { searchProducts } from './utils/smartSearch';

const CART_STORAGE_KEY = 'lasophia_cart_v2';
const SETTINGS_STORAGE_KEY = 'lasophia_settings_v2';
const PRODUCTS_STORAGE_KEY = 'lasophia_products_v3';

export default function App() {

  // Pizzeria settings state
  const [pizzeria, setPizzeria] = useState<PizzeriaInfo>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const address =
          !parsed.address || parsed.address === 'Atendimento Delivery e Balcão'
            ? PIZZERIA_DEFAULT_INFO.address
            : parsed.address;
        const whatsappNumber =
          !parsed.whatsappNumber || parsed.whatsappNumber === '5511999999999'
            ? PIZZERIA_DEFAULT_INFO.whatsappNumber
            : parsed.whatsappNumber;
        const displayPhone =
          !parsed.displayPhone || parsed.displayPhone === '(11) 99999-9999'
            ? PIZZERIA_DEFAULT_INFO.displayPhone
            : parsed.displayPhone;
        return {
          ...PIZZERIA_DEFAULT_INFO,
          ...parsed,
          address: PIZZERIA_DEFAULT_INFO.address,
          neighborhood: PIZZERIA_DEFAULT_INFO.neighborhood,
          city: PIZZERIA_DEFAULT_INFO.city,
          state: PIZZERIA_DEFAULT_INFO.state,
          cep: PIZZERIA_DEFAULT_INFO.cep,
          whatsappNumber,
          displayPhone,
          openingHours: PIZZERIA_DEFAULT_INFO.openingHours,
          pixKey: '66708233000151',
        };
      }
    } catch {
      // fallback
    }
    return PIZZERIA_DEFAULT_INFO;
  });

  // Master products list: ALWAYS sourced directly from official MENU_PRODUCTS
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      // Completely remove all previous product cache keys from localStorage
      localStorage.removeItem('lasophia_products_v1');
      localStorage.removeItem('lasophia_products_v2');
      localStorage.removeItem('lasophia_products_v3');
      localStorage.removeItem('lasophia_products');
    } catch {
      // ignore
    }
    return MENU_PRODUCTS;
  });

  // Cart state (synced with official product images on load)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const officialMap = new Map(MENU_PRODUCTS.map((p) => [p.id, p]));
          return parsed.map((item) => {
            const official = officialMap.get(item.product.id);
            const updatedProd = official && official.image ? { ...item.product, image: official.image } : item.product;
            const updatedFlavors = item.flavors?.map((flv) => {
              const offFlv = officialMap.get(flv.id);
              return offFlv && offFlv.image ? { ...flv, image: offFlv.image } : flv;
            });
            return { ...item, product: updatedProd, flavors: updatedFlavors };
          });
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Flow State: Step 2 (Beverages & Complements Upsell after Pizza configuration)
  const [isBeveragesUpsellOpen, setIsBeveragesUpsellOpen] = useState(false);
  const [lastConfiguredPizzaName, setLastConfiguredPizzaName] = useState<string>('');

  // Uninformed price alert state (for item 12 - Beringela)
  const [uninformedPriceItem, setUninformedPriceItem] = useState<Product | null>(null);

  // Search and Category filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const [specialFilter, setSpecialFilter] = useState<PrimaryFilter>(null);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteIds());
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  // Recent Orders state
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>(() => getRecentOrders());
  const [isRecentOrdersModalOpen, setIsRecentOrdersModalOpen] = useState(false);

  // View mode: 'compact' (default, per user request) or 'grid'
  const [viewMode, setViewMode] = useState<'compact' | 'grid'>('compact');

  // Comparison feature state
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  // Quick Categories Sheet state
  const [isCategoriesSheetOpen, setIsCategoriesSheetOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(pizzeria));
    } catch (e) {
      console.warn('Erro ao salvar configurações no localStorage', e);
    }
  }, [pizzeria]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Erro ao salvar carrinho no localStorage', e);
    }
  }, [cartItems]);

  // ==================== URL ROUTING & NAVIGATION ====================
  const navigateTo = (path: string, replace = false) => {
    try {
      if (window.location.pathname !== path) {
        const query = window.location.search || '';
        const fullTarget = path + query;
        if (replace) {
          window.history.replaceState(null, '', fullTarget);
        } else {
          window.history.pushState(null, '', fullTarget);
        }
      }
    } catch {
      // fallback
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    navigateTo('/carrinho');
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    if (window.location.pathname === '/carrinho' || window.location.pathname === '/cart') {
      navigateTo('/', true);
    }
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    navigateTo('/checkout');
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    if (window.location.pathname === '/checkout') {
      navigateTo('/', true);
    }
  };

  const handleOpenRecentOrders = () => {
    setIsRecentOrdersModalOpen(true);
    navigateTo('/pedidos');
  };

  const handleCloseRecentOrders = () => {
    setIsRecentOrdersModalOpen(false);
    if (window.location.pathname === '/pedidos' || window.location.pathname === '/meus-pedidos') {
      navigateTo('/', true);
    }
  };

  const handleOpenFavorites = () => {
    setIsFavoritesModalOpen(true);
    navigateTo('/favoritos');
  };

  const handleCloseFavorites = () => {
    setIsFavoritesModalOpen(false);
    if (window.location.pathname === '/favoritos') {
      navigateTo('/', true);
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    navigateTo('/admin');
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.pathname === '/admin' || window.location.pathname === '/painel') {
      navigateTo('/', true);
    }
  };

  // Favorite handlers
  const handleToggleFavorite = useCallback((product: Product) => {
    const { updatedList } = toggleFavoriteId(product.id);
    setFavoriteIds(updatedList);
  }, []);

  const favoriteProducts = useMemo(() => {
    return products.filter((p) => favoriteIds.includes(p.id));
  }, [products, favoriteIds]);

  // Reorder handler
  const handleReorder = (order: RecentOrder) => {
    const freshItems: CartItem[] = order.items.map((item) => ({
      ...item,
      cartItemId: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }));

    setCartItems((prev) => [...prev, ...freshItems]);
    setIsRecentOrdersModalOpen(false);
    setIsCartOpen(true);
  };

  const handleClearHistory = () => {
    clearRecentOrders();
    setRecentOrders([]);
  };

  // Cart calculations
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  // Category options with counts for quick sheet navigation
  const categoryOptions = useMemo(() => {
    const realCategories = CATEGORIES.filter((c) => c.id !== 'todas');
    return realCategories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      count: products.filter((p) => p.category === cat.id).length,
    }));
  }, [products]);

  const highlightsCount = useMemo(() => {
    return products.filter((p) => p.popular || Boolean(p.tag)).length;
  }, [products]);

  // Smart Search & 2-Level Category Filters
  const filteredProducts = useMemo(() => {
    // 1. Run intelligent search (fuzzy match, typos, ingredients, description, code)
    let list = searchProducts(products, searchTerm);

    // 2. Apply level 1 special filters (Destaques | Favoritos)
    if (specialFilter === 'destaques') {
      list = list.filter((p) => p.popular || Boolean(p.tag));
    } else if (specialFilter === 'favoritos') {
      list = list.filter((p) => favoriteIds.includes(p.id));
    }

    return list;
  }, [products, searchTerm, specialFilter, favoriteIds]);

  const activeScopeLabel = useMemo(() => {
    if (specialFilter === 'destaques') return 'Destaques';
    if (specialFilter === 'favoritos') return 'Favoritos';
    return '';
  }, [specialFilter]);

  const handleResetAllFilters = useCallback(() => {
    setSearchTerm('');
    setSpecialFilter(null);
    setActiveCategory('todas');
  }, []);

  // Group filtered products into real category sections based on CATEGORIES
  const categorySections = useMemo(() => {
    const realCategories = CATEGORIES.filter((c) => c.id !== 'todas');

    return realCategories
      .map((cat) => {
        const catProducts = filteredProducts.filter((p) => p.category === cat.id);
        return {
          id: cat.id,
          label: cat.label,
          products: catProducts,
        };
      })
      .filter((section) => section.products.length > 0);
  }, [filteredProducts]);

  // ==================== ORDER FLOW STEPS ====================

  // STEP 1: Pizza configured -> Add to Cart with optional selected beverages & Close modal directly to preserve exact cardápio scroll position
  const handleAddPizzaToCart = (
    configuredItem: ConfiguredPizzaPayload,
    selectedBeverages?: Array<{ product: Product; quantity: number }>
  ) => {
    // Collect all chosen flavors
    const rawFlavors = configuredItem.flavors && configuredItem.flavors.length > 0
      ? configuredItem.flavors
      : (configuredItem.isHalfHalf && configuredItem.secondFlavor ? [configuredItem.product, configuredItem.secondFlavor] : [configuredItem.product]);

    const size = configuredItem.size || 'pizza';
    // Max 3 flavors for 8 slices, max 2 for broto
    const maxAllowedFlavors = size === 'broto' ? 2 : 3;
    const finalFlavors = rawFlavors.slice(0, maxAllowedFlavors);

    // Guaranteed calculation on logic/backend side: Highest price among selected flavors
    const safeBasePrice = calculateMultiFlavorPizzaPrice(finalFlavors, size);
    const safeCrustPrice = configuredItem.crust ? configuredItem.crust.price : 0;
    const safeExtraPrice = (configuredItem.extraToppings || []).reduce((acc, e) => acc + e.price, 0)
      || (configuredItem.extraTopping ? configuredItem.extraTopping.price : 0);
    const safeUnitPrice = safeBasePrice + safeCrustPrice + safeExtraPrice;

    const newItem: CartItem = {
      cartItemId: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      product: configuredItem.product,
      size: configuredItem.size,
      isHalfHalf: finalFlavors.length === 2,
      secondFlavor: finalFlavors[1] || undefined,
      flavors: finalFlavors,
      crust: configuredItem.crust,
      extraTopping: configuredItem.extraTopping,
      extraToppings: configuredItem.extraToppings,
      quantity: Math.max(1, configuredItem.quantity || 1),
      unitPrice: safeUnitPrice,
      notes: configuredItem.notes,
    };

    const beverageCartItems: CartItem[] = (selectedBeverages || []).map((bev) => ({
      cartItemId: `${Date.now()}_bev_${Math.random().toString(36).substring(2, 9)}`,
      product: bev.product,
      quantity: bev.quantity,
      unitPrice: bev.product.price,
    }));

    setCartItems((prev) => [...prev, newItem, ...beverageCartItems]);
    setSelectedProductForModal(null); // Closes customization modal directly; user remains at exact cardápio position
  };

  // STEP 2 FINISHED: Beverages & Complements confirmed -> Add to cart & Proceed to Step 3 (Cart Drawer)
  const handleConfirmBeveragesUpsell = (complements: Array<{ product: Product; quantity: number }>) => {
    const newItems: CartItem[] = complements.map((comp) => ({
      cartItemId: `${Date.now()}_upsell_${Math.random().toString(36).substring(2, 9)}`,
      product: comp.product,
      quantity: comp.quantity,
      unitPrice: comp.product.price,
    }));

    setCartItems((prev) => [...prev, ...newItems]);
    setIsBeveragesUpsellOpen(false);

    // STEP 3: Automatically open Cart Drawer with complete order
    setIsCartOpen(true);
  };

  // STEP 2 SKIPPED: Continue without adding drinks -> Proceed directly to Step 3 (Cart Drawer)
  const handleSkipBeveragesUpsell = () => {
    setIsBeveragesUpsellOpen(false);
    // STEP 3: Open Cart Drawer
    setIsCartOpen(true);
  };

  // Adding single non-pizza item directly (esfihas, drinks, etc.)
  const handleAddDirectItem = (prod: Product) => {
    const newItem: CartItem = {
      cartItemId: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      product: prod,
      quantity: 1,
      unitPrice: prod.price,
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  // Adding complement (e.g. sweet esfiha from upsell) directly without closing modal or switching screens
  const handleAddComplement = (prod: Product) => {
    const newItem: CartItem = {
      cartItemId: `${Date.now()}_upsell_${Math.random().toString(36).substring(2, 9)}`,
      product: prod,
      quantity: 1,
      unitPrice: prod.price,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleEditItem = (item: CartItem) => {
    handleRemoveItem(item.cartItemId);
    setIsCartOpen(false);
    setSelectedProductForModal(item.product);
  };

  const handleClearCart = () => {
    if (confirm('Deseja realmente esvaziar seu carrinho?')) {
      setCartItems([]);
    }
  };

  const handleOrderCompleted = () => {
    setCartItems([]);
    setRecentOrders(getRecentOrders());
  };

  // Compare handlers
  const handleToggleCompare = useCallback((product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let updated: Product[];
      if (exists) {
        updated = prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), product];
        } else {
          updated = [...prev, product];
        }
      }
      setIsCompareOpen(updated.length > 0);
      return updated;
    });
  }, []);

  const handleSelectProduct = useCallback((prod: Product) => {
    if (prod.uninformedPrice) {
      setUninformedPriceItem(prod);
      return;
    }
    if (prod.isPizza || prod.isSweetPizza) {
      setSelectedProductForModal(prod);
    } else {
      handleAddDirectItem(prod);
    }
  }, []);

  const handleAssembleHalfHalf = (p1: Product) => {
    setIsCompareOpen(false);
    setSelectedProductForModal(p1);
  };

  const handleStartHalfHalfFromHero = () => {
    const firstPizza = products.find((p) => p.isPizza) || products[0];
    if (firstPizza) {
      setSelectedProductForModal(firstPizza);
    } else {
      handleCategoryNavigation('pizzas');
    }
  };

  const handleConsultUninformedItem = (prod: Product) => {
    const msg = `Olá! Gostaria de consultar o preço e disponibilidade do sabor "${prod.name}" (${prod.description}) do cardápio da ${pizzeria.name}.`;
    openWhatsApp(pizzeria.whatsappNumber, msg);
    setUninformedPriceItem(null);
  };

  // Navigation and Scrollspy logic
  const isManualScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const handleCategoryNavigation = (categoryId: string, updateUrl = true) => {
    // Clear special filter (Destaques/Favoritos) so full category is visible
    setSpecialFilter(null);
    if (searchTerm) {
      setSearchTerm('');
    }

    setActiveCategory(categoryId);

    if (updateUrl) {
      const urlPath = categoryId === 'todas' ? '/cardapio' : `/${categoryId}`;
      navigateTo(urlPath, true);
    }

    // Suppress scrollspy updates while programmatic scroll is taking place
    isManualScrollRef.current = true;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isManualScrollRef.current = false;
    }, 900);

    const targetId = categoryId === 'todas' ? 'cardapio' : categoryId;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const headerHeight = window.innerWidth >= 640 ? 64 : 56;
          const navHeight = 48;
          const breathingRoom = 12;
          const totalOffset = headerHeight + navHeight + breathingRoom;

          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth',
          });
        }
      }, 40);
    });
  };

  const handleToggleSpecialFilter = (filter: 'destaques' | 'favoritos') => {
    if (specialFilter === filter) {
      setSpecialFilter(null);
      setActiveCategory('todas');
    } else {
      setSpecialFilter(filter);
      const menuEl = document.getElementById('cardapio');
      if (menuEl) {
        const headerHeight = window.innerWidth >= 640 ? 64 : 56;
        const navHeight = 48;
        const totalOffset = headerHeight + navHeight + 12;
        const elementPosition = menuEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - totalOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }
  };

  // Scrollspy: update active category tab as user scrolls through the menu
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrollRef.current || specialFilter !== null) return;

      const menuEl = document.getElementById('cardapio');
      if (!menuEl) return;

      const headerHeight = window.innerWidth >= 640 ? 64 : 56;
      const navHeight = 48;
      const headerOffset = headerHeight + navHeight + 16;

      const menuTop = menuEl.getBoundingClientRect().top;
      // If user is at or above the top of the menu, highlight 'todas'
      if (menuTop > headerOffset) {
        setActiveCategory('todas');
        return;
      }

      const realCategories = CATEGORIES.filter((c) => c.id !== 'todas');
      let currentActive = 'todas';

      for (const cat of realCategories) {
        const el = document.getElementById(cat.id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= headerOffset + 40) {
            currentActive = cat.id;
          }
        }
      }

      setActiveCategory(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [specialFilter]);

  // Process URL route on load & on popstate (browser back/forward button)
  useEffect(() => {
    const handleRoute = (pathname: string) => {
      // Handle fallback query param ?route=... (e.g. from static hosts like 404.html)
      const searchParams = new URLSearchParams(window.location.search);
      const routeParam = searchParams.get('route');
      const cleanPath = (routeParam || pathname).toLowerCase().trim().replace(/\/+$/, '') || '/';

      if (routeParam) {
        window.history.replaceState(null, '', cleanPath);
      }

      if (cleanPath === '' || cleanPath === '/') {
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      if (cleanPath === '/carrinho' || cleanPath === '/cart') {
        setIsCartOpen(true);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      if (cleanPath === '/checkout') {
        setIsCheckoutOpen(true);
        setIsCartOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      if (cleanPath === '/pedidos' || cleanPath === '/meus-pedidos' || cleanPath === '/historico') {
        setIsRecentOrdersModalOpen(true);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      if (cleanPath === '/favoritos') {
        setIsFavoritesModalOpen(true);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      if (cleanPath === '/admin' || cleanPath === '/painel' || cleanPath === '/gerenciar') {
        setIsAdminOpen(true);
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        return;
      }

      if (cleanPath === '/cardapio' || cleanPath === '/menu') {
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        handleCategoryNavigation('todas', false);
        return;
      }

      // Check category paths like /pizzas, /esfihas, /bebidas, /pizzas-doces, etc.
      const categorySlug = cleanPath.replace(/^\//, '');
      const matchedCategory = CATEGORIES.find(
        (c) => c.id === categorySlug || c.id === categorySlug.replace(/s$/, '')
      );
      if (matchedCategory) {
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        handleCategoryNavigation(matchedCategory.id, false);
        return;
      }

      if (cleanPath === '/' || cleanPath === '') {
        // Página inicial: preserva query string (?admin=1)
        setIsCartOpen(false);
        setIsCheckoutOpen(false);
        setIsRecentOrdersModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsAdminOpen(false);
        return;
      }

      // Safe fallback for any unrecognized URL: clean up to '/' without error, preservando query string
      const currentQuery = window.location.search || '';
      window.history.replaceState(null, '', '/' + currentQuery);
    };

    handleRoute(window.location.pathname);

    const onPopState = () => {
      handleRoute(window.location.pathname);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#F5EFE6] text-[#1C1C1C] flex flex-col selection:bg-[#E4171E] selection:text-white w-full max-w-full">
      {/* Header (Fixo no topo: Logo compacto + Status discreto + Carrinho com contador) */}
      <Header
        pizzeria={pizzeria}
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        onOpenCart={handleOpenCart}
      />

      {/* Hero Section (Fundo forno a lenha, status 1 linha, título forte, botões de alta conversão, atalhos e card compacto) */}
      <Hero
        pizzeria={pizzeria}
        onNavigateCategory={handleCategoryNavigation}
        onAssembleHalfHalf={handleStartHalfHalfFromHero}
        onOpenWhatsApp={() =>
          openWhatsApp(pizzeria.whatsappNumber, `Olá! Gostaria de fazer um pedido na ${pizzeria.name}.`)
        }
      />

      {/* Sticky & Smart Category Navigation Bar (Always accessible, scrollspy, horizontal auto-scroll) */}
      <CategoryNav
        primaryFilter={specialFilter}
        onSelectPrimaryFilter={handleToggleSpecialFilter}
        activeCategory={activeCategory}
        onSelectCategory={handleCategoryNavigation}
        favoritesCount={favoriteIds.length}
        onOpenCategoriesSheet={() => setIsCategoriesSheetOpen(true)}
      />

      {/* Main Menu Area: max-w-[1200px] central container */}
      <main id="cardapio" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-36 lg:pb-16">
        {/* Section Heading & Compact Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#E8E0D5] pb-6">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[#E4171E] block mb-1">
              Cardápio Completo Oficial
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#1C1C1C] tracking-tight">
              Escolha seu Sabor
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1 max-w-xl mx-auto sm:mx-0">
              Pizzas (Broto e Tradicional 8 fatias), Esfihas, Bebidas e Bordas Recheadas. Monte seu pedido e envie direto para o WhatsApp.
            </p>
          </div>

          {/* Action Tools: View Mode Toggle & Menu Manager */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-[#E4171E] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1C1C1C]'
                }`}
                title="Modo Lista Compacta (Fácil comparação)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compacto</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#E4171E] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1C1C1C]'
                }`}
                title="Modo Grade"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grade</span>
              </button>
            </div>

            {/* Quick Favorites Button */}
            <button
              type="button"
              onClick={() => {
                if (specialFilter === 'favoritos') {
                  setSpecialFilter(null);
                  setActiveCategory('todas');
                } else {
                  setSpecialFilter('favoritos');
                }
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                specialFilter === 'favoritos'
                  ? 'bg-[#E4171E] text-white border-[#E4171E]'
                  : 'bg-[#FBF9F6] hover:bg-white border-[#E8E0D5] text-[#1C1C1C]'
              }`}
              title="Meus produtos favoritos"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  specialFilter === 'favoritos'
                    ? 'fill-white text-white'
                    : favoriteIds.length > 0
                    ? 'fill-[#E4171E] text-[#E4171E]'
                    : 'text-[#6B6B6B]'
                }`}
              />
              <span className="hidden sm:inline">Favoritos</span>
              {favoriteIds.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    specialFilter === 'favoritos'
                      ? 'bg-white text-[#E4171E]'
                      : 'bg-[#E4171E] text-white'
                  }`}
                >
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {/* Quick Recent Orders Button */}
            <button
              type="button"
              onClick={handleOpenRecentOrders}
              className="px-3 py-2 rounded-xl bg-[#FBF9F6] hover:bg-white border border-[#E8E0D5] text-[#1C1C1C] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Últimos pedidos realizados"
            >
              <Clock className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="hidden sm:inline">Últimos Pedidos</span>
              {recentOrders.length > 0 && (
                <span className="text-[10px] font-bold bg-neutral-700 text-white px-1.5 py-0.2 rounded-full">
                  {recentOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search by Flavor or Product */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
          totalResultsCount={filteredProducts.length}
          scopeLabel={activeScopeLabel}
        />

        {/* Empty Favorites State */}
        {specialFilter === 'favoritos' && favoriteIds.length === 0 ? (
          <div className="bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-[#FBE4E1] text-[#E4171E] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#1C1C1C] mb-2">
              Nenhum produto nos favoritos
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed mb-6">
              Toque no ícone de coração nos itens do cardápio para salvar suas pizzas, esfihas e bebidas preferidas e encontrá-las rapidamente aqui.
            </p>
            <button
              type="button"
              onClick={() => {
                setSpecialFilter(null);
                setActiveCategory('todas');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Ver Todo o Cardápio
            </button>
          </div>
        ) : categorySections.length > 0 ? (
          <div className="space-y-8 sm:space-y-12">
            {categorySections.map((section, sectionIdx) => (
              <LazyCategorySection
                key={section.id}
                id={section.id}
                label={section.label}
                products={section.products}
                viewMode={viewMode}
                comparedProducts={comparedProducts}
                favoriteIds={favoriteIds}
                specialFilter={specialFilter}
                searchTerm={searchTerm}
                initialRender={sectionIdx < 2}
                onToggleCompare={handleToggleCompare}
                onToggleFavorite={handleToggleFavorite}
                onSelectProduct={handleSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center max-w-md mx-auto bg-[#FBF9F6] rounded-2xl border border-[#E8E0D5] p-8 shadow-xs">
            {specialFilter === 'favoritos' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[#FBE4E1] flex items-center justify-center mx-auto text-[#E4171E] mb-4">
                  <Heart className="w-7 h-7 fill-[#E4171E]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#1C1C1C] mb-2">
                  Nenhum produto favoritado
                </h3>
                <p className="text-xs text-[#6B6B6B] mb-6 leading-relaxed">
                  Você ainda não marcou nenhum produto como favorito. Toque no ícone de coração nos produtos para salvar suas preferências e acessá-las com rapidez.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Ver Todo o Cardápio
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-[#F5EFE6] flex items-center justify-center mx-auto text-[#6B6B6B] mb-4">
                  <SearchX className="w-7 h-7 text-[#E4171E]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-[#1C1C1C] mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] mb-6 leading-relaxed">
                  {searchTerm.trim()
                    ? `Não encontramos nenhum item correspondente a "${searchTerm}". Tente buscar por número do sabor (ex: "01", "17") ou por ingredientes.`
                    : 'Não há itens disponíveis para os filtros selecionados no momento.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Limpar Busca e Filtros
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Compare Drawer (When comparing flavors) */}
      <CompareDrawer
        isOpen={isCompareOpen && comparedProducts.length > 0}
        onClose={() => setIsCompareOpen(false)}
        comparedProducts={comparedProducts}
        onRemoveProduct={(id) =>
          setComparedProducts((prev) => prev.filter((p) => p.id !== id))
        }
        onClearAll={() => {
          setComparedProducts([]);
          setIsCompareOpen(false);
        }}
        onSelectProduct={(prod) => {
          setIsCompareOpen(false);
          setSelectedProductForModal(prod);
        }}
        onAssembleHalfHalf={handleAssembleHalfHalf}
      />

      {/* Footer */}
      <Footer
        pizzeria={pizzeria}
      />

      {/* Mobile Sticky Cart Bar */}
      <MobileCartBar
        itemCount={cartCount}
        total={cartSubtotal}
        onOpenCart={handleOpenCart}
      />

      {/* Discrete Floating "CATEGORIAS" Button during scrolling */}
      <FloatingCategoriesButton
        onOpenCategories={() => setIsCategoriesSheetOpen(true)}
        onScrollToTop={() => {
          const el = document.getElementById('cardapio');
          if (el) {
            const headerOffset = window.innerWidth >= 640 ? 64 : 56;
            const pos = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({ top: Math.max(0, pos), behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        hasCartItems={cartCount > 0}
      />

      {/* Quick Categories Navigation Sheet Modal */}
      <CategoriesSheetModal
        isOpen={isCategoriesSheetOpen}
        onClose={() => setIsCategoriesSheetOpen(false)}
        categories={categoryOptions}
        activeCategory={activeCategory}
        specialFilter={specialFilter}
        onSelectCategory={handleCategoryNavigation}
        onSelectSpecialFilter={handleToggleSpecialFilter}
        favoritesCount={favoriteIds.length}
        highlightsCount={highlightsCount}
      />

      {/* STEP 1: Pizza Selection & Configuration Modal */}
      {selectedProductForModal && (
        <PizzaModal
          product={selectedProductForModal}
          allProducts={products}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={handleAddPizzaToCart}
        />
      )}

      {/* STEP 2: Bebidas e Upsell Modal (Acompanhamentos) */}
      <BeveragesUpsellModal
        isOpen={isBeveragesUpsellOpen}
        onClose={handleSkipBeveragesUpsell}
        allProducts={products}
        onConfirmComplements={handleConfirmBeveragesUpsell}
        onSkip={handleSkipBeveragesUpsell}
        pizzaName={lastConfiguredPizzaName}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        items={cartItems}
        subtotal={cartSubtotal}
        deliveryFee={pizzeria.deliveryFee}
        deliveryType="entrega"
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onEditItem={handleEditItem}
        onClearCart={handleClearCart}
        allProducts={products}
        onAddComplement={handleAddComplement}
        onProceedToCheckout={handleOpenCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        items={cartItems}
        subtotal={cartSubtotal}
        pizzeria={pizzeria}
        onOrderCompleted={handleOrderCompleted}
        allProducts={products}
        onAddComplement={handleAddComplement}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={handleCloseFavorites}
        favoriteProducts={favoriteProducts}
        onToggleFavorite={handleToggleFavorite}
        onSelectProduct={(prod) => {
          if (prod.uninformedPrice) {
            setUninformedPriceItem(prod);
            return;
          }
          if (prod.isPizza || prod.isSweetPizza) {
            setSelectedProductForModal(prod);
          } else {
            handleAddDirectItem(prod);
          }
        }}
      />

      {/* Recent Orders Modal */}
      <RecentOrdersModal
        isOpen={isRecentOrdersModalOpen}
        onClose={handleCloseRecentOrders}
        orders={recentOrders}
        onReorder={handleReorder}
        onClearHistory={handleClearHistory}
      />

      {/* Admin Menu Importer / Manager Modal */}
      <MenuImporterModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        products={products}
        onSaveProducts={(updated) => {
          setProducts(updated);
          try {
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Erro ao salvar produtos no localStorage', e);
          }
        }}
      />

      {/* Modal for Uninformed Price Item (Item 12 - Beringela) */}
      {uninformedPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl p-5 sm:p-6 text-[#1C1C1C] shadow-2xl my-auto">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#1C1C1C] mb-2">
              {uninformedPriceItem.name}
            </h3>
            <p className="text-xs text-[#1C1C1C] leading-relaxed mb-3">
              Ingredientes: {uninformedPriceItem.description}
            </p>
            <p className="text-xs text-[#6B6B6B] leading-relaxed mb-6">
              O valor deste produto não está informado na tabela impressa do cardápio. Você pode consultar o preço e disponibilidade diretamente pelo WhatsApp da pizzaria.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setUninformedPriceItem(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#E8E0D5] text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer text-center"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleConsultUninformedItem(uninformedPriceItem)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
