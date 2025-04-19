<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { updateCalculation } from "./utils/storage";
  import { recalculateInvoice, updateCalculationCustomer } from "./utils/calculations";
  import type { SavedCalculation } from "./types";

  export let calculation: SavedCalculation;
  
  const dispatch = createEventDispatcher<{
    close: void;
    update: SavedCalculation;
  }>();
  
  let isEditing = false;
  let editedName = calculation.name;
  let editedDescription = calculation.description || "";
  let editedType = calculation.type;
  let editedNotes = calculation.notes || "";
  let isLoading = false;
  let error = "";
  
  async function handleSaveChanges() {
    try {
      isLoading = true;
      error = "";
      
      // Update calculation metadata
      const updatedCalculation = {
        ...calculation,
        name: editedName,
        description: editedDescription,
        type: editedType as "draft" | "offer" | "final" | "archived",
        notes: editedNotes,
        modifiedAt: new Date().toISOString()
      };
      
      // Save to storage
      await updateCalculation(updatedCalculation);
      
      // Update local state
      calculation = updatedCalculation;
      isEditing = false;
      
      // Notify parent component
      dispatch('update', updatedCalculation);
      
    } catch (e) {
      console.error("Failed to update calculation:", e);
      error = "Failed to update calculation";
    } finally {
      isLoading = false;
    }
  }
  
  function cancelEdit() {
    // Reset form values to current calculation values
    editedName = calculation.name;
    editedDescription = calculation.description || "";
    editedType = calculation.type;
    editedNotes = calculation.notes || "";
    isEditing = false;
  }
  
  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
</script>

