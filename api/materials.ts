
import { Storage } from '@ionic/storage';
import mockMaterials from './mockMaterials';
import { Material } from '../types';

const store = new Storage();
store.create();

const MATERIALS_KEY = 'materials';

export const resetStore = async (): Promise<void> => {
    await store.set(MATERIALS_KEY, mockMaterials);
};

function generateAlphanumericId(): string {
    return (
        'MAT-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString(36).substring(-2).toUpperCase()
    );
}

export const saveMaterial = async (materialData: Partial<Material>): Promise<Material[]> => {
    let materials: Material[] = (await store.get(MATERIALS_KEY)) || [];
    const now = new Date().toISOString();

    const fullMaterialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'> = {
        nume: materialData.nume || 'Nume Lipsa',
        descriere: materialData.descriere || '',
        tip: materialData.tip || 'Materie prima',
        stare: materialData.stare || 'Receptionat',
        supplierId: materialData.supplierId,
        componente: materialData.componente || [],
        
        logDiameter: materialData.logDiameter,
        logLength: materialData.logLength,
        logGrade: materialData.logGrade,
        estimatedWeightKg: materialData.estimatedWeightKg,
        defectDescription: materialData.defectDescription,
        dimensions: materialData.dimensions,
        lumberGrade: materialData.lumberGrade,
        surfaceFinish: materialData.surfaceFinish,
        moistureContent: materialData.moistureContent,
        treatment: materialData.treatment,
        processedWeightKg: materialData.processedWeightKg,

        countryOfHarvest: materialData.countryOfHarvest,
        regionAndForestName: materialData.regionAndForestName,
        gpsCoordinatesOrFMU: materialData.gpsCoordinatesOrFMU,
        forestOwnership: materialData.forestOwnership,
        forestType: materialData.forestType,
        harvestDateOrPeriod: materialData.harvestDateOrPeriod,
        treeSpeciesScientific: materialData.treeSpeciesScientific,
        treeSpeciesCommon: materialData.treeSpeciesCommon,
        estimatedVolumePerSpeciesRWE: materialData.estimatedVolumePerSpeciesRWE,
        
        loggingPermitOrLicense: materialData.loggingPermitOrLicense,
        landTenureAndUseRights: materialData.landTenureAndUseRights,
        chainOfCustodyRecords: materialData.chainOfCustodyRecords,
        transportPermits: materialData.transportPermits,
        dueDiligenceRecordsSubSuppliers: materialData.dueDiligenceRecordsSubSuppliers,
        
        forestCertificationScheme: materialData.forestCertificationScheme,
        certificationNumber: materialData.certificationNumber,
        certificationScope: materialData.certificationScope,
        certificationValidityPeriod: materialData.certificationValidityPeriod,
        productGroupAndClaimType: materialData.productGroupAndClaimType,
        cocCertificateCopies: materialData.cocCertificateCopies,
        certificationAuditSummaries: materialData.certificationAuditSummaries,
        
        inputOutputReconciliation: materialData.inputOutputReconciliation,
        batchLevelTrackingInfo: materialData.batchLevelTrackingInfo,
        rawMaterialLedgerInfo: materialData.rawMaterialLedgerInfo,
        
        recycledContentPercentage: materialData.recycledContentPercentage,
        carbonFootprintData: materialData.carbonFootprintData,
        resourceEfficiencyOrWasteData: materialData.resourceEfficiencyOrWasteData,
        forestManagementPlanDetails: materialData.forestManagementPlanDetails,
        
        finalProcessingLocation: materialData.finalProcessingLocation,
        ikeaProductType: materialData.ikeaProductType,
        ikeaProductNamesOrArticles: materialData.ikeaProductNamesOrArticles,
        packingListTraceableToRawMaterial: materialData.packingListTraceableToRawMaterial,
        
        worldForestIDParticipation: materialData.worldForestIDParticipation,
        forensicTestData: materialData.forensicTestData,
        gpsOrBlockchainTraceabilityTools: materialData.gpsOrBlockchainTraceabilityTools,
    };


    if (materialData.id && materialData.id !== '') { 
        const index = materials.findIndex((material: Material) => material.id === materialData.id);
        if (index !== -1) {
            materials[index] = {
                ...materials[index], 
                ...fullMaterialData,
                id: materials[index].id, 
                updatedAt: now,
            };
        } else {
             const newMaterial: Material = {
                id: materialData.id, 
                ...fullMaterialData,
                createdAt: materialData.createdAt || now, 
                updatedAt: now,
            };
            materials.push(newMaterial);
        }
    } else { 
        const newMaterial: Material = {
            id: generateAlphanumericId(),
            ...fullMaterialData,
            createdAt: now,
            updatedAt: now,
        };
        materials.push(newMaterial);
    }
    await store.set(MATERIALS_KEY, materials);
    return materials;
};

export const getAllMaterials = async (): Promise<Material[]> => {
    const materials = await store.get(MATERIALS_KEY);
    if (!materials || materials.length === 0 && mockMaterials.length > 0) { 
        await store.set(MATERIALS_KEY, mockMaterials);
        return mockMaterials;
    }
    return materials || [];
};

export const getMaterialById = async (id: string): Promise<Material | undefined> => {
    const materials: Material[] = (await store.get(MATERIALS_KEY)) || [];
    return materials.find(m => m.id === id);
};

export const deleteMaterialById = async (id: string): Promise<Material[]> => {
    let materials: Material[] = (await store.get(MATERIALS_KEY)) || [];
    materials = materials.filter((material: Material) => material.id !== id);
    await store.set(MATERIALS_KEY, materials);
    return materials;
};

export const removeSupplierFromMaterials = async (supplierIdToDelete: string): Promise<void> => {
    let materials: Material[] = (await store.get(MATERIALS_KEY)) || [];
    let changed = false;
    materials = materials.map(material => {
        if (material.supplierId === supplierIdToDelete) {
            changed = true;
            return { ...material, supplierId: undefined };
        }
        return material;
    });
    if (changed) {
        await store.set(MATERIALS_KEY, materials);
    }
};
