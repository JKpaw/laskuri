// Customer types
export interface MarginFactors {
  foreignTrade: boolean;
  cashOperations: boolean;
  ecommerce: boolean;
  import: boolean;
  assetsInBalance: boolean;
  investments: boolean;
  isLimitedCompany: boolean;
  vatLiable: boolean;
  manualBankStatement: boolean;
}

export interface Discount {
  percentage: number;
  validUntil: string; // Date as string in ISO format
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyType: 'Toiminimi' | 'OY';
  registrationDate: string;
  hourlyRate: number;
  hoursLast3Months: number;
  accountingSoftwarePrice: number;
  numberOfEmployees: number;
  salaryPaymentPrice: number;
  yearEndAccountingStartDate: string; // Start date of year-end accounting period
  yearEndAccountingEndDate: string; // End date of year-end accounting period
  previousYearInvoicing: number;
  marginFactors: MarginFactors;
  discount: Discount;
  pricingValidUntil: string; // Date as string in ISO format
  isFirstMonth: boolean; // Flag for first month setup fee
  isSpecialOffer: boolean; // Flag for special offer
  notes: string;
  calculationIds?: string[]; // References to saved calculations
}

// Storage preferences
export interface StoragePreferences {
  customStoragePath: string | null;
}

// Calculation types
export interface InvoiceSubtotals {
  hourlyWork: number;
  accountingSoftware: number;
  salaryPayments: number;
  totalSubtotal: number;
}

export interface InvoiceCalculation {
  customer: Customer;
  averageHours: number;
  subtotals: InvoiceSubtotals;
  marginCoefficient: number;
  marginAmount: number;
  yearEndAccountingPrice: number;
  discountAmount: number;
  additionalFees: number;
  vatRate: number;
  priceWithoutVat: number;
  priceWithVat: number;
  customerMargin: number;
}

// New type for calculation results without customer reference
export interface InvoiceCalculationResult {
  averageHours: number;
  subtotals: InvoiceSubtotals;
  marginCoefficient: number;
  marginAmount: number;
  yearEndAccountingPrice: number;
  discountAmount: number;
  additionalFees: number;
  vatRate: number;
  priceWithoutVat: number;
  priceWithVat: number;
  customerMargin: number;
}

// Type for saved calculations
export interface SavedCalculation {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date string
  modifiedAt: string; // ISO date string
  type: 'draft' | 'offer' | 'final' | 'archived';
  customerSnapshot: Customer; // Full customer data at time of calculation
  result: InvoiceCalculationResult;
  notes?: string;
  version: number; // For tracking changes
}

// Application state
export interface AppState {
  customers: Customer[];
  calculations: SavedCalculation[];
  selectedCustomerId: string | null;
  selectedCalculationId: string | null;
  vatRate: number; // Default VAT rate (e.g., 0.24 for 24%)
}