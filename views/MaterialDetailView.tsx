
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonAccordion, IonAccordionGroup, IonFooter, IonModal, IonAlert, IonChip, useIonViewWillLeave,
  AccordionGroupCustomEvent // Corrected import
} from '@ionic/react';
import { checkmarkOutline, trashOutline, downloadOutline, documentTextOutline, qrCodeOutline, close } from 'ionicons/icons';
import { getMaterialById, saveMaterial, deleteMaterialById, getAllMaterials } from '../api/materials';
import { getAllSuppliers } from '../api/suppliers';
import { Material, MaterialState, MaterialType, QRCodeData, Supplier, OwnershipStatus, ForestType, SurfaceFinishType } from '../types';
import labels from '../labels';
import MaterialLabelCanvas from '../components/MaterialLabelCanvas';
// @ts-ignore
import { Html5Qrcode } from 'html5-qrcode';

const isWeb = (): boolean => typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.();

const MaterialDetailView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();
  const isNewMaterial = !routeId;

  const initialMaterialState: Partial<Material> = {
    nume: '', tip: MaterialType.PRIME, stare: MaterialState.RECEIVED, descriere: '', componente: [], supplierId: '',
    // Initialize all other fields to prevent uncontrolled to controlled input issues
    logDiameter: '', logLength: '', logGrade: '', estimatedWeightKg: '', defectDescription: '',
    dimensions: '', lumberGrade: '', surfaceFinish: SurfaceFinishType.ROUGH, moistureContent: '', treatment: '', processedWeightKg: '',
    countryOfHarvest: '', regionAndForestName: '', gpsCoordinatesOrFMU: '',
    forestOwnership: OwnershipStatus.OTHER, forestType: ForestType.SEMI_NATURAL, harvestDateOrPeriod: '',
    treeSpeciesScientific: '', treeSpeciesCommon: '', estimatedVolumePerSpeciesRWE: '',
    loggingPermitOrLicense: '', landTenureAndUseRights: '', chainOfCustodyRecords: '',
    transportPermits: '', dueDiligenceRecordsSubSuppliers: '',
    forestCertificationScheme: '', certificationNumber: '', certificationScope: '',
    certificationValidityPeriod: '', productGroupAndClaimType: '', cocCertificateCopies: '',
    certificationAuditSummaries: '', forestManagementPlanDetails: '',
    inputOutputReconciliation: '', batchLevelTrackingInfo: '', rawMaterialLedgerInfo: '',
    recycledContentPercentage: '', carbonFootprintData: '', resourceEfficiencyOrWasteData: '',
    finalProcessingLocation: '', ikeaProductType: '', ikeaProductNamesOrArticles: '',
    packingListTraceableToRawMaterial: '', worldForestIDParticipation: '',
    forensicTestData: '', gpsOrBlockchainTraceabilityTools: '',
  };

  const [material, setMaterial] = useState<Partial<Material>>(isNewMaterial ? {...initialMaterialState} : {});
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [labelCanvas, setLabelCanvas] = useState<HTMLCanvasElement | null>(null);
  const initialMaterialJson = useRef<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [showWebQrModal, setShowWebQrModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [scanErrorAlert, setScanErrorAlert] = useState<{show: boolean, message: string}>({show: false, message: ''});

  const nextNavigationPath = useRef<string | null>(null);
  const webQrRef = useRef<HTMLDivElement>(null);
  const html5QrInstance = useRef<any>(null);

  const [expandedSections, setExpandedSections] = useState<string[]>(['general', 'lumberMill', 'components', 'qrLabel']);


  const loadInitialData = useCallback(async () => {
    try {
        const suppliersData = await getAllSuppliers();
        setAllSuppliers(suppliersData);
        if (!isNewMaterial && routeId) {
            const fetchedMaterial = await getMaterialById(routeId);
            if (fetchedMaterial) {
                setMaterial(fetchedMaterial);
                initialMaterialJson.current = JSON.stringify(fetchedMaterial);
            } else {
                setScanErrorAlert({show: true, message: labels.materialNegasit});
                navigate('/', { replace: true });
            }
        } else {
            const newMatTemplate = { ...initialMaterialState };
            if (suppliersData.length > 0 && newMatTemplate.tip === MaterialType.PRIME) {
                newMatTemplate.supplierId = suppliersData[0].id;
            }
            setMaterial(newMatTemplate);
            initialMaterialJson.current = JSON.stringify(newMatTemplate);
        }
        const allMats = await getAllMaterials(); setAllMaterials(allMats);
    } catch (error) {
        console.error("Error loading data for detail view", error);
        setScanErrorAlert({show: true, message: `Eroare la încărcare: ${(error as Error).message}`});
    }
  }, [routeId, navigate, isNewMaterial]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    if (initialMaterialJson.current !== null) {
      const currentMaterialJson = JSON.stringify(material);
      setIsDirty(currentMaterialJson !== initialMaterialJson.current);
    }
  }, [material, initialMaterialJson]);

  useEffect(() => {
    if (isNewMaterial && material.tip === MaterialType.PRIME && !material.supplierId && allSuppliers.length > 0) {
      setMaterial(prev => ({ ...prev, supplierId: allSuppliers[0].id }));
    }
  }, [isNewMaterial, material.tip, material.supplierId, allSuppliers]);


  useIonViewWillLeave(() => {
    // Already handled by attemptLeavePage
  });

  const attemptLeavePage = (targetPath: string) => {
    if (isDirty) {
      nextNavigationPath.current = targetPath;
      setShowLeaveConfirm(true);
    } else {
      navigate(targetPath);
    }
  };


  const handleInputChange = (field: keyof Material, value: any) => {
    let updatedMaterial = { ...material, [field]: value };
    if (field === 'tip') {
      const newType = value as MaterialType; const oldType = material.tip as MaterialType;
      if (newType !== oldType) {
        let clearedFields: Partial<Material> = {};
        const primeSpecificFields: (keyof Material)[] = ['supplierId', 'logDiameter', 'logLength', 'logGrade', 'estimatedWeightKg', 'defectDescription', 'countryOfHarvest', 'regionAndForestName', 'gpsCoordinatesOrFMU', 'forestOwnership', 'forestType', 'harvestDateOrPeriod', 'treeSpeciesScientific', 'treeSpeciesCommon', 'estimatedVolumePerSpeciesRWE', 'loggingPermitOrLicense', 'landTenureAndUseRights', 'chainOfCustodyRecords', 'transportPermits', 'dueDiligenceRecordsSubSuppliers', 'forestCertificationScheme', 'certificationNumber', 'certificationScope', 'certificationValidityPeriod', 'productGroupAndClaimType', 'cocCertificateCopies', 'certificationAuditSummaries', 'forestManagementPlanDetails'];
        const workedSpecificFields: (keyof Material)[] = ['dimensions', 'lumberGrade', 'surfaceFinish', 'moistureContent', 'treatment', 'processedWeightKg', 'finalProcessingLocation', 'ikeaProductType', 'ikeaProductNamesOrArticles', 'packingListTraceableToRawMaterial', 'recycledContentPercentage'];
        if (newType !== MaterialType.PRIME) { primeSpecificFields.forEach(key => clearedFields[key] = initialMaterialState[key]); }
        if (newType !== MaterialType.WORKED) { workedSpecificFields.forEach(key => clearedFields[key] = initialMaterialState[key]); }
        updatedMaterial = { ...updatedMaterial, ...clearedFields };
        if (newType === MaterialType.PRIME && !updatedMaterial.supplierId && allSuppliers.length > 0) {
          updatedMaterial.supplierId = allSuppliers[0].id;
        }
      }
    }
    setMaterial(updatedMaterial);
  };

  const handleSave = async () => {
    if (!material.nume || material.nume.trim() === '') {
      setScanErrorAlert({show: true, message: labels.nume + " " + labels.campObligatoriu.toLowerCase()});
      return Promise.reject("Nume obligatoriu");
    }
    let materialToSave: Partial<Material> = { ...material };
    const primeSpecificFields: (keyof Material)[] = ['supplierId', 'logDiameter', 'logLength', 'logGrade', 'estimatedWeightKg', 'defectDescription', 'countryOfHarvest', 'regionAndForestName', 'gpsCoordinatesOrFMU', 'forestOwnership', 'forestType', 'harvestDateOrPeriod', 'treeSpeciesScientific', 'treeSpeciesCommon', 'estimatedVolumePerSpeciesRWE', 'loggingPermitOrLicense', 'landTenureAndUseRights', 'chainOfCustodyRecords', 'transportPermits', 'dueDiligenceRecordsSubSuppliers', 'forestCertificationScheme', 'certificationNumber', 'certificationScope', 'certificationValidityPeriod', 'productGroupAndClaimType', 'cocCertificateCopies', 'certificationAuditSummaries', 'forestManagementPlanDetails'];
    const workedSpecificFields: (keyof Material)[] = ['dimensions', 'lumberGrade', 'surfaceFinish', 'moistureContent', 'treatment', 'processedWeightKg', 'finalProcessingLocation', 'ikeaProductType', 'ikeaProductNamesOrArticles', 'packingListTraceableToRawMaterial', 'recycledContentPercentage'];
    if (materialToSave.tip !== MaterialType.PRIME) { primeSpecificFields.forEach(key => materialToSave[key] = initialMaterialState[key]); }
    if (materialToSave.tip === MaterialType.PRIME && !materialToSave.supplierId && allSuppliers.length > 0) { materialToSave.supplierId = allSuppliers[0].id; }
    if (materialToSave.tip !== MaterialType.WORKED) { workedSpecificFields.forEach(key => materialToSave[key] = initialMaterialState[key]); }

    try {
        const savedMaterialsArray = await saveMaterial(materialToSave);
        let savedMaterialInSystem: Material | undefined;
        if (isNewMaterial) {
            if (materialToSave.id && materialToSave.id !== '') { savedMaterialInSystem = await getMaterialById(materialToSave.id); }
            else {
                const latestMaterialByName = savedMaterialsArray.filter(m => m.nume === materialToSave.nume).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                if (latestMaterialByName) savedMaterialInSystem = latestMaterialByName;
            }
        } else { savedMaterialInSystem = await getMaterialById(materialToSave.id || routeId || ''); }

        if (savedMaterialInSystem) {
            initialMaterialJson.current = JSON.stringify(savedMaterialInSystem);
            setMaterial(savedMaterialInSystem); // Update state with the full saved material
            setIsDirty(false);
            if (isNewMaterial && savedMaterialInSystem.id) { navigate(`/material/${savedMaterialInSystem.id}`, { replace: true }); }
        } else if (isNewMaterial) {
             // Fallback for new material if ID generation or retrieval is problematic
            const fallbackNewMaterial = { ...materialToSave, id: materialToSave.id || `temp-${Date.now()}`, updatedAt: new Date().toISOString(), createdAt: materialToSave.createdAt || new Date().toISOString() } as Material;
            initialMaterialJson.current = JSON.stringify(fallbackNewMaterial);
            setMaterial(fallbackNewMaterial);
            setIsDirty(false);
            navigate('/', { replace: true }); // Or to the new material's temp ID if routing allows
        }
        // Simple success alert, IonToast could be used for more native feel
        alert(labels.materialSalvat);
        return Promise.resolve();
    } catch(e) {
        setScanErrorAlert({show: true, message: `Salvare eșuată: ${(e as Error).message}`});
        return Promise.reject(e);
    }
  };

  const confirmDelete = async () => {
    if (isNewMaterial || !material.id) return;
    try {
        await deleteMaterialById(material.id);
        setIsDirty(false);
        navigate('/', { replace: true });
    } catch (e) {
        setScanErrorAlert({show: true, message: `Ștergere eșuată: ${(e as Error).message}`});
    }
  };

  const handleDownloadLabel = async () => {
    if (labelCanvas) {
      const dataUrl = labelCanvas.toDataURL('image/png');
      const fileName = `${material.id || material.nume?.replace(/[^a-z0-9]/gi, '_') || 'material-label'}.png`;
      if (Capacitor.getPlatform() === 'web') {
        const link = document.createElement('a'); link.download = fileName; link.href = dataUrl;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } else {
        try {
          const base64Data = dataUrl.split(',')[1];
          await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents, recursive: true });
          alert(labels.qrSalvat); // Consider IonToast
        } catch (e) {
            setScanErrorAlert({show: true, message: "Eroare salvare QR: " + (e as Error).message});
        }
      }
    }
  };

  const processScannedComponentData = useCallback(async (scannedText: string) => {
    let scannedId: string | null = null;
    try {
      const rawValue = scannedText.trim(); const parsed: QRCodeData = JSON.parse(rawValue);
      if (parsed && parsed.id) { scannedId = parsed.id; }
    } catch (e) { scannedId = scannedText.trim(); }

    if (scannedId) {
      const componentExists = allMaterials.find(m => m.id === scannedId);
      if (componentExists) {
        if (material.id === scannedId) { setScanErrorAlert({show: true, message: "Nu puteți adăuga un material la el însuși."}); return; }
        setMaterial(prev => ({ ...prev, componente: Array.from(new Set([...(prev.componente || []), scannedId!])) }));
        alert(labels.componentaAdaugata); // Consider IonToast
      } else { setScanErrorAlert({show: true, message: labels.materialInexistentInfo + scannedId}); }
    } else { setScanErrorAlert({show: true, message: labels.qrInvalidMaterial}); }
  }, [allMaterials, material.id]);

  const closeWebQrModal = useCallback(async () => {
    if (html5QrInstance.current) {
        try {
            if (html5QrInstance.current.getState() === 2) { // SCANNING
                await html5QrInstance.current.stop();
            }
        } catch (e) { console.warn('Error stopping QR scanner:', e); }
        finally {
            if(webQrRef.current) webQrRef.current.innerHTML = "";
            html5QrInstance.current = null;
        }
    }
    setShowWebQrModal(false);
  }, []);

  useEffect(() => {
    if (showWebQrModal && webQrRef.current && !html5QrInstance.current && isWeb()) {
        const qrReaderElementId = `material-detail-qr-${Date.now()}`;
        if(webQrRef.current) webQrRef.current.id = qrReaderElementId;

        const instance = new Html5Qrcode(qrReaderElementId);
        html5QrInstance.current = instance;
        Html5Qrcode.getCameras().then((cameras: any[]) => {
            if (cameras && cameras.length) {
                instance.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 }},
                    (decodedText: string) => { processScannedComponentData(decodedText); closeWebQrModal(); },
                    (errorMessage: string) => { /* ignore */ }
                ).catch((err:any) => {
                    console.error("QR Scanner Start Error:", err);
                    setScanErrorAlert({show:true, message: `Eroare pornire scaner: ${err.message || err.name}`});
                    closeWebQrModal();
                });
            } else {
                setScanErrorAlert({show:true, message: "Nicio cameră găsită."});
                closeWebQrModal();
            }
        }).catch((err:any) => {
            console.error("Error getting cameras:", err);
            setScanErrorAlert({show:true, message: `Eroare accesare camere: ${err.message || err.name}`});
            closeWebQrModal();
        });
    }
     return () => {
      if (html5QrInstance.current && typeof html5QrInstance.current.stop === 'function' && html5QrInstance.current.getState() === 2) {
         html5QrInstance.current.stop().catch((e:any) => console.warn("Cleanup stop error:", e));
         if (webQrRef.current) webQrRef.current.innerHTML = "";
         html5QrInstance.current = null;
      }
    };
  }, [showWebQrModal, processScannedComponentData, closeWebQrModal]);


  const handleNativeScanComponent = async () => {
    try {
      await BarcodeScanner.requestPermissions(); const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) { processScannedComponentData(barcodes[0].rawValue); }
    } catch (error) { setScanErrorAlert({show: true, message: labels.eroareScanare + (error as Error).message}); }
  };
  const handleScanComponent = () => { if (isWeb()) { setShowWebQrModal(true); } else { handleNativeScanComponent(); }};

  const removeComponent = (compIdToRemove: string) => {
    setMaterial(prev => ({ ...prev, componente: (prev.componente || []).filter(cId => cId !== compIdToRemove) }));
  };

  const createFormField = (id: keyof Material, labelText: string, type: "text" | "textarea" | "select" | "email" | "tel" | "date" | "number" = "text", options?: { value: string; label: string }[], required?: boolean, rows?: number) => {
    const value = material[id] as any;
    return (
        <IonItem lines="full">
            <IonLabel position="stacked">{labelText}{required && <span style={{color: 'var(--ion-color-danger)'}}>*</span>}</IonLabel>
            {type === "textarea" ? (
                <IonTextarea value={value || ''} onIonChange={e => handleInputChange(id, e.detail.value!)} rows={rows || 2} />
            ) : type === "select" ? (
                <IonSelect value={value || ''} onIonChange={e => handleInputChange(id, e.detail.value)} interface="action-sheet" placeholder={labels.selecteazaTipul}>
                    {options?.map(opt => <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>)}
                </IonSelect>
            ) : (
                <IonInput type={type as any} value={value || ''} onIonChange={e => handleInputChange(id, e.detail.value!)} />
            )}
        </IonItem>
    );
  };

  if (!isNewMaterial && (!material || !material.id) && routeId) {
    return <IonPage><IonContent className="ion-padding">Încărcare material...</IonContent></IonPage>;
  }

  const handleAccordionChange = (e: AccordionGroupCustomEvent<string | string[] | null | undefined>) => {
    const valueFromEvent = e.detail.value;
    if (Array.isArray(valueFromEvent)) {
        setExpandedSections(valueFromEvent);
    } else if (typeof valueFromEvent === 'string') {
        setExpandedSections([valueFromEvent]);
    } else { // null or undefined
        setExpandedSections([]);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" onClick={(e) => { e.preventDefault(); attemptLeavePage(isNewMaterial ? '/' : '/'); }} />
          </IonButtons>
          <IonTitle>{isNewMaterial ? labels.adauga : material.nume || labels.detaliiMaterial}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={!isDirty && !isNewMaterial}>
              <IonIcon slot="icon-only" icon={checkmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonAccordionGroup
            value={expandedSections}
            multiple={true}
            onIonChange={handleAccordionChange}
        >
          <IonAccordion value="general">
            <IonItem slot="header" color="light"><IonLabel>Detalii Generale</IonLabel></IonItem>
            <IonList slot="content" className="ion-no-padding">
              {createFormField('nume', labels.nume, 'text', undefined, true)}
              {createFormField('tip', labels.tip, 'select', Object.values(MaterialType).map(v => ({value:v, label:v})))}
              {material.tip === MaterialType.PRIME && (
                createFormField('supplierId', labels.furnizor, 'select', allSuppliers.map(s => ({value: s.id, label: s.nume})))
              )}
              {createFormField('descriere', labels.descriere, 'textarea')}
              {createFormField('stare', labels.stare, 'select', Object.values(MaterialState).map(v => ({value:v, label:v})))}
            </IonList>
          </IonAccordion>

          <IonAccordion value="lumberMill">
            <IonItem slot="header" color="light"><IonLabel>{labels.detaliiSpecificeLemnMoara}</IonLabel></IonItem>
            <IonList slot="content" className="ion-no-padding">
              {material.tip === MaterialType.PRIME && (
                <>
                  {createFormField('logDiameter', labels.logDiameter)}
                  {createFormField('logLength', labels.logLength)}
                  {createFormField('logGrade', labels.logGrade)}
                  {createFormField('estimatedWeightKg', labels.estimatedWeightKg, 'number')}
                  {createFormField('defectDescription', labels.defectDescription, 'textarea', undefined, false, 2)}
                </>
              )}
              {material.tip === MaterialType.WORKED && (
                <>
                  {createFormField('dimensions', labels.dimensions)}
                  {createFormField('lumberGrade', labels.lumberGrade)}
                  {createFormField('surfaceFinish', labels.surfaceFinish, 'select', Object.values(SurfaceFinishType).map(v => ({value:v, label:v})) )}
                  {createFormField('moistureContent', labels.moistureContent)}
                  {createFormField('treatment', labels.treatment)}
                  {createFormField('processedWeightKg', labels.processedWeightKg, 'number')}
                </>
              )}
            </IonList>
          </IonAccordion>

          <IonAccordion value="components">
            <IonItem slot="header" color="light"><IonLabel>{labels.componente}</IonLabel></IonItem>
            <div slot="content" className="ion-padding">
              {(material.componente && material.componente.length > 0) ? (
                <IonList inset={true}>
                  {material.componente.map(compId => {
                    const comp = allMaterials.find(m => m.id === compId);
                    return (
                      <IonItem key={compId} button onClick={() => attemptLeavePage(`/material/${compId}`)}>
                        <IonLabel>{comp ? `${comp.nume} (${compId})` : compId}</IonLabel>
                        <IonButton fill="clear" color="danger" slot="end" onClick={(e) => {e.stopPropagation(); removeComponent(compId);}}>
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </IonItem>
                    );
                  })}
                </IonList>
              ) : (<p className="ion-padding-start ion-padding-bottom text-sm text-text-muted dark:text-slate-400">{labels.nicioComponentaAdaugata}</p>)}
              <IonButton expand="block" onClick={handleScanComponent} className="ion-margin-top">
                <IonIcon slot="start" icon={qrCodeOutline} /> {labels.adaugaComponenta}
              </IonButton>
            </div>
          </IonAccordion>

          {!isNewMaterial && material.id && (
            <IonAccordion value="qrLabel">
              <IonItem slot="header" color="light"><IonLabel>{labels.etichetaQR}</IonLabel></IonItem>
              <div slot="content" className="ion-padding ion-text-center">
                <MaterialLabelCanvas material={material as Material} allSuppliers={allSuppliers} onCanvasReady={setLabelCanvas} />
                <IonButton expand="block" onClick={handleDownloadLabel} className="ion-margin-top" disabled={!labelCanvas}>
                  <IonIcon slot="start" icon={downloadOutline} /> {labels.descarcaQR}
                </IonButton>
              </div>
            </IonAccordion>
          )}

          {material.tip === MaterialType.PRIME && (
            <IonAccordion value="ikeaOrigin">
              <IonItem slot="header" color="light"><IonLabel>{labels.detaliiOrigineLemnIKEA}</IonLabel></IonItem>
              <IonList slot="content" className="ion-no-padding">
                {createFormField('countryOfHarvest', labels.countryOfHarvest)}
                {createFormField('regionAndForestName', labels.regionAndForestName)}
                {createFormField('gpsCoordinatesOrFMU', labels.gpsCoordinatesOrFMU)}
                {createFormField('forestOwnership', labels.forestOwnership, 'select', Object.values(OwnershipStatus).map(v => ({value:v, label:v})))}
                {createFormField('forestType', labels.forestType, 'select', Object.values(ForestType).map(v => ({value:v, label:v})))}
                {createFormField('harvestDateOrPeriod', labels.harvestDateOrPeriod, 'text')}
                {createFormField('treeSpeciesScientific', labels.treeSpeciesScientific)}
                {createFormField('treeSpeciesCommon', labels.treeSpeciesCommon)}
                {createFormField('estimatedVolumePerSpeciesRWE', labels.estimatedVolumePerSpeciesRWE)}
              </IonList>
            </IonAccordion>
          )}
          {/* Add other IKEA sections similarly, checking visibility based on material.tip */}
           {material.tip === MaterialType.PRIME && (
            <IonAccordion value="ikeaLegal">
                <IonItem slot="header" color="light"><IonLabel>{labels.documentatieLegalaIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('loggingPermitOrLicense', labels.loggingPermitOrLicense, 'textarea', undefined, false, 2)}
                    {createFormField('landTenureAndUseRights', labels.landTenureAndUseRights, 'textarea', undefined, false, 2)}
                    {createFormField('chainOfCustodyRecords', labels.chainOfCustodyRecords, 'textarea', undefined, false, 2)}
                    {createFormField('transportPermits', labels.transportPermits, 'textarea', undefined, false, 2)}
                    {createFormField('dueDiligenceRecordsSubSuppliers', labels.dueDiligenceRecordsSubSuppliers, 'textarea', undefined, false, 2)}
                </IonList>
            </IonAccordion>
          )}
          {material.tip === MaterialType.PRIME && (
            <IonAccordion value="ikeaCertification">
                <IonItem slot="header" color="light"><IonLabel>{labels.certificareIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('forestCertificationScheme', labels.forestCertificationScheme)}
                    {createFormField('certificationNumber', labels.certificationNumber)}
                    {createFormField('certificationScope', labels.certificationScope, 'textarea', undefined, false, 2)}
                    {createFormField('certificationValidityPeriod', labels.certificationValidityPeriod)}
                    {createFormField('productGroupAndClaimType', labels.productGroupAndClaimType)}
                    {createFormField('cocCertificateCopies', labels.cocCertificateCopies, 'textarea', undefined, false, 2)}
                    {createFormField('certificationAuditSummaries', labels.certificationAuditSummaries, 'textarea', undefined, false, 2)}
                </IonList>
            </IonAccordion>
          )}
          {material.tip === MaterialType.WORKED && (
             <IonAccordion value="ikeaDelivery">
                <IonItem slot="header" color="light"><IonLabel>{labels.infoLivrareProductieIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('finalProcessingLocation', labels.finalProcessingLocation)}
                    {createFormField('ikeaProductType', labels.ikeaProductType)}
                    {createFormField('ikeaProductNamesOrArticles', labels.ikeaProductNamesOrArticles, 'textarea', undefined, false, 2)}
                    {createFormField('packingListTraceableToRawMaterial', labels.packingListTraceableToRawMaterial, 'textarea', undefined, false, 2)}
                </IonList>
            </IonAccordion>
          )}
           <IonAccordion value="ikeaTraceability">
                <IonItem slot="header" color="light"><IonLabel>{labels.trasabilitateMaterialIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('inputOutputReconciliation', labels.inputOutputReconciliation, 'textarea', undefined, false, 2)}
                    {createFormField('batchLevelTrackingInfo', labels.batchLevelTrackingInfo)}
                    {createFormField('rawMaterialLedgerInfo', labels.rawMaterialLedgerInfo, 'textarea', undefined, false, 2)}
                </IonList>
            </IonAccordion>
            <IonAccordion value="ikeaSustainability">
                <IonItem slot="header" color="light"><IonLabel>{labels.metriciSustenabilitateIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('recycledContentPercentage', labels.recycledContentPercentage, 'text')}
                    {createFormField('carbonFootprintData', labels.carbonFootprintData, 'textarea', undefined, false, 2)}
                    {createFormField('resourceEfficiencyOrWasteData', labels.resourceEfficiencyOrWasteData, 'textarea', undefined, false, 2)}
                    {material.tip === MaterialType.PRIME && createFormField('forestManagementPlanDetails', labels.forestManagementPlanDetails, 'textarea', undefined, false, 3)}
                </IonList>
            </IonAccordion>
            <IonAccordion value="ikeaProvenance">
                <IonItem slot="header" color="light"><IonLabel>{labels.instrumenteVerificareProvenientaIKEA}</IonLabel></IonItem>
                <IonList slot="content" className="ion-no-padding">
                    {createFormField('worldForestIDParticipation', labels.worldForestIDParticipation, 'textarea', undefined, false, 2)}
                    {createFormField('forensicTestData', labels.forensicTestData, 'textarea', undefined, false, 2)}
                    {createFormField('gpsOrBlockchainTraceabilityTools', labels.gpsOrBlockchainTraceabilityTools, 'textarea', undefined, false, 2)}
                </IonList>
            </IonAccordion>

        </IonAccordionGroup>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isNewMaterial || !material.id}>
              <IonIcon slot="start" icon={trashOutline} /> {labels.sterge}
            </IonButton>
          </IonButtons>
          {!isNewMaterial && material.id && (
            <IonButtons slot="end">
              <IonButton onClick={() => attemptLeavePage(`/material/${material.id}/components`)}>
                <IonIcon slot="start" icon={documentTextOutline} /> {labels.billOfMaterials}
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonFooter>

      <IonModal isOpen={showWebQrModal} onDidDismiss={closeWebQrModal}>
        <IonHeader><IonToolbar><IonTitle>{labels.scan}</IonTitle><IonButtons slot="end"><IonButton onClick={closeWebQrModal}><IonIcon icon={close}/></IonButton></IonButtons></IonToolbar></IonHeader>
        <IonContent className="ion-padding"><div ref={webQrRef} style={{ width: '100%', height: '300px' }} id="web-qr-reader-detail"></div></IonContent>
      </IonModal>

      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header={labels.confirmareStergere}
        message={labels.confirmareStergereInfo}
        buttons={[ { text: labels.anuleaza, role: 'cancel' }, { text: labels.daSterge, role: 'destructive', handler: confirmDelete }]}
      />
       <IonAlert
        isOpen={showLeaveConfirm}
        onDidDismiss={() => setShowLeaveConfirm(false)}
        header={labels.modificariNesalvate}
        message={labels.modificariNesalvateInfo}
        buttons={[
          { text: labels.ramaiPePagina, role: 'cancel', handler: () => nextNavigationPath.current = null },
          { text: labels.parasesteFaraSalvare, handler: () => { setIsDirty(false); if(nextNavigationPath.current) navigate(nextNavigationPath.current); } },
          { text: labels.salveazaSiPleaca, handler: async () => { await handleSave(); if(nextNavigationPath.current && !isDirty) navigate(nextNavigationPath.current); } }
        ]}
      />
      <IonAlert
        isOpen={scanErrorAlert.show}
        onDidDismiss={() => setScanErrorAlert({show: false, message:''})}
        header={"Notificare"}
        message={scanErrorAlert.message}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default MaterialDetailView;
