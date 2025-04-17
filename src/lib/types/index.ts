// Customer data model
export interface Customer {
  id: string;
  name: string;
  companyType: 'Toiminimi' | 'OY';  // Company type (sole trader or limited company)
  hoursLast3Months: number; // Total hours for last 3 months (will be divided by 3)
  hourlyRate: number; // Hourly rate for calculations
  accountingSoftwarePrice: number; // Fixed price for accounting software
  salaryPaymentPrice: number; // Price per employee for salary payments
  numberOfEmployees: number; // Number of employees
  previousYearInvoicing: number; // Used for year-end accounting calculation
  pricingValidUntil: string; // Valid until date for the whole pricing
  
  // Year-end accounting period
  yearEndAccountingStartDate: string; // Start date for year-end accounting
  yearEndAccountingEndDate: string; // End date for year-end accounting
  
  // Margin factors - each boolean represents if factor is applicable
  marginFactors: {
    foreignTrade: boolean;
    cashOperations: boolean;
    ecommerce: boolean;
    import: boolean;
    assetsInBalance: boolean;
    investments: boolean;
    isLimitedCompany: boolean; // OY
    vatLiable: boolean;
    manualBankStatement: boolean;
  };
  
  // Discount details
  discount: {
    percentage: number;
    validUntil: string; // date string
  };
  
  // Special case flags
  isFirstMonth: boolean;
  isSpecialOffer: boolean;
}

// Invoice calculation result
export interface InvoiceCalculation {
  customer: Customer;
  averageHours: number;
  subtotals: {
    hourlyWork: number;
    accountingSoftware: number;
    salaryPayments: number;
    totalSubtotal: number;
  };
  marginCoefficient: number;
  marginAmount: number;
  yearEndAccountingPrice: number;
  discountAmount: number;
  additionalFees: number;
  vatRate: number;
  priceWithoutVat: number;
  priceWithVat: number;
  customerMargin: number; // customer profit margin
}

// Application state
export interface AppState {
  customers: Customer[];
  selectedCustomerId: string | null;
  vatRate: number; // Default VAT rate (e.g., 0.24 for 24%)
}