<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Customer {
    id: string;
    name: string;
    companyType: 'toiminimi' | 'oy';
    email?: string;
    phone?: string;
    address?: string;
    createdDate: string;
  }

  interface CalculationParameters {
    hourlyRate: number;
    accountingSoftware: number;
    employees: number;
    salaryPaymentPrice: number;
    totalHoursLastThreeMonths: number;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    marginFactors: {
      foreignTrade: boolean;
      cashOperations: boolean;
      ecommerce: boolean;
      import: boolean;
      assetsInBalance: boolean;
      investments: boolean;
      limitedCompany: boolean;
      vatLiable: boolean;
      manualBankStatement: boolean;
    };
    previousYearInvoicing: number;
    yearEndAccountingStartDate: string;
    yearEndAccountingEndDate: string;
    isFirstMonth: boolean;
  }

  interface InvoiceCalculation {
    averageMonthlyHours: number;
    hourlyWork: number;
    totalSubtotal: number;
    marginCoefficient: number;
    marginAmount: number;
    yearEndAccounting: number;
    priceWithoutVat: number;
    priceWithVat: number;
    customerMargin: number;
  }

  interface SavedInvoice {
    id: string;
    customerSnapshot: Customer;
    calculationParams: CalculationParameters;
    calculationResult: InvoiceCalculation;
    createdDate: string;
    description: string;
    status: 'draft' | 'sent' | 'paid';
  }

  export let show: boolean;
  export let savedInvoices: SavedInvoice[];

  const dispatch = createEventDispatcher();

  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleOpenInvoice(invoice: SavedInvoice) {
    dispatch('open-invoice', invoice);
  }

  function handleEditInvoice(invoice: SavedInvoice) {
    dispatch('edit-invoice', invoice);
  }

  function handleDeleteInvoice(invoiceId: string) {
    dispatch('delete-invoice', invoiceId);
  }

  function handleClose() {
    dispatch('close');
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'badge-warning';
      case 'sent':
        return 'badge-info';
      case 'paid':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'draft':
        return 'Luonnos';
      case 'sent':
        return 'Lähetetty';
      case 'paid':
        return 'Maksettu';
      default:
        return 'Tuntematon';
    }
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  function formatDateRange(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'Ei määritelty';
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  }

  function getMarginFactorCount(marginFactors: any): number {
    return Object.values(marginFactors).filter(Boolean).length;
  }

  function getComplexityLevel(marginCoefficient: number): { text: string, class: string } {
    if (marginCoefficient <= 0.2) return { text: 'Matala', class: 'badge-success' };
    if (marginCoefficient <= 0.4) return { text: 'Keskitaso', class: 'badge-warning' };
    return { text: 'Korkea', class: 'badge-danger' };
  }
</script>

