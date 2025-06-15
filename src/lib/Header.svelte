<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let storageLocation: string;

  const dispatch = createEventDispatcher();

  function handleAddCustomer() {
    dispatch('add-customer');
  }

  function handleShowPricing() {
    dispatch('show-pricing');
  }

  function handleShowInvoices() {
    dispatch('show-invoices');
  }

  function handleSelectStorage() {
    dispatch('select-storage');
  }
</script>

<div class="header-actions card mb-8">
  <div class="card-body">
    <div class="flex flex-mobile-col items-center justify-between gap-4">
      <div class="action-buttons flex gap-3 flex-mobile-col gap-mobile-4">
        <button class="btn btn-primary" on:click={handleAddCustomer}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Lisää Asiakas
        </button>
        <button class="btn btn-secondary" on:click={handleShowPricing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
          Hinnasto
        </button>
        <button class="btn btn-secondary" on:click={handleShowInvoices}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          Laskut
        </button>
        <button class="btn btn-secondary" on:click={handleSelectStorage}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
            <polyline points="7.5,19.79 7.5,14.6 3,12"/>
            <polyline points="21,12 16.5,14.6 16.5,19.79"/>
            <polyline points="12,22.81 12,17.01"/>
          </svg>
          Tallennussijainti
        </button>
      </div>
      {#if storageLocation}
        <div class="storage-info">
          <div class="badge badge-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            {storageLocation.split('\\').pop()}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .action-buttons {
    flex-wrap: wrap;
  }

  .storage-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .badge svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    .action-buttons {
      width: 100%;
    }
    
    .action-buttons .btn {
      flex: 1;
      min-width: 0;
    }
  }
</style>