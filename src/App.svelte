<script lang="ts">
  import { onMount } from "svelte";
  import CustomerList from "./lib/CustomerList.svelte";
  import CustomerForm from "./lib/CustomerForm.svelte";
  import InvoiceCalculator from "./lib/InvoiceCalculator.svelte";
  import StorageLocationSelector from "./lib/StorageLocationSelector.svelte";
  import {
    initStorage,
    loadCustomers,
    addCustomer,
    updateCustomer,
  } from "./lib/utils/storage";
  import type { Customer } from "./lib/types";

  // Application state
  let selectedCustomer: Customer | null = null;
  let isAddingCustomer = false;
  let isEditingCustomer = false;
  let showingInvoice = false;
  let vatRate = 0.255; // Default VAT rate (25.5%)
  let isLoading = true;
  let errorMessage = "";
  let hasUnsavedChanges = false;

  // Keep track of navigation history to support back button
  type ViewState = "list" | "add" | "edit" | "invoice";
  let currentView: ViewState = "list";
  let previousView: ViewState | null = null;

  // Initialize storage on app start
  onMount(() => {
    // Start the async operation but don't wait for it
    (async () => {
      try {
        console.log("Starting app initialization...");
        await initStorage();
        console.log("Storage initialized successfully");

        // Restore last session state if available
        const lastViewState = localStorage.getItem("lastViewState");
        const lastCustomerId = localStorage.getItem("lastCustomerId");

        if (lastViewState && lastCustomerId) {
          // We'll load the customer in a separate step
          currentView = lastViewState as ViewState;
          await loadLastCustomer(lastCustomerId);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // Provide more detailed error message to the user
        errorMessage = `Failed to initialize app: ${error instanceof Error ? error.message : "Unknown error"}. Try restarting the application.`;
      } finally {
        isLoading = false;
      }
    })();

    // Add keyboard shortcuts
    window.addEventListener("keydown", handleGlobalKeydown);

    // Return the cleanup function directly
    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  });

  // Save current view state for session persistence
  function saveViewState() {
    if (selectedCustomer) {
      localStorage.setItem("lastCustomerId", selectedCustomer.id);
      localStorage.setItem("lastViewState", currentView);
    } else {
      localStorage.removeItem("lastCustomerId");
      localStorage.removeItem("lastViewState");
    }
  }

  async function loadLastCustomer(customerId: string) {
    try {
      const customers = await loadCustomers();
      const customer = customers.find((c) => c.id === customerId);

      if (customer) {
        selectedCustomer = customer;

        if (currentView === "edit") {
          isEditingCustomer = true;
          isAddingCustomer = false;
          showingInvoice = false;
        } else if (currentView === "invoice") {
          showingInvoice = true;
          isEditingCustomer = false;
          isAddingCustomer = false;
        }
      } else {
        // Customer not found, reset to list view
        navigateTo("list");
      }
    } catch (error) {
      console.error("Failed to load last customer:", error);
      navigateTo("list");
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    // Don't interfere with form-specific shortcuts
    if (isAddingCustomer || isEditingCustomer) return;

    // Global shortcuts - only when not in a form
    if (event.key === "Home" || (event.ctrlKey && event.key === "h")) {
      event.preventDefault();
      navigateTo("list");
    }
  }

  function navigateTo(view: ViewState, customer: Customer | null = null) {
    // Store current view for back button
    previousView = currentView;

    // Handle unsaved changes if transitioning away from form
    if ((isAddingCustomer || isEditingCustomer) && hasUnsavedChanges) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to navigate away?"
        )
      ) {
        return; // Cancel navigation if user doesn't confirm
      }
    }

    // Update state based on target view
    currentView = view;

    if (customer) {
      selectedCustomer = customer;
    }

    switch (view) {
      case "list":
        isAddingCustomer = false;
        isEditingCustomer = false;
        showingInvoice = false;
        selectedCustomer = null;
        break;
      case "add":
        isAddingCustomer = true;
        isEditingCustomer = false;
        showingInvoice = false;
        break;
      case "edit":
        isAddingCustomer = false;
        isEditingCustomer = true;
        showingInvoice = false;
        break;
      case "invoice":
        isAddingCustomer = false;
        isEditingCustomer = false;
        showingInvoice = true;
        break;
    }

    // Save state for session persistence
    saveViewState();
  }

  function handleAddCustomer() {
    navigateTo("add");
  }

  function handleSelectCustomer(customer: Customer) {
    navigateTo("edit", customer);
  }

  function handleCancelForm() {
    // Go back to previous view if available, otherwise to list
    navigateTo(previousView || "list");
  }

  async function handleSaveCustomer(event: CustomEvent<Customer>) {
    const customer = event.detail;
    isLoading = true;
    errorMessage = "";

    try {
      if (isAddingCustomer) {
        await addCustomer(customer);
      } else if (isEditingCustomer) {
        await updateCustomer(customer);
      }

      // Reset form state and show invoice
      selectedCustomer = customer;
      navigateTo("invoice");
      hasUnsavedChanges = false;
    } catch (error) {
      console.error("Failed to save customer:", error);
      errorMessage = "Failed to save customer. Please try again.";
    } finally {
      isLoading = false;
    }
  }

  function handleBackToList() {
    navigateTo("list");
  }

  function handleShowInvoice(customer?: Customer) {
    // If customer is provided (from list), use it, otherwise use the selected customer
    const customerToShow = customer || selectedCustomer;

    if (customerToShow) {
      selectedCustomer = customerToShow; // Update selected customer
      navigateTo("invoice");
    }
  }

  function handleEditCustomer() {
    if (selectedCustomer) {
      navigateTo("edit", selectedCustomer);
    }
  }

  function handleFormChanges(event: CustomEvent<boolean>) {
    hasUnsavedChanges = event.detail;
  }

  // Handle storage location update
  function handleStorageLocationUpdate() {
    // Reinitialize storage with the new location
    isLoading = true;
    errorMessage = "";

    (async () => {
      try {
        await initStorage();
        // If we're in the list view, refresh the customer list
        if (currentView === "list") {
          await loadCustomers();
        }
      } catch (error) {
        console.error("Failed to update storage location:", error);
        errorMessage = `Failed to update storage location: ${error instanceof Error ? error.message : "Unknown error"}`;
      } finally {
        isLoading = false;
      }
    })();
  }

  // Determine active breadcrumb
  $: activeBreadcrumb = isAddingCustomer
    ? "add"
    : isEditingCustomer
      ? "edit"
      : showingInvoice
        ? "invoice"
        : "list";
