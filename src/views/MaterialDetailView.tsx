import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  Container, AppBar, Toolbar, Typography, Button, IconButton, Box, TextField, Select, MenuItem,
  Accordion as MuiAccordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert as MuiAlert, Chip, FormControl, InputLabel, List, ListItem, ListItemText, Paper, ListItemButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ArticleIcon from '@mui/icons-material/Article'; // for BOM
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

import { getMaterialById, saveMaterial, deleteMaterialById, getAllMaterials } from '@/api/materials';
import { getAllSuppliers } from '@/api/suppliers';
import { Material, MaterialState, MaterialType, QRCodeData, Supplier, OwnershipStatus, ForestType, SurfaceFinishType } from '@/types';
import labels from '@/labels';
import MaterialLabelCanvas from '@/components/MaterialLabelCanvas';
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

  const [material, setMaterial] = useState<Partial<Material>>(isNewMaterial ? { ...initialMaterialState } : {});
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [labelCanvas, setLabelCanvas] = useState<HTMLCanvasElement | null>(null);
  const initialMaterialJson = useRef<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [showWebQrModal, setShowWebQrModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notifAlert, setNotifAlert] = useState<{ show: boolean, message: string, severity?: 'success' | 'error' | 'info' | 'warning' }>({ show: false, message: '' });

  const nextNavigationPath = useRef<string | null>(null);
  const webQrRef = useRef<HTMLDivElement>(null);
  const html5QrInstance = useRef<any>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>(['general', 'lumberMill', 'components', 'qrLabel']);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => isExpanded ? [...prev, panel] : prev.filter(p => p !== panel));
  };

  const loadInitialData = useCallback(async () => {
    try {
      const suppliersData = await getAllSuppliers(); setAllSuppliers(suppliersData);
      if (!isNewMaterial && routeId) {
        const fetchedMaterial = await getMaterialById(routeId);
        if (fetchedMaterial) { setMaterial(fetchedMaterial); initialMaterialJson.current = JSON.stringify(fetchedMaterial); }
        else { setNotifAlert({ show: true, message: labels.materialNegasit, severity: 'error' }); navigate('/', { replace: true }); }
      } else {
        const newMatTemplate = { ...initialMaterialState };
        if (suppliersData.length > 0 && newMatTemplate.tip === MaterialType.PRIME) newMatTemplate.supplierId = suppliersData[0].id;
        setMaterial(newMatTemplate); initialMaterialJson.current = JSON.stringify(newMatTemplate);
      }
      const allMats = await getAllMaterials(); setAllMaterials(allMats);
    } catch (error) { setNotifAlert({ show: true, message: `Eroare la încărcare: ${(error as Error).message}`, severity: 'error' }); }
  }, [routeId, navigate, isNewMaterial]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  useEffect(() => { if (initialMaterialJson.current !== null) setIsDirty(JSON.stringify(material) !== initialMaterialJson.current); }, [material]);
  useEffect(() => { if (isNewMaterial && material.tip === MaterialType.PRIME && !material.supplierId && allSuppliers.length > 0) setMaterial(prev => ({ ...prev, supplierId: allSuppliers[0].id })); }, [isNewMaterial, material.tip, material.supplierId, allSuppliers]);

  // Simplified navigation for unsaved changes for this refactor.
  // TODO: Re-implement robust unsaved changes dialog using React Router v6 blockers if needed.
  const handleAttemptLeave = (targetPath: string) => {
    if (isDirty) {
      nextNavigationPath.current = targetPath;
      setShowLeaveConfirm(true); // This will show a generic "are you sure?"
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
        if (newType !== MaterialType.PRIME) { primeSpecificFields.forEach(key => clearedFields[key] = initialMaterialState[key] as any); }
        if (newType !== MaterialType.WORKED) { workedSpecificFields.forEach(key => clearedFields[key] = initialMaterialState[key] as any); }
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
      setNotifAlert({ show: true, message: labels.nume + " " + labels.campObligatoriu.toLowerCase(), severity: 'error' }); return Promise.reject("Nume obligatoriu");
    }
    let materialToSave: Partial<Material> = { ...material };
    const primeSpecificFields: (keyof Material)[] = ['supplierId', 'logDiameter', 'logLength', 'logGrade', 'estimatedWeightKg', 'defectDescription', 'countryOfHarvest', 'regionAndForestName', 'gpsCoordinatesOrFMU', 'forestOwnership', 'forestType', 'harvestDateOrPeriod', 'treeSpeciesScientific', 'treeSpeciesCommon', 'estimatedVolumePerSpeciesRWE', 'loggingPermitOrLicense', 'landTenureAndUseRights', 'chainOfCustodyRecords', 'transportPermits', 'dueDiligenceRecordsSubSuppliers', 'forestCertificationScheme', 'certificationNumber', 'certificationScope', 'certificationValidityPeriod', 'productGroupAndClaimType', 'cocCertificateCopies', 'certificationAuditSummaries', 'forestManagementPlanDetails'];
    const workedSpecificFields: (keyof Material)[] = ['dimensions', 'lumberGrade', 'surfaceFinish', 'moistureContent', 'treatment', 'processedWeightKg', 'finalProcessingLocation', 'ikeaProductType', 'ikeaProductNamesOrArticles', 'packingListTraceableToRawMaterial', 'recycledContentPercentage'];
    if (materialToSave.tip !== MaterialType.PRIME) { primeSpecificFields.forEach(key => { materialToSave[key] = initialMaterialState[key] as any }); }
    if (materialToSave.tip === MaterialType.PRIME && !materialToSave.supplierId && allSuppliers.length > 0) { materialToSave.supplierId = allSuppliers[0].id; }
    if (materialToSave.tip !== MaterialType.WORKED) { workedSpecificFields.forEach(key => materialToSave[key] = initialMaterialState[key] as any); }

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
        initialMaterialJson.current = JSON.stringify(savedMaterialInSystem); setMaterial(savedMaterialInSystem); setIsDirty(false);
        if (isNewMaterial && savedMaterialInSystem.id) navigate(`/material/${savedMaterialInSystem.id}`, { replace: true });
      } else if (isNewMaterial) {
        const fallbackNewMaterial = { ...materialToSave, id: materialToSave.id || `temp-${Date.now()}`, updatedAt: new Date().toISOString(), createdAt: materialToSave.createdAt || new Date().toISOString() } as Material;
        initialMaterialJson.current = JSON.stringify(fallbackNewMaterial); setMaterial(fallbackNewMaterial); setIsDirty(false);
        navigate('/', { replace: true });
      }
      setNotifAlert({ show: true, message: labels.materialSalvat, severity: 'success' });
      return Promise.resolve();
    } catch (e) { setNotifAlert({ show: true, message: `Salvare eșuată: ${(e as Error).message}`, severity: 'error' }); return Promise.reject(e); }
  };

  const confirmDelete = async () => {
    if (isNewMaterial || !material.id) return;
    try { await deleteMaterialById(material.id); setIsDirty(false); navigate('/', { replace: true }); }
    catch (e) { setNotifAlert({ show: true, message: `Ștergere eșuată: ${(e as Error).message}`, severity: 'error' }); }
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
          setNotifAlert({ show: true, message: labels.qrSalvat, severity: 'success' });
        } catch (e) {
          setNotifAlert({ show: true, message: "Eroare salvare QR: " + (e as Error).message, severity: 'error' });
        }
      }
    }
  };
  const processScannedComponentData = useCallback(async (scannedText: string) => {
    let scannedId: string | null = null;
    try {
      const rawValue = scannedText.trim(); const parsed: QRCodeData = JSON.parse(rawValue);
      scannedId = parsed?.id || rawValue;
    } catch (e) { scannedId = scannedText.trim(); }

    if (scannedId) {
      const componentExists = allMaterials.find(m => m.id === scannedId);
      if (componentExists) {
        if (material.id === scannedId) { setNotifAlert({ show: true, message: "Nu puteți adăuga un material la el însuși.", severity: 'warning' }); return; }
        setMaterial(prev => ({ ...prev, componente: Array.from(new Set([...(prev.componente || []), scannedId!])) }));
        setNotifAlert({ show: true, message: labels.componentaAdaugata, severity: 'success' });
      } else { setNotifAlert({ show: true, message: labels.materialInexistentInfo + scannedId, severity: 'error' }); }
    } else { setNotifAlert({ show: true, message: labels.qrInvalidMaterial, severity: 'error' }); }
  }, [allMaterials, material.id]);

  const closeWebQrModal = useCallback(async () => {
    if (html5QrInstance.current) {
      try { if (html5QrInstance.current.getState() === 2) await html5QrInstance.current.stop(); }
      catch (e) { console.warn('Error stopping QR scanner:', e); }
      finally { if (webQrRef.current) webQrRef.current.innerHTML = ""; html5QrInstance.current = null; }
    }
    setShowWebQrModal(false);
  }, []);

  useEffect(() => {
    if (showWebQrModal && webQrRef.current && !html5QrInstance.current && isWeb()) {
      const qrReaderElementId = `material-detail-qr-${Date.now()}`;
      if (webQrRef.current) webQrRef.current.id = qrReaderElementId;
      const instance = new Html5Qrcode(qrReaderElementId);
      html5QrInstance.current = instance;
      Html5Qrcode.getCameras().then((cameras: any[]) => {
        if (cameras && cameras.length) {
          instance.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => { processScannedComponentData(decodedText); closeWebQrModal(); }, () => { /* ignore */ }
          ).catch((err: any) => { setNotifAlert({ show: true, message: `Eroare pornire scaner: ${err.message || err.name}`, severity: 'error' }); closeWebQrModal(); });
        } else { setNotifAlert({ show: true, message: "Nicio cameră găsită.", severity: 'error' }); closeWebQrModal(); }
      }).catch((err: any) => { setNotifAlert({ show: true, message: `Eroare accesare camere: ${err.message || err.name}`, severity: 'error' }); closeWebQrModal(); });
    }
    return () => {
      if (html5QrInstance.current && typeof html5QrInstance.current.stop === 'function' && html5QrInstance.current.getState() === 2) {
        html5QrInstance.current.stop().catch((e: any) => console.warn("Cleanup stop error:", e));
        if (webQrRef.current) webQrRef.current.innerHTML = ""; html5QrInstance.current = null;
      }
    };
  }, [showWebQrModal, processScannedComponentData, closeWebQrModal]);

  const handleNativeScanComponent = async () => {
    try {
      await BarcodeScanner.requestPermissions(); const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) { processScannedComponentData(barcodes[0].rawValue); }
    } catch (error) { setNotifAlert({ show: true, message: labels.eroareScanare + (error as Error).message, severity: 'error' }); }
  };
  const handleScanComponent = () => { if (isWeb()) { setShowWebQrModal(true); } else { handleNativeScanComponent(); } };
  const removeComponent = (compIdToRemove: string) => setMaterial(prev => ({ ...prev, componente: (prev.componente || []).filter(cId => cId !== compIdToRemove) }));

  const createFormField = (id: keyof Material, labelText: string, type: "text" | "textarea" | "select" | "email" | "tel" | "date" | "number" = "text", options?: { value: string; label: string }[], required?: boolean, rows?: number) => {
    const value = material[id] as any;
    const baseProps = {
      value: value || '',
      onChange: (e: any) => handleInputChange(id, e.target.value),
      fullWidth: true,
      required: required,
    };

    if (type === "textarea") return <TextField {...baseProps} label={labelText} multiline rows={rows || 2} variant="outlined" margin="normal" />;
    if (type === "select") return (
      <FormControl fullWidth margin="normal" variant="outlined" required={required}>
        <InputLabel>{labelText}</InputLabel>
        <Select {...baseProps} label={labelText}>
          {options?.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </Select>
      </FormControl>
    );
    return <TextField {...baseProps} label={labelText} type={type} variant="outlined" margin="normal" />;
  };

  if (!isNewMaterial && (!material || !material.id) && routeId) {
    return <Container sx={{ p: 2 }}><Typography>Încărcare material...</Typography></Container>;
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => handleAttemptLeave('/')} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isNewMaterial ? labels.adauga : material.nume || labels.detaliiMaterial}
          </Typography>
          <Button color="inherit" onClick={handleSave} disabled={!isDirty && !isNewMaterial} startIcon={<SaveIcon />}>
            Salvare
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <MuiAccordion expanded={expandedAccordions.includes('general')} onChange={handleAccordionChange('general')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">Detalii Generale</Typography></AccordionSummary>
          <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {createFormField('nume', labels.nume, 'text', undefined, true)}
            {createFormField('tip', labels.tip, 'select', Object.values(MaterialType).map(v => ({ value: v, label: v })))}
            {material.tip === MaterialType.PRIME && createFormField('supplierId', labels.furnizor, 'select', allSuppliers.map(s => ({ value: s.id, label: s.nume })))}
            {createFormField('descriere', labels.descriere, 'textarea')}
            {createFormField('stare', labels.stare, 'select', Object.values(MaterialState).map(v => ({ value: v, label: v })))}
          </Box></AccordionDetails>
        </MuiAccordion>

        <MuiAccordion expanded={expandedAccordions.includes('lumberMill')} onChange={handleAccordionChange('lumberMill')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.detaliiSpecificeLemnMoara}</Typography></AccordionSummary>
          <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {material.tip === MaterialType.PRIME && (<>
              {createFormField('logDiameter', labels.logDiameter)} {createFormField('logLength', labels.logLength)}
              {createFormField('logGrade', labels.logGrade)} {createFormField('estimatedWeightKg', labels.estimatedWeightKg, 'number')}
              {createFormField('defectDescription', labels.defectDescription, 'textarea', undefined, false, 2)}
            </>)}
            {material.tip === MaterialType.WORKED && (<>
              {createFormField('dimensions', labels.dimensions)} {createFormField('lumberGrade', labels.lumberGrade)}
              {createFormField('surfaceFinish', labels.surfaceFinish, 'select', Object.values(SurfaceFinishType).map(v => ({ value: v, label: v })))}
              {createFormField('moistureContent', labels.moistureContent)} {createFormField('treatment', labels.treatment)}
              {createFormField('processedWeightKg', labels.processedWeightKg, 'number')}
            </>)}
          </Box></AccordionDetails>
        </MuiAccordion>

        <MuiAccordion expanded={expandedAccordions.includes('components')} onChange={handleAccordionChange('components')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.componente}</Typography></AccordionSummary>
          <AccordionDetails>
            {(material.componente && material.componente.length > 0) ? (
              <List> {material.componente.map(compId => {
                const comp = allMaterials.find(m => m.id === compId);
                return (
                  <ListItem key={compId} disablePadding secondaryAction={
                    <IconButton edge="end" aria-label="delete component" onClick={(e) => { e.stopPropagation(); removeComponent(compId); }}>
                      <DeleteIcon color="error" />
                    </IconButton>}>
                    <ListItemButton onClick={() => handleAttemptLeave(`/material/${compId}`)} sx={{ cursor: 'pointer' }}>
                      <ListItemText primary={comp ? `${comp.nume} (${compId})` : compId} />
                    </ListItemButton>
                  </ListItem>);
              })} </List>
            ) : (<Typography sx={{ p: 1, color: 'text.secondary' }}>{labels.nicioComponentaAdaugata}</Typography>)}
            <Button variant="contained" onClick={handleScanComponent} startIcon={<QrCodeScannerIcon />} sx={{ mt: 2 }}>
              {labels.adaugaComponenta}
            </Button>
          </AccordionDetails>
        </MuiAccordion>

        {!isNewMaterial && material.id && (
          <MuiAccordion expanded={expandedAccordions.includes('qrLabel')} onChange={handleAccordionChange('qrLabel')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.etichetaQR}</Typography></AccordionSummary>
            <AccordionDetails sx={{ textAlign: 'center' }}>
              <MaterialLabelCanvas material={material as Material} allSuppliers={allSuppliers} onCanvasReady={setLabelCanvas} />
              <Button variant="contained" onClick={handleDownloadLabel} startIcon={<DownloadIcon />} sx={{ mt: 2 }} disabled={!labelCanvas}>
                {labels.descarcaQR}
              </Button>
            </AccordionDetails>
          </MuiAccordion>
        )}

        {material.tip === MaterialType.PRIME && (
          <MuiAccordion expanded={expandedAccordions.includes('ikeaOrigin')} onChange={handleAccordionChange('ikeaOrigin')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.detaliiOrigineLemnIKEA}</Typography></AccordionSummary>
            <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {createFormField('countryOfHarvest', labels.countryOfHarvest)}
              {createFormField('regionAndForestName', labels.regionAndForestName)}
              {createFormField('gpsCoordinatesOrFMU', labels.gpsCoordinatesOrFMU)}
              {createFormField('forestOwnership', labels.forestOwnership, 'select', Object.values(OwnershipStatus).map(v => ({ value: v, label: v })))}
              {createFormField('forestType', labels.forestType, 'select', Object.values(ForestType).map(v => ({ value: v, label: v })))}
              {createFormField('harvestDateOrPeriod', labels.harvestDateOrPeriod, 'text')}
              {createFormField('treeSpeciesScientific', labels.treeSpeciesScientific)}
              {createFormField('treeSpeciesCommon', labels.treeSpeciesCommon)}
              {createFormField('estimatedVolumePerSpeciesRWE', labels.estimatedVolumePerSpeciesRWE)}
            </Box></AccordionDetails>
          </MuiAccordion>
        )}
        {material.tip === MaterialType.PRIME && (
          <MuiAccordion expanded={expandedAccordions.includes('ikeaLegal')} onChange={handleAccordionChange('ikeaLegal')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.documentatieLegalaIKEA}</Typography></AccordionSummary>
            <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {createFormField('loggingPermitOrLicense', labels.loggingPermitOrLicense, 'textarea', undefined, false, 2)}
              {createFormField('landTenureAndUseRights', labels.landTenureAndUseRights, 'textarea', undefined, false, 2)}
              {createFormField('chainOfCustodyRecords', labels.chainOfCustodyRecords, 'textarea', undefined, false, 2)}
              {createFormField('transportPermits', labels.transportPermits, 'textarea', undefined, false, 2)}
              {createFormField('dueDiligenceRecordsSubSuppliers', labels.dueDiligenceRecordsSubSuppliers, 'textarea', undefined, false, 2)}
            </Box></AccordionDetails>
          </MuiAccordion>
        )}
        {material.tip === MaterialType.PRIME && (
          <MuiAccordion expanded={expandedAccordions.includes('ikeaCertification')} onChange={handleAccordionChange('ikeaCertification')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.certificareIKEA}</Typography></AccordionSummary>
            <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {createFormField('forestCertificationScheme', labels.forestCertificationScheme)}
              {createFormField('certificationNumber', labels.certificationNumber)}
              {createFormField('certificationScope', labels.certificationScope, 'textarea', undefined, false, 2)}
              {createFormField('certificationValidityPeriod', labels.certificationValidityPeriod)}
              {createFormField('productGroupAndClaimType', labels.productGroupAndClaimType)}
              {createFormField('cocCertificateCopies', labels.cocCertificateCopies, 'textarea', undefined, false, 2)}
              {createFormField('certificationAuditSummaries', labels.certificationAuditSummaries, 'textarea', undefined, false, 2)}
            </Box></AccordionDetails>
          </MuiAccordion>
        )}
        {material.tip === MaterialType.WORKED && (
          <MuiAccordion expanded={expandedAccordions.includes('ikeaDelivery')} onChange={handleAccordionChange('ikeaDelivery')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.infoLivrareProductieIKEA}</Typography></AccordionSummary>
            <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {createFormField('finalProcessingLocation', labels.finalProcessingLocation)}
              {createFormField('ikeaProductType', labels.ikeaProductType)}
              {createFormField('ikeaProductNamesOrArticles', labels.ikeaProductNamesOrArticles, 'textarea', undefined, false, 2)}
              {createFormField('packingListTraceableToRawMaterial', labels.packingListTraceableToRawMaterial, 'textarea', undefined, false, 2)}
            </Box></AccordionDetails>
          </MuiAccordion>
        )}
        <MuiAccordion expanded={expandedAccordions.includes('ikeaTraceability')} onChange={handleAccordionChange('ikeaTraceability')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.trasabilitateMaterialIKEA}</Typography></AccordionSummary>
          <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {createFormField('inputOutputReconciliation', labels.inputOutputReconciliation, 'textarea', undefined, false, 2)}
            {createFormField('batchLevelTrackingInfo', labels.batchLevelTrackingInfo)}
            {createFormField('rawMaterialLedgerInfo', labels.rawMaterialLedgerInfo, 'textarea', undefined, false, 2)}
          </Box></AccordionDetails>
        </MuiAccordion>
        <MuiAccordion expanded={expandedAccordions.includes('ikeaSustainability')} onChange={handleAccordionChange('ikeaSustainability')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.metriciSustenabilitateIKEA}</Typography></AccordionSummary>
          <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {createFormField('recycledContentPercentage', labels.recycledContentPercentage, 'text')}
            {createFormField('carbonFootprintData', labels.carbonFootprintData, 'textarea', undefined, false, 2)}
            {createFormField('resourceEfficiencyOrWasteData', labels.resourceEfficiencyOrWasteData, 'textarea', undefined, false, 2)}
            {material.tip === MaterialType.PRIME && createFormField('forestManagementPlanDetails', labels.forestManagementPlanDetails, 'textarea', undefined, false, 3)}
          </Box></AccordionDetails>
        </MuiAccordion>
        <MuiAccordion expanded={expandedAccordions.includes('ikeaProvenance')} onChange={handleAccordionChange('ikeaProvenance')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">{labels.instrumenteVerificareProvenientaIKEA}</Typography></AccordionSummary>
          <AccordionDetails><Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {createFormField('worldForestIDParticipation', labels.worldForestIDParticipation, 'textarea', undefined, false, 2)}
            {createFormField('forensicTestData', labels.forensicTestData, 'textarea', undefined, false, 2)}
            {createFormField('gpsOrBlockchainTraceabilityTools', labels.gpsOrBlockchainTraceabilityTools, 'textarea', undefined, false, 2)}
          </Box></AccordionDetails>
        </MuiAccordion>
      </Box>

      <Paper sx={{ position: 'sticky', bottom: 0, left: 0, right: 0, p: 1, zIndex: 1100 }} elevation={3}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Button color="error" onClick={() => setShowDeleteConfirm(true)} disabled={isNewMaterial || !material.id} startIcon={<DeleteIcon />}>
            {labels.sterge}
          </Button>
          {!isNewMaterial && material.id && (
            <Button onClick={() => handleAttemptLeave(`/material/${material.id}/components`)} startIcon={<ArticleIcon />}>
              {labels.billOfMaterials}
            </Button>
          )}
        </Toolbar>
      </Paper>

      <Dialog open={showWebQrModal} onClose={closeWebQrModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {labels.scan}
          <IconButton onClick={closeWebQrModal}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent><Box ref={webQrRef} sx={{ width: '100%', minHeight: '300px' }} id="web-qr-reader-detail"></Box></DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>{labels.confirmareStergere}</DialogTitle>
        <DialogContent><Typography>{labels.confirmareStergereInfo}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>{labels.anuleaza}</Button>
          <Button onClick={confirmDelete} color="error">{labels.daSterge}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showLeaveConfirm} onClose={() => { setShowLeaveConfirm(false); nextNavigationPath.current = null; }}>
        <DialogTitle>{labels.modificariNesalvate}</DialogTitle>
        <DialogContent><Typography>{labels.modificariNesalvateInfo}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowLeaveConfirm(false); nextNavigationPath.current = null; }}>{labels.ramaiPePagina}</Button>
          <Button onClick={() => { setIsDirty(false); if (nextNavigationPath.current) navigate(nextNavigationPath.current); setShowLeaveConfirm(false); }}>{labels.parasesteFaraSalvare}</Button>
          <Button onClick={async () => { await handleSave(); if (nextNavigationPath.current && !isDirty) navigate(nextNavigationPath.current); setShowLeaveConfirm(false); }} color="primary" variant="contained">{labels.salveazaSiPleaca}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={notifAlert.show} onClose={() => setNotifAlert({ show: false, message: '' })}>
        <DialogTitle>Notificare</DialogTitle>
        <DialogContent><MuiAlert severity={notifAlert.severity || "info"} sx={{ width: '100%' }}>{notifAlert.message}</MuiAlert></DialogContent>
        <DialogActions><Button onClick={() => setNotifAlert({ show: false, message: '' })}>OK</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialDetailView;