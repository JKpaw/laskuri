<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface PricingSettings {
    hourlyRate: number;
    accountingSoftware: number;
    salaryPaymentPrice: number;
    firstMonthFee: number;
    vatRate: number;
    yearEndMinimumSoleTrader: number;
    yearEndMinimumLimitedCompany: number;
    yearEndPeriodStartMonth: number;
    yearEndPeriodStartDay: number;
    yearEndPeriodEndMonth: number;
    yearEndPeriodEndDay: number;
    yearEndInstallments: number;
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

  export let show: boolean;
  export let pricingSettings: PricingSettings;

  const dispatch = createEventDispatcher();

  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleSave() {
    dispatch('save-pricing');
  }

  function handleClose() {
    dispatch('close');
  }
</script>

{#if show}
  <div class="modal-overlay" role="button" aria-label="Close modal" tabindex="0" on:click={handleClose} on:keydown={handleModalKeydown}>
    <div class="modal" role="document" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <div class="modal-header">
        <h2>Hinnasto - Oletusasetukset</h2>
        <button class="modal-close btn-secondary" on:click={handleClose} aria-label="Sulje">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="pricing-sections">
          <div class="pricing-section">
            <h3 class="section-title">Perushinnat</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="default-hourly-rate">Tuntihinta</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="default-hourly-rate" bind:value={pricingSettings.hourlyRate} type="number" step="0.01" min="0">
                  <span class="input-suffix">€</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="default-accounting-software">Kirjanpito-ohjelma</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="default-accounting-software" bind:value={pricingSettings.accountingSoftware} type="number" step="0.01" min="0">
                  <span class="input-suffix">€/kk</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="default-salary-payment">Palkka-ajo per henkilö</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="default-salary-payment" bind:value={pricingSettings.salaryPaymentPrice} type="number" step="0.01" min="0">
                  <span class="input-suffix">€</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="default-first-month">Ensimmäisen kuukauden lisämaksu</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="default-first-month" bind:value={pricingSettings.firstMonthFee} type="number" step="0.01" min="0">
                  <span class="input-suffix">€</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="default-vat-rate">ALV-%</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="default-vat-rate" bind:value={pricingSettings.vatRate} type="number" step="0.001" min="0" max="1" placeholder="0.255">
                  <span class="input-suffix">%</span>
                </div>
                <div class="form-help text-xs text-gray-500 mt-1">
                  Esim. 0.255 = 25.5%
                </div>
              </div>
            </div>
          </div>

          <div class="pricing-section">
            <h3 class="section-title">Tilinpäätöstyöt</h3>
            <p class="text-sm text-gray-600 mb-4">Määritä tilinpäätöstöiden minimihinnat ja aikajaksot.</p>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="year-end-minimum-sole-trader">Toiminimi minimihinta</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="year-end-minimum-sole-trader" bind:value={pricingSettings.yearEndMinimumSoleTrader} type="number" step="0.01" min="0">
                  <span class="input-suffix">€</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-minimum-limited-company">Osakeyhtiö minimihinta</label>
                <div class="input-with-suffix">
                  <input class="form-input" id="year-end-minimum-limited-company" bind:value={pricingSettings.yearEndMinimumLimitedCompany} type="number" step="0.01" min="0">
                  <span class="input-suffix">€</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-start-month">Kausi alkaa (kuukausi)</label>
                <select class="form-input" id="year-end-start-month" bind:value={pricingSettings.yearEndPeriodStartMonth}>
                  <option value={1}>Tammikuu</option>
                  <option value={2}>Helmikuu</option>
                  <option value={3}>Maaliskuu</option>
                  <option value={4}>Huhtikuu</option>
                  <option value={5}>Toukokuu</option>
                  <option value={6}>Kesäkuu</option>
                  <option value={7}>Heinäkuu</option>
                  <option value={8}>Elokuu</option>
                  <option value={9}>Syyskuu</option>
                  <option value={10}>Lokakuu</option>
                  <option value={11}>Marraskuu</option>
                  <option value={12}>Joulukuu</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-start-day">Kausi alkaa (päivä)</label>
                <input class="form-input" id="year-end-start-day" bind:value={pricingSettings.yearEndPeriodStartDay} type="number" min="1" max="31">
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-end-month">Kausi päättyy (kuukausi)</label>
                <select class="form-input" id="year-end-end-month" bind:value={pricingSettings.yearEndPeriodEndMonth}>
                  <option value={1}>Tammikuu</option>
                  <option value={2}>Helmikuu</option>
                  <option value={3}>Maaliskuu</option>
                  <option value={4}>Huhtikuu</option>
                  <option value={5}>Toukokuu</option>
                  <option value={6}>Kesäkuu</option>
                  <option value={7}>Heinäkuu</option>
                  <option value={8}>Elokuu</option>
                  <option value={9}>Syyskuu</option>
                  <option value={10}>Lokakuu</option>
                  <option value={11}>Marraskuu</option>
                  <option value={12}>Joulukuu</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-end-day">Kausi päättyy (päivä)</label>
                <input class="form-input" id="year-end-end-day" bind:value={pricingSettings.yearEndPeriodEndDay} type="number" min="1" max="31">
              </div>

              <div class="form-group">
                <label class="form-label" for="year-end-installments">Oletusositus</label>
                <select class="form-input" id="year-end-installments" bind:value={pricingSettings.yearEndInstallments}>
                  <option value={1}>1 osa (koko summa kerralla)</option>
                  <option value={2}>2 osaa</option>
                  <option value={3}>3 osaa</option>
                  <option value={4}>4 osaa</option>
                  <option value={6}>6 osaa</option>
                  <option value={12}>12 osaa</option>
                </select>
              </div>
            </div>
            <div class="form-help text-xs text-gray-500 mt-2">
              Tilinpäätöstyöt lisätään automaattisesti laskuun määritetyn ajanjakson aikana. Hinta lasketaan kaavalla: Edellisen vuoden laskutus ÷ 12 ÷ osien määrä, mutta vähintään määritetty minimihinta ÷ osien määrä.
            </div>
          </div>

          <div class="pricing-section">
            <h3 class="section-title">Oletusmarginaalitekijät</h3>
            <p class="text-sm text-gray-600 mb-4">Valitse tekijät, jotka ovat useimmiten käytössä uusille asiakkaille.</p>
            <div class="margin-factors">
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.foreignTrade}>
                <span class="checkbox-text">Ulkomaankauppa</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.cashOperations}>
                <span class="checkbox-text">Käteistoiminnot</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.ecommerce}>
                <span class="checkbox-text">Verkkokauppa</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.import}>
                <span class="checkbox-text">Tuonti</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.assetsInBalance}>
                <span class="checkbox-text">Käyttöomaisuus</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.investments}>
                <span class="checkbox-text">Sijoitukset</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.limitedCompany}>
                <span class="checkbox-text">Osakeyhtiö</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.vatLiable}>
                <span class="checkbox-text">ALV-velvollinen</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={pricingSettings.defaultMarginFactors.manualBankStatement}>
                <span class="checkbox-text">Manuaalinen tiliote</span>
              </label>
            </div>
          </div>

          <div class="info-card">
            <div class="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-info">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <div>
                <h4 class="font-medium text-gray-900">Automaattinen tallennus</h4>
                <p class="text-sm text-gray-600">Nämä asetukset tallennetaan automaattisesti ja tulevat oletusarvoiksi kaikissa uusissa laskutuksissa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={handleClose}>Sulje</button>
        <button class="btn btn-success" on:click={handleSave}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          Tallenna Hinnasto
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    width: 100%;
    max-width: 700px;
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

  .pricing-sections {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-8);
  }

  .pricing-section {
    padding: 0;
  }

  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-2);
    border-bottom: 2px solid var(--color-gray-200);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
  }

  .input-with-suffix {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-with-suffix .form-input {
    padding-right: var(--spacing-12);
  }

  .input-suffix {
    position: absolute;
    right: var(--spacing-3);
    color: var(--color-gray-500);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .form-help {
    margin-top: var(--spacing-1);
  }

  .margin-factors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-3);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3);
    border: 1px solid var(--color-gray-200);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .checkbox-label:hover {
    background-color: var(--color-gray-50);
    border-color: var(--color-gray-300);
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
    accent-color: var(--color-primary);
  }

  .checkbox-text {
    font-size: var(--font-size-sm);
    color: var(--color-gray-700);
  }

  .info-card {
    background-color: var(--color-primary-light);
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-4);
  }

  .info-card .text-info {
    color: var(--color-primary);
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .margin-factors {
      grid-template-columns: 1fr;
    }
  }
</style>