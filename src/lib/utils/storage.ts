// Import from the filesystem plugin
import { exists, readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';
import type { Customer, SavedCalculation } from '../types';

// File name for customer data
const CUSTOMER_DATA_FILENAME = 'customers.json';
const CALCULATIONS_DATA_FILENAME = 'calculations.json';
const APP_DATA_SUBFOLDER = 'laskuri_data';
const STORAGE_PREFS_FILENAME = 'storage_prefs.json';

// Type definition for storage preferences
interface StoragePreferences {
  customStoragePath?: string;
}

/**
 * Get the storage preferences path (always in app data dir)
 */
async function getStoragePrefsPath(): Promise<string> {
  const appDataDirPath = await path.appDataDir();
  const appSubfolderPath = await path.join(appDataDirPath, APP_DATA_SUBFOLDER);
  return path.join(appSubfolderPath, STORAGE_PREFS_FILENAME);
}

/**
 * Load storage preferences
 */
async function loadStoragePrefs(): Promise<StoragePreferences> {
  try {
    const prefsPath = await getStoragePrefsPath();
    
    // Check if prefs file exists
    const prefsExists = await exists(prefsPath);
    if (!prefsExists) {
      // If it doesn't exist, ensure the directory exists
      const dirPath = await path.dirname(prefsPath);
      const dirExists = await exists(dirPath);
      if (!dirExists) {
        await mkdir(dirPath, { recursive: true });
      }
      
      // Create empty prefs file
      await writeTextFile(prefsPath, JSON.stringify({}));
      return {};
    }
    
    // Read and parse prefs file
    const content = await readTextFile(prefsPath);
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load storage preferences:', error);
    return {};
  }
}

/**
 * Save storage preferences
 */
async function saveStoragePrefs(prefs: StoragePreferences): Promise<void> {
  try {
    const prefsPath = await getStoragePrefsPath();
    
    // Ensure directory exists
    const dirPath = await path.dirname(prefsPath);
    const dirExists = await exists(dirPath);
    if (!dirExists) {
      await mkdir(dirPath, { recursive: true });
    }
    
    await writeTextFile(prefsPath, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save storage preferences:', error);
    throw new Error(`Failed to save storage preferences: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the current storage location
 */
export async function getStorageLocation(): Promise<string> {
  try {
    const prefs = await loadStoragePrefs();
    return prefs.customStoragePath || '';
  } catch (error) {
    console.error('Failed to get storage location:', error);
    return '';
  }
}

/**
 * Set a custom storage location
 */
export async function setStorageLocation(path: string): Promise<void> {
  try {
    // Validate that the path exists
    const pathExists = await exists(path);
    if (!pathExists) {
      throw new Error('The selected directory does not exist');
    }
    
    // Load current preferences
    const prefs = await loadStoragePrefs();
    
    // Update with new path
    prefs.customStoragePath = path;
    
    // Save updated preferences
    await saveStoragePrefs(prefs);
    
    console.log('Storage location updated to:', path);
  } catch (error) {
    console.error('Failed to set storage location:', error);
    throw new Error(`Failed to set storage location: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the full path to the data file
 */
async function getDataFilePath(): Promise<string> {
  try {
    // Check if we have a custom path set
    const prefs = await loadStoragePrefs();
    
    if (prefs.customStoragePath) {
      // Use custom path if set
      console.log('Using custom data directory:', prefs.customStoragePath);
      return path.join(prefs.customStoragePath, CUSTOMER_DATA_FILENAME);
    }
    
    // First try app data dir with subfolder
    const appDataDirPath = await path.appDataDir();
    const appSubfolderPath = await path.join(appDataDirPath, APP_DATA_SUBFOLDER);
    console.log('Using app data directory:', appSubfolderPath);
    return path.join(appSubfolderPath, CUSTOMER_DATA_FILENAME);
  } catch (error) {
    console.error('Failed to get app data directory:', error);
    // Fallback to documents folder
    try {
      const docDir = await path.documentDir();
      const fallbackPath = await path.join(docDir, APP_DATA_SUBFOLDER);
      console.log('Falling back to document directory:', fallbackPath);
      return path.join(fallbackPath, CUSTOMER_DATA_FILENAME);
    } catch (fallbackError) {
      console.error('Failed to get document directory as fallback:', fallbackError);
      throw new Error('Could not determine a valid storage location');
    }
  }
}

/**
 * Get the full path to the calculations file
 */
async function getCalculationsFilePath(): Promise<string> {
  try {
    // Check if we have a custom path set
    const prefs = await loadStoragePrefs();
    
    if (prefs.customStoragePath) {
      // Use custom path if set
      console.log('Using custom data directory for calculations:', prefs.customStoragePath);
      return path.join(prefs.customStoragePath, CALCULATIONS_DATA_FILENAME);
    }
    
    // First try app data dir with subfolder
    const appDataDirPath = await path.appDataDir();
    const appSubfolderPath = await path.join(appDataDirPath, APP_DATA_SUBFOLDER);
    console.log('Using app data directory for calculations:', appSubfolderPath);
    return path.join(appSubfolderPath, CALCULATIONS_DATA_FILENAME);
  } catch (error) {
    console.error('Failed to get calculations file path:', error);
    // Fallback to documents folder
    try {
      const docDir = await path.documentDir();
      const fallbackPath = await path.join(docDir, APP_DATA_SUBFOLDER);
      console.log('Falling back to document directory for calculations:', fallbackPath);
      return path.join(fallbackPath, CALCULATIONS_DATA_FILENAME);
    } catch (fallbackError) {
      console.error('Failed to get document directory as fallback:', fallbackError);
      throw new Error('Could not determine a valid storage location for calculations');
    }
  }
}

/**
 * Initialize storage by ensuring the data directory exists
 */
export async function initStorage(): Promise<void> {
  try {
    // Get the directory path
    const customerFilePath = await getDataFilePath();
    const calculationsFilePath = await getCalculationsFilePath();
    const dirPath = await path.dirname(customerFilePath);
    console.log('Ensuring directory exists:', dirPath);
    
    // Check if directory exists
    const dirExists = await exists(dirPath);
    console.log('Directory exists:', dirExists);
    
    if (!dirExists) {
      console.log('Creating directory...');
      await mkdir(dirPath, { recursive: true });
    }
    
    // Initialize customers file if needed
    console.log('Data file path:', customerFilePath);
    const customerFileExists = await exists(customerFilePath);
    console.log('Customer file exists:', customerFileExists);
    
    if (!customerFileExists) {
      console.log('Creating empty customers file...');
      await writeTextFile(customerFilePath, JSON.stringify({ customers: [] }));
      console.log('Customer file created successfully');
    }
    
    // Initialize calculations file if needed
    console.log('Calculations file path:', calculationsFilePath);
    const calculationsFileExists = await exists(calculationsFilePath);
    console.log('Calculations file exists:', calculationsFileExists);
    
    if (!calculationsFileExists) {
      console.log('Creating empty calculations file...');
      await writeTextFile(calculationsFilePath, JSON.stringify({ calculations: [] }));
      console.log('Calculations file created successfully');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load customers from local storage
 */
export async function loadCustomers(): Promise<Customer[]> {
  try {
    console.log('Starting to load customers...');
    const filePath = await getDataFilePath();
    console.log('Checking file exists at:', filePath);
    const fileExists = await exists(filePath);
    console.log('File exists:', fileExists);
    
    if (!fileExists) {
      console.log('Customer file does not exist, initializing storage...');
      await initStorage();
      console.log('Storage initialized, returning empty customers array');
      return [];
    }
    
    console.log('Reading customer file content...');
    const content = await readTextFile(filePath);
    console.log('File content read, parsing JSON...');
    const data = JSON.parse(content);
    console.log('Customers loaded successfully, count:', (data.customers || []).length);
    return data.customers || [];
  } catch (error) {
    console.error('Failed to load customers:', error);
    // Try to provide more specific error information
    if (error instanceof Error) {
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to load customers: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save customers to local storage
 */
export async function saveCustomers(customers: Customer[]): Promise<void> {
  try {
    const filePath = await getDataFilePath();
    console.log('Saving customers to:', filePath);
    await writeTextFile(filePath, JSON.stringify({ customers }));
    console.log('Customers saved successfully');
  } catch (error) {
    console.error('Failed to save customers:', error);
    throw new Error(`Failed to save customers: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Add a new customer and save to storage
 */
export async function addCustomer(customer: Customer): Promise<Customer[]> {
  try {
    const customers = await loadCustomers();
    customers.push(customer);
    await saveCustomers(customers);
    return customers;
  } catch (error) {
    console.error('Failed to add customer:', error);
    throw new Error(`Failed to add customer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update an existing customer and save to storage
 */
export async function updateCustomer(customer: Customer): Promise<Customer[]> {
  try {
    const customers = await loadCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    
    if (index !== -1) {
      customers[index] = customer;
      await saveCustomers(customers);
    } else {
      throw new Error(`Customer with ID ${customer.id} not found`);
    }
    
    return customers;
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a customer and save to storage
 */
export async function deleteCustomer(customerId: string): Promise<Customer[]> {
  try {
    console.log('Starting delete operation for customer ID:', customerId);
    
    // Delete all calculations for this customer first
    const calculations = await loadCalculations();
    const customerCalculations = calculations.filter(calc => calc.customerId === customerId);
    
    if (customerCalculations.length > 0) {
      console.log(`Deleting ${customerCalculations.length} calculations for customer ${customerId}`);
      const updatedCalculations = calculations.filter(calc => calc.customerId !== customerId);
      await saveCalculations(updatedCalculations);
    }
    
    // Now delete the customer
    const customers = await loadCustomers();
    console.log('Loaded customers before deletion, count:', customers.length);
    
    const filteredCustomers = customers.filter(c => c.id !== customerId);
    console.log('Filtered customers after deletion, count:', filteredCustomers.length);
    
    if (filteredCustomers.length === customers.length) {
      console.warn(`No customer found with ID ${customerId}`);
    } else {
      console.log(`Found and filtered out customer with ID ${customerId}`);
    }
    
    await saveCustomers(filteredCustomers);
    console.log('Successfully saved updated customers list');
    
    return filteredCustomers;
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw new Error(`Failed to delete customer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load all calculations from storage
 */
export async function loadCalculations(): Promise<SavedCalculation[]> {
  try {
    console.log('Starting to load calculations...');
    const filePath = await getCalculationsFilePath();
    console.log('Checking if calculations file exists at:', filePath);
    const fileExists = await exists(filePath);
    console.log('Calculations file exists:', fileExists);
    
    if (!fileExists) {
      console.log('Calculations file does not exist, initializing storage...');
      await initStorage();
      console.log('Storage initialized, returning empty calculations array');
      return [];
    }
    
    console.log('Reading calculations file content...');
    const content = await readTextFile(filePath);
    console.log('File content read, parsing JSON...');
    const data = JSON.parse(content);
    console.log('Calculations loaded successfully, count:', (data.calculations || []).length);
    return data.calculations || [];
  } catch (error) {
    console.error('Failed to load calculations:', error);
    throw new Error(`Failed to load calculations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Save all calculations to storage
 */
export async function saveCalculations(calculations: SavedCalculation[]): Promise<void> {
  try {
    const filePath = await getCalculationsFilePath();
    console.log('Saving calculations to:', filePath);
    await writeTextFile(filePath, JSON.stringify({ calculations }));
    console.log('Calculations saved successfully');
  } catch (error) {
    console.error('Failed to save calculations:', error);
    throw new Error(`Failed to save calculations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Add a new calculation
 */
export async function addCalculation(calculation: SavedCalculation): Promise<SavedCalculation[]> {
  try {
    const calculations = await loadCalculations();
    calculations.push(calculation);
    await saveCalculations(calculations);
    
    // Update customer reference
    await updateCustomerCalculationReference(calculation.customerId, calculation.id);
    
    return calculations;
  } catch (error) {
    console.error('Failed to add calculation:', error);
    throw new Error(`Failed to add calculation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update an existing calculation
 */
export async function updateCalculation(calculation: SavedCalculation): Promise<SavedCalculation[]> {
  try {
    const calculations = await loadCalculations();
    const index = calculations.findIndex(c => c.id === calculation.id);
    
    if (index !== -1) {
      // Update calculation with new modification date
      const updatedCalculation = {
        ...calculation,
        modifiedAt: new Date().toISOString(),
        version: (calculations[index].version || 0) + 1
      };
      
      calculations[index] = updatedCalculation;
      await saveCalculations(calculations);
    } else {
      throw new Error(`Calculation with ID ${calculation.id} not found`);
    }
    
    return calculations;
  } catch (error) {
    console.error('Failed to update calculation:', error);
    throw new Error(`Failed to update calculation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a calculation
 */
export async function deleteCalculation(calculationId: string): Promise<SavedCalculation[]> {
  try {
    console.log('Starting delete operation for calculation ID:', calculationId);
    const calculations = await loadCalculations();
    
    // Find the calculation to get the customer ID
    const calculationToDelete = calculations.find(c => c.id === calculationId);
    if (!calculationToDelete) {
      console.warn(`No calculation found with ID ${calculationId}`);
      return calculations;
    }
    
    const filteredCalculations = calculations.filter(c => c.id !== calculationId);
    await saveCalculations(filteredCalculations);
    
    // Remove the calculation reference from customer
    await removeCalculationReferenceFromCustomer(calculationToDelete.customerId, calculationId);
    
    console.log('Successfully saved updated calculations list');
    return filteredCalculations;
  } catch (error) {
    console.error('Failed to delete calculation:', error);
    throw new Error(`Failed to delete calculation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all calculations for a specific customer
 */
export async function getCustomerCalculations(customerId: string): Promise<SavedCalculation[]> {
  try {
    const calculations = await loadCalculations();
    return calculations.filter(calculation => calculation.customerId === customerId);
  } catch (error) {
    console.error(`Failed to get calculations for customer ${customerId}:`, error);
    throw new Error(`Failed to get customer calculations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update customer's reference to its calculations
 */
async function updateCustomerCalculationReference(customerId: string, calculationId: string): Promise<void> {
  try {
    const customers = await loadCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      console.error(`Customer with ID ${customerId} not found when updating calculation reference`);
      return;
    }
    
    const customer = customers[customerIndex];
    
    // Initialize calculationIds array if it doesn't exist
    if (!customer.calculationIds) {
      customer.calculationIds = [];
    }
    
    // Add calculationId if it's not already in the array
    if (!customer.calculationIds.includes(calculationId)) {
      customer.calculationIds.push(calculationId);
      customers[customerIndex] = customer;
      await saveCustomers(customers);
    }
  } catch (error) {
    console.error('Failed to update customer calculation reference:', error);
    throw new Error(`Failed to update customer calculation reference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Remove a calculation reference from a customer
 */
async function removeCalculationReferenceFromCustomer(customerId: string, calculationId: string): Promise<void> {
  try {
    const customers = await loadCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      console.error(`Customer with ID ${customerId} not found when removing calculation reference`);
      return;
    }
    
    const customer = customers[customerIndex];
    
    // Remove calculationId if customer has calculationIds
    if (customer.calculationIds && customer.calculationIds.includes(calculationId)) {
      customer.calculationIds = customer.calculationIds.filter(id => id !== calculationId);
      customers[customerIndex] = customer;
      await saveCustomers(customers);
    }
  } catch (error) {
    console.error('Failed to remove customer calculation reference:', error);
    throw new Error(`Failed to remove customer calculation reference: ${error instanceof Error ? error.message : String(error)}`);
  }
}