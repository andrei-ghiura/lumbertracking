
export enum MaterialType {
  PRIME = "Materie prima", // Raw Wood Material
  WORKED = "Material prelucrat", // Milled/Prefabricated Material
}

export enum MaterialState {
  RECEIVED = "Receptionat",
  IN_PROGRESS = "In lucru",
  DELIVERED = "Livrat",
}

export enum OwnershipStatus {
  PUBLIC = "Public",
  PRIVATE = "Privat",
  COMMUNAL = "Comunal",
  OTHER = "Altul"
}

export enum ForestType {
  NATURAL_PRIMARY = "Naturală/Primară",
  SEMI_NATURAL = "Semi-naturală",
  PLANTATION = "Plantație",
}

export enum SurfaceFinishType {
  ROUGH = "Brut", // Nevopsit/Netratat
  S2S = "Rindeluit 2 Fețe (S2S)", // Surfaced 2 Sides
  S4S = "Rindeluit 4 Fețe (S4S)", // Surfaced 4 Sides
  SANDED = "Șlefuit",
  PAINTED = "Vopsit",
  LACQUERED = "Lăcuit",
  OILED = "Uleiat",
}


export interface Supplier {
  id: string;
  nume: string; // Legal entity name
  persoanaContact?: string;
  email?: string;
  telefon?: string;
  adresa?: string; // Legal entity address
  createdAt: string;
  updatedAt: string;

  // IKEA Fields for Supplier (Point 1 from list)
  ikeaSupplierId?: string; // Supplier ID (assigned by IKEA)
  complianceOfficerInfo?: string; // Contact person and compliance officer info
  subSupplierInfo?: string; // Sub-supplier or subcontractor details

  // IKEA Fields for Supplier (Point 5, 7 - related to supplier's system & audits)
  traceabilitySystemDescription?: string; // Traceability system description (manual or software-based)
  supplyChainFlowChartData?: string; // Supply chain flow chart or data flow (textual description or link)

  // Point 7: Audits and Compliance
  latestThirdPartyAuditReports?: string; // Link or description of (e.g. FSC, IKEA audits)
  correctiveActionPlans?: string; // Link or description for CAPs, if any
  ikeaOwnAuditResults?: string; // Link or description for IKEA’s own audit results (shared back to the supplier)
  legalComplianceDeclarations?: string; // e.g., EUTR/DDS if exporting to EU/UK/US
}

export interface Material {
  id: string;
  nume: string;
  descriere: string;
  tip: MaterialType | string;
  stare: MaterialState | string;
  supplierId?: string; // For PRIME materials, links to Supplier.id
  createdAt: string;
  updatedAt: string;
  componente: string[]; // array of material IDs

  // --- Lumber Mill Specific Attributes ---
  // For PRIME materials (e.g., Logs)
  logDiameter?: string; // e.g., "30-50 cm"
  logLength?: string; // e.g., "4m, 6m"
  logGrade?: string; // e.g., "A", "B", "Veneer Quality"
  estimatedWeightKg?: string; // e.g., "1200"
  defectDescription?: string; // e.g., "Knots present, slight curve"

  // For WORKED materials (e.g., Lumber, Beams)
  dimensions?: string; // e.g., "25x100x4000mm"
  lumberGrade?: string; // e.g., "Structural Grade 1", "Appearance Grade"
  surfaceFinish?: SurfaceFinishType | string;
  moistureContent?: string; // e.g., "KD 15-19%", "Uscat la aer"
  treatment?: string; // e.g., "Tratat termic ISPM-15", "Antifungic"
  processedWeightKg?: string; // e.g., "800"
  // --- End Lumber Mill Specific Attributes ---

  // IKEA Fields for Material - Wood Origin Details (Point 2) - Primarily for MaterialType.PRIME
  countryOfHarvest?: string;
  regionAndForestName?: string;
  gpsCoordinatesOrFMU?: string; // GPS coordinates or forest management unit (FMU)
  forestOwnership?: OwnershipStatus | string; // Public or private ownership status
  forestType?: ForestType | string; // Natural/primary, semi-natural, plantation
  harvestDateOrPeriod?: string;
  treeSpeciesScientific?: string;
  treeSpeciesCommon?: string;
  estimatedVolumePerSpeciesRWE?: string; // In cubic meters or RWE (Round Wood Equivalent)

  // IKEA Fields for Material - Legal Documentation (Point 3) - Primarily for MaterialType.PRIME
  loggingPermitOrLicense?: string; // Link or doc ID for Logging permit / harvesting license
  landTenureAndUseRights?: string; // Link or description for Land tenure and forest use rights
  chainOfCustodyRecords?: string; // Link or description for Chain of custody (CoC) records for this batch/lot
  transportPermits?: string; // Link or doc ID (if applicable)
  dueDiligenceRecordsSubSuppliers?: string; // Link or description for Due diligence records for all sub-suppliers

  // IKEA Fields for Material - Certification Information (Point 4) - Primarily for MaterialType.PRIME
  forestCertificationScheme?: string; // e.g., FSC, PEFC
  certificationNumber?: string;
  certificationScope?: string;
  certificationValidityPeriod?: string;
  productGroupAndClaimType?: string; // e.g., FSC 100%, FSC Mix
  cocCertificateCopies?: string; // Link or reference to Chain-of-custody certificate copies
  certificationAuditSummaries?: string; // (optional but preferred) Link or reference

  // IKEA Fields for Material - Material Traceability (Point 5) - Relevant for both, context differs
  // traceabilitySystemDescription is on Supplier
  inputOutputReconciliation?: string; // wood in vs. products out (more for WORKED, but can be for PRIME batches)
  batchLevelTrackingInfo?: string; // Batch-level tracking of material
  // supplyChainFlowChartData is on Supplier
  rawMaterialLedgerInfo?: string; // Raw material ledger (including sub-supplier inputs) (More for overall system, but can attach specific ledger if batch specific)

  // IKEA Fields for Material - Sustainability Metrics (Point 6)
  recycledContentPercentage?: string; // if applicable (more for WORKED if it includes recycled)
  carbonFootprintData?: string; // (optional, encouraged)
  resourceEfficiencyOrWasteData?: string; // (if required)
  forestManagementPlanDetails?: string; // (for FSC Controlled Wood or non-certified material) - for PRIME

  // IKEA Fields for Material - Audits and Compliance (Point 7) are mostly at Supplier level
  // legalComplianceDeclarations is also at Supplier level for overall declarations

  // IKEA Fields for Material - Delivery & Manufacturing Info (Point 8) - Primarily for MaterialType.WORKED
  finalProcessingLocation?: string; // country, facility name
  ikeaProductType?: string; // plywood, particle board, solid wood, etc. (final product type from this material)
  ikeaProductNamesOrArticles?: string; // IKEA product names or article numbers using the wood
  packingListTraceableToRawMaterial?: string; // Link or reference to Packing list traceable to raw material

  // IKEA Fields for Material - Provenance Verification Tools (Point 9) - Optional/If applicable
  worldForestIDParticipation?: string; // Participation in World Forest ID (wood fingerprinting)
  forensicTestData?: string; // Forensic test data (if IKEA requests isotope/fiber/chemical tests)
  gpsOrBlockchainTraceabilityTools?: string; // GPS or blockchain traceability tools (if in use)

  // Point 10 Data Submission Standards - Not stored data, but process note.
}

export interface QRCodeData {
  id: string;
}

