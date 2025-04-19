<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { calculateInvoice, createSavedCalculation } from "./utils/calculations";
  import { addCalculation } from "./utils/storage";
  import type { Customer, InvoiceCalculation, SavedCalculation } from "./types";
  import InvoiceCalculationsList from "./InvoiceCalculationsList.svelte";
  import InvoiceCalculationDetail from "./InvoiceCalculationDetail.svelte";

  export let customer: Customer;
  export let vatRate: number = 0.24; // Default 24%

  const dispatch = createEventDispatcher<{
    saveCalculation: SavedCalculation;
  }>();

  let invoice: InvoiceCalculation;
  let showCalculationsList = false;
  let showSaveForm = false;
  let selectedCalculation: SavedCalculation | null = null;
  let newCalculationName = "";
  let newCalculationType: "draft" | "offer" | "final" | "archived" = "draft";
  let error = "";
  let saving = false;

  $: if (customer && !selectedCalculation) {
    invoice = calculateInvoice(customer, vatRate);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString();
  }

  function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    return new Date() <= date;
  }

  function isYearEndPeriodActive(customerData: Customer): boolean {
    if (
      !customerData.yearEndAccountingStartDate ||
      !customerData.yearEndAccountingEndDate
    )
      return false;

    const startDate = new Date(customerData.yearEndAccountingStartDate);
    const endDate = new Date(customerData.yearEndAccountingEndDate);
    const currentDate = new Date();

    return currentDate >= startDate && currentDate <= endDate;
  }

  // Handle saving current calculation
  async function handleSaveCalculation() {
    if (!newCalculationName.trim()) {
      error = "Please enter a name for this calculation";
      return;
    }

    try {
      saving = true;
      error = "";
      
      // Create a new calculation
      const savedCalculation = createSavedCalculation(
        customer,
        newCalculationName,
        newCalculationType
      );
      
      // Save to storage
      await addCalculation(savedCalculation);
      
      // Notify parent
      dispatch('saveCalculation', savedCalculation);
      
      // Update UI state
      showSaveForm = false;
      newCalculationName = "";
      
      // Display the saved calculation
      selectedCalculation = savedCalculation;
      
    } catch (e) {
      console.error("Failed to save calculation:", e);
      error = "Failed to save calculation";
    } finally {
      saving = false;
    }
  }

  function handleViewCalculations() {
    showCalculationsList = true;
    selectedCalculation = null;
  }

  function handleSelectCalculation(event: CustomEvent<SavedCalculation>) {
    selectedCalculation = event.detail;
    showCalculationsList = false;
  }

  function handleCreateCalculation(event: CustomEvent<SavedCalculation>) {
    selectedCalculation = event.detail;
    showCalculationsList = false;
  }

  function handleCloseCalculationDetail() {
    selectedCalculation = null;
  }

  function handleCloseCalculationsList() {
    showCalculationsList = false;
  }

  function handleUpdateCalculation(event: CustomEvent<SavedCalculation>) {
    selectedCalculation = event.detail;
  }

  $: isPricingValid = isValidDate(customer?.pricingValidUntil);
  $: isDiscountValid = isValidDate(customer?.discount.validUntil);

  // Get the customer data based on context - either from a saved calculation or the current customer
  $: customerData = selectedCalculation ? selectedCalculation.customerSnapshot : customer;
  // Get invoice data - either from a saved calculation or the current invoice
  $: invoiceData = selectedCalculation ? selectedCalculation.result : invoice;
</script>

