import type { Customer, InvoiceCalculation } from '../types';

/**
 * Calculate the margin coefficient based on customer's margin factors
 */
export function calculateMarginCoefficient(customer: Customer): number {
  // Start with minimum margin
  let coefficient = 0.1;
  
  const { marginFactors } = customer;
  
  // Add 0.1 for each applicable factor
  if (marginFactors.foreignTrade) coefficient += 0.1;
  if (marginFactors.cashOperations) coefficient += 0.1;
  if (marginFactors.ecommerce) coefficient += 0.1;
  if (marginFactors.import) coefficient += 0.1;
  if (marginFactors.assetsInBalance) coefficient += 0.1;
  if (marginFactors.investments) coefficient += 0.1;
  if (marginFactors.isLimitedCompany) coefficient += 0.1;
  if (marginFactors.vatLiable) coefficient += 0.1;
  if (marginFactors.manualBankStatement) coefficient += 0.1;
  
  return coefficient;
}

/**
 * Calculate year-end accounting price
 */
export function calculateYearEndPrice(customer: Customer): number {
  // Base calculation: Previous year's invoicing divided by 12
  let yearEndPrice = customer.previousYearInvoicing / 12;
  
  // Apply minimum thresholds based on company type
  if (customer.companyType === 'Toiminimi' && yearEndPrice < 100) {
    yearEndPrice = 100;
  } else if (customer.companyType === 'OY' && yearEndPrice < 260) {
    yearEndPrice = 260;
  }

  // Check if year-end accounting period is valid
  const startDate = new Date(customer.yearEndAccountingStartDate);
  const endDate = new Date(customer.yearEndAccountingEndDate);
  const today = new Date();
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || today < startDate || today > endDate) {
    // If outside the year-end accounting period, return 0
    return 0;
  }
  
  return yearEndPrice;
}

/**
 * Calculate discount amount if valid
 */
export function calculateDiscount(subtotal: number, customer: Customer): number {
  const { discount } = customer;
  
  // Check if discount is valid (not expired)
  const discountValid = new Date(discount.validUntil) >= new Date();
  
  if (discountValid && discount.percentage > 0) {
    return subtotal * (discount.percentage / 100);
  }
  
  return 0;
}

/**
 * Calculate customer margin - should be based only on hourly work
 */
export function calculateCustomerMargin(
  hourlyWork: number, 
  salaryPayments: number,
  accountingSoftware: number,
  yearEndAccountingPrice: number,
  discountAmount: number
): number {
  // Calculate margin based on hourly work + salary payments - accounting software + yearend - discount
  return hourlyWork + salaryPayments - accountingSoftware + yearEndAccountingPrice - discountAmount;
}

/**
 * Calculate complete invoice
 */
export function calculateInvoice(customer: Customer, vatRate: number = 0.24): InvoiceCalculation {
  // 1. Calculate average hours (total hours for 3 months divided by 3)
  const averageHours = customer.hoursLast3Months / 3;
  
  // 2. Calculate subtotals
  const hourlyWork = averageHours * customer.hourlyRate;
  const accountingSoftware = customer.accountingSoftwarePrice;
  const salaryPayments = customer.salaryPaymentPrice * customer.numberOfEmployees;
  const totalSubtotal = hourlyWork + accountingSoftware + salaryPayments;
  
  // 3. Calculate margin - only based on hourly work now
  const marginCoefficient = calculateMarginCoefficient(customer);
  const marginAmount = hourlyWork * marginCoefficient;
  
  // 4. Calculate year-end accounting price
  const yearEndAccountingPrice = calculateYearEndPrice(customer);
  
  // 5. Calculate discount
  const discountAmount = calculateDiscount(totalSubtotal, customer);
  
  // 6. Additional fees for special situations (simplified)
  const additionalFees = customer.isFirstMonth ? 50 : 0; // Example: 50€ fee for first month setup
  
  // 7. Calculate final prices
  const priceWithoutVat = totalSubtotal + marginAmount + yearEndAccountingPrice - discountAmount + additionalFees;
  const priceWithVat = priceWithoutVat * (1 + vatRate);
  
  // 8. Calculate customer margin - using the new formula
  const customerMargin = calculateCustomerMargin(
    hourlyWork, 
    salaryPayments, 
    accountingSoftware,
    yearEndAccountingPrice,
    discountAmount
  );
  
  return {
    customer,
    averageHours,
    subtotals: {
      hourlyWork,
      accountingSoftware,
      salaryPayments,
      totalSubtotal
    },
    marginCoefficient,
    marginAmount,
    yearEndAccountingPrice,
    discountAmount,
    additionalFees,
    vatRate,
    priceWithoutVat,
    priceWithVat,
    customerMargin
  };
}