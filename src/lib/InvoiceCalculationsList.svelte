<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import {
    loadCalculations,
    getCustomerCalculations,
    deleteCalculation
  } from "./utils/storage";
  import {
    createSavedCalculation,
    duplicateCalculation
  } from "./utils/calculations";
  import type { Customer, SavedCalculation } from "./types";

  export let customer: Customer;

  const dispatch = createEventDispatcher<{
    selectCalculation: SavedCalculation;
    createCalculation: SavedCalculation;
    close: void;
  }>();

  let calculations: SavedCalculation[] = [];
  let loading = true;
  let error = "";
  let newCalculationName = "";
  let newCalculationType: "draft" | "offer" | "final" | "archived" = "draft";
  let showNewCalculationForm = false;
  let sortOption: "date" | "name" | "type" | "amount" = "date";
  let filterType: "all" | "draft" | "offer" | "final" | "archived" = "all";

  onMount(async () => {
    await loadCustomerCalculations();
  });

  async function loadCustomerCalculations() {
    try {
      loading = true;
      error = "";
      calculations = await getCustomerCalculations(customer.id);
      loading = false;
    } catch (e) {
      console.error("Failed to load calculations:", e);
      error = "Failed to load calculations";
      loading = false;
    }
  }

  async function handleDeleteCalculation(id: string) {
    if (confirm("Are you sure you want to delete this calculation?")) {
      try {
        await deleteCalculation(id);
        await loadCustomerCalculations(); // Reload the list
      } catch (e) {
        console.error("Failed to delete calculation:", e);
        error = "Failed to delete calculation";
      }
    }
  }

  async function handleDuplicateCalculation(calculation: SavedCalculation) {
    try {
      const newName = prompt("Enter a name for the duplicate:", `${calculation.name} (Copy)`);
      if (newName) {
        const duplicated = duplicateCalculation(calculation, newName);
        dispatch('createCalculation', duplicated);
      }
    } catch (e) {
      console.error("Failed to duplicate calculation:", e);
      error = "Failed to duplicate calculation";
    }
  }

  function handleCreateNewCalculation() {
    if (!newCalculationName.trim()) {
      error = "Please enter a calculation name";
      return;
    }

    try {
      const newCalculation = createSavedCalculation(
        customer,
        newCalculationName,
        newCalculationType
      );

      dispatch('createCalculation', newCalculation);
      newCalculationName = ""; // Reset the form
      showNewCalculationForm = false;
    } catch (e) {
      console.error("Failed to create calculation:", e);
      error = "Failed to create calculation";
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getCalculationTypeClass(type: string): string {
    switch (type) {
      case "draft":
        return "type-draft";
      case "offer":
        return "type-offer";
      case "final":
        return "type-final";
      case "archived":
        return "type-archived";
      default:
        return "";
    }
  }

  // Sort and filter calculations
  $: filteredCalculations = calculations
    .filter(calc => filterType === "all" || calc.type === filterType)
    .sort((a, b) => {
      switch (sortOption) {
        case "date":
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "amount":
          return b.result.priceWithoutVat - a.result.priceWithoutVat;
        default:
          return 0;
      }
    });
</script>

<div class="calculations-list">
  <div class="header">
    <h2><i class="icon">📊</i> Invoice Calculations</h2>
    <div class="controls">
      <button 
        on:click={() => showNewCalculationForm = !showNewCalculationForm} 
        class="btn btn-primary add-button"
      >
        {#if !showNewCalculationForm}
          <i class="icon">➕</i> New Calculation
        {:else}
          <i class="icon">✕</i> Cancel
        {/if}
      </button>
      <button 
        on:click={() => dispatch('close')} 
        class="btn btn-secondary back-button"
      >
        <i class="icon">←</i> Back
      </button>
    </div>
  </div>

  {#if showNewCalculationForm}
    <div class="new-calculation-form card">
      <h3>Create New Calculation</h3>
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
        <label for="calculation-type">Calculation Type</label>
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

      <div class="form-actions">
        <button 
          on:click={handleCreateNewCalculation} 
          class="btn btn-primary"
        >
          <i class="icon">✓</i> Create
        </button>
        <button 
          on:click={() => showNewCalculationForm = false} 
          class="btn btn-secondary"
        >
          <i class="icon">✕</i> Cancel
        </button>
      </div>
    </div>
  {/if}

  <div class="filters-bar">
    <div class="filter-group">
      <label for="filter-type">Filter:</label>
      <select id="filter-type" bind:value={filterType} class="filter-control">
        <option value="all">All Types</option>
        <option value="draft">Drafts Only</option>
        <option value="offer">Offers Only</option>
        <option value="final">Final Invoices Only</option>
        <option value="archived">Archived Only</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label for="sort-by">Sort by:</label>
      <select id="sort-by" bind:value={sortOption} class="filter-control">
        <option value="date">Latest First</option>
        <option value="name">Name (A-Z)</option>
        <option value="type">Type</option>
        <option value="amount">Amount (High-Low)</option>
      </select>
    </div>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading calculations...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <i class="icon error-icon">⚠️</i>
      <p class="error">{error}</p>
      <button
        on:click={loadCustomerCalculations}
        class="btn btn-secondary retry-btn"
      >
        <i class="icon">🔄</i> Retry
      </button>
    </div>
  {:else if filteredCalculations.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty">
        {filterType === "all"
          ? "No calculations found for this customer. Create your first calculation to get started."
          : `No ${filterType} calculations found for this customer.`}
      </p>
      {#if filterType !== "all"}
        <button on:click={() => filterType = "all"} class="btn btn-secondary">
          <i class="icon">🔍</i> Show All Types
        </button>
      {:else}
        <button on:click={() => showNewCalculationForm = true} class="btn btn-primary">
          <i class="icon">➕</i> Create First Calculation
        </button>
      {/if}
    </div>
  {:else}
    <div class="calculations-grid">
      {#each filteredCalculations as calculation (calculation.id)}
        <div class="calculation-card">
          <div class="card-header">
            <span class={`type-tag ${getCalculationTypeClass(calculation.type)}`}>
              {calculation.type}
            </span>
            <span class="calc-date">
              {formatDate(calculation.modifiedAt)}
            </span>
          </div>
          
          <h3 class="calc-name">{calculation.name}</h3>
          
          {#if calculation.description}
            <p class="calc-description">{calculation.description}</p>
          {/if}
          
          <div class="amount-row">
            <div class="label">Total (excl. VAT)</div>
            <div class="value">€{calculation.result.priceWithoutVat.toFixed(2)}</div>
          </div>
          <div class="amount-row">
            <div class="label">VAT ({(calculation.result.vatRate * 100).toFixed(0)}%)</div>
            <div class="value">€{(calculation.result.priceWithoutVat * calculation.result.vatRate).toFixed(2)}</div>
          </div>
          <div class="amount-row total">
            <div class="label">Total (incl. VAT)</div>
            <div class="value">€{calculation.result.priceWithVat.toFixed(2)}</div>
          </div>
          
          <div class="card-footer">
            <button
              on:click={() => dispatch('selectCalculation', calculation)}
              class="btn btn-sm btn-primary view"
            >
              <i class="icon">👁️</i> View
            </button>
            <button
              on:click={() => handleDuplicateCalculation(calculation)}
              class="btn btn-sm btn-secondary duplicate"
            >
              <i class="icon">📋</i> Duplicate
            </button>
            <button
              on:click={() => handleDeleteCalculation(calculation.id)}
              class="btn btn-sm btn-danger delete"
            >
              <i class="icon">🗑️</i> Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .calculations-list {
    width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--primary-light);
  }

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-dark);
  }

  h3 {
    margin: 0.5rem 0;
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .add-button, .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: transform 0.1s ease;
  }

  .add-button:hover, .back-button:hover {
    transform: translateY(-2px);
  }

  .new-calculation-form {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-radius: var(--border-radius);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .form-control {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-start;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .filters-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    background-color: #f8f9fa;
    border-radius: var(--border-radius);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-control {
    padding: 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }

  .calculations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .calculation-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .calculation-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .type-tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .type-draft {
    background-color: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.2);
  }

  .type-offer {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
    border: 1px solid rgba(0, 123, 255, 0.2);
  }

  .type-final {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
    border: 1px solid rgba(40, 167, 69, 0.2);
  }

  .type-archived {
    background-color: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.2);
  }

  .calc-date {
    font-size: 0.8rem;
    color: #6c757d;
  }

  .calc-name {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
    color: var(--primary-dark);
  }

  .calc-description {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .amount-row {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .amount-row.total {
    font-weight: 700;
    border-top: 2px solid #f0f0f0;
    border-bottom: none;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }

  .label {
    color: #6c757d;
  }

  .value {
    font-weight: 600;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 1.25rem;
  }

  .btn-sm {
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .btn-sm:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    width: 50px;
    height: 50px;
    border: 4px solid rgba(0, 102, 204, 0.1);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
    color: var(--primary-color);
  }

  .error-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--error-color);
  }

  .empty {
    color: var(--text-light);
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .retry-btn {
    margin-top: 1.5rem;
  }

  .error {
    color: var(--error-color);
    font-weight: 500;
  }

  .icon {
    display: inline-block;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .calculations-grid {
      grid-template-columns: 1fr;
    }
    
    .filters-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .controls {
      justify-content: space-between;
    }
  }
</style>
