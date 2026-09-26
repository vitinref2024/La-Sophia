import React from 'react';
import { MapPin, Phone, Clock, CreditCard, Banknote, QrCode, UtensilsCrossed } from 'lucide-react';
import { PizzeriaInfo } from '../types';
import { getPizzeriaStatus } from '../utils/businessHours';
import { LaSophiaLogoBadge } from './LaSophiaLogoBadge';

interface FooterProps {
  pizzeria: PizzeriaInfo;
}

export const Footer: React.FC<FooterProps> = ({ pizzeria }) => {
  const status = getPizzeriaStatus();

  return (
    <footer className="bg-[#111111] border-t border-[#222222] text-neutral-400 text-xs py-12 pb-32 lg:pb-14">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <LaSophiaLogoBadge
                logoUrl={pizzeria.logoImage}
                pizzeriaName={pizzeria.name}
                size="md"
              />
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight [overflow-wrap:anywhere]">
                {pizzeria.name}
              </h3>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed [overflow-wrap:anywhere]">
              Pizzas artesanais assadas no forno a lenha com fermentação natural, ingredientes nobres e entrega rápida.
            </p>
            <p className="text-neutral-500 text-[11px] [overflow-wrap:anywhere]">
              Peça online e finalize em segundos pelo WhatsApp.
            </p>
          </div>

          {/* Col 2: Horários & Entrega */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Atendimento & Horários
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#E4171E] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="text-neutral-300 block font-medium">Ter, Qua, Qui e Dom</span>
                    <span className="text-neutral-400">18:00 às 23:30</span>
                  </div>
                  <div>
                    <span className="text-neutral-300 block font-medium">Sexta e Sábado</span>
                    <span className="text-emerald-400 font-semibold">18:00 às 00:00</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 pl-6 [overflow-wrap:anywhere]">
                Segunda-feira: Fechado para descanso da equipe.
              </p>
              <div className="pt-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                    status.isOpen
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                    }`}
                  />
                  <span>{status.statusText} · {status.details}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Col 3: Localização & Contato */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Endereço & Pedidos
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E4171E] shrink-0 mt-0.5" />
                <span className="[overflow-wrap:anywhere]">{pizzeria.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E4171E] shrink-0" />
                <span>WhatsApp: {pizzeria.displayPhone}</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 [overflow-wrap:anywhere]">
              Atendemos pedidos para entrega em domicílio e retirada no balcão da loja.
            </p>
          </div>

          {/* Col 4: Formas de Pagamento */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">
              Formas de Pagamento Aceitas
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pix</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dinheiro</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Vale-Refeição</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 [overflow-wrap:anywhere]">
              Aceitamos Pix, Dinheiro, Cartão e Vale-Refeição na entrega e na retirada.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-neutral-800 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-500 text-[11px]">
          <p className="[overflow-wrap:anywhere]">
            © {new Date().getFullYear()} {pizzeria.name}. Todos os direitos reservados.
          </p>
          <p className="[overflow-wrap:anywhere]">
            Forno a Lenha Tradicional · Pizzas & Esfihas Artesanais
          </p>
        </div>
      </div>
    </footer>
  );
};
