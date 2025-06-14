import { Preferences } from '@capacitor/preferences';
import mockSuppliers from '@/api/mockSuppliers'; 
import { Supplier } from '@/types';

const SUPPLIERS_KEY = 'suppliers_store';

export const resetSuppliersStore = async (): Promise<void> => {
    await Preferences.set({ key: SUPPLIERS_KEY, value: JSON.stringify(mockSuppliers) });
};

function generateSupplierId(): string {
    return (
        'SUP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).substring(-2).toUpperCase()
    );
}

export const saveSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
    const { value } = await Preferences.get({ key: SUPPLIERS_KEY });
    let suppliers: Supplier[] = value ? JSON.parse(value) : [];
    const now = new Date().toISOString();
    let savedSupplier: Supplier;

    const fullSupplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> = {
        nume: supplierData.nume || 'Nume Furnizor Lipsă', 
        persoanaContact: supplierData.persoanaContact,
        email: supplierData.email,
        telefon: supplierData.telefon,
        adresa: supplierData.adresa,
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

    if (supplierData.id && supplierData.id !== '') { 
        const index = suppliers.findIndex((s: Supplier) => s.id === supplierData.id);
        if (index !== -1) {
            suppliers[index] = {
                ...suppliers[index], 
                ...fullSupplierData, 
                id: suppliers[index].id, 
                updatedAt: now,
            } as Supplier; 
            savedSupplier = suppliers[index];
        } else {
             const newSupplierEntry: Supplier = {
                id: supplierData.id,
                ...fullSupplierData,
                createdAt: supplierData.createdAt || now, 
                updatedAt: now,
            };
            suppliers.push(newSupplierEntry);
            savedSupplier = newSupplierEntry;
        }
    } else { 
        const newSupplierEntry: Supplier = {
            id: generateSupplierId(),
            ...fullSupplierData,
            createdAt: now,
            updatedAt: now,
        };
        suppliers.push(newSupplierEntry);
        savedSupplier = newSupplierEntry;
    }
    await Preferences.set({ key: SUPPLIERS_KEY, value: JSON.stringify(suppliers) });
    return savedSupplier;
};

export const getAllSuppliers = async (): Promise<Supplier[]> => {
    const { value } = await Preferences.get({ key: SUPPLIERS_KEY });
    const suppliers = value ? JSON.parse(value) : null;
    if (!suppliers || suppliers.length === 0 && mockSuppliers.length > 0) { 
        await Preferences.set({ key: SUPPLIERS_KEY, value: JSON.stringify(mockSuppliers) });
        return mockSuppliers;
    }
    return suppliers || [];
};

export const getSupplierById = async (id: string): Promise<Supplier | undefined> => {
    const { value } = await Preferences.get({ key: SUPPLIERS_KEY });
    const suppliers: Supplier[] = value ? JSON.parse(value) : [];
    return suppliers.find(s => s.id === id);
};

export const deleteSupplierById = async (id: string): Promise<Supplier[]> => {
    const { value } = await Preferences.get({ key: SUPPLIERS_KEY });
    let suppliers: Supplier[] = value ? JSON.parse(value) : [];
    suppliers = suppliers.filter((s: Supplier) => s.id !== id);
    await Preferences.set({ key: SUPPLIERS_KEY, value: JSON.stringify(suppliers) });
    return suppliers;
};