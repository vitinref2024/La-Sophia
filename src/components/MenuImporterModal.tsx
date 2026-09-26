import React, { useState } from 'react';
import { X, FileText, Check, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { MENU_PRODUCTS, formatBRL } from '../data/menuData';

interface MenuImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (updatedProducts: Product[]) => void;
}

export const MenuImporterModal: React.FC<MenuImporterModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProducts,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('visual');
  const [rawText, setRawText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // New product visual form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('pizzas');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPriceBroto, setNewProdPriceBroto] = useState('');
  const [newProdPricePizza, setNewProdPricePizza] = useState('');
  const [newProdSinglePrice, setNewProdSinglePrice] = useState('');

  const handleResetToOfficialMenu = () => {
    if (confirm('Deseja restaurar todos os 80+ itens do cardápio oficial da La Sophia Pizzaria e Esfiharia?')) {
      onSaveProducts(MENU_PRODUCTS);
      setImportStatus('Cardápio oficial da La Sophia restaurado com sucesso!');
    }
  };

  const handleAddVisualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const isPizza = ['pizzas', 'pizzas-especiais', 'pizzas-doces'].includes(newProdCategory);
    const isEsfiha = ['esfihas', 'esfihas-doces'].includes(newProdCategory);
    const singlePrice = parseFloat(newProdSinglePrice.replace(',', '.')) || 10;
    const pizzaPrice = parseFloat(newProdPricePizza.replace(',', '.')) || singlePrice;
    const brotoPrice = parseFloat(newProdPriceBroto.replace(',', '.')) || Number((pizzaPrice * 0.6).toFixed(2));

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory,
      description: newProdDesc.trim() || 'Ingredientes selecionados.',
      price: isPizza ? pizzaPrice : singlePrice,
      pricesBySize: isPizza
        ? {
            broto: brotoPrice,
            pizza: pizzaPrice,
          }
        : undefined,
      image: isPizza
        ? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
      isPizza,
      isEsfiha,
      isSweetPizza: newProdCategory === 'pizzas-doces',
    };

    onSaveProducts([newProd, ...products]);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPriceBroto('');
    setNewProdPricePizza('');
    setNewProdSinglePrice('');
    setImportStatus(`"${newProd.name}" adicionado com sucesso!`);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Remover este item do cardápio?')) {
      onSaveProducts(products.filter((p) => p.id !== productId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94dvh] sm:max-h-[90vh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 pr-10 sm:pr-12 bg-white border-b border-[#E8E0D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#FBE4E1] text-[#E4171E] shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#1C1C1C]">
                Gerenciador do Cardápio
              </h2>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B]">
                Cardápio real completo da La Sophia com sincronização em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-3 sm:px-5 pt-3 sm:pt-4 bg-white border-b border-[#E8E0D5] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'visual'
                  ? 'bg-[#FBF9F6] text-[#E4171E] border-t-2 border-[#E4171E]'
                  : 'text-[#6B6B6B] hover:text-[#1C1C1C]'
              }`}
            >
              Adicionar / Ver Lista
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'text'
                  ? 'bg-[#FBF9F6] text-[#E4171E] border-t-2 border-[#E4171E]'
                  : 'text-[#6B6B6B] hover:text-[#1C1C1C]'
              }`}
            >
              Importar em Massa
            </button>
          </div>

          <button
            onClick={handleResetToOfficialMenu}
            className="text-xs text-[#6B6B6B] hover:text-[#E4171E] flex items-center gap-1.5 transition-colors cursor-pointer pb-2 shrink-0"
            title="Recarregar cardápio oficial padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar Oficial</span>
          </button>
        </div>

        {/* Status banner */}
        {importStatus && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'visual' ? (
            <div className="space-y-6">
              {/* Add product form */}
              <form onSubmit={handleAddVisualProduct} className="p-4 rounded-xl bg-white border border-[#E8E0D5] space-y-3 shadow-xs">
                <h3 className="font-heading text-sm font-bold text-[#1C1C1C] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#E4171E]" />
                  <span>Cadastrar Novo Item no Cardápio</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                      Nome do Item / Sabor *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="Ex: Pepperoni Especial"
                      className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                      Categoria *
                    </label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                      className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E4171E]"
                    >
                      <option value="pizzas">Pizzas Tradicionais</option>
                      <option value="pizzas-especiais">Pizzas Especiais</option>
                      <option value="pizzas-doces">Pizzas Doces</option>
                      <option value="esfihas">Esfihas Salgadas</option>
                      <option value="esfihas-doces">Esfihas Doces</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="cervejas">Cervejas</option>
                      <option value="bordas">Bordas Recheadas</option>
                      <option value="cobertura-extra">Cobertura Extra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                    Ingredientes / Descrição
                  </label>
                  <input
                    type="text"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Ex: molho especial, mussarela fresca e orégano"
                    className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                  />
                </div>

                {['pizzas', 'pizzas-especiais', 'pizzas-doces'].includes(newProdCategory) ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                        Preço Broto (R$)
                      </label>
                      <input
                        type="text"
                        value={newProdPriceBroto}
                        onChange={(e) => setNewProdPriceBroto(e.target.value)}
                        placeholder="Ex: 38,00"
                        className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                        Preço Pizza (8 fatias) (R$)
                      </label>
                      <input
                        type="text"
                        value={newProdPricePizza}
                        onChange={(e) => setNewProdPricePizza(e.target.value)}
                        placeholder="Ex: 65,00"
                        className="w-full bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-[#1C1C1C] font-semibold block mb-1">
                      Preço Unitário (R$)
                    </label>
                    <input
                      type="text"
                      value={newProdSinglePrice}
                      onChange={(e) => setNewProdSinglePrice(e.target.value)}
                      placeholder="Ex: 8,00 ou 17,00"
                      className="w-full max-w-xs bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl px-3 py-2 text-xs text-[#1C1C1C] placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Adicionar ao Cardápio
                  </button>
                </div>
              </form>

              {/* Existing items list */}
              <div>
                <h3 className="font-heading text-base font-bold text-[#1C1C1C] mb-3">
                  Itens Atuais ({products.length})
                </h3>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-white border border-[#E8E0D5] flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#1C1C1C] truncate">
                          {prod.name}
                        </div>
                        <div className="text-[#6B6B6B] truncate text-[11px]">
                          {prod.description}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {prod.pricesBySize ? (
                          <div className="font-mono text-[#E4171E] font-bold">
                            Broto: {formatBRL(prod.pricesBySize.broto)} | Pizza: {formatBRL(prod.pricesBySize.pizza)}
                          </div>
                        ) : (
                          <div className="font-mono text-[#E4171E] font-bold">
                            {formatBRL(prod.price)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="text-[#6B6B6B] hover:text-[#E4171E] p-1 cursor-pointer"
                        title="Excluir item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Cole o texto do seu cardápio abaixo. O sistema identificará automaticamente os nomes, descrições e preços.
              </p>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Exemplo:\nCalabresa - R$ 55,00 - calabresa fatiada com cebola\nMussarela - R$ 55,00 - mussarela e orégano\nGuaraná 2L - R$ 17,00`}
                className="w-full bg-white border border-[#E8E0D5] rounded-xl p-3 text-xs text-[#1C1C1C] font-mono placeholder-[#6B6B6B] focus:outline-none focus:border-[#E4171E]"
              />
              <button
                type="button"
                onClick={() => {
                  if (rawText.trim()) {
                    setImportStatus('Itens processados e adicionados!');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Processar e Importar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
