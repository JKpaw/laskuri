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

  export let customers: Customer[];

  const dispatch = createEventDispatcher();

  function handleCalculation(customer: Customer) {
    dispatch('show-calculation', customer);
  }

  function handleDelete(customerId: string) {
    dispatch('delete-customer', customerId);
  }
</script>

<div class="customers-section">
  <div class="section-header mb-6">
    <h2>Asiakkaat</h2>
    <div class="customer-count badge badge-info">
      {customers.length} asiakasta
    </div>
  </div>
  
  {#if customers.length === 0}
    <div class="empty-state card">
      <div class="card-body text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        <h3 class="mb-2">Ei asiakkaita vielä</h3>
        <p class="text-gray-600">Aloita lisäämällä ensimmäinen asiakas järjestelmään</p>
      </div>
    </div>
  {:else}
    <div class="customers-grid">
      {#each customers as customer}
        <div class="customer-card card">
          <div class="card-body">
            <div class="customer-header mb-4">
              <div class="customer-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="customer-info">
                <h3 class="customer-name">{customer.name}</h3>
                <div class="company-type badge {customer.companyType === 'oy' ? 'badge-info' : 'badge-warning'}">
                  {customer.companyType.toUpperCase()}
                </div>
              </div>
            </div>
            
            <div class="customer-details">
              {#if customer.email}
                <div class="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span class="text-sm text-gray-600">{customer.email}</span>
                </div>
              {/if}
              {#if customer.phone}
                <div class="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span class="text-sm text-gray-600">{customer.phone}</span>
                </div>
              {/if}
              {#if customer.address}
                <div class="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span class="text-sm text-gray-600">{customer.address}</span>
                </div>
              {/if}
            </div>
          </div>
          
          <div class="card-footer">
            <div class="customer-actions flex gap-3">
              <button class="btn btn-primary btn-sm flex-1" on:click={() => handleCalculation(customer)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Laskuta
              </button>
              <button class="btn btn-danger btn-sm" on:click={() => handleDelete(customer.id)} title="Poista asiakas">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .customers-section {
    margin-top: var(--spacing-8);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-6);
  }

  .section-header h2 {
    margin: 0;
    color: var(--color-gray-900);
  }

  .customer-count {
    font-size: var(--font-size-sm);
  }

  .empty-state {
    padding: var(--spacing-16) var(--spacing-8);
  }

  .empty-icon {
    color: var(--color-gray-400);
    margin-bottom: var(--spacing-4);
  }

  .customers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--spacing-6);
  }

  .customer-card {
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .customer-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .customer-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }

  .customer-avatar {
    width: 48px;
    height: 48px;
    background-color: var(--color-primary-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .customer-info {
    flex: 1;
    min-width: 0;
  }

  .customer-name {
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .customer-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    color: var(--color-gray-600);
  }

  .detail-item svg {
    flex-shrink: 0;
    color: var(--color-gray-400);
  }

  .detail-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .customer-actions {
    width: 100%;
  }

  @media (max-width: 768px) {
    .customers-grid {
      grid-template-columns: 1fr;
    }
    
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-2);
    }
  }
</style>