<script lang="ts">
  import { calculateInvoice } from "./utils/calculations";
  import type { Customer, InvoiceCalculation } from "./types";

  export let customer: Customer;
  export let vatRate: number = 0.24; // Default 24%

  let invoice: InvoiceCalculation;

  $: if (customer) {
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

  function isYearEndPeriodActive(): boolean {
    if (
      !customer.yearEndAccountingStartDate ||
      !customer.yearEndAccountingEndDate
    )
      return false;

    const startDate = new Date(customer.yearEndAccountingStartDate);
    const endDate = new Date(customer.yearEndAccountingEndDate);
    const currentDate = new Date();

    return currentDate >= startDate && currentDate <= endDate;
  }

  $: isPricingValid = isValidDate(customer.pricingValidUntil);
  $: isDiscountValid = isValidDate(customer.discount.validUntil);
</script>

<div class="invoice-calculator">
  <h2>Invoice Calculation for {customer.name}</h2>

  <div class="validity-banners">
    <div class="validity-banner pricing {isPricingValid ? 'valid' : 'expired'}">
      <span class="label">Pricing {isPricingValid ? "Valid" : "Expired"}:</span>
      <span class="date">{formatDate(customer.pricingValidUntil)}</span>
    </div>

    {#if customer.discount.percentage > 0}
      <div
        class="validity-banner discount {isDiscountValid ? 'valid' : 'expired'}"
      >
        <span class="label"
          >Discount {isDiscountValid ? "Valid" : "Expired"}:</span
        >
        <span class="date">{formatDate(customer.discount.validUntil)}</span>
      </div>
    {/if}
  </div>

  {#if invoice}
    <div class="calculation-details">
      <section class="hours-section">
        <h3>Hours Calculation</h3>
        <div class="detail-row">
          <span>Total Hours (Last 3 Months):</span>
          <span>{customer.hoursLast3Months} hours</span>
        </div>
        <div class="detail-row highlight">
          <span>Average Monthly Hours:</span>
          <span>{invoice.averageHours.toFixed(2)} hours</span>
        </div>
      </section>

      <section class="subtotal-section">
        <h3>Subtotals</h3>
        <div class="detail-row">
          <span>Hourly Work:</span>
          <span
            >{invoice.averageHours.toFixed(2)} h × {formatCurrency(
              customer.hourlyRate
            )}/h = {formatCurrency(invoice.subtotals.hourlyWork)}</span
          >
        </div>
        <div class="detail-row">
          <span>Accounting Software:</span>
          <span>{formatCurrency(invoice.subtotals.accountingSoftware)}</span>
        </div>
        <div class="detail-row">
          <span>Salary Payments:</span>
          <span
            >{customer.numberOfEmployees} × {formatCurrency(
              customer.salaryPaymentPrice
            )} = {formatCurrency(invoice.subtotals.salaryPayments)}</span
          >
        </div>
        <div class="detail-row highlight">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.subtotals.totalSubtotal)}</span>
        </div>
      </section>

      <section class="margin-section">
        <h3>Margin Calculation</h3>
        <div class="margin-factors">
          <h4>Applied Margin Factors:</h4>
          <ul>
            <li class="base-margin">Base Margin: 0.1 (10%)</li>
            {#if customer.marginFactors.foreignTrade}<li>
                Foreign Trade: +0.1
              </li>{/if}
            {#if customer.marginFactors.cashOperations}<li>
                Cash Operations: +0.1
              </li>{/if}
            {#if customer.marginFactors.ecommerce}<li>E-commerce: +0.1</li>{/if}
            {#if customer.marginFactors.import}<li>Import: +0.1</li>{/if}
            {#if customer.marginFactors.assetsInBalance}<li>
                Assets in Balance: +0.1
              </li>{/if}
            {#if customer.marginFactors.investments}<li>
                Investments: +0.1
              </li>{/if}
            {#if customer.marginFactors.isLimitedCompany}<li>
                Limited Company (OY): +0.1
              </li>{/if}
            {#if customer.marginFactors.vatLiable}<li>VAT Liable: +0.1</li>{/if}
            {#if customer.marginFactors.manualBankStatement}<li>
                Manual Bank Statement: +0.1
              </li>{/if}
          </ul>
        </div>
        <div class="detail-row highlight">
          <span>Margin Coefficient:</span>
          <span
            >{invoice.marginCoefficient.toFixed(2)} ({(
              invoice.marginCoefficient * 100
            ).toFixed(0)}%)</span
          >
        </div>
        <div class="detail-row">
          <span>Margin Amount:</span>
          <span
            >{formatCurrency(invoice.subtotals.hourlyWork)} × {invoice.marginCoefficient.toFixed(
              2
            )} = {formatCurrency(invoice.marginAmount)}</span
          >
        </div>
      </section>

      <section class="year-end-section">
        <h3>Year-End Pricing</h3>
        <div class="detail-row">
          <span>Previous Year Invoicing:</span>
          <span>{formatCurrency(customer.previousYearInvoicing)}</span>
        </div>
        <div class="detail-row">
          <span>Year-End Pricing Period:</span>
          <span class={isYearEndPeriodActive() ? "valid-date" : "expired-date"}>
            {formatDate(customer.yearEndAccountingStartDate)} - {formatDate(
              customer.yearEndAccountingEndDate
            )}
          </span>
        </div>
        <div class="detail-row">
          <span>Base Calculation:</span>
          <span
            >{formatCurrency(customer.previousYearInvoicing)} ÷ 12 = {formatCurrency(
              customer.previousYearInvoicing / 12
            )}</span
          >
        </div>
        {#if customer.companyType === "Toiminimi" && customer.previousYearInvoicing / 12 < 100}
          <div class="detail-row">
            <span>Minimum for Toiminimi:</span>
            <span>{formatCurrency(100)}</span>
          </div>
        {:else if customer.companyType === "OY" && customer.previousYearInvoicing / 12 < 260}
          <div class="detail-row">
            <span>Minimum for OY:</span>
            <span>{formatCurrency(260)}</span>
          </div>
        {/if}
        <div class="detail-row highlight">
          <span>Year-End Pricing:</span>
          <span>
            {formatCurrency(invoice.yearEndAccountingPrice)}
            {#if !isYearEndPeriodActive()}
              <span class="expired-note"
                >(not applied - outside pricing period)</span
              >
            {/if}
          </span>
        </div>
      </section>

      <!-- Enhanced discount section, always shown if discount exists -->
      {#if customer.discount.percentage > 0}
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
            <span>{customer.discount.percentage}%</span>
          </div>
          <div class="detail-row">
            <span>Valid Until:</span>
            <span class={isDiscountValid ? "valid-date" : "expired-date"}>
              {formatDate(customer.discount.validUntil)}
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
                ? `-${formatCurrency(invoice.discountAmount)}`
                : formatCurrency(0)}
              {#if !isDiscountValid && customer.discount.percentage > 0}
                <span class="expired-note"
                  >(would be -{formatCurrency(invoice.discountAmount)} if valid)</span
                >
              {/if}
            </span>
          </div>
        </section>
      {/if}

      {#if customer.isFirstMonth}
        <section class="special-cases">
          <h3>Special Cases</h3>
          <div class="detail-row">
            <span>First Month Setup Fee:</span>
            <span>{formatCurrency(invoice.additionalFees)}</span>
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
            {#if isDiscountValid && invoice.discountAmount > 0}
              <span>-</span>
              <span>Discount</span>
            {/if}
            {#if invoice.additionalFees > 0}
              <span>+</span>
              <span>Additional Fees</span>
            {/if}
          </div>
          <div class="values">
            <span>{formatCurrency(invoice.subtotals.totalSubtotal)}</span>
            <span>+</span>
            <span>{formatCurrency(invoice.marginAmount)}</span>
            <span>+</span>
            <span>{formatCurrency(invoice.yearEndAccountingPrice)}</span>
            {#if isDiscountValid && invoice.discountAmount > 0}
              <span>-</span>
              <span>{formatCurrency(invoice.discountAmount)}</span>
            {/if}
            {#if invoice.additionalFees > 0}
              <span>+</span>
              <span>{formatCurrency(invoice.additionalFees)}</span>
            {/if}
          </div>
        </div>

        <div class="final-prices">
          <div class="detail-row highlight subtotal-margin">
            <span>Subtotal + Margin:</span>
            <span>{formatCurrency(invoice.subtotals.totalSubtotal + invoice.marginAmount)}</span>
          </div>
          <div class="detail-row subtotal-margin-vat">
            <span>Subtotal + Margin with VAT:</span>
            <span>{formatCurrency((invoice.subtotals.totalSubtotal + invoice.marginAmount) * (1 + vatRate))}</span>
          </div>
          <div class="detail-row highlight">
            <span>Total Price without VAT:</span>
            <span>{formatCurrency(invoice.priceWithoutVat)}</span>
          </div>
          <div class="detail-row">
            <span>VAT ({(vatRate * 100).toFixed(1)}%):</span>
            <span
              >{formatCurrency(
                invoice.priceWithVat - invoice.priceWithoutVat
              )}</span
            >
          </div>
          <div class="detail-row total">
            <span>Total Price with VAT:</span>
            <span>{formatCurrency(invoice.priceWithVat)}</span>
          </div>
          <div class="detail-row customer-margin">
            <span>Customer Margin:</span>
            <span>{formatCurrency(invoice.customerMargin)}</span>
          </div>
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .invoice-calculator {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin-bottom: 20px;
    color: #333;
    border-bottom: 2px solid #0066cc;
    padding-bottom: 10px;
  }

  h3 {
    margin: 20px 0 10px;
    color: #0066cc;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h4 {
    margin: 10px 0;
    font-size: 1rem;
  }

  section {
    margin-bottom: 25px;
    padding: 15px;
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .validity-banners {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .validity-banner {
    flex: 1;
    padding: 10px 15px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
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
    font-weight: bold;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #eee;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .highlight {
    font-weight: bold;
    background-color: #f0f7ff;
    padding: 10px;
    border-radius: 4px;
    margin: 5px 0;
  }

  .subtotal-margin-vat {
    font-weight: bold;
    background-color: #e6f7ff;
    padding: 10px;
    border-radius: 4px;
    margin: 5px 0;
  }

  .expired-tag {
    background-color: #dc3545;
    color: white;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .expired-note {
    display: block;
    font-size: 0.8rem;
    color: #6c757d;
    font-style: italic;
    margin-top: 3px;
  }

  .valid-date {
    color: #28a745;
    font-weight: 500;
  }

  .expired-date {
    color: #dc3545;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .active-discount {
    border-left: 4px solid #28a745;
  }

  .expired-discount {
    border-left: 4px solid #dc3545;
    opacity: 0.9;
  }

  .margin-factors ul {
    list-style-type: none;
    padding-left: 0;
  }

  .margin-factors li {
    margin-bottom: 5px;
    padding: 5px 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
    display: inline-block;
    margin-right: 5px;
  }

  .base-margin {
    background-color: #e6f7ff;
  }

  .calculation-summary {
    margin: 15px 0;
  }

  .formula,
  .values {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .formula span,
  .values span {
    flex: 1;
    text-align: center;
  }

  .final-prices {
    margin-top: 20px;
    border-top: 2px solid #0066cc;
    padding-top: 15px;
  }

  .total {
    font-size: 1.2rem;
    font-weight: bold;
    color: #0066cc;
    padding: 15px 10px;
    background-color: #e6f7ff;
    border-radius: 4px;
    margin: 10px 0;
  }

  .customer-margin {
    color: #28a745;
    font-style: italic;
  }
</style>
