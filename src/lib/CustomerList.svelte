<script lang="ts">
  import { onMount } from "svelte";
  import { loadCustomers, deleteCustomer } from "./utils/storage";
  import { calculateInvoice } from "./utils/calculations";
  import type { Customer } from "./types";

  export let onSelectCustomer: (customer: Customer) => void;
  export let onAddCustomer: () => void;
  export let onShowInvoice: (customer: Customer) => void;

  let customers: Customer[] = [];
  let loading = true;
  let error = "";

  onMount(async () => {
    try {
      customers = await loadCustomers();
      loading = false;
    } catch (e) {
      console.error("Failed to load customers:", e);
      error = "Failed to load customers";
      loading = false;
    }
  });

  async function handleDeleteCustomer(id: string) {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        customers = await deleteCustomer(id);
      } catch (e) {
        console.error("Failed to delete customer:", e);
        error = "Failed to delete customer";
      }
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString();
  }

  function formatDateRange(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return "Not set";

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  function isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    return new Date() <= date;
  }

  function isYearEndPeriodActive(customer: Customer): boolean {
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

  function getSubtotalMarginAmount(customer: Customer): string {
    try {
      const invoice = calculateInvoice(customer);
      return `€${(invoice.subtotals.totalSubtotal + invoice.marginAmount).toFixed(2)}`;
    } catch (e) {
      console.error("Error calculating subtotal + margin:", e);
      return "Error";
    }
  }

  function getYearEndPricingAmount(customer: Customer): string {
    try {
      const invoice = calculateInvoice(customer);
      return isYearEndPeriodActive(customer)
        ? `€${invoice.yearEndAccountingPrice.toFixed(2)}`
        : "€0.00";
    } catch (e) {
      console.error("Error calculating year-end pricing:", e);
      return "Error";
    }
  }
</script>

<div class="customer-list">
  <div class="header">
    <h2><i class="icon">👥</i> Customers</h2>
    <button on:click={onAddCustomer} class="btn btn-primary add-button">
      <i class="icon">➕</i> Add Customer
    </button>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading customers...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <i class="icon error-icon">⚠️</i>
      <p class="error">{error}</p>
      <button
        on:click={() => location.reload()}
        class="btn btn-secondary retry-btn"
      >
        <i class="icon">🔄</i> Retry
      </button>
    </div>
  {:else if customers.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty">
        No customers found. Add your first customer to get started.
      </p>
      <button on:click={onAddCustomer} class="btn btn-primary">
        <i class="icon">➕</i> Add First Customer
      </button>
    </div>
  {:else}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Avg. Hours</th>
            <th>Subtotal + Margin</th>
            <th>Year-End Pricing</th>
            <th>Year-End Period</th>
            <th>Pricing Valid Until</th>
            <th>Discount Valid Until</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each customers as customer}
            <tr>
              <td class="customer-name">
                <span class="icon-wrapper"><i class="icon">👤</i></span>
                {customer.name}
              </td>
              <td>
                <span
                  class="tag {customer.companyType === 'OY'
                    ? 'tag-blue'
                    : 'tag-green'}"
                >
                  {customer.companyType}
                </span>
              </td>
              <td>
                {(customer.hoursLast3Months / 3).toFixed(1)}h
              </td>
              <td class="amount subtotal-margin">
                {getSubtotalMarginAmount(customer)}
              </td>
              <td
                class="amount year-end {isYearEndPeriodActive(customer)
                  ? 'active'
                  : 'inactive'}"
              >
                {getYearEndPricingAmount(customer)}
                {#if !isYearEndPeriodActive(customer)}
                  <span class="inactive-note">(inactive)</span>
                {/if}
              </td>
              <td
                class="date-range {isYearEndPeriodActive(customer)
                  ? 'active'
                  : 'inactive'}"
              >
                {formatDateRange(
                  customer.yearEndAccountingStartDate,
                  customer.yearEndAccountingEndDate
                )}
              </td>
              <td>
                <span
                  class="date {isValidDate(customer.pricingValidUntil)
                    ? 'valid-date'
                    : 'expired-date'}"
                >
                  {formatDate(customer.pricingValidUntil)}
                </span>
              </td>
              <td>
                <span
                  class="date {isValidDate(customer.discount.validUntil)
                    ? 'valid-date'
                    : 'expired-date'}"
                >
                  {formatDate(customer.discount.validUntil)}
                </span>
              </td>
              <td class="actions">
                <button
                  on:click={() => onShowInvoice(customer)}
                  class="btn btn-sm btn-primary invoice"
                >
                  <i class="icon">📄</i> Invoice
                </button>
                <button
                  on:click={() => onSelectCustomer(customer)}
                  class="btn btn-sm btn-secondary edit"
                >
                  <i class="icon">✎</i> Edit
                </button>
                <button
                  on:click={() => handleDeleteCustomer(customer.id)}
                  class="btn btn-sm btn-danger delete"
                >
                  <i class="icon">🗑️</i> Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .customer-list {
    width: 100%;
    max-width: 1300px; /* Increased to accommodate more columns */
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .add-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .table-container {
    overflow-x: auto;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
    background-color: white;
    margin-bottom: 20px; /* Add some space at the bottom */
  }

  table {
    width: 100%;
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.85rem; /* Slightly smaller font to fit more content */
    table-layout: auto;
  }

  th {
    padding: 0.75rem 0.5rem;
    font-weight: 600;
    border-bottom: 2px solid var(--border-color);
    background-color: #f8f9fa;
    color: var(--text-light);
    font-size: 0.85rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  tbody tr {
    transition: background-color 0.2s ease;
  }

  tr:hover td {
    background-color: rgba(0, 102, 204, 0.05);
  }

  td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
  }

  .customer-name {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
  }

  .tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
  }

  .tag-blue {
    background-color: rgba(0, 102, 204, 0.1);
    color: var(--primary-color);
  }

  .tag-green {
    background-color: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
  }

  .amount {
    font-weight: bold;
  }

  .subtotal-margin {
    color: var(--text-color);
  }

  .year-end.active {
    color: var(--success-color);
  }

  .year-end.inactive {
    color: var(--text-light);
  }

  .inactive-note {
    display: block;
    font-size: 0.75rem;
    color: var(--text-light);
    font-style: italic;
    opacity: 0.8;
    font-weight: normal;
  }

  .date {
    display: inline-block;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .valid-date {
    background-color: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
  }

  .expired-date {
    background-color: rgba(220, 53, 69, 0.1);
    color: var(--error-color);
  }

  .date-range {
    font-size: 0.8rem;
    padding: 4px 6px;
    border-radius: 4px;
    white-space: nowrap;
    display: block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date-range.active {
    background-color: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
    border: 1px solid rgba(40, 167, 69, 0.2);
  }

  .date-range.inactive {
    background-color: rgba(108, 117, 125, 0.1);
    color: var(--text-light);
    border: 1px solid rgba(108, 117, 125, 0.2);
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 3rem 2rem;
    text-align: center;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 102, 204, 0.1);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--error-color);
  }

  .retry-btn {
    margin-top: 1rem;
  }

  .error {
    color: var(--error-color);
  }

  .icon {
    display: inline-block;
  }

  .text-right {
    text-align: right;
  }
</style>
