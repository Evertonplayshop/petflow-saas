import { useMemo, useState } from 'react';
import { ExternalLink, MessageCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  createWhatsAppActionUrl,
  WHATSAPP_TEMPLATE_PRESETS,
} from '../integrations/whatsapp/waMe';
import { interpolateWhatsAppTemplate } from '../utils/whatsapp';

export function WhatsAppPage() {
  const { activeTenant } = useAuth();
  const [selectedPresetId, setSelectedPresetId] = useState(
    WHATSAPP_TEMPLATE_PRESETS[0].id
  );
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [petName, setPetName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedPreset = useMemo(
    () =>
      WHATSAPP_TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId) ??
      WHATSAPP_TEMPLATE_PRESETS[0],
    [selectedPresetId]
  );

  const variables = useMemo(
    () => ({
      cliente: customerName,
      pet: petName,
      servico: serviceName,
      data: dateStr,
      horario: timeStr,
      pedido: orderNumber,
      status: orderStatus,
      empresa: activeTenant?.name ?? 'PETFLOW Pet Shop',
    }),
    [
      customerName,
      petName,
      serviceName,
      dateStr,
      timeStr,
      orderNumber,
      orderStatus,
      activeTenant?.name,
    ]
  );

  const previewMessage = useMemo(
    () => interpolateWhatsAppTemplate(selectedPreset.body, variables),
    [selectedPreset.body, variables]
  );

  const waUrl = useMemo(
    () => createWhatsAppActionUrl(phone, selectedPreset.body, variables),
    [phone, selectedPreset.body, variables]
  );

  const handleCopy = async () => {
    if (!waUrl || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(waUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível em contexto restrito
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E9F4EE] text-[#102D27]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[#102D27]">
              Central de Atendimento Manual via WhatsApp (wa.me)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#5C6B66]">
              Arquitetura preparada para disparo manual assistido por links <code className="font-mono text-[#102D27]">https://wa.me</code> sem automação não autorizada nesta etapa. Os modelos salvos por empresa são persistidos na tabela <code className="font-mono text-[#102D27]">message_templates</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Template Selector + Variables Form */}
        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5 lg:col-span-7 space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#102D27]">
              1. Escolha o contexto da mensagem
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WHATSAPP_TEMPLATE_PRESETS.map((preset) => {
                const isActive = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`rounded-lg border px-3.5 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#102D27] bg-[#EEF9F3] text-[#102D27]'
                        : 'border-[#DDE6E1] bg-white text-[#5C6B66] hover:border-[#BFD1C7] hover:text-[#102D27]'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#EDF2EF] pt-4">
            <p className="text-xs font-semibold text-[#102D27]">
              2. Preencha os dados para montar o link wa.me
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="wa-phone"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  WhatsApp do cliente (com DDD)
                </label>
                <input
                  id="wa-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99988-7766"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-customer"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Nome do tutor
                </label>
                <input
                  id="wa-customer"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-pet"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Nome do pet
                </label>
                <input
                  id="wa-pet"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Ex: Thor"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-service"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Serviço
                </label>
                <input
                  id="wa-service"
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Banho e Tosa Higiênica"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-date"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Data
                </label>
                <input
                  id="wa-date"
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="Ex: 24/11"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-time"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Horário
                </label>
                <input
                  id="wa-time"
                  type="text"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  placeholder="Ex: 14:30"
                  className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
              </div>

              {selectedPreset.category === 'order_update' && (
                <>
                  <div>
                    <label
                      htmlFor="wa-order"
                      className="block text-xs font-medium text-[#102D27]"
                    >
                      Número do pedido
                    </label>
                    <input
                      id="wa-order"
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Ex: 1042"
                      className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wa-status"
                      className="block text-xs font-medium text-[#102D27]"
                    >
                      Status do pedido
                    </label>
                    <input
                      id="wa-status"
                      type="text"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      placeholder="Ex: Pronto para retirada"
                      className="mt-1 h-9 w-full rounded-lg border border-[#DDE6E1] px-3 text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Live Preview & Link Launcher */}
        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5 lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#102D27]">
                Prévia da mensagem gerada
              </h3>
              <p className="mt-0.5 text-xs text-[#5C6B66]">
                O texto é codificado diretamente na URL oficial do WhatsApp.
              </p>
            </div>

            <div className="rounded-lg border border-[#DDE6E1] bg-[#F4F7F5] p-4 text-xs leading-relaxed text-[#102D27]">
              {previewMessage}
            </div>

            <div>
              <p className="text-[11px] font-medium text-[#5C6B66]">
                URL gerada
              </p>
              <p className="mt-1 break-all rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-2.5 font-mono text-[11px] text-[#20483B]">
                {waUrl || 'Informe o telefone do cliente para gerar o link wa.me.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#EDF2EF] pt-4">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-xs font-medium text-white transition-colors hover:bg-[#20483B] whitespace-nowrap"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir conversa no WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#CBD8D1] px-4 text-xs font-medium text-white cursor-not-allowed whitespace-nowrap"
              >
                Informe o telefone
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              disabled={!waUrl}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#DDE6E1] bg-white px-3.5 text-xs font-medium text-[#102D27] transition-colors hover:bg-[#F4F7F5] disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#20483B]" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar link
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