<div class="calculation-detail">
  <div class="header">
    <div class="title-area">
      {#if isEditing}
        <input 
          type="text" 
          bind:value={editedName} 
          class="title-input" 
          placeholder="Calculation Name"
        />
      {:else}
        <h2 class="calculation-title">
          <span class={`type-badge ${calculation.type}`}>{calculation.type}</span>
          {calculation.name}
        </h2>
      {/if}
      
      <div class="metadata">
        <div class="dates">
          <span class="date-label">Created:</span> 
          <span class="date-value">{formatDate(calculation.createdAt)}</span>
          <span class="date-separator">|</span>
          <span class="date-label">Modified:</span>
          <span class="date-value">{formatDate(calculation.modifiedAt)}</span>
          <span class="date-separator">|</span>
          <span class="version">v{calculation.version}</span>
        </div>
      </div>
    </div>
    
    <div class="actions">
      {#if isEditing}
        <button 
          on:click={handleSaveChanges} 
          class="btn btn-primary save-btn" 
          disabled={isLoading}
        >
          <i class="icon">💾</i> Save Changes
        </button>
        <button 
          on:click={cancelEdit}
          class="btn btn-secondary"
          disabled={isLoading}
        >
          <i class="icon">✕</i> Cancel
        </button>
      {:else}
        <button on:click={() => isEditing = true} class="btn btn-secondary edit-btn">
          <i class="icon">✎</i> Edit Details
        </button>
        <button on:click={() => dispatch('close')} class="btn btn-secondary back-btn">
          <i class="icon">←</i> Back to List
        </button>
      {/if}
    </div>
  </div>
  
  {#if error}
    <div class="error-message">
      <i class="icon">⚠️</i> {error}
    </div>
  {/if}

  <div class="content">
    <div class="calculation-info">
      {#if isEditing}
        <div class="form-group">
          <label for="calculation-type">Calculation Type</label>
          <select id="calculation-type" bind:value={editedType} class="form-control">
            <option value="draft">Draft</option>
            <option value="offer">Offer</option>
            <option value="final">Final</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="calculation-description">Description</label>
          <textarea
            id="calculation-description"
            bind:value={editedDescription}
            class="form-control"
            placeholder="Add a description for this calculation"
            rows="2"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="calculation-notes">Notes</label>
          <textarea
            id="calculation-notes"
            bind:value={editedNotes}
            class="form-control"
            placeholder="Add your notes here"
            rows="4"
          ></textarea>
        </div>
      {:else}
        {#if calculation.description}
          <div class="description">
            <h3>Description</h3>
            <p>{calculation.description}</p>
          </div>
        {/if}
        
        {#if calculation.notes}
          <div class="notes">
            <h3>Notes</h3>
            <p>{calculation.notes}</p>
          </div>
        {/if}
      {/if}
    </div>
    
    <div class="results-section">
      <h3>Calculation Results</h3>
      
      <div class="results-container">
        <div class="results-group">
          <h4>Basic Information</h4>
          <div class="result-row">
            <span class="label">Company Type</span>
            <span class="value">{calculation.customerSnapshot.companyType}</span>
          </div>
          <div class="result-row">
            <span class="label">Monthly Hours (avg)</span>
            <span class="value">{calculation.result.averageHours.toFixed(2)} hours</span>
          </div>
          <div class="result-row">
            <span class="label">Hourly Rate</span>
            <span class="value">€{calculation.customerSnapshot.hourlyRate.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="results-group">
          <h4>Subtotals</h4>
          <div class="result-row">
            <span class="label">Hourly Work</span>
            <span class="value">€{calculation.result.subtotals.hourlyWork.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">Accounting Software</span>
            <span class="value">€{calculation.result.subtotals.accountingSoftware.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">Salary Payments</span>
            <span class="value">€{calculation.result.subtotals.salaryPayments.toFixed(2)}</span>
          </div>
          <div class="result-row subtotal">
            <span class="label">Subtotal</span>
            <span class="value">€{calculation.result.subtotals.totalSubtotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="results-group">
          <h4>Additional Items</h4>
          <div class="result-row">
            <span class="label">Margin (Coefficient: {calculation.result.marginCoefficient.toFixed(2)})</span>
            <span class="value">€{calculation.result.marginAmount.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">Year-End Accounting</span>
            <span class="value">€{calculation.result.yearEndAccountingPrice.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">Discount</span>
            <span class="value">-€{calculation.result.discountAmount.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">Additional Fees</span>
            <span class="value">€{calculation.result.additionalFees.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="results-group totals">
          <div class="result-row">
            <span class="label">Price (excl. VAT)</span>
            <span class="value">€{calculation.result.priceWithoutVat.toFixed(2)}</span>
          </div>
          <div class="result-row">
            <span class="label">VAT ({(calculation.result.vatRate * 100).toFixed(0)}%)</span>
            <span class="value">€{(calculation.result.priceWithoutVat * calculation.result.vatRate).toFixed(2)}</span>
          </div>
          <div class="result-row grand-total">
            <span class="label">Total (incl. VAT)</span>
            <span class="value">€{calculation.result.priceWithVat.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="results-group">
          <h4>Profitability</h4>
          <div class="result-row">
            <span class="label">Customer Margin</span>
            <span class="value">€{calculation.result.customerMargin.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <div class="snapshot-info">
      <span class="snapshot-label">This calculation is based on a snapshot of customer data at the time of creation.</span>
    </div>
  </div>
</div>

<style>
  .calculation-detail {
    width: 100%;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-md);
    padding: 2rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid var(--primary-light);
  }
  
  .title-area {
    flex: 1;
  }
  
  .calculation-title {
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.75rem;
  }
  
  .title-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1.5rem;
    border: 1px solid var(--primary-light);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  
  .metadata {
    font-size: 0.85rem;
    color: var(--text-light);
  }
  
  .dates {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  
  .date-label {
    font-weight: 500;
  }
  
  .date-separator {
    color: #ddd;
  }
  
  .version {
    background-color: var(--primary-light);
    color: var(--primary-dark);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.8rem;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
  }
  
  .type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .type-badge.draft {
    background-color: rgba(108, 117, 125, 0.1);
    color: #6c757d;
  }
  
  .type-badge.offer {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
  }
  
  .type-badge.final {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
  }
  
  .type-badge.archived {
    background-color: rgba(108, 117, 125, 0.1);
    color: #6c757d;
  }
  
  .error-message {
    background-color: #ffebee;
    color: var(--error-color);
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
    border-left: 4px solid var(--error-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }
  
  .calculation-info {
    padding-bottom: 1rem;
  }
  
  .description, .notes {
    margin-bottom: 1.5rem;
  }
  
  .description h3, .notes h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #eee;
  }
  
  .description p, .notes p {
    color: var(--text-dark);
    line-height: 1.5;
    white-space: pre-line;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  textarea.form-control {
    resize: vertical;
  }
  
  .results-section h3 {
    margin-top: 0;
    margin-bottom: 1.25rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #f0f0f0;
    font-size: 1.25rem;
  }
  
  .results-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .results-group {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .results-group h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: var(--primary-dark);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .result-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px dashed #eee;
  }
  
  .result-row:last-child {
    border-bottom: none;
  }
  
  .result-row.subtotal {
    font-weight: 600;
    border-top: 2px solid #eee;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
  }
  
  .results-group.totals {
    background-color: var(--primary-light);
    color: var(--primary-dark);
    font-weight: 600;
  }
  
  .result-row.grand-total {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary-dark);
    border-top: 2px solid rgba(0, 102, 204, 0.2);
    margin-top: 0.5rem;
    padding-top: 0.75rem;
  }
  
  .footer {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid #eee;
  }
  
  .snapshot-info {
    font-size: 0.85rem;
    color: var(--text-light);
    font-style: italic;
  }
  
  /* Responsive styles */
  @media (max-width: 1100px) {
    .content {
      grid-template-columns: 1fr;
    }
    
    .results-container {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .actions {
      justify-content: space-between;
    }
  }
</style>
