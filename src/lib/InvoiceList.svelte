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
    ignoreYearEndCalculations: boolean;
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
    notes: string;
    status: 'draft' | 'sent' | 'paid';
  }

  export let show: boolean;
  export let savedInvoices: SavedInvoice[];

  const dispatch = createEventDispatcher();

  let filterStatus: 'all' | 'draft' | 'sent' | 'paid' = 'all';
  let filterCustomer = '';
  let sortBy: 'date' | 'customer' | 'amount' | 'status' = 'date';
  let sortOrder: 'asc' | 'desc' = 'desc';
  let viewMode: 'grid' | 'list' = 'list';

  $: filteredInvoices = savedInvoices
    .filter(invoice => {
      const statusMatch = filterStatus === 'all' || invoice.status === filterStatus;
      const customerMatch = !filterCustomer || 
        invoice.customerSnapshot.name.toLowerCase().includes(filterCustomer.toLowerCase());
      return statusMatch && customerMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          break;
        case 'customer':
          comparison = a.customerSnapshot.name.localeCompare(b.customerSnapshot.name);
          break;
        case 'amount':
          comparison = a.calculationResult.priceWithVat - b.calculationResult.priceWithVat;
          break;
        case 'status':
          const statusOrder = { 'draft': 0, 'sent': 1, 'paid': 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  $: statusCounts = savedInvoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  $: totalValue = filteredInvoices.reduce((sum, invoice) => 
    sum + invoice.calculationResult.priceWithVat, 0);

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

  function clearFilters() {
    filterStatus = 'all';
    filterCustomer = '';
    sortBy = 'date';
    sortOrder = 'desc';
  }
</script>

{#if show}
  <div class="modal-overlay" role="button" aria-label="Close modal" tabindex="0" on:click={handleClose} on:keydown={handleModalKeydown}>
    <div class="modal" role="document" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <div class="modal-header">
        <div class="header-main">
          <h2>Tallennetut Laskut</h2>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{filteredInvoices.length}</span>
              <span class="stat-label">laskua</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{totalValue.toFixed(0)} €</span>
              <span class="stat-label">yhteensä</span>
            </div>
          </div>
        </div>
        
        <div class="status-overview">
          <div class="status-item">
            <span class="status-count badge badge-warning">{statusCounts.draft || 0}</span>
            <span class="status-text">Luonnosta</span>
          </div>
          <div class="status-item">
            <span class="status-count badge badge-info">{statusCounts.sent || 0}</span>
            <span class="status-text">Lähetettyä</span>
          </div>
          <div class="status-item">
            <span class="status-count badge badge-success">{statusCounts.paid || 0}</span>
            <span class="status-text">Maksettua</span>
          </div>
        </div>
        
        <button class="modal-close btn-secondary" on:click={handleClose} aria-label="Sulje">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="controls-section">
        <div class="filters-row">
          <div class="filter-group">
            <label for="status-filter">Tila:</label>
            <select id="status-filter" bind:value={filterStatus} class="filter-select">
              <option value="all">Kaikki</option>
              <option value="draft">Luonnos</option>
              <option value="sent">Lähetetty</option>
              <option value="paid">Maksettu</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="customer-filter">Asiakas:</label>
            <input 
              id="customer-filter"
              type="text" 
              bind:value={filterCustomer} 
              placeholder="Hae asiakasta..."
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label for="sort-select">Järjestä:</label>
            <select id="sort-select" bind:value={sortBy} class="filter-select">
              <option value="date">Päivämäärä</option>
              <option value="customer">Asiakas</option>
              <option value="amount">Summa</option>
              <option value="status">Tila</option>
            </select>
          </div>
          
          <button 
            class="sort-order-btn" 
            on:click={() => sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'}
            title={sortOrder === 'asc' ? 'Nouseva järjestys' : 'Laskeva järjestys'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              {#if sortOrder === 'asc'}
                <path d="M7 14l5-5 5 5"/>
              {:else}
                <path d="M7 10l5 5 5-5"/>
              {/if}
            </svg>
          </button>
          
          <div class="view-controls">
            <button 
              class="view-btn {viewMode === 'list' ? 'active' : ''}"
              on:click={() => viewMode = 'list'}
              title="Lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button 
              class="view-btn {viewMode === 'grid' ? 'active' : ''}"
              on:click={() => viewMode = 'grid'}
              title="Ruudukko"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
          
          {#if filterStatus !== 'all' || filterCustomer}
            <button class="clear-filters-btn btn-secondary btn-sm" on:click={clearFilters}>
              Tyhjennä suodattimet
            </button>
          {/if}
        </div>
      </div>
      
      <div class="modal-body">
        {#if filteredInvoices.length === 0}
          <div class="empty-state text-center">
            {#if savedInvoices.length === 0}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h3 class="mb-2">Ei tallennettuja laskuja</h3>
              <p class="text-gray-600">Luo ensimmäinen lasku asiakkaalle aloittaaksesi</p>
            {:else}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <h3 class="mb-2">Ei tuloksia</h3>
              <p class="text-gray-600">Kokeile muuttaa hakuehtoja</p>
            {/if}
          </div>
        {:else}
          {#if viewMode === 'list'}
            <div class="invoices-table">
              <div class="table-header">
                <div class="col-customer">Asiakas</div>
                <div class="col-period">Kausi</div>
                <div class="col-amount">Summa</div>
                <div class="col-status">Tila</div>
                <div class="col-notes">Muistiinpanot</div>
                <div class="col-date">Luotu</div>
                <div class="col-actions">Toiminnot</div>
              </div>
              
              {#each filteredInvoices as invoice}
                <div class="table-row" class:paid={invoice.status === 'paid'}>
                  <div class="col-customer">
                    <div class="customer-info">
                      <span class="customer-name">{invoice.customerSnapshot.name}</span>
                      <span class="company-type badge {invoice.customerSnapshot.companyType === 'oy' ? 'badge-info' : 'badge-warning'}">
                        {invoice.customerSnapshot.companyType.toUpperCase()}
                      </span>
                    </div>
                    {#if invoice.description}
                      <div class="invoice-description">{invoice.description}</div>
                    {/if}
                  </div>
                  
                  <div class="col-period">
                    <div class="period-dates">
                      {formatDateRange(invoice.calculationParams.billingPeriodStart, invoice.calculationParams.billingPeriodEnd)}
                    </div>
                    <div class="period-details">
                      {invoice.calculationParams.employees} hlö • {invoice.calculationResult.averageMonthlyHours.toFixed(1)}h/kk
                    </div>
                  </div>
                  
                  <div class="col-amount">
                    <div class="amount-without-vat">{invoice.calculationResult.priceWithoutVat.toFixed(2)} €</div>
                    <div class="amount-with-vat">{invoice.calculationResult.priceWithVat.toFixed(2)} € (sis. ALV)</div>
                  </div>
                  
                  <div class="col-status">
                    <span class="status-badge badge {getStatusClass(invoice.status)}">
                      {getStatusText(invoice.status)}
                    </span>
                    <div class="complexity-indicator">
                      <span class="complexity-badge badge {getComplexityLevel(invoice.calculationResult.marginCoefficient).class}">
                        {getComplexityLevel(invoice.calculationResult.marginCoefficient).text}
                      </span>
                    </div>
                  </div>
                  
                  <div class="col-notes">
                    {#if invoice.notes}
                      <div class="notes-preview" title={invoice.notes}>
                        {invoice.notes.length > 50 ? invoice.notes.substring(0, 50) + '...' : invoice.notes}
                      </div>
                    {:else}
                      <div class="notes-empty">-</div>
                    {/if}
                  </div>
                  
                  <div class="col-date">
                    {formatDate(invoice.createdDate)}
                  </div>
                  
                  <div class="col-actions">
                    <div class="action-buttons">
                      <button class="btn-icon" on:click={() => handleOpenInvoice(invoice)} title="Tarkastele">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button class="btn-icon" on:click={() => handleEditInvoice(invoice)} title="Muokkaa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn-icon btn-danger" on:click={() => handleDeleteInvoice(invoice.id)} title="Poista">
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
          {:else}
            <div class="invoices-grid">
              {#each filteredInvoices as invoice}
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
                      {#if invoice.notes}
                        <div class="detail-row">
                          <span class="detail-label">Muistiinpanot:</span>
                          <span class="detail-value notes-text">{invoice.notes}</span>
                        </div>
                      {/if}
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
        {/if}
      </div>

      <div class="modal-footer">
        <div class="footer-summary">
          Näytetään {filteredInvoices.length} / {savedInvoices.length} laskua
          {#if filteredInvoices.length > 0}
            • Yhteensä: {totalValue.toFixed(2)} €
          {/if}
        </div>
        <button class="btn btn-secondary" on:click={handleClose}>Sulje</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    width: 100%;
    max-width: 1200px;
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-main h2 {
    font-size: var(--font-size-xl);
    color: var(--color-gray-900);
    margin: 0;
  }

  .header-stats {
    display: flex;
    gap: var(--spacing-4);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-primary);
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-gray-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-overview {
    display: flex;
    gap: var(--spacing-6);
    padding: var(--spacing-3);
    background: var(--color-gray-50);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-gray-200);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .status-count {
    font-weight: 600;
    min-width: 24px;
    text-align: center;
  }

  .status-text {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }

  .modal-close {
    position: absolute;
    top: var(--spacing-4);
    right: var(--spacing-4);
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

  .controls-section {
    border-bottom: 1px solid var(--color-gray-200);
    padding-bottom: var(--spacing-4);
    margin-bottom: var(--spacing-4);
  }

  .filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    align-items: end;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    min-width: 120px;
  }

  .filter-group label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .filter-select,
  .filter-input {
    padding: var(--spacing-2);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    background: white;
  }

  .filter-input {
    min-width: 150px;
  }

  .sort-order-btn {
    padding: var(--spacing-2);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    background: white;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .sort-order-btn:hover {
    background: var(--color-gray-50);
  }

  .view-controls {
    display: flex;
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .view-btn {
    padding: var(--spacing-2);
    border: none;
    background: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    border-right: 1px solid var(--color-gray-300);
  }

  .view-btn:last-child {
    border-right: none;
  }

  .view-btn:hover {
    background: var(--color-gray-50);
  }

  .view-btn.active {
    background: var(--color-primary);
    color: white;
  }

  .clear-filters-btn {
    margin-left: auto;
  }

  .invoices-table {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr 1fr 1fr;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    background: var(--color-gray-50);
    border-bottom: 1px solid var(--color-gray-200);
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr 1fr 1fr;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-gray-100);
    transition: background-color var(--transition-fast);
  }

  .table-row:hover {
    background: var(--color-gray-50);
  }

  .table-row.paid {
    background: var(--color-green-50);
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .customer-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-1);
  }

  .customer-name {
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .invoice-description {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    margin-top: var(--spacing-1);
  }

  .period-dates {
    font-weight: 500;
    color: var(--color-gray-900);
    margin-bottom: var(--spacing-1);
  }

  .period-details {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
  }

  .amount-without-vat {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
  }

  .amount-with-vat {
    font-weight: 600;
    color: var(--color-gray-900);
    margin-top: var(--spacing-1);
  }

  .complexity-indicator {
    margin-top: var(--spacing-1);
  }

  .complexity-badge {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
  }

  .notes-preview {
    font-size: var(--font-size-sm);
    color: var(--color-gray-600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: help;
  }

  .notes-empty {
    font-size: var(--font-size-sm);
    color: var(--color-gray-400);
    font-style: italic;
  }

  .notes-text {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
    font-style: italic;
    line-height: 1.4;
  }

  .col-notes {
    min-width: 0;
    overflow: hidden;
  }

  .action-buttons {
    display: flex;
    gap: var(--spacing-1);
  }

  .btn-icon {
    padding: var(--spacing-1);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius-sm);
    background: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon:hover {
    background: var(--color-gray-50);
  }

  .btn-icon.btn-danger:hover {
    background: var(--color-red-50);
    border-color: var(--color-red-300);
    color: var(--color-red-600);
  }

  .invoices-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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

  .empty-state {
    padding: var(--spacing-16) var(--spacing-8);
  }

  .empty-icon {
    color: var(--color-gray-400);
    margin-bottom: var(--spacing-4);
  }

  @media (max-width: 768px) {
    .modal {
      max-width: 100%;
    }

    .header-main {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-2);
    }

    .status-overview {
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .filters-row {
      flex-direction: column;
      align-items: stretch;
    }

    .view-controls {
      align-self: center;
    }

    .table-header {
      display: none;
    }

    .table-row {
      grid-template-columns: 1fr;
      gap: var(--spacing-2);
      padding: var(--spacing-4);
    }

    .invoices-grid {
      grid-template-columns: 1fr;
    }

    .modal-footer {
      flex-direction: column;
      gap: var(--spacing-2);
      align-items: stretch;
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