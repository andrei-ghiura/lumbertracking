
import { Storage } from '@ionic/storage';
import mockSuppliers from './mockSuppliers'; 
import { Supplier } from '../types';

const store = new Storage();
store.create();

const SUPPLIERS_KEY = 'suppliers';

export const resetSuppliersStore = async (): Promise<void> => {
    await store.set(SUPPLIERS_KEY, mockSuppliers);
};

function generateSupplierId(): string {
    return (
        'SUP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).substring(-2).toUpperCase()
    );
}

export const saveSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    let suppliers: Supplier[] = (await store.get(SUPPLIERS_KEY)) || [];
    const now = new Date().toISOString();
    let savedSupplier: Supplier;

    // Consolidate all fields from supplierData into a new object
    // This ensures all optional fields are included if present, or undefined if not
    const fullSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
        nume: supplierData.nume || 'Nume Furnizor Lipsă', // Ensure 'nume' is always defined
        persoanaContact: supplierData.persoanaContact,
        email: supplierData.email,
        telefon: supplierData.telefon,
        adresa: supplierData.adresa,
        // IKEA Fields
        ikeaSupplierId: supplierData.ikeaSupplierId,
        complianceOfficerInfo: supplierData.complianceOfficerInfo,
        subSupplierInfo: supplierData.subSupplierInfo,
        traceabilitySystemDescription: supplierData.traceabilitySystemDescription,
        supplyChainFlowChartData: supplierData.supplyChainFlowChartData,
        latestThirdPartyAuditReports: supplierData.latestThirdPartyAuditReports,
        correctiveActionPlans: supplierData.correctiveActionPlans,
        ikeaOwnAuditResults: supplierData.ikeaOwnAuditResults,
        legalComplianceDeclarations: supplierData.legalComplianceDeclarations,
    };

    if (supplierData.id && supplierData.id !== '') { // Existing supplier
        const index = suppliers.findIndex((s: Supplier) => s.id === supplierData.id);
        if (index !== -1) {
            suppliers[index] = {
                ...suppliers[index], // Preserve existing fields like createdAt
                ...fullSupplierData, // Apply all new and existing fields from input
                id: suppliers[index].id, // Ensure ID is preserved
                updatedAt: now,
            } as Supplier; // Cast to Supplier to satisfy TypeScript
            savedSupplier = suppliers[index];
        } else {
            // This case might happen if an ID is provided but doesn't exist, treat as new with specified ID
             const newSupplierEntry: Supplier = {
                id: supplierData.id,
                ...fullSupplierData,
                createdAt: supplierData.createdAt || now, // Use provided createdAt if available
                updatedAt: now,
            };
            suppliers.push(newSupplierEntry);
            savedSupplier = newSupplierEntry;
        }
    } else { // New supplier
        const newSupplierEntry: Supplier = {
            id: generateSupplierId(),
            ...fullSupplierData,
            createdAt: now,
            updatedAt: now,
        };
        suppliers.push(newSupplierEntry);
        savedSupplier = newSupplierEntry;
    }
    await store.set(SUPPLIERS_KEY, suppliers);
    return savedSupplier;
};

export const getAllSuppliers = async (): Promise<Supplier[]> => {
    const suppliers = await store.get(SUPPLIERS_KEY);
    if (!suppliers || suppliers.length === 0 && mockSuppliers.length > 0) { 
        // Initialize with mock data if store is empty but mock data exists
        await store.set(SUPPLIERS_KEY, mockSuppliers);
        return mockSuppliers;
    }
    return suppliers || [];
};

export const getSupplierById = async (id: string): Promise<Supplier | undefined> => {
    const suppliers: Supplier[] = (await store.get(SUPPLIERS_KEY)) || [];
    return suppliers.find(s => s.id === id);
};

export const deleteSupplierById = async (id: string): Promise<Supplier[]> => {
    let suppliers: Supplier[] = (await store.get(SUPPLIERS_KEY)) || [];
    suppliers = suppliers.filter((s: Supplier) => s.id !== id);
    await store.set(SUPPLIERS_KEY, suppliers);
    return suppliers;
};