</script>

<svelte:head>
  <title
    >{selectedCustomer
      ? `${selectedCustomer.name} - `
      : ""}Laskutustyökalu</title
  >
</svelte:head>

<main>
  <header>
    <div class="container">
      <h1>Laskutustyökalu</h1>
      <p>Kirjanpidon laskutustyökalu</p>

      <!-- Breadcrumb navigation -->
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <button
              type="button"
              class="breadcrumb-link"
              class:active={activeBreadcrumb === "list"}
              on:click={() => navigateTo("list")}
            >
              <i class="icon">📋</i> Customer List
            </button>
          </li>

          {#if isAddingCustomer || isEditingCustomer || showingInvoice}
            <li>
              {#if isAddingCustomer}
                <span class:active={activeBreadcrumb === "add"}>
                  <i class="icon">➕</i> Add Customer
                </span>
              {:else}
                <button
                  type="button"
                  class="breadcrumb-link"
                  class:active={activeBreadcrumb === "edit"}
                  on:click={() =>
                    selectedCustomer && navigateTo("edit", selectedCustomer)}
                >
                  <i class="icon">👤</i>
                  {selectedCustomer?.name}
                </button>
              {/if}
            </li>
          {/if}

          {#if showingInvoice}
            <li>
              <span class:active={activeBreadcrumb === "invoice"}>
                <i class="icon">📄</i> Invoice
              </span>
            </li>
          {/if}
        </ol>
      </nav>
    </div>
  </header>

  {#if errorMessage}
    <div class="error-banner">
      <div class="container error-content">
        <p><i class="icon">⚠️</i> {errorMessage}</p>
        <button class="btn-close" on:click={() => (errorMessage = "")}>✕</button
        >
      </div>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  {/if}

  <div class="page-content">
    {#if !isAddingCustomer && !isEditingCustomer && !showingInvoice}
      <div class="container main-layout">
        <div class="main-container full-width">
          <div class="customer-list-container card">
            <CustomerList
              onSelectCustomer={handleSelectCustomer}
              onAddCustomer={handleAddCustomer}
              onShowInvoice={handleShowInvoice}
            />
          </div>

          <!-- Storage location siirretty listauksen alle -->
          <div class="storage-location-container card">
            <StorageLocationSelector
              onLocationUpdate={handleStorageLocationUpdate}
            />
          </div>
        </div>
      </div>
    {:else if (isAddingCustomer || isEditingCustomer) && !showingInvoice}
      <div class="container">
        <div class="card form-card">
          <CustomerForm
            customer={selectedCustomer}
            on:save={handleSaveCustomer}
            on:cancel={handleCancelForm}
            on:formChange={handleFormChanges}
          />
        </div>
      </div>
    {:else if selectedCustomer && showingInvoice}
      <div class="container">
        <div class="card invoice-view">
          <div class="actions">
            <button on:click={handleBackToList} class="secondary">
              <i class="icon">←</i> Back to List
            </button>
            <button on:click={handleEditCustomer} class="primary">
              Edit Customer <i class="icon">✎</i>
            </button>
          </div>

          <InvoiceCalculator customer={selectedCustomer} {vatRate} />
        </div>
      </div>
    {/if}

    {#if !isAddingCustomer && !isEditingCustomer}
      <div class="keyboard-shortcuts-info container">
        <small
          ><i class="icon">⌨️</i> Keyboard shortcuts: Home or Ctrl+H for customer
          list</small
        >
      </div>
    {/if}
  </div>

  <footer>
    <div class="container">
      <p>© {new Date().getFullYear()} Laskutustyökalu</p>
    </div>
  </footer>
</main>

<style>
  /* App.svelte - tyylimäärittelyjen parannukset */

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    background-color: #f5f5f5;
    color: #333;
    overflow-x: hidden; /* Estää horisontaalisen vierityksen */
  }

  main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
  }

  header {
    background: linear-gradient(135deg, #0066cc 0%, #004c99 100%);
    color: white;
    padding: 1.5rem 2rem 1rem;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  header h1 {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  header p {
    margin: 0.5rem 0 0;
    opacity: 0.85;
    font-size: 1.1rem;
  }

  .breadcrumbs {
    margin-top: 1rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem;
  }

  .breadcrumbs ol {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0;
    margin: 0;
  }

  .breadcrumbs li {
    display: inline-flex;
    align-items: center;
    margin: 0.25rem 0;
  }

  .breadcrumbs li:not(:last-child)::after {
    content: "›";
    margin: 0 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.2rem;
  }

  .breadcrumbs button,
  .breadcrumbs span {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.95rem;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .breadcrumbs button:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  .breadcrumbs .active {
    color: white;
    font-weight: bold;
    background-color: rgba(255, 255, 255, 0.2);
  }

  .breadcrumbs button.breadcrumb-link {
    color: rgba(255, 255, 255, 0.9);
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.95rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .breadcrumbs button.breadcrumb-link:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .breadcrumbs button.breadcrumb-link:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }

  .breadcrumbs button.breadcrumb-link.active {
    color: white;
    font-weight: bold;
    background-color: rgba(255, 255, 255, 0.2);
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0066cc;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error-banner {
    background-color: #ffebee;
    color: #c62828;
    padding: 0.75rem 1rem;
    margin: 0 1rem 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #c62828;
  }

  .error-banner .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .error-banner p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .error-banner button.btn-close {
    background-color: transparent;
    border: none;
    color: #c62828;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .error-banner button.btn-close:hover {
    background-color: rgba(198, 40, 40, 0.1);
  }

  footer {
    margin-top: auto;
    padding: 1.25rem;
    background-color: #f0f0f0;
    text-align: center;
    border-top: 1px solid #ddd;
    font-size: 0.9rem;
    color: #666;
  }

  footer .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .invoice-view {
    padding: 25px;
    max-width: 1000px;
    margin: 0 auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  button {
    padding: 10px 18px;
    background-color: #f0f0f0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  button:hover {
    background-color: #e0e0e0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  button.primary {
    background-color: #0066cc;
    color: white;
  }

  button.primary:hover {
    background-color: #0055b3;
  }

  button.secondary {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #ddd;
  }

  button.secondary:hover {
    background-color: #e6e6e6;
  }

  .icon {
    font-size: 1.1em;
  }

  .keyboard-shortcuts-info {
    text-align: center;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #666;
    background-color: #f9f9f9;
    padding: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    font-size: 0.9rem;
  }

  .keyboard-shortcuts-info small {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .main-container {
    display: flex;
    gap: 25px;
    max-width: 1300px;
    margin: 0 auto;
    padding: 25px 20px;
  }

  .customer-list-container {
    flex: 3;
    transition: all 0.3s ease;
  }

  .container {
    max-width: 1300px;
    margin: 0 auto;
    padding: 20px;
  }

  .card {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    padding: 25px;
    transition: all 0.3s ease;
  }

  .card:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .form-card {
    max-width: 850px;
    margin: 0 auto;
  }

  .main-layout {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .page-content {
    flex: 1;
    padding-bottom: 2rem;
  }

  /* Responsiiviset tyylit suuremmille näytöille */
  @media (min-width: 1400px) {
    .container {
      max-width: 1400px;
    }

    .card {
      padding: 30px;
    }

    .main-container {
      gap: 30px;
    }
  }

  /* Responsiiviset tyylit pienemmille näytöille (vaikka pääsääntöisesti työpöytäkäyttöön) */
  @media (max-width: 1200px) {
    .main-container {
      flex-direction: column;
    }

    .container {
      padding: 15px;
    }
  }

  .main-container.full-width {
    flex-direction: column;
    width: 100%;
    max-width: 1300px;
  }

  .storage-location-container {
    margin-top: 20px;
    max-width: 100%;
  }

  @media (min-width: 768px) {
    .storage-location-container {
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>
