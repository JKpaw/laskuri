# Laskutustyökalu (Invoicing Tool)

This is a Tauri + Svelte + TypeScript desktop application for accounting invoice calculations. The application helps accounting professionals manage customer information, calculate invoices with various parameters, and maintain a comprehensive customer database.

## Features

- **Customer Management**
  - Add, edit, and delete customer details
  - Store company type (OY, sole trader, etc.)
  - Track customer-specific pricing and discounts
  
- **Invoice Calculations**
  - Automatic calculation based on customer data
  - Support for hourly rate, fixed fees, and employee count
  - Margin adjustments based on business complexity factors
  - Year-end accounting price calculations
  
- **Data Visualization**
  - Clear table view of all customers with important metrics
  - Visual indicators for active year-end periods
  - Status indicators for pricing and discount validity
  
- **Data Management**
  - Local storage with customizable storage location
  - Session persistence to resume work where you left off
  - Data validation to prevent errors

## Invoicing Logic

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
- **Application Framework**: Tauri (Rust-based desktop framework)
- **Data Storage**: Local JSON file with configurable storage location
- **UI Components**: Custom-designed responsive components
- **State Management**: Svelte stores and context API

## Project Structure

```
laskuri/
├── src/                    # Frontend source code
│   ├── assets/             # Static assets
│   ├── lib/                # Svelte components
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── App.svelte          # Main application component
│   └── main.ts             # Application entry point
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/                # Rust source code
│   └── Cargo.toml          # Rust dependencies
├── public/                 # Static files
└── package.json            # Node.js dependencies
```

## Installation and Development

### Prerequisites

- Node.js 16.0.0 or later
- Rust and Cargo
- System dependencies for Tauri (see [Tauri setup docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Setting Up the Development Environment

```bash
# Clone the repository
git clone [repository-url]
cd laskuri

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

## Usage

1. **Adding Customers**: Click the "Add Customer" button to create a new customer record.
2. **Editing Customers**: Select a customer from the list and click "Edit" to modify their details.
3. **Calculating Invoices**: Click "Invoice" button next to a customer to see their detailed invoice calculation.
4. **Storage Location**: Use the storage location selector to choose where your customer data is saved.

## Version History

- **1.0.0** (April 2025): Initial release with core functionality
  - Customer management
  - Invoice calculations
  - Local storage

## License

Open source
