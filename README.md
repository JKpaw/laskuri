# Invoicing Tool

This is a simple Tauri + Svelte + TypeScript desktop application for accounting invoice calculations. The application allows you to store customer information, calculate invoices, and maintain a customer listing.

## Features

- Customer information management (name, company type)
- Accounting hours tracking (total for a 3-month period)
- Automatic invoice calculation with various parameters
- Local data storage
- Simple and user-friendly interface

## Invoicing Logic

The application calculates invoices using the following logic:

### Basic Information
- Customer details (name and company type)
- Total hours spent on accounting over the last 3 months
- Hourly rate
- Fixed accounting software price
- Salary payment price per employee
- Number of employees

### Invoice Calculation
1. **Average Monthly Hours**: Total hours for three months divided by three
2. **Subtotals**:
   - Hourly rate × Average monthly hours
   - Fixed accounting software price
   - Salary payment price × Number of employees

3. **Margin Calculation**:
   Margin is calculated using the following formula: subtotal × margin coefficient
   
   The margin coefficient is determined by the margin system:
   - Minimum margin: 0.1
   - Each of the following adds 0.1 to the margin coefficient:
     - Foreign trade
     - Cash operations
     - E-commerce
     - Import
     - Assets in balance (machinery and equipment)
     - Investments
     - Limited Company (OY)
     - VAT liability
     - Manual bank statement, etc.

4. **Year-End Accounting Price**:
   - Calculated as: Previous fiscal year's invoicing ÷ 12
   - For sole traders: If the amount is less than €100, it's set to €100
   - For limited companies: If the amount is less than €260, it's set to €260

5. **Discounts/Campaigns**:
   - Discount percentage is considered
   - Discount validity period is checked

6. **Special Cases**:
   - First month/promotional pricing

7. **Final Price**:
   - Price without VAT: subtotal + margin + year-end accounting price - discounts + possible additional fees
   - Price with VAT: Price without VAT + (Price without VAT × VAT)
   - Customer margin (can be calculated at the end)

## Technical Details

- **Frontend**: Svelte + TypeScript
- **Application Framework**: Tauri
- **Data Storage**: Local JSON file
- **User Interface**: Custom UI components

## Installation and Usage

### Setting Up the Development Environment

```bash
# Clone the repository
git clone [repository-url]
cd invoicing-tool

# Install dependencies
npm install

# Start development mode
npm run tauri:dev
```

### Building for Production

```bash
# Build production version
npm run tauri:build
```

The production build can be found in the `src-tauri/target/release` folder.

## File Structure

[File structure details here]

## License

[License information]
