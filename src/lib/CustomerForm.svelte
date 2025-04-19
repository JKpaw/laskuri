<script lang="ts">
  import { createEventDispatcher, onMount, beforeUpdate } from "svelte";
  import type { Customer } from "./types";
  import { v4 as uuidv4 } from "uuid";

  export let customer: Customer | null = null;

  const dispatch = createEventDispatcher();

  // Form validation state
  let errors: Record<string, string> = {};
  let touched: Record<string, boolean> = {};
  let hasFormChanges = false;
  let originalCustomerJson = "";

  // Create an empty customer object or use the provided one
  let editingCustomer: Customer = customer
    ? { ...customer }
    : {
        id: uuidv4(),
        name: "",
        email: "",
        phone: "",
        registrationDate: new Date().toISOString().split("T")[0],
        companyType: "Toiminimi",
        hoursLast3Months: 0,
        hourlyRate: 0,
        accountingSoftwarePrice: 0,
        salaryPaymentPrice: 0,
        numberOfEmployees: 0,
        previousYearInvoicing: 0,
        pricingValidUntil: new Date().toISOString().split("T")[0],
        yearEndAccountingStartDate: new Date().toISOString().split("T")[0],
        yearEndAccountingEndDate: new Date().toISOString().split("T")[0],
        marginFactors: {
          foreignTrade: false,
          cashOperations: false,
          ecommerce: false,
          import: false,
          assetsInBalance: false,
          investments: false,
          isLimitedCompany: false,
          vatLiable: false,
          manualBankStatement: false,
        },
        discount: {
          percentage: 0,
          validUntil: new Date().toISOString().split("T")[0],
        },
        isFirstMonth: false,
        isSpecialOffer: false,
        notes: ""
      };

  // Update isLimitedCompany when companyType changes
  $: {
    if (editingCustomer.companyType === "OY") {
      editingCustomer.marginFactors.isLimitedCompany = true;
    } else {
      editingCustomer.marginFactors.isLimitedCompany = false;
    }
  }

  // Track form changes
  onMount(() => {
    originalCustomerJson = JSON.stringify(editingCustomer);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  $: {
    hasFormChanges = originalCustomerJson !== JSON.stringify(editingCustomer);
    // Dispatch event when form changes state
    if (hasFormChanges !== undefined) {
      dispatch("formChange", hasFormChanges);
    }
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (hasFormChanges) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  // Form validation
  function validateForm(): boolean {
    errors = {};

    // Name validation
    if (!editingCustomer.name.trim()) {
      errors.name = "Name is required";
    }

    // Company Type validation
    if (!editingCustomer.companyType) {
      errors.companyType = "Company type is required";
    }

    // Numeric field validations
    if (editingCustomer.hoursLast3Months < 0) {
      errors.hoursLast3Months = "Hours cannot be negative";
    }

    if (editingCustomer.hourlyRate < 0) {
      errors.hourlyRate = "Hourly rate cannot be negative";
    }

    if (editingCustomer.accountingSoftwarePrice < 0) {
      errors.accountingSoftwarePrice = "Price cannot be negative";
    }

    if (editingCustomer.salaryPaymentPrice < 0) {
      errors.salaryPaymentPrice = "Price cannot be negative";
    }

    if (
      editingCustomer.numberOfEmployees < 0 ||
      !Number.isInteger(editingCustomer.numberOfEmployees)
    ) {
      errors.numberOfEmployees =
        "Number of employees must be a non-negative integer";
    }

    if (editingCustomer.previousYearInvoicing < 0) {
      errors.previousYearInvoicing =
        "Previous year invoicing cannot be negative";
    }

    // Discount validation
    if (
      editingCustomer.discount.percentage < 0 ||
      editingCustomer.discount.percentage > 100
    ) {
      errors.discountPercentage = "Discount must be between 0 and 100%";
    }

    // Check if date is valid
    if (!editingCustomer.discount.validUntil) {
      errors.discountValidUntil = "Please provide a valid date";
    }

    return Object.keys(errors).length === 0;
  }

  function handleInputBlur(field: string) {
    touched[field] = true;
  }

  function handleSubmit() {
    // Mark all fields as touched
    Object.keys(editingCustomer).forEach((key) => {
      touched[key] = true;
    });

    if (validateForm()) {
      dispatch("save", editingCustomer);
    }
  }

  function handleCancel() {
    if (hasFormChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to cancel?")
      ) {
        dispatch("cancel");
      }
    } else {
      dispatch("cancel");
    }
  }

  // Keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      handleCancel();
    } else if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="customer-form">
  <h2>{customer ? "Edit" : "Add"} Customer</h2>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="name">Name <span class="required">*</span></label>
      <input
        id="name"
        type="text"
        bind:value={editingCustomer.name}
        on:blur={() => handleInputBlur("name")}
        class:error={touched.name && errors.name}
        required
      />
      {#if touched.name && errors.name}
        <span class="error-message">{errors.name}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="companyType"
        >Company Type <span class="required">*</span></label
      >
      <select
        id="companyType"
        bind:value={editingCustomer.companyType}
        class:error={touched.companyType && errors.companyType}
      >
        <option value="Toiminimi">Toiminimi</option>
        <option value="OY">Osakeyhtiö</option>
      </select>
      {#if touched.companyType && errors.companyType}
        <span class="error-message">{errors.companyType}</span>
      {/if}
    </div>

    <h3>Accounting Hours</h3>
    <div class="form-group">
      <label for="hoursLast3Months"
        >Total Hours (Last 3 Months) <span class="required">*</span></label
      >
      <input
        id="hoursLast3Months"
        type="number"
        min="0"
        step="0.5"
        bind:value={editingCustomer.hoursLast3Months}
        on:blur={() => handleInputBlur("hoursLast3Months")}
        class:error={touched.hoursLast3Months && errors.hoursLast3Months}
        required
      />
      <small class="helper-text"
        >Total hours spent on accounting over the last 3 months</small
      >
      {#if touched.hoursLast3Months && errors.hoursLast3Months}
        <span class="error-message">{errors.hoursLast3Months}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="hourlyRate"
        >Hourly Rate (€) <span class="required">*</span></label
      >
      <input
        id="hourlyRate"
        type="number"
        min="0"
        step="0.01"
        bind:value={editingCustomer.hourlyRate}
        on:blur={() => handleInputBlur("hourlyRate")}
        class:error={touched.hourlyRate && errors.hourlyRate}
        required
      />
      {#if touched.hourlyRate && errors.hourlyRate}
        <span class="error-message">{errors.hourlyRate}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="accountingSoftwarePrice"
        >Accounting Software Price (€) <span class="required">*</span></label
      >
      <input
        id="accountingSoftwarePrice"
        type="number"
        min="0"
        step="0.01"
        bind:value={editingCustomer.accountingSoftwarePrice}
        on:blur={() => handleInputBlur("accountingSoftwarePrice")}
        class:error={touched.accountingSoftwarePrice &&
          errors.accountingSoftwarePrice}
        required
      />
      {#if touched.accountingSoftwarePrice && errors.accountingSoftwarePrice}
        <span class="error-message">{errors.accountingSoftwarePrice}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="salaryPaymentPrice"
        >Salary Payment Price (€/employee) <span class="required">*</span
        ></label
      >
      <input
        id="salaryPaymentPrice"
        type="number"
        min="0"
        step="0.01"
        bind:value={editingCustomer.salaryPaymentPrice}
        on:blur={() => handleInputBlur("salaryPaymentPrice")}
        class:error={touched.salaryPaymentPrice && errors.salaryPaymentPrice}
        required
      />
      {#if touched.salaryPaymentPrice && errors.salaryPaymentPrice}
        <span class="error-message">{errors.salaryPaymentPrice}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="numberOfEmployees"
        >Number of Employees <span class="required">*</span></label
      >
      <input
        id="numberOfEmployees"
        type="number"
        min="0"
        step="1"
        bind:value={editingCustomer.numberOfEmployees}
        on:blur={() => handleInputBlur("numberOfEmployees")}
        class:error={touched.numberOfEmployees && errors.numberOfEmployees}
        required
      />
      {#if touched.numberOfEmployees && errors.numberOfEmployees}
        <span class="error-message">{errors.numberOfEmployees}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="previousYearInvoicing"
        >Previous Year's Invoicing (€) <span class="required">*</span></label
      >
      <input
        id="previousYearInvoicing"
        type="number"
        min="0"
        step="0.01"
        bind:value={editingCustomer.previousYearInvoicing}
        on:blur={() => handleInputBlur("previousYearInvoicing")}
        class:error={touched.previousYearInvoicing &&
          errors.previousYearInvoicing}
        required
      />
      {#if touched.previousYearInvoicing && errors.previousYearInvoicing}
        <span class="error-message">{errors.previousYearInvoicing}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="pricingValidUntil">Pricing Valid Until</label>
      <input
        id="pricingValidUntil"
        type="date"
        bind:value={editingCustomer.pricingValidUntil}
        on:blur={() => handleInputBlur("pricingValidUntil")}
        class:error={touched.pricingValidUntil && errors.pricingValidUntil}
      />
      {#if touched.pricingValidUntil && errors.pricingValidUntil}
        <span class="error-message">{errors.pricingValidUntil}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="yearEndAccountingStartDate"
        >Year-End Pricing Period Start Date</label
      >
      <input
        id="yearEndAccountingStartDate"
        type="date"
        bind:value={editingCustomer.yearEndAccountingStartDate}
        on:blur={() => handleInputBlur("yearEndAccountingStartDate")}
        class:error={touched.yearEndAccountingStartDate &&
          errors.yearEndAccountingStartDate}
      />
      {#if touched.yearEndAccountingStartDate && errors.yearEndAccountingStartDate}
        <span class="error-message">{errors.yearEndAccountingStartDate}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="yearEndAccountingEndDate"
        >Year-End Pricing Period End Date</label
      >
      <input
        id="yearEndAccountingEndDate"
        type="date"
        bind:value={editingCustomer.yearEndAccountingEndDate}
        on:blur={() => handleInputBlur("yearEndAccountingEndDate")}
        class:error={touched.yearEndAccountingEndDate &&
          errors.yearEndAccountingEndDate}
      />
      {#if touched.yearEndAccountingEndDate && errors.yearEndAccountingEndDate}
        <span class="error-message">{errors.yearEndAccountingEndDate}</span>
      {/if}
    </div>

    <h3>Margin Factors</h3>
    <div class="margin-factors">
      <div class="form-check">
        <input
          id="foreignTrade"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.foreignTrade}
        />
        <label for="foreignTrade">Foreign Trade</label>
      </div>

      <div class="form-check">
        <input
          id="cashOperations"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.cashOperations}
        />
        <label for="cashOperations">Cash Operations</label>
      </div>

      <div class="form-check">
        <input
          id="ecommerce"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.ecommerce}
        />
        <label for="ecommerce">E-commerce</label>
      </div>

      <div class="form-check">
        <input
          id="import"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.import}
        />
        <label for="import">Import</label>
      </div>

      <div class="form-check">
        <input
          id="assetsInBalance"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.assetsInBalance}
        />
        <label for="assetsInBalance">Assets in Balance</label>
      </div>

      <div class="form-check">
        <input
          id="investments"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.investments}
        />
        <label for="investments">Investments</label>
      </div>

      <div class="form-check">
        <input
          id="vatLiable"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.vatLiable}
        />
        <label for="vatLiable">VAT Liable</label>
      </div>

      <div class="form-check">
        <input
          id="manualBankStatement"
          type="checkbox"
          bind:checked={editingCustomer.marginFactors.manualBankStatement}
        />
        <label for="manualBankStatement">Manual Bank Statement</label>
      </div>
    </div>

    <h3>Discount</h3>
    <div class="form-group">
      <label for="discountPercentage">Discount (%)</label>
      <input
        id="discountPercentage"
        type="number"
        min="0"
        max="100"
        step="1"
        bind:value={editingCustomer.discount.percentage}
        on:blur={() => handleInputBlur("discountPercentage")}
        class:error={touched.discountPercentage && errors.discountPercentage}
      />
      {#if touched.discountPercentage && errors.discountPercentage}
        <span class="error-message">{errors.discountPercentage}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="discountValidUntil">Valid Until</label>
      <input
        id="discountValidUntil"
        type="date"
        bind:value={editingCustomer.discount.validUntil}
        on:blur={() => handleInputBlur("discountValidUntil")}
        class:error={touched.discountValidUntil && errors.discountValidUntil}
      />
      {#if touched.discountValidUntil && errors.discountValidUntil}
        <span class="error-message">{errors.discountValidUntil}</span>
      {/if}
    </div>

    <h3>Special Cases</h3>
    <div class="form-check">
      <input
        id="isFirstMonth"
        type="checkbox"
        bind:checked={editingCustomer.isFirstMonth}
      />
      <label for="isFirstMonth">First Month</label>
    </div>

    <div class="form-check">
      <input
        id="isSpecialOffer"
        type="checkbox"
        bind:checked={editingCustomer.isSpecialOffer}
      />
      <label for="isSpecialOffer">Special Offer</label>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="primary"
        disabled={Object.keys(errors).length > 0}>Save</button
      >
      <button type="button" on:click={handleCancel}>Cancel</button>
      {#if hasFormChanges}
        <span class="unsaved-indicator">Unsaved changes</span>
      {/if}
    </div>

    <div class="keyboard-shortcuts">
      <small>Keyboard shortcuts: Ctrl+S to save, Esc to cancel</small>
    </div>
  </form>
</div>

<style>
  .customer-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h2 {
    margin-bottom: 20px;
  }

  h3 {
    margin: 20px 0 10px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .helper-text {
    display: block;
    font-size: 0.8em;
    color: #666;
    margin-top: 3px;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .form-group input.error {
    border-color: #dc3545;
    background-color: #fff8f8;
  }

  /* Apply error styling to select element when needed */
  .form-group select.error {
    border-color: #dc3545;
    background-color: #fff8f8;
  }

  .error-message {
    color: #dc3545;
    font-size: 0.8em;
    display: block;
    margin-top: 5px;
  }

  .required {
    color: #dc3545;
  }

  .margin-factors {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .form-check {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .form-check input[type="checkbox"] {
    margin-right: 8px;
    width: auto;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: #e0e0e0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button.primary {
    background-color: #0066cc;
    color: white;
  }

  .unsaved-indicator {
    font-style: italic;
    color: #dc3545;
    margin-right: auto;
  }

  .keyboard-shortcuts {
    margin-top: 10px;
    text-align: right;
    color: #666;
  }
</style>