<div class="invoice-calculator">
  {#if showCalculationsList}
    <InvoiceCalculationsList
      {customer}
      on:selectCalculation={handleSelectCalculation}
      on:createCalculation={handleCreateCalculation}
      on:close={handleCloseCalculationsList}
    />
  {:else if selectedCalculation}
    <InvoiceCalculationDetail
      calculation={selectedCalculation}
      on:close={handleCloseCalculationDetail}
      on:update={handleUpdateCalculation}
    />
  {:else}
    <div class="header">
      <h2>Invoice Calculation for {customer.name}</h2>
      <div class="actions">
        <button on:click={() => showSaveForm = !showSaveForm} class="btn btn-secondary">
          {#if !showSaveForm}
            <i class="icon">💾</i> Save Calculation
          {:else}
            <i class="icon">✕</i> Cancel
          {/if}
        </button>
        <button on:click={handleViewCalculations} class="btn btn-primary">
          <i class="icon">📋</i> View Saved Calculations
        </button>
      </div>
    </div>

    {#if showSaveForm}
      <div class="save-form">
        {#if error}
          <div class="error-message">
            <i class="icon">⚠️</i> {error}
          </div>
        {/if}
        <div class="form-row">
          <div class="form-group">
            <label for="calculation-name">Calculation Name</label>
            <input
              id="calculation-name"
              bind:value={newCalculationName}
              type="text"
              placeholder="E.g. April 2025 Invoice"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="calculation-type">Type</label>
            <select
              id="calculation-type"
              bind:value={newCalculationType}
              class="form-control"
            >
              <option value="draft">Draft</option>
              <option value="offer">Offer</option>
              <option value="final">Final Invoice</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <button 
            on:click={handleSaveCalculation} 
            class="btn btn-primary" 
            disabled={saving}
          >
            <i class="icon">💾</i> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    {/if}

    <div class="validity-banners">
      <div class="validity-banner pricing {isPricingValid ? 'valid' : 'expired'}">
        <span class="label">Pricing {isPricingValid ? "Valid" : "Expired"}:</span>
        <span class="date">{formatDate(customerData.pricingValidUntil)}</span>
      </div>

      {#if customerData.discount.percentage > 0}
        <div
          class="validity-banner discount {isDiscountValid ? 'valid' : 'expired'}"
        >
          <span class="label"
            >Discount {isDiscountValid ? "Valid" : "Expired"}:</span
          >
          <span class="date">{formatDate(customerData.discount.validUntil)}</span>
        </div>
      {/if}
    </div>

    {#if invoiceData}
      <div class="calculation-details">
        <section class="hours-section">
          <h3>Hours Calculation</h3>
          <div class="detail-row">
            <span>Total Hours (Last 3 Months):</span>
            <span>{customerData.hoursLast3Months} hours</span>
          </div>
          <div class="detail-row highlight">
            <span>Average Monthly Hours:</span>
            <span>{invoiceData.averageHours.toFixed(2)} hours</span>
          </div>
        </section>

        <section class="subtotal-section">
          <h3>Subtotals</h3>
          <div class="detail-row">
            <span>Hourly Work:</span>
            <span
              >{invoiceData.averageHours.toFixed(2)} h × {formatCurrency(
                customerData.hourlyRate
              )}/h = {formatCurrency(invoiceData.subtotals.hourlyWork)}</span
            >
          </div>
          <div class="detail-row">
            <span>Accounting Software:</span>
            <span>{formatCurrency(invoiceData.subtotals.accountingSoftware)}</span>
          </div>
          <div class="detail-row">
            <span>Salary Payments:</span>
            <span
              >{customerData.numberOfEmployees} × {formatCurrency(
                customerData.salaryPaymentPrice
              )} = {formatCurrency(invoiceData.subtotals.salaryPayments)}</span
            >
          </div>
          <div class="detail-row highlight">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoiceData.subtotals.totalSubtotal)}</span>
          </div>
        </section>

        <section class="margin-section">
          <h3>Margin Calculation</h3>
          <div class="margin-factors">
            <h4>Applied Margin Factors:</h4>
            <ul>
              <li class="base-margin">Base Margin: 0.1 (10%)</li>
              {#if customerData.marginFactors.foreignTrade}<li>
                  Foreign Trade: +0.1
                </li>{/if}
              {#if customerData.marginFactors.cashOperations}<li>
                  Cash Operations: +0.1
                </li>{/if}
              {#if customerData.marginFactors.ecommerce}<li>E-commerce: +0.1</li>{/if}
              {#if customerData.marginFactors.import}<li>Import: +0.1</li>{/if}
              {#if customerData.marginFactors.assetsInBalance}<li>
                  Assets in Balance: +0.1
                </li>{/if}
              {#if customerData.marginFactors.investments}<li>
                  Investments: +0.1
                </li>{/if}
              {#if customerData.marginFactors.isLimitedCompany}<li>
                  Limited Company (OY): +0.1
                </li>{/if}
              {#if customerData.marginFactors.vatLiable}<li>VAT Liable: +0.1</li>{/if}
              {#if customerData.marginFactors.manualBankStatement}<li>
                  Manual Bank Statement: +0.1
                </li>{/if}
            </ul>
          </div>
          <div class="detail-row highlight">
            <span>Margin Coefficient:</span>
            <span
              >{invoiceData.marginCoefficient.toFixed(2)} ({(
                invoiceData.marginCoefficient * 100
              ).toFixed(0)}%)</span
            >
          </div>
          <div class="detail-row">
            <span>Margin Amount:</span>
            <span
              >{formatCurrency(invoiceData.subtotals.hourlyWork)} × {invoiceData.marginCoefficient.toFixed(
                2
              )} = {formatCurrency(invoiceData.marginAmount)}</span
            >
          </div>
        </section>

        <section class="year-end-section">
          <h3>Year-End Pricing</h3>
          <div class="detail-row">
            <span>Previous Year Invoicing:</span>
            <span>{formatCurrency(customerData.previousYearInvoicing)}</span>
          </div>
          <div class="detail-row">
            <span>Year-End Pricing Period:</span>
            <span class={isYearEndPeriodActive(customerData) ? "valid-date" : "expired-date"}>
              {formatDate(customerData.yearEndAccountingStartDate)} - {formatDate(
                customerData.yearEndAccountingEndDate
              )}
            </span>
          </div>
          <div class="detail-row">
            <span>Base Calculation:</span>
            <span
              >{formatCurrency(customerData.previousYearInvoicing)} ÷ 12 = {formatCurrency(
                customerData.previousYearInvoicing / 12
              )}</span
            >
          </div>
          {#if customerData.companyType === "Toiminimi" && customerData.previousYearInvoicing / 12 < 100}
            <div class="detail-row">
              <span>Minimum for Toiminimi:</span>
              <span>{formatCurrency(100)}</span>
            </div>
          {:else if customerData.companyType === "OY" && customerData.previousYearInvoicing / 12 < 260}
            <div class="detail-row">
              <span>Minimum for OY:</span>
              <span>{formatCurrency(260)}</span>
            </div>
          {/if}
          <div class="detail-row highlight">
            <span>Year-End Pricing:</span>
            <span>
              {formatCurrency(invoiceData.yearEndAccountingPrice)}
              {#if !isYearEndPeriodActive(customerData)}
                <span class="expired-note"
                  >(not applied - outside pricing period)</span
                >
              {/if}
            </span>
          </div>
        </section>

        <!-- Enhanced discount section, always shown if discount exists -->
        {#if customerData.discount.percentage > 0}
          <section
            class="discount-section {isDiscountValid
              ? 'active-discount'
              : 'expired-discount'}"
          >
            <h3>
              Discount
              {#if !isDiscountValid}
                <span class="expired-tag">Expired</span>
              {/if}
            </h3>
            <div class="detail-row">
              <span>Discount Percentage:</span>
              <span>{customerData.discount.percentage}%</span>
            </div>
            <div class="detail-row">
              <span>Valid Until:</span>
              <span class={isDiscountValid ? "valid-date" : "expired-date"}>
                {formatDate(customerData.discount.validUntil)}
              </span>
            </div>
            <div class="detail-row highlight">
              <span
                >Discount Amount ({isDiscountValid
                  ? "Applied"
                  : "Not Applied"}):</span
              >
              <span>
                {isDiscountValid
                  ? `-${formatCurrency(invoiceData.discountAmount)}`
                  : formatCurrency(0)}
                {#if !isDiscountValid && customerData.discount.percentage > 0}
                  <span class="expired-note"
                    >(would be -{formatCurrency(invoiceData.discountAmount)} if valid)</span
                  >
                {/if}
              </span>
            </div>
          </section>
        {/if}

        {#if customerData.isFirstMonth}
          <section class="special-cases">
            <h3>Special Cases</h3>
            <div class="detail-row">
              <span>First Month Setup Fee:</span>
              <span>{formatCurrency(invoiceData.additionalFees)}</span>
            </div>
          </section>
        {/if}

        <section class="final-price">
          <h3>Final Price</h3>
          <div class="calculation-summary">
            <div class="formula">
              <span>Subtotal</span>
              <span>+</span>
              <span>Margin</span>
              <span>+</span>
              <span>Year-End</span>
              {#if isDiscountValid && invoiceData.discountAmount > 0}
                <span>-</span>
                <span>Discount</span>
              {/if}
              {#if invoiceData.additionalFees > 0}
                <span>+</span>
                <span>Additional Fees</span>
              {/if}
            </div>
            <div class="values">
              <span>{formatCurrency(invoiceData.subtotals.totalSubtotal)}</span>
              <span>+</span>
              <span>{formatCurrency(invoiceData.marginAmount)}</span>
              <span>+</span>
              <span>{formatCurrency(invoiceData.yearEndAccountingPrice)}</span>
              {#if isDiscountValid && invoiceData.discountAmount > 0}
                <span>-</span>
                <span>{formatCurrency(invoiceData.discountAmount)}</span>
              {/if}
              {#if invoiceData.additionalFees > 0}
                <span>+</span>
                <span>{formatCurrency(invoiceData.additionalFees)}</span>
              {/if}
            </div>
          </div>

          <div class="final-prices">
            <div class="detail-row highlight subtotal-margin">
              <span>Subtotal + Margin:</span>
              <span
                >{formatCurrency(
                  invoiceData.subtotals.totalSubtotal + invoiceData.marginAmount
                )}</span
              >
            </div>
            <div class="detail-row subtotal-margin-vat">
              <span>Subtotal + Margin with VAT:</span>
              <span
                >{formatCurrency(
                  (invoiceData.subtotals.totalSubtotal + invoiceData.marginAmount) *
                    (1 + invoiceData.vatRate)
                )}</span
              >
            </div>
            <div class="detail-row highlight">
              <span>Total Price without VAT:</span>
              <span>{formatCurrency(invoiceData.priceWithoutVat)}</span>
            </div>
            <div class="detail-row">
              <span>VAT ({(invoiceData.vatRate * 100).toFixed(1)}%):</span>
              <span
                >{formatCurrency(
                  invoiceData.priceWithVat - invoiceData.priceWithoutVat
                )}</span
              >
            </div>
            <div class="detail-row total">
              <span>Total Price with VAT:</span>
              <span>{formatCurrency(invoiceData.priceWithVat)}</span>
            </div>
            <div class="detail-row customer-margin">
              <span>Customer Margin:</span>
              <span>{formatCurrency(invoiceData.customerMargin)}</span>
            </div>
          </div>
        </section>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* InvoiceCalculator.svelte - tyylimäärittelyjen parannukset */

  .invoice-calculator {
    max-width: 850px;
    margin: 0 auto;
    padding: 25px;
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 15px;
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .save-form {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border-left: 3px solid #0066cc;
  }

  .form-row {
    display: flex;
    gap: 15px;
    align-items: flex-end;
  }

  .form-group {
    flex: 1;
  }

  .form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h2 {
    margin-bottom: 0;
    color: var(--primary-dark);
    font-size: 1.6rem;
    letter-spacing: -0.5px;
  }

  h3 {
    margin: 22px 0 15px;
    color: #0066cc;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    letter-spacing: -0.3px;
  }

  h4 {
    margin: 12px 0;
    font-size: 1.05rem;
    color: #444;
  }

  section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    border-left: 3px solid #e6e6e6;
    transition:
      box-shadow 0.3s ease,
      transform 0.3s ease;
  }

  section:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .hours-section {
    border-left-color: #9ec5fe;
  }

  .subtotal-section {
    border-left-color: #b6e4d4;
  }

  .margin-section {
    border-left-color: #ffd97d;
  }

  .year-end-section {
    border-left-color: #adb5bd;
  }

  .discount-section {
    border-left-color: #f8d7da;
  }

  .special-cases {
    border-left-color: #d1c4e9;
  }

  .final-price {
    border-left-color: #0066cc;
    background-color: #f8f9fa;
  }

  .validity-banners {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
    flex-wrap: wrap;
  }

  .validity-banner {
    flex: 1;
    min-width: 250px;
    padding: 12px 18px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .validity-banner.valid {
    background-color: rgba(40, 167, 69, 0.1);
    border: 1px solid rgba(40, 167, 69, 0.3);
  }

  .validity-banner.expired {
    background-color: rgba(220, 53, 69, 0.1);
    border: 1px solid rgba(220, 53, 69, 0.3);
    color: #dc3545;
  }

  .validity-banner .label {
    font-weight: 600;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px dashed #eee;
    transition: background-color 0.2s ease;
  }

  .detail-row:hover {
    background-color: #f8f9fa;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .highlight {
    font-weight: 600;
    background-color: #f0f7ff;
    padding: 12px;
    border-radius: 6px;
    margin: 5px 0;
  }

  .subtotal-margin-vat {
    font-weight: 600;
    background-color: #e6f7ff;
    padding: 12px;
    border-radius: 6px;
    margin: 5px 0;
  }

  .expired-tag {
    background-color: #dc3545;
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 10px;
  }

  .expired-note {
    display: block;
    font-size: 0.85rem;
    color: #6c757d;
    font-style: italic;
    margin-top: 5px;
  }

  .valid-date {
    color: #28a745;
    font-weight: 500;
    padding: 3px 8px;
    background-color: rgba(40, 167, 69, 0.07);
    border-radius: 4px;
  }

  .expired-date {
    color: #dc3545;
    text-decoration: line-through;
    opacity: 0.8;
    padding: 3px 8px;
    background-color: rgba(220, 53, 69, 0.07);
    border-radius: 4px;
  }

  .active-discount {
    border-left: 4px solid #28a745;
  }

  .expired-discount {
    border-left: 4px solid #dc3545;
    opacity: 0.95;
  }

  .margin-factors ul {
    list-style-type: none;
    padding-left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 15px;
  }

  .margin-factors li {
    margin-bottom: 5px;
    padding: 6px 12px;
    background-color: #f0f0f0;
    border-radius: 20px;
    display: inline-block;
    font-size: 0.9rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .base-margin {
    background-color: #e6f7ff;
    border: 1px solid #d1e9ff;
    font-weight: 600;
  }

  .calculation-summary {
    margin: 18px 0;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .formula,
  .values {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-family: "Courier New", monospace;
  }

  .formula span,
  .values span {
    flex: 1;
    text-align: center;
    padding: 5px;
    font-size: 0.95rem;
  }

  .formula span {
    font-weight: 600;
    color: #555;
  }

  .values span {
    color: #0066cc;
  }

  .final-prices {
    margin-top: 25px;
    border-top: 2px solid #0066cc;
    padding-top: 15px;
  }

  .total {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0066cc;
    padding: 18px 15px;
    background-color: #e6f7ff;
    border-radius: 8px;
    margin: 15px 0;
    box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
    letter-spacing: -0.5px;
  }

  .customer-margin {
    color: #28a745;
    font-style: italic;
    font-weight: 600;
    padding: 8px 12px;
    background-color: rgba(40, 167, 69, 0.07);
    border-radius: 6px;
    margin-top: 10px;
  }

  /* Lisää animaatiota ja korostuksia laskurin komponenteille */
  @keyframes highlight-pulse {
    0% {
      background-color: rgba(0, 102, 204, 0.1);
    }
    50% {
      background-color: rgba(0, 102, 204, 0.2);
    }
    100% {
      background-color: rgba(0, 102, 204, 0.1);
    }
  }

  .detail-row.highlight:hover {
    animation: highlight-pulse 1.5s infinite;
  }

  /* Responsiiviset tyylit */
  @media (min-width: 1200px) {
    .invoice-calculator {
      padding: 30px;
    }

    .calculation-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .final-price {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .form-row {
      flex-direction: column;
      gap: 15px;
    }
    
    .validity-banner {
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }

    .detail-row {
      flex-direction: column;
      padding: 12px 0;
    }

    .detail-row span:last-child {
      margin-top: 5px;
      font-weight: 600;
    }
  }
</style>