{#if show}
  <div class="modal-overlay" role="button" aria-label="Close modal" tabindex="0" on:click={handleClose} on:keydown={handleModalKeydown}>
    <div class="modal" role="document" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <div class="modal-header">
        <h2>Tallennetut Laskut</h2>
        <div class="invoice-count badge badge-info">
          {savedInvoices.length} laskua
        </div>
        <button class="modal-close btn-secondary" on:click={handleClose} aria-label="Sulje">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        {#if savedInvoices.length === 0}
          <div class="empty-state text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h3 class="mb-2">Ei tallennettuja laskuja</h3>
            <p class="text-gray-600">Luo ensimmäinen lasku asiakkaalle aloittaaksesi</p>
          </div>
        {:else}
          <div class="invoices-list">
            {#each savedInvoices as invoice}
              <div class="invoice-card card">
                <div class="card-body">
                  <div class="invoice-header mb-4">
                    <div class="invoice-customer">
                      <h3 class="customer-name">{invoice.customerSnapshot.name}</h3>
                      <div class="company-type badge {invoice.customerSnapshot.companyType === 'oy' ? 'badge-info' : 'badge-warning'}">
                        {invoice.customerSnapshot.companyType.toUpperCase()}
                      </div>
                    </div>
                    <div class="invoice-status">
                      <div class="status-badge badge {getStatusClass(invoice.status)}">
                        {getStatusText(invoice.status)}
                      </div>
                    </div>
                  </div>

                  <!-- Billing Period Section -->
                  <div class="billing-period-section mb-3">
                    <div class="section-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span class="section-title">Laskutuskausi</span>
                    </div>
                    <div class="period-info">
                      {formatDateRange(invoice.calculationParams.billingPeriodStart, invoice.calculationParams.billingPeriodEnd)}
                    </div>
                    {#if invoice.calculationParams.yearEndAccountingStartDate && invoice.calculationParams.yearEndAccountingEndDate}
                      <div class="year-end-period">
                        <span class="year-end-label">Tilinpäätöstyöt:</span>
                        {formatDateRange(invoice.calculationParams.yearEndAccountingStartDate, invoice.calculationParams.yearEndAccountingEndDate)}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Key Metrics Section -->
                  <div class="metrics-section mb-4">
                    <div class="metrics-grid">
                      <div class="metric-item">
                        <span class="metric-label">Henkilöstö</span>
                        <span class="metric-value">{invoice.calculationParams.employees} hlö</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">Keskitunnit/kk</span>
                        <span class="metric-value">{invoice.calculationResult.averageMonthlyHours.toFixed(1)} h</span>
                      </div>
                      <div class="metric-item">
                        <span class="metric-label">Monimutkaisuus</span>
                        <span class="metric-value">
                          <span class="complexity-badge badge {getComplexityLevel(invoice.calculationResult.marginCoefficient).class}">
                            {getComplexityLevel(invoice.calculationResult.marginCoefficient).text}
                          </span>
                        </span>
                      </div>
                      {#if invoice.calculationResult.yearEndAccounting > 0}
                        <div class="metric-item">
                          <span class="metric-label">Tilinpäätös</span>
                          <span class="metric-value year-end-amount">{invoice.calculationResult.yearEndAccounting.toFixed(2)} €</span>
                        </div>
                      {/if}
                    </div>
                  </div>

                  <div class="invoice-details mb-4">
                    <div class="detail-row">
                      <span class="detail-label">Kuvaus:</span>
                      <span class="detail-value">{invoice.description}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Hinta (ALV 0%):</span>
                      <span class="detail-value price">{invoice.calculationResult.priceWithoutVat.toFixed(2)} €</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Hinta (sis. ALV):</span>
                      <span class="detail-value price-with-vat">{invoice.calculationResult.priceWithVat.toFixed(2)} €</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Luotu:</span>
                      <span class="detail-value">{formatDate(invoice.createdDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-footer">
                  <div class="invoice-actions flex gap-2">
                    <button class="btn btn-primary btn-sm" on:click={() => handleOpenInvoice(invoice)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Tarkastele
                    </button>
                    <button class="btn btn-secondary btn-sm" on:click={() => handleEditInvoice(invoice)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Muokkaa
                    </button>
                    <button class="btn btn-danger btn-sm" on:click={() => handleDeleteInvoice(invoice.id)} title="Poista lasku">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={handleClose}>Sulje</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    width: 100%;
    max-width: 900px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }

  .modal-header h2 {
    font-size: var(--font-size-xl);
    color: var(--color-gray-900);
    margin-right: auto;
  }

  .invoice-count {
    font-size: var(--font-size-sm);
  }

  .modal-close {
    padding: var(--spacing-2);
    background: none;
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    color: var(--color-gray-500);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .modal-close:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-700);
  }

  .empty-state {
    padding: var(--spacing-16) var(--spacing-8);
  }

  .empty-icon {
    color: var(--color-gray-400);
    margin-bottom: var(--spacing-4);
  }

  .invoices-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .invoice-card {
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .invoice-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .invoice-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
  }

  .invoice-customer {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex: 1;
    min-width: 0;
  }

  .customer-name {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .invoice-status {
    flex-shrink: 0;
  }

  .status-badge {
    font-weight: 500;
  }

  /* Billing Period Section */
  .billing-period-section {
    background: var(--color-gray-50);
    border-radius: var(--border-radius);
    padding: var(--spacing-3);
    border-left: 4px solid var(--color-primary);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-2);
  }

  .section-icon {
    color: var(--color-primary);
  }

  .section-title {
    font-weight: 600;
    color: var(--color-gray-900);
    font-size: var(--font-size-sm);
  }

  .period-info {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--spacing-1);
  }

  .year-end-period {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
  }

  .year-end-label {
    font-weight: 500;
    margin-right: var(--spacing-2);
  }

  /* Metrics Section */
  .metrics-section {
    background: var(--color-gray-50);
    border-radius: var(--border-radius);
    padding: var(--spacing-3);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-3);
  }

  .metric-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--spacing-2);
    background: white;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-gray-200);
  }

  .metric-label {
    font-size: var(--font-size-xs);
    color: var(--color-gray-600);
    font-weight: 500;
    margin-bottom: var(--spacing-1);
  }

  .metric-value {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .complexity-badge {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
  }

  .year-end-amount {
    color: var(--color-primary);
  }

  .invoice-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-gray-100);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    font-weight: 500;
  }

  .detail-value {
    font-size: var(--font-size-sm);
    color: var(--color-gray-900);
  }

  .price {
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .price-with-vat {
    font-weight: 700;
    color: var(--color-primary);
    font-size: var(--font-size-base);
  }

  .invoice-actions {
    width: 100%;
  }

  @media (max-width: 768px) {
    .modal {
      max-width: 100%;
    }

    .invoice-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-2);
    }
    
    .invoice-customer {
      width: 100%;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-1);
    }
    
    .invoice-actions {
      flex-direction: column;
    }
    
    .invoice-actions .btn {
      justify-content: center;
    }
  }
</style>