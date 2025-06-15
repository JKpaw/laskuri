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

  export let show: boolean;
  export let newCustomer: Customer;

  const dispatch = createEventDispatcher();

  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleAddCustomer() {
    if (!newCustomer.name) return;
    dispatch('add-customer', newCustomer);
  }

  function handleClose() {
    dispatch('close');
  }
</script>

{#if show}
  <div class="modal-overlay" role="button" aria-label="Close modal" tabindex="0" on:click={handleClose} on:keydown={handleModalKeydown}>
    <div class="modal" role="document" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <div class="modal-header">
        <h2>Lisää Uusi Asiakas</h2>
        <button class="modal-close btn-secondary" on:click={handleClose} aria-label="Sulje">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="customer-name">Nimi *</label>
          <input class="form-input" id="customer-name" bind:value={newCustomer.name} type="text" placeholder="Asiakkaan nimi" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="company-type">Yritysmuoto *</label>
          <select class="form-select" id="company-type" bind:value={newCustomer.companyType}>
            <option value="toiminimi">Toiminimi</option>
            <option value="oy">Osakeyhtiö (OY)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Sähköposti</label>
          <input class="form-input" id="email" bind:value={newCustomer.email} type="email" placeholder="asiakas@yritys.fi">
        </div>

        <div class="form-group">
          <label class="form-label" for="phone">Puhelinnumero</label>
          <input class="form-input" id="phone" bind:value={newCustomer.phone} type="tel" placeholder="+358 40 123 4567">
        </div>

        <div class="form-group">
          <label class="form-label" for="address">Osoite</label>
          <input class="form-input" id="address" bind:value={newCustomer.address} type="text" placeholder="Katuosoite, Kaupunki">
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={handleClose}>Peruuta</button>
        <button class="btn btn-primary" on:click={handleAddCustomer} disabled={!newCustomer.name}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          Tallenna Asiakas
        </button>
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

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    font-size: var(--font-size-xl);
    color: var(--color-gray-900);
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

  .form-group {
    margin-bottom: 15px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-label {
    font-weight: bold;
  }

  .form-input {
    padding: var(--spacing-2);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    font-size: var(--font-size-md);
  }

  .form-select {
    padding: var(--spacing-2);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--border-radius);
    font-size: var(--font-size-md);
  }

  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .btn {
    padding: 10px 20px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-md);
  }

  .btn-primary {
    background: #007acc;
    color: white;
    border: none;
  }

  .btn-primary:hover {
    background: #005a9e;
  }

  .btn-secondary {
    background: none;
    color: var(--color-gray-700);
    border: 1px solid var(--color-gray-300);
  }

  .btn-secondary:hover {
    background-color: var(--color-gray-100);
  }
</style>