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
    yearEndInstallmentNumber: number;
    yearEndTotalInstallments: number;
    // Add option to ignore year-end calculations
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

  interface PricingSettings {
    hourlyRate: number;
    accountingSoftware: number;
    salaryPaymentPrice: number;
    firstMonthFee: number;
    vatRate: number;
    yearEndMinimumSoleTrader: number;
    yearEndMinimumLimitedCompany: number;
    yearEndPeriodStartMonth: number;
    yearEndPeriodStartDay: number;
    yearEndPeriodEndMonth: number;
    yearEndPeriodEndDay: number;
    defaultMarginFactors: {
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
  }

  export let show: boolean;
  export let selectedCustomer: Customer | null;
  export let calculationParams: CalculationParameters;
  export let calculationResult: InvoiceCalculation | null;
  export let invoiceDescription: string;
  export let invoiceNotes: string;
  export let invoiceStatus: 'draft' | 'sent' | 'paid';
  export let pricingSettings: PricingSettings;
  export let isEditMode: boolean = false;
  // Add smart view mode props
  export let isViewMode: boolean = false;
  export let originalCalculationParams: CalculationParameters | null = null;
  export let selectedInvoice: any = null;

  const dispatch = createEventDispatcher();

  // Track if calculation parameters have changed from original
  let hasCalculationParamsChanged = false;
  
  // Watch for changes in calculation parameters to detect when we need to switch modes
  $: if (isViewMode && originalCalculationParams) {
    hasCalculationParamsChanged = checkCalculationParamsChanged();
  }

  function checkCalculationParamsChanged(): boolean {
    if (!originalCalculationParams) return false;
    
    // Check key calculation parameters that would require recalculation
    const keyParams: (keyof CalculationParameters)[] = [
      'hourlyRate', 'accountingSoftware', 'employees', 'salaryPaymentPrice',
      'totalHoursLastThreeMonths', 'billingPeriodStart', 'billingPeriodEnd',
      'previousYearInvoicing', 'isFirstMonth', 'yearEndInstallmentNumber',
      'yearEndTotalInstallments', 'ignoreYearEndCalculations'
    ];
    
    for (const param of keyParams) {
      if (calculationParams[param] !== originalCalculationParams[param]) {
        return true;
      }
    }
    
    // Check margin factors
    const marginKeys: (keyof typeof calculationParams.marginFactors)[] = [
      'foreignTrade', 'cashOperations', 'ecommerce', 'import', 'assetsInBalance',
      'investments', 'limitedCompany', 'vatLiable', 'manualBankStatement'
    ];
    for (const key of marginKeys) {
      if (calculationParams.marginFactors[key] !== originalCalculationParams.marginFactors[key]) {
        return true;
      }
    }
    
    return false;
  }

  // Initialize default billing period (next 2 months) if not set
  $: if (calculationParams && (!calculationParams.billingPeriodStart || !calculationParams.billingPeriodEnd)) {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const twoMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    
    calculationParams.billingPeriodStart = nextMonth.toISOString().split('T')[0];
    calculationParams.billingPeriodEnd = twoMonthsLater.toISOString().split('T')[0];
  }

  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleCalculate() {
    if (selectedCustomer) {
      const result = calculateInvoice(selectedCustomer);
      dispatch('calculate', result);
    }
  }

  function calculateInvoice(customer: Customer): InvoiceCalculation {
    // 1. Calculate average monthly hours
    const averageMonthlyHours = calculationParams.totalHoursLastThreeMonths / 3;
    
    // 2. Calculate billing period multiplier (for display purposes only)
    const startDate = new Date(calculationParams.billingPeriodStart);
    const endDate = new Date(calculationParams.billingPeriodEnd);
    const billingPeriodMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                               (endDate.getMonth() - startDate.getMonth()) + 1;
    
    // 3. Calculate hourly work (always for 1 month, regardless of billing period)
    const hourlyWork = averageMonthlyHours * calculationParams.hourlyRate;
    
    // 4. Calculate salary payments (always for 1 month)
    const salaryPayments = calculationParams.employees * calculationParams.salaryPaymentPrice;
    
    // 5. Calculate accounting software cost (always for 1 month)
    const accountingSoftwareCost = calculationParams.accountingSoftware;
    
    // 6. Calculate total subtotal
    const totalSubtotal = hourlyWork + accountingSoftwareCost + salaryPayments;
    
    // 7. Calculate margin coefficient
    const marginFactorCount = Object.values(calculationParams.marginFactors).filter(Boolean).length;
    const marginCoefficient = 0.1 + (marginFactorCount * 0.1);
    const marginAmount = hourlyWork * marginCoefficient;
    
    // 8. Calculate year-end accounting with installment support
    const currentDate = new Date();
    const yearEndStartDate = new Date(calculationParams.yearEndAccountingStartDate);
    const yearEndEndDate = new Date(calculationParams.yearEndAccountingEndDate);
    
    let yearEndAccounting = 0;
    
    // Check if we should include year-end accounting
    const isInTraditionalPeriod = currentDate >= yearEndStartDate && currentDate <= yearEndEndDate;
    const isUsingInstallments = calculationParams.yearEndTotalInstallments > 1;
    const hasValidInstallmentNumber = calculationParams.yearEndInstallmentNumber > 0 && 
                                    calculationParams.yearEndInstallmentNumber <= calculationParams.yearEndTotalInstallments;
    
    // Include year-end accounting if:
    // 1. User hasn't chosen to ignore year-end calculations, AND
    // 2. We're in the traditional period (for both single payments and installments), OR
    // 3. We're using installments with a valid installment number (allows installments outside traditional period)
    if (!calculationParams.ignoreYearEndCalculations && (isInTraditionalPeriod || (isUsingInstallments && hasValidInstallmentNumber))) {
      const baseYearEndPrice = calculationParams.previousYearInvoicing / 12;
      const minimum = customer.companyType === 'oy' 
        ? pricingSettings.yearEndMinimumLimitedCompany 
        : pricingSettings.yearEndMinimumSoleTrader;
      const fullYearEndAmount = Math.max(baseYearEndPrice, minimum);
      
      // Divide by number of installments to get the amount for this installment
      yearEndAccounting = fullYearEndAmount / calculationParams.yearEndTotalInstallments;
    }
    
    // 9. Calculate final prices
    let priceWithoutVat = totalSubtotal + marginAmount + yearEndAccounting;
    
    // Add first month fee if applicable
    if (calculationParams.isFirstMonth) {
      priceWithoutVat += pricingSettings.firstMonthFee;
    }
    
    const priceWithVat = priceWithoutVat * (1 + pricingSettings.vatRate);
    
    // 10. Calculate customer margin
    const customerMargin = hourlyWork + salaryPayments - accountingSoftwareCost + yearEndAccounting;
    
    return {
      averageMonthlyHours,
      hourlyWork,
      totalSubtotal,
      marginCoefficient,
      marginAmount,
      yearEndAccounting,
      priceWithoutVat,
      priceWithVat,
      customerMargin
    };
  }

  function handleSaveInvoice() {
    dispatch('save-invoice', {
      description: invoiceDescription,
      notes: invoiceNotes,
      status: invoiceStatus
    });
  }

  function handleUpdateInvoice() {
    dispatch('update-invoice', {
      description: invoiceDescription,
      notes: invoiceNotes,
      status: invoiceStatus
    });
  }

  function handleClose() {
    dispatch('close');
  }

  function isInYearEndPeriod(): boolean {
    const currentDate = new Date();
    const yearEndStartDate = new Date(calculationParams.yearEndAccountingStartDate);
    const yearEndEndDate = new Date(calculationParams.yearEndAccountingEndDate);
    return currentDate >= yearEndStartDate && currentDate <= yearEndEndDate;
  }

  function calculateYearEndPreview(): number {
    const baseYearEndPrice = calculationParams.previousYearInvoicing / 12;
    return Math.max(baseYearEndPrice, getYearEndMinimum());
  }

  function getYearEndMinimum(): number {
    return selectedCustomer?.companyType === 'oy'
      ? pricingSettings.yearEndMinimumLimitedCompany
      : pricingSettings.yearEndMinimumSoleTrader;
  }
</script>

{#if show && selectedCustomer}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="modal-overlay" role="button" aria-label="Close modal" tabindex="0" on:click={handleClose} on:keydown={handleModalKeydown}>
    <div class="modal calculation-modal" role="document" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <!-- Smart view mode header with context -->
      {#if isViewMode && selectedInvoice}
        <div class="view-mode-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="view-icon">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Tarkastele Laskua - {selectedCustomer.name}
          </h2>
          <div class="invoice-context">
            <span class="invoice-id">Lasku #{selectedInvoice.id.slice(-8)}</span>
            <span class="invoice-date">Luotu: {new Date(selectedInvoice.createdDate).toLocaleDateString()}</span>
          </div>
          {#if hasCalculationParamsChanged}
            <div class="params-changed-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Laskutusparametrit muuttuneet - vaatii uudelleenlaskentaa
              <button class="switch-to-edit-btn" on:click={() => dispatch('switch-to-edit')}>
                Siirry muokkaustilaan
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <h2>{isEditMode ? 'Muokkaa Laskua' : 'Laskutus'} - {selectedCustomer.name}</h2>
      {/if}
      
      <!-- Calculation Parameters Form -->
      <div class="calculation-form">
        <h3>Laskutusparametrit</h3>

        <!-- Smart view mode: Show existing calculation results first if available -->
        {#if isViewMode && calculationResult && !hasCalculationParamsChanged}
          <div class="existing-calculation">
            <h4>Nykyinen laskutustulos</h4>
            <div class="result-row">
              <span>Laskutuskausi:</span>
              <span>{calculationParams.billingPeriodStart} - {calculationParams.billingPeriodEnd}</span>
            </div>
            <div class="result-row">
              <span>Hinta (sis. ALV):</span>
              <span class="price-highlight">{calculationResult.priceWithVat.toFixed(2)} €</span>
            </div>
            <div class="view-mode-actions">
              <button class="secondary-btn" on:click={() => dispatch('switch-to-edit')}>
                Muokkaa parametreja
              </button>
            </div>
          </div>
        {/if}

        <div class="form-group">
          <label for="hourly-rate">Tuntihinta (€):</label>
          <input id="hourly-rate" bind:value={calculationParams.hourlyRate} type="number" step="0.01">
        </div>

        <div class="form-group">
          <label for="accounting-software">Kirjanpito-ohjelma (€/kk):</label>
          <input id="accounting-software" bind:value={calculationParams.accountingSoftware} type="number" step="0.01">
        </div>

        <div class="form-group">
          <label for="employees">Työntekijöiden määrä:</label>
          <input id="employees" bind:value={calculationParams.employees} type="number" min="0">
        </div>

        <div class="form-group">
          <label for="salary-payment">Palkka-ajo hinta per henkilö (€):</label>
          <input id="salary-payment" bind:value={calculationParams.salaryPaymentPrice} type="number" step="0.01">
        </div>

        <div class="form-group">
          <label for="total-hours">Tunnit viimeisen 3 kuukauden ajalta:</label>
          <input id="total-hours" bind:value={calculationParams.totalHoursLastThreeMonths} type="number" placeholder="Yhteensä">
        </div>

        <div class="form-group">
          <label for="billing-period-start">Laskutuskauden alku:</label>
          <input id="billing-period-start" bind:value={calculationParams.billingPeriodStart} type="date">
        </div>

        <div class="form-group">
          <label for="billing-period-end">Laskutuskauden loppu:</label>
          <input id="billing-period-end" bind:value={calculationParams.billingPeriodEnd} type="date">
        </div>

        <div class="form-group">
          <span class="form-label">Marginaalitekijät:</span>
          <div class="checkboxes">
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.foreignTrade}> Ulkomaankauppa</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.cashOperations}> Käteistoiminnot</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.ecommerce}> Verkkokauppa</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.import}> Tuonti</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.assetsInBalance}> Käyttöomaisuus</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.investments}> Sijoitukset</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.limitedCompany}> Osakeyhtiö</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.vatLiable}> ALV-velvollinen</label>
            <label><input type="checkbox" bind:checked={calculationParams.marginFactors.manualBankStatement}> Manuaalinen tiliote</label>
          </div>
        </div>

        <div class="form-group">
          <label for="previous-year">Edellisen vuoden laskutus (€):</label>
          <input id="previous-year" bind:value={calculationParams.previousYearInvoicing} type="number" step="0.01" min="0">
          <!-- Add validation warning -->
          {#if calculationParams.previousYearInvoicing < 0}
            <div class="validation-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Edellisen vuoden laskutus ei voi olla negatiivinen
            </div>
          {/if}
        </div>

        <!-- Add ignore year-end calculations option -->
        <div class="form-group">
          <label class="checkbox-option">
            <input type="checkbox" bind:checked={calculationParams.ignoreYearEndCalculations}>
            <span class="checkbox-text">
              <strong>Ensimmäinen vuosi - ei tilinpäätöslaskutusta</strong>
              <small>Jätä tilinpäätöstyöt pois laskutuksesta (sopii uusille asiakkaille)</small>
            </span>
          </label>
        </div>

        <!-- Add year-end accounting status indicator -->
        <div class="year-end-status">
          {#if isInYearEndPeriod()}
            <div class="status-indicator active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Tilinpäätöskausi aktiivinen ({calculationParams.yearEndAccountingStartDate} - {calculationParams.yearEndAccountingEndDate})
            </div>
          {:else}
            <div class="status-indicator inactive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
              </svg>
              Tilinpäätöskausi ei aktiivinen
            </div>
          {/if}
          
          <!-- Show installment controls always (not just during traditional period) -->
          <div class="installment-controls">
            <div class="form-group-inline">
              <label for="installment-total">Ositus:</label>
              <select id="installment-total" bind:value={calculationParams.yearEndTotalInstallments}>
                <option value={1}>1 osa (koko summa)</option>
                <option value={2}>2 osaa</option>
                <option value={3}>3 osaa</option>
                <option value={4}>4 osaa</option>
                <option value={6}>6 osaa</option>
                <option value={12}>12 osaa</option>
              </select>
            </div>
            
            {#if calculationParams.yearEndTotalInstallments > 1}
              <div class="form-group-inline">
                <label for="installment-number">Tämä lasku on osa:</label>
                <select id="installment-number" bind:value={calculationParams.yearEndInstallmentNumber}>
                  {#each Array(calculationParams.yearEndTotalInstallments).fill(0) as _, i}
                    <option value={i + 1}>{i + 1} / {calculationParams.yearEndTotalInstallments}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>
          
          <div class="year-end-preview">
            {#if !isInYearEndPeriod() && calculationParams.yearEndTotalInstallments > 1}
              <div class="installment-note">
                <span style="color: #ff9800; font-weight: bold;">📅 Ositusmaksu käytössä perinteisen kauden ulkopuolella</span>
              </div>
            {/if}
            {#if calculationParams.previousYearInvoicing > 0}
              <span>Kokonais tilinpäätöshinta: {calculateYearEndPreview().toFixed(2)} €</span>
              {#if calculationParams.yearEndTotalInstallments > 1}
                <span class="installment-info">Tämä osa ({calculationParams.yearEndInstallmentNumber}/{calculationParams.yearEndTotalInstallments}): {(calculateYearEndPreview() / calculationParams.yearEndTotalInstallments).toFixed(2)} €</span>
              {/if}
              <span class="text-muted">({calculationParams.previousYearInvoicing} ÷ 12 = {(calculationParams.previousYearInvoicing / 12).toFixed(2)} €, min. {getYearEndMinimum().toFixed(2)} €)</span>
            {:else}
              <span>Kokonais tilinpäätöshinta: {getYearEndMinimum().toFixed(2)} € (minimihinta)</span>
              {#if calculationParams.yearEndTotalInstallments > 1}
                <span class="installment-info">Tämä osa ({calculationParams.yearEndInstallmentNumber}/{calculationParams.yearEndTotalInstallments}): {(getYearEndMinimum() / calculationParams.yearEndTotalInstallments).toFixed(2)} €</span>
              {/if}
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label><input type="checkbox" bind:checked={calculationParams.isFirstMonth}> Ensimmäinen kuukausi ({pricingSettings.firstMonthFee}€ lisämaksu)</label>
        </div>

        <button class="calculate-btn" on:click={handleCalculate}>
          Laske
        </button>
      </div>

      <!-- Calculation Results -->
      {#if calculationResult}
        <div class="calculation-results">
          <h3>Laskutustulos</h3>
          <div class="result-row">
            <span>Laskutuskausi:</span>
            <span>{calculationParams.billingPeriodStart} - {calculationParams.billingPeriodEnd}</span>
          </div>
          <div class="result-row">
            <span>Keskimääräiset kuukausitunnit:</span>
            <span>{calculationResult.averageMonthlyHours.toFixed(1)} h</span>
          </div>
          <div class="result-row">
            <span>Tuntityö:</span>
            <span>{calculationResult.hourlyWork.toFixed(2)} €</span>
          </div>
          <div class="result-row">
            <span>Välisumma:</span>
            <span>{calculationResult.totalSubtotal.toFixed(2)} €</span>
          </div>
          <div class="result-row">
            <span>Marginaali ({(calculationResult.marginCoefficient * 100).toFixed(0)}%):</span>
            <span>{calculationResult.marginAmount.toFixed(2)} €</span>
          </div>
          {#if calculationResult.yearEndAccounting > 0}
            <div class="result-row">
              <span>Tilinpäätöstyöt:</span>
              <span>{calculationResult.yearEndAccounting.toFixed(2)} €</span>
            </div>
          {/if}
          <div class="result-row total">
            <span>Hinta ilman ALV:</span>
            <span>{calculationResult.priceWithoutVat.toFixed(2)} €</span>
          </div>
          <div class="result-row total">
            <span>Hinta ALV kanssa:</span>
            <span>{calculationResult.priceWithVat.toFixed(2)} €</span>
          </div>
          <div class="result-row margin">
            <span>Asiakas marginaali:</span>
            <span>{calculationResult.customerMargin.toFixed(2)} €</span>
          </div>
        </div>
        
        <!-- Invoice saving/updating form -->
        <div class="save-invoice-form">
          <h3>
            {#if isViewMode && selectedInvoice}
              Päivitä Laskun Tietoja
            {:else if isEditMode}
              Päivitä Lasku
            {:else}
              Tallenna Lasku
            {/if}
          </h3>
          <div class="form-group">
            <label for="invoice-description">Laskun kuvaus:</label>
            <input id="invoice-description" type="text" bind:value={invoiceDescription} placeholder="Esim: Kirjanpito maaliskuu 2025">
          </div>
          <div class="form-group">
            <label for="invoice-notes">Muistiinpanot:</label>
            <textarea id="invoice-notes" bind:value={invoiceNotes} rows="4" placeholder="Lisätietoja, muistiinpanoja tai erityisiä huomautuksia laskusta..."></textarea>
          </div>
          <div class="form-group">
            <label for="invoice-status">Status:</label>
            <select id="invoice-status" bind:value={invoiceStatus}>
              <option value="draft">Luonnos</option>
              <option value="sent">Lähetetty</option>
              <option value="paid">Maksettu</option>
            </select>
          </div>
          {#if isViewMode && selectedInvoice}
            <!-- Smart view mode: Always update existing invoice -->
            <button on:click={handleUpdateInvoice}>Päivitä Tietoja</button>
            {#if hasCalculationParamsChanged}
              <div class="calculation-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                Huom: Laskutusparametrit ovat muuttuneet. Paina "Laske" uudestaan nähdäksesi päivitetyn tuloksen.
              </div>
            {/if}
          {:else if isEditMode}
            <button on:click={handleUpdateInvoice}>Päivitä Lasku</button>
          {:else}
            <button on:click={handleSaveInvoice}>Tallenna Lasku</button>
          {/if}
        </div>
      {/if}

      <div class="modal-actions">
        <button on:click={handleClose}>Sulje</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    width: 90%;
  }

  .calculation-modal {
    max-width: 500px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .checkboxes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .checkboxes label {
    display: flex;
    align-items: center;
    font-weight: normal;
  }

  .checkboxes input {
    width: auto;
    margin-right: 8px;
  }

  .calculation-results {
    margin: 20px 0;
  }

  .result-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .result-row.total {
    font-weight: bold;
    border-bottom: 2px solid #333;
    font-size: 16px;
  }

  .result-row.margin {
    color: #007acc;
    font-weight: bold;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  button {
    padding: 10px 20px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover {
    background: #005a9e;
  }

  .calculate-btn {
    width: 100%;
    margin-top: 15px;
  }

  .validation-warning {
    display: flex;
    align-items: center;
    color: #d9534f;
    font-size: 14px;
    margin-top: 5px;
  }

  .validation-warning svg {
    margin-right: 5px;
  }

  .year-end-status {
    margin-top: 15px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-bottom: 5px;
  }

  .status-indicator.active {
    color: #5cb85c;
  }

  .status-indicator.inactive {
    color: #d9534f;
  }

  .status-indicator svg {
    margin-right: 5px;
  }

  .year-end-preview {
    font-size: 14px;
    color: #333;
  }

  .year-end-preview span {
    display: block;
    margin-bottom: 3px;
  }

  .year-end-preview .text-muted {
    color: #777;
    font-size: 12px;
  }

  .installment-controls {
    margin-top: 10px;
  }

  .form-group-inline {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .form-group-inline label {
    margin-right: 10px;
    font-weight: bold;
    min-width: 120px;
  }

  .form-group-inline select {
    min-width: 150px;
  }

  .installment-info {
    display: block;
    margin-top: 5px;
    font-size: 14px;
    color: #007acc;
    font-weight: bold;
  }

  .installment-note {
    margin-bottom: 5px;
  }

  .checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #f9f9f9;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .checkbox-option:hover {
    background-color: #f0f0f0;
  }

  .checkbox-option input[type="checkbox"] {
    width: auto;
    margin: 0;
    margin-top: 2px;
  }

  .checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checkbox-text strong {
    color: #333;
    font-size: 14px;
  }

  .checkbox-text small {
    color: #666;
    font-size: 12px;
    font-weight: normal;
  }

  .view-mode-header {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #f9f9f9;
  }

  .view-mode-header h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    margin: 0;
  }

  .view-icon {
    color: #007acc;
  }

  .invoice-context {
    display: flex;
    gap: 15px;
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }

  .params-changed-warning {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #d9534f;
    border-radius: 6px;
    background-color: #f9f9f9;
    color: #d9534f;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .params-changed-warning svg {
    flex-shrink: 0;
  }

  .switch-to-edit-btn {
    padding: 5px 10px;
    background: #d9534f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .switch-to-edit-btn:hover {
    background: #c9302c;
  }

  .existing-calculation {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #f9f9f9;
  }

  .existing-calculation h4 {
    margin: 0 0 10px;
    font-size: 16px;
    color: #333;
  }

  .price-highlight {
    font-weight: bold;
    color: #007acc;
  }

  .view-mode-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }

  .secondary-btn {
    padding: 5px 10px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .secondary-btn:hover {
    background: #005a9e;
  }

  .calculation-warning {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #f0ad4e;
    border-radius: 6px;
    background-color: #fdf6e3;
    color: #8a6d3b;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .calculation-warning svg {
    flex-shrink: 0;
    color: #f0ad4e;
  }
</style>