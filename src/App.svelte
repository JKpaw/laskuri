<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import { invoke } from '@tauri-apps/api/core';
  import { save, open } from '@tauri-apps/plugin-dialog';
  import { writeTextFile, readTextFile, exists } from '@tauri-apps/plugin-fs';
  import { documentDir } from '@tauri-apps/api/path';

  // Import components
  import Header from './lib/Header.svelte';
  import CustomerForm from './lib/CustomerForm.svelte';
  import CustomerList from './lib/CustomerList.svelte';
  import PricingSettings from './lib/PricingSettings.svelte';
  import InvoiceList from './lib/InvoiceList.svelte';
  import InvoiceCalculation from './lib/InvoiceCalculation.svelte';

  // Simplified Customer interface - just basic info
  interface Customer {
    id: string;
    name: string;
    companyType: 'toiminimi' | 'oy';
    email?: string;
    phone?: string;
    address?: string;
    createdDate: string;
  }

  // Separate interface for calculation parameters
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
    // Add year-end installment support
    yearEndInstallmentNumber: number; // Which installment (1, 2, 3, etc.)
    yearEndTotalInstallments: number; // Total number of installments
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

  // Add new pricing interface
  interface PricingSettings {
    hourlyRate: number;
    accountingSoftware: number;
    salaryPaymentPrice: number;
    firstMonthFee: number;
    vatRate: number;
    // Add year-end accounting configuration
    yearEndMinimumSoleTrader: number;
    yearEndMinimumLimitedCompany: number;
    yearEndPeriodStartMonth: number; // 1-12
    yearEndPeriodStartDay: number; // 1-31
    yearEndPeriodEndMonth: number; // 1-12
    yearEndPeriodEndDay: number; // 1-31
    // Add installment support
    yearEndInstallments: number; // Default number of installments (1, 2, 3, etc.)
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

  // Add saved invoice interface
  interface SavedInvoice {
    id: string;
    customerSnapshot: Customer;
    calculationParams: CalculationParameters;
    calculationResult: InvoiceCalculation;
    createdDate: string;
    description: string;
    status: 'draft' | 'sent' | 'paid';
  }

  let customers: Customer[] = [];
  let savedInvoices: SavedInvoice[] = [];
  let showAddCustomer = false;
  let showInvoiceCalculation = false;
  let showPricingSettings = false;
  let showInvoiceList = false;
  let showEditInvoice = false;
  let selectedCustomer: Customer | null = null;
  let selectedInvoice: SavedInvoice | null = null;
  let calculationResult: InvoiceCalculation | null = null;
  let storageLocation = '';
  let pricingStorageLocation = '';
  let invoicesStorageLocation = '';
  let invoiceDescription = '';
  let invoiceStatus: 'draft' | 'sent' | 'paid' = 'draft';

  // Simplified new customer form data - only basic info
  let newCustomer: Customer = {
    id: '',
    name: '',
    companyType: 'toiminimi',
    email: '',
    phone: '',
    address: '',
    createdDate: ''
  };

  // Separate calculation parameters with defaults
  let calculationParams: CalculationParameters = {
    hourlyRate: 80,
    accountingSoftware: 45,
    employees: 0,
    salaryPaymentPrice: 15,
    totalHoursLastThreeMonths: 0,
    billingPeriodStart: '',
    billingPeriodEnd: '',
    marginFactors: {
      foreignTrade: false,
      cashOperations: false,
      ecommerce: false,
      import: false,
      assetsInBalance: false,
      investments: false,
      limitedCompany: false,
      vatLiable: false,
      manualBankStatement: false
    },
    previousYearInvoicing: 0,
    yearEndAccountingStartDate: '2025-01-01',
    yearEndAccountingEndDate: '2025-04-30',
    isFirstMonth: false,
    yearEndInstallmentNumber: 1,
    yearEndTotalInstallments: 1
  };

  // Default pricing settings
  let pricingSettings: PricingSettings = {
    hourlyRate: 80,
    accountingSoftware: 45,
    salaryPaymentPrice: 15,
    firstMonthFee: 50,
    vatRate: 0.255,
    // Year-end accounting configuration with correct defaults
    yearEndMinimumSoleTrader: 100,
    yearEndMinimumLimitedCompany: 260,
    yearEndPeriodStartMonth: 1,
    yearEndPeriodStartDay: 1,
    yearEndPeriodEndMonth: 4,
    yearEndPeriodEndDay: 30,
    yearEndInstallments: 1, // Default number of installments
    defaultMarginFactors: {
      foreignTrade: false,
      cashOperations: false,
      ecommerce: false,
      import: false,
      assetsInBalance: false,
      investments: false,
      limitedCompany: false,
      vatLiable: false,
      manualBankStatement: false
    }
  };

  onMount(async () => {
    await setDefaultStorageLocation();
    loadCustomers();
    loadPricingSettings();
    loadInvoices();
  });

  async function setDefaultStorageLocation() {
    if (!storageLocation) {
      try {
        const documentsPath = await documentDir();
        storageLocation = `${documentsPath}\\Laskutustyökalu_asiakkaat.json`;
        pricingStorageLocation = `${documentsPath}\\Laskutustyökalu_hinnasto.json`;
        invoicesStorageLocation = `${documentsPath}\\Laskutustyökalu_laskut.json`;
      } catch (error) {
        console.error('Error setting default storage location:', error);
      }
    }
  }

  async function loadCustomers() {
    try {
      if (storageLocation && await exists(storageLocation)) {
        const data = await readTextFile(storageLocation);
        customers = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async function saveCustomers() {
    try {
      if (!storageLocation) {
        const path = await save({
          filters: [{
            name: 'JSON',
            extensions: ['json']
          }]
        });
        if (path) {
          storageLocation = path;
        } else {
          return;
        }
      }
      await writeTextFile(storageLocation, JSON.stringify(customers, null, 2));
    } catch (error) {
      console.error('Error saving customers:', error);
    }
  }

  async function loadPricingSettings() {
    try {
      if (pricingStorageLocation && await exists(pricingStorageLocation)) {
        const data = await readTextFile(pricingStorageLocation);
        pricingSettings = { ...pricingSettings, ...JSON.parse(data) };
        updateCalculationParamsFromPricing();
      }
    } catch (error) {
      console.error('Error loading pricing settings:', error);
    }
  }

  async function savePricingSettings() {
    try {
      if (!pricingStorageLocation) {
        const documentsPath = await documentDir();
        pricingStorageLocation = `${documentsPath}\\Laskutustyökalu_hinnasto.json`;
      }
      await writeTextFile(pricingStorageLocation, JSON.stringify(pricingSettings, null, 2));
      updateCalculationParamsFromPricing();
    } catch (error) {
      console.error('Error saving pricing settings:', error);
    }
  }

  async function loadInvoices() {
    try {
      if (invoicesStorageLocation && await exists(invoicesStorageLocation)) {
        const data = await readTextFile(invoicesStorageLocation);
        savedInvoices = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  }

  async function saveInvoices() {
    try {
      if (!invoicesStorageLocation) {
        const documentsPath = await documentDir();
        invoicesStorageLocation = `${documentsPath}\\Laskutustyökalu_laskut.json`;
      }
      await writeTextFile(invoicesStorageLocation, JSON.stringify(savedInvoices, null, 2));
    } catch (error) {
      console.error('Error saving invoices:', error);
    }
  }

  async function selectStorageLocation() {
    try {
      const path = await open({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });
      if (path) {
        storageLocation = path;
        await loadCustomers();
      }
    } catch (error) {
      console.error('Error selecting storage location:', error);
    }
  }

  function updateCalculationParamsFromPricing() {
    calculationParams.hourlyRate = pricingSettings.hourlyRate;
    calculationParams.accountingSoftware = pricingSettings.accountingSoftware;
    calculationParams.salaryPaymentPrice = pricingSettings.salaryPaymentPrice;
    calculationParams.marginFactors = { ...pricingSettings.defaultMarginFactors };
    
    // Update year-end accounting dates dynamically
    const yearEndDates = calculateYearEndDates();
    calculationParams.yearEndAccountingStartDate = yearEndDates.startDate;
    calculationParams.yearEndAccountingEndDate = yearEndDates.endDate;
  }

  function calculateYearEndDates() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Determine which year's accounting period we're in
    const startOfCurrentPeriod = new Date(currentYear, pricingSettings.yearEndPeriodStartMonth - 1, pricingSettings.yearEndPeriodStartDay);
    const endOfCurrentPeriod = new Date(currentYear, pricingSettings.yearEndPeriodEndMonth - 1, pricingSettings.yearEndPeriodEndDay);
    
    let startYear = currentYear;
    let endYear = currentYear;
    
    // If current date is before the start of this year's period, use last year's period
    if (currentDate < startOfCurrentPeriod) {
      startYear = currentYear - 1;
      endYear = currentYear - 1;
    }
    // If current date is after the end of this year's period, use next year's period
    else if (currentDate > endOfCurrentPeriod) {
      startYear = currentYear + 1;
      endYear = currentYear + 1;
    }
    
    const startDate = new Date(startYear, pricingSettings.yearEndPeriodStartMonth - 1, pricingSettings.yearEndPeriodStartDay);
    const endDate = new Date(endYear, pricingSettings.yearEndPeriodEndMonth - 1, pricingSettings.yearEndPeriodEndDay);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  function addCustomer() {
    if (!newCustomer.name) return;
    
    const customer: Customer = {
      id: uuidv4(),
      name: newCustomer.name,
      companyType: newCustomer.companyType || 'toiminimi',
      email: newCustomer.email || '',
      phone: newCustomer.phone || '',
      address: newCustomer.address || '',
      createdDate: new Date().toISOString()
    };

    customers = [...customers, customer];
    saveCustomers();
    showAddCustomer = false;
    resetNewCustomerForm();
  }

  function resetNewCustomerForm() {
    newCustomer = {
      id: '',
      name: '',
      companyType: 'toiminimi',
      email: '',
      phone: '',
      address: '',
      createdDate: ''
    };

    // Get dynamic year-end dates
    const yearEndDates = calculateYearEndDates();
    
    calculationParams = {
      hourlyRate: pricingSettings.hourlyRate,
      accountingSoftware: pricingSettings.accountingSoftware,
      employees: 0,
      salaryPaymentPrice: pricingSettings.salaryPaymentPrice,
      totalHoursLastThreeMonths: 0,
      billingPeriodStart: '',
      billingPeriodEnd: '',
      marginFactors: { ...pricingSettings.defaultMarginFactors },
      previousYearInvoicing: 0,
      yearEndAccountingStartDate: yearEndDates.startDate,
      yearEndAccountingEndDate: yearEndDates.endDate,
      isFirstMonth: false,
      yearEndInstallmentNumber: 1,
      yearEndTotalInstallments: pricingSettings.yearEndInstallments
    };
  }

  function saveInvoice(description: string, status: 'draft' | 'sent' | 'paid') {
    if (!selectedCustomer || !calculationResult) return;

    const invoice: SavedInvoice = {
      id: uuidv4(),
      customerSnapshot: { ...selectedCustomer },
      calculationParams: { ...calculationParams },
      calculationResult: { ...calculationResult },
      createdDate: new Date().toISOString(),
      description,
      status
    };

    savedInvoices = [...savedInvoices, invoice];
    saveInvoices();
    showInvoiceCalculation = false;
  }

  function showCalculation(customer: Customer) {
    selectedCustomer = customer;
    showInvoiceCalculation = true;
    showEditInvoice = false;
  }

  function deleteCustomer(customerId: string) {
    if (confirm('Haluatko varmasti poistaa asiakkaan?')) {
      customers = customers.filter(c => c.id !== customerId);
      saveCustomers();
    }
  }

  function deleteInvoice(invoiceId: string) {
    if (confirm('Haluatko varmasti poistaa laskun?')) {
      savedInvoices = savedInvoices.filter(i => i.id !== invoiceId);
      saveInvoices();
    }
  }

  function openInvoice(invoice: SavedInvoice) {
    selectedInvoice = invoice;
    selectedCustomer = invoice.customerSnapshot;
    calculationParams = { ...invoice.calculationParams };
    calculationResult = { ...invoice.calculationResult };
    invoiceDescription = invoice.description;
    invoiceStatus = invoice.status;
    showInvoiceList = false;
    showInvoiceCalculation = true;
    showEditInvoice = false;
  }

  function editInvoice(invoice: SavedInvoice) {
    selectedInvoice = invoice;
    selectedCustomer = invoice.customerSnapshot;
    calculationParams = { ...invoice.calculationParams };
    calculationResult = null; // Clear result so user can recalculate
    invoiceDescription = invoice.description;
    invoiceStatus = invoice.status;
    showInvoiceList = false;
    showInvoiceCalculation = true;
    showEditInvoice = true;
  }

  function updateInvoice(description: string, status: 'draft' | 'sent' | 'paid') {
    if (!selectedInvoice || !selectedCustomer || !calculationResult) return;

    const updatedInvoice: SavedInvoice = {
      ...selectedInvoice,
      calculationParams: { ...calculationParams },
      calculationResult: { ...calculationResult },
      description,
      status
    };

    savedInvoices = savedInvoices.map(inv => 
      inv.id === selectedInvoice!.id ? updatedInvoice : inv
    );
    
    saveInvoices();
    showInvoiceCalculation = false;
    showEditInvoice = false;
    selectedInvoice = null;
  }

  // Event handlers for components
  function handleHeaderAddCustomer() {
    showAddCustomer = true;
  }

  function handleHeaderShowPricing() {
    showPricingSettings = true;
  }

  function handleHeaderShowInvoices() {
    showInvoiceList = true;
  }

  function handleHeaderSelectStorage() {
    selectStorageLocation();
  }

  function handleCustomerFormAddCustomer(event: CustomEvent) {
    addCustomer();
  }

  function handleCustomerFormClose() {
    showAddCustomer = false;
  }

  function handleCustomerListShowCalculation(event: CustomEvent) {
    showCalculation(event.detail);
  }

  function handleCustomerListDeleteCustomer(event: CustomEvent) {
    deleteCustomer(event.detail);
  }

  function handlePricingSettingsSave() {
    savePricingSettings();
  }

  function handlePricingSettingsClose() {
    showPricingSettings = false;
  }

  function handleInvoiceListOpenInvoice(event: CustomEvent) {
    openInvoice(event.detail);
  }

  function handleInvoiceListEditInvoice(event: CustomEvent) {
    editInvoice(event.detail);
  }

  function handleInvoiceListDeleteInvoice(event: CustomEvent) {
    deleteInvoice(event.detail);
  }

  function handleInvoiceListClose() {
    showInvoiceList = false;
  }

  function handleInvoiceCalculationCalculate(event: CustomEvent) {
    calculationResult = event.detail;
  }

  function handleInvoiceCalculationSaveInvoice(event: CustomEvent) {
    saveInvoice(event.detail.description, event.detail.status);
  }

  function handleInvoiceCalculationUpdateInvoice(event: CustomEvent) {
    updateInvoice(event.detail.description, event.detail.status);
  }

  function handleInvoiceCalculationClose() {
    showInvoiceCalculation = false;
    showEditInvoice = false;
  }
</script>

<main class="container">
  <div class="app-header text-center mb-8">
    <h1 class="mb-2">Laskutustyökalu</h1>
    <p class="text-gray-600">Modernit työkalut asiakkaiden ja laskutuksen hallintaan</p>
  </div>
  
  <Header 
    {storageLocation}
    on:add-customer={handleHeaderAddCustomer}
    on:show-pricing={handleHeaderShowPricing}
    on:show-invoices={handleHeaderShowInvoices}
    on:select-storage={handleHeaderSelectStorage}
  />

  <CustomerForm 
    show={showAddCustomer}
    bind:newCustomer
    on:add-customer={handleCustomerFormAddCustomer}
    on:close={handleCustomerFormClose}
  />

  <CustomerList 
    {customers}
    on:show-calculation={handleCustomerListShowCalculation}
    on:delete-customer={handleCustomerListDeleteCustomer}
  />

  <PricingSettings 
    show={showPricingSettings}
    bind:pricingSettings
    on:save-pricing={handlePricingSettingsSave}
    on:close={handlePricingSettingsClose}
  />

  <InvoiceList 
    show={showInvoiceList}
    {savedInvoices}
    on:open-invoice={handleInvoiceListOpenInvoice}
    on:edit-invoice={handleInvoiceListEditInvoice}
    on:delete-invoice={handleInvoiceListDeleteInvoice}
    on:close={handleInvoiceListClose}
  />

  <InvoiceCalculation 
    show={showInvoiceCalculation}
    {selectedCustomer}
    bind:calculationParams
    bind:calculationResult
    bind:invoiceDescription
    bind:invoiceStatus
    {pricingSettings}
    isEditMode={showEditInvoice}
    on:calculate={handleInvoiceCalculationCalculate}
    on:save-invoice={handleInvoiceCalculationSaveInvoice}
    on:update-invoice={handleInvoiceCalculationUpdateInvoice}
    on:close={handleInvoiceCalculationClose}
  />
</main>

<style>
  main {
    padding: var(--spacing-8) 0;
    min-height: 100vh;
  }

  .app-header {
    margin-bottom: var(--spacing-12);
  }

  .app-header h1 {
    background: linear-gradient(135deg, var(--color-primary), var(--color-info));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }
</style>