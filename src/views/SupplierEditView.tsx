import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, AppBar, Toolbar, Typography, Button, IconButton, Box, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert as MuiAlert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { getSupplierById, saveSupplier } from '@/api/suppliers';
import { Supplier } from '@/types';
import labels from '@/labels';

const SupplierEditView: React.FC = () => {
  const navigate = useNavigate();
  const { id: supplierId } = useParams<{ id?: string }>();
  const isNewSupplier = !supplierId;

  const initialSupplierState: Partial<Supplier> = {
    nume: '', persoanaContact: '', email: '', telefon: '', adresa: '',
    ikeaSupplierId: '', complianceOfficerInfo: '', subSupplierInfo: '',
    traceabilitySystemDescription: '', supplyChainFlowChartData: '',
    latestThirdPartyAuditReports: '', correctiveActionPlans: '',
    ikeaOwnAuditResults: '', legalComplianceDeclarations: ''
  };

  const [supplier, setSupplier] = useState<Partial<Supplier>>(isNewSupplier ? {...initialSupplierState} : {});
  const [initialSupplierJson, setInitialSupplierJson] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [notifAlert, setNotifAlert] = useState<{show: boolean, message: string, severity?: 'success'|'error'|'info'|'warning'}>({show: false, message:''});
  const nextNavigationPath = useRef<string | null>(null);

  const loadSupplierData = useCallback(async () => {
    if (!isNewSupplier && supplierId) {
      const fetchedSupplier = await getSupplierById(supplierId);
      if (fetchedSupplier) { setSupplier(fetchedSupplier); setInitialSupplierJson(JSON.stringify(fetchedSupplier)); }
      else { setNotifAlert({show: true, message: "Furnizorul nu a fost găsit.", severity: 'error'}); navigate('/suppliers', { replace: true }); }
    } else { setSupplier({...initialSupplierState}); setInitialSupplierJson(JSON.stringify(initialSupplierState)); }
  }, [supplierId, navigate, isNewSupplier]);

  useEffect(() => { loadSupplierData(); }, [loadSupplierData]);
  useEffect(() => { if (initialSupplierJson !== null) setIsDirty(JSON.stringify(supplier) !== initialSupplierJson); }, [supplier, initialSupplierJson]);
  
  // Simplified navigation for unsaved changes.
  // TODO: Re-implement robust unsaved changes dialog using React Router v6 blockers.
  const handleAttemptLeave = (targetPath: string) => {
    if (isDirty) { nextNavigationPath.current = targetPath; setShowLeaveConfirm(true); }
    else { navigate(targetPath); }
  };

  const handleInputChange = (field: keyof Supplier, value: any) => setSupplier(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!supplier.nume || supplier.nume.trim() === '') {
      setNotifAlert({show:true, message: labels.numeFurnizor + " " + labels.campObligatoriu.toLowerCase(), severity: 'error'}); return Promise.reject("Nume furnizor obligatoriu");
    }
    try {
      const saved = await saveSupplier(supplier);
      setInitialSupplierJson(JSON.stringify(saved)); setIsDirty(false);
      setNotifAlert({show:true, message: labels.furnizorSalvat, severity: 'success'});
      if (isNewSupplier && saved.id) navigate(`/supplier/${saved.id}`, { replace: true });
      return Promise.resolve();
    } catch(e) { setNotifAlert({show:true, message: `Salvare eșuată: ${(e as Error).message}`, severity: 'error'}); return Promise.reject(e); }
  };

  const createSupplierField = (id: keyof Supplier, labelText: string, type: "text" | "textarea" | "email" | "tel" = "text", required?: boolean, rows?: number) => (
    <TextField
      label={labelText}
      value={supplier[id] || ''}
      onChange={(e) => handleInputChange(id, e.target.value)}
      fullWidth
      margin="normal"
      required={required}
      variant="outlined"
      type={type === "textarea" ? undefined : type}
      multiline={type === "textarea"}
      rows={type === "textarea" ? rows || 2 : undefined}
    />
  );

  if (!isNewSupplier && !supplier.id && supplierId) {
    return <Container sx={{p:2}}><Typography>Încărcare furnizor...</Typography></Container>;
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => handleAttemptLeave('/suppliers')} aria-label="back"> <ArrowBackIcon /> </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isNewSupplier ? labels.adaugaFurnizor : labels.editeazaFurnizor}
          </Typography>
          <Button color="inherit" onClick={handleSave} disabled={!isDirty && !isNewSupplier} startIcon={<SaveIcon />}> Salvare </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <Typography variant="h5" gutterBottom>{labels.numeFurnizor}</Typography>
        {createSupplierField('nume', labels.numeFurnizor, 'text', true)}
        {createSupplierField('persoanaContact', labels.persoanaContact)}
        {createSupplierField('email', labels.email, 'email')}
        {createSupplierField('telefon', labels.telefon, 'tel')}
        {createSupplierField('adresa', labels.adresa, 'textarea')}

        <Typography variant="h5" gutterBottom sx={{mt:3}}>{labels.detaliiFurnizor} (IKEA)</Typography>
        {createSupplierField('ikeaSupplierId', labels.ikeaSupplierId)}
        {createSupplierField('complianceOfficerInfo', labels.complianceOfficerInfo, 'textarea', false, 2)}
        {createSupplierField('subSupplierInfo', labels.subSupplierInfo, 'textarea', false, 3)}
        
        <Typography variant="h5" gutterBottom sx={{mt:3}}>Sistem Trasabilitate și Audituri IKEA</Typography>
        {createSupplierField('traceabilitySystemDescription', labels.traceabilitySystemDescription, 'textarea', false, 3)}
        {createSupplierField('supplyChainFlowChartData', labels.supplyChainFlowChartData, 'textarea', false, 3)}
        {createSupplierField('latestThirdPartyAuditReports', labels.latestThirdPartyAuditReports, 'textarea', false, 3)}
        {createSupplierField('correctiveActionPlans', labels.correctiveActionPlans, 'textarea', false, 3)}
        {createSupplierField('ikeaOwnAuditResults', labels.ikeaOwnAuditResults, 'textarea', false, 3)}
        {createSupplierField('legalComplianceDeclarations', labels.legalComplianceDeclarations, 'textarea', false, 3)}
      </Box>

      <Dialog open={showLeaveConfirm} onClose={() => { setShowLeaveConfirm(false); nextNavigationPath.current = null; }}>
        <DialogTitle>{labels.modificariNesalvate}</DialogTitle>
        <DialogContent><Typography>{labels.modificariNesalvateInfo}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowLeaveConfirm(false); nextNavigationPath.current = null; }}>{labels.ramaiPePagina}</Button>
          <Button onClick={() => { setIsDirty(false); if(nextNavigationPath.current) navigate(nextNavigationPath.current); setShowLeaveConfirm(false); }}>{labels.parasesteFaraSalvare}</Button>
          <Button onClick={async () => { await handleSave(); if(nextNavigationPath.current && !isDirty) navigate(nextNavigationPath.current); setShowLeaveConfirm(false);}} color="primary" variant="contained">{labels.salveazaSiPleaca}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={notifAlert.show} onClose={() => setNotifAlert({show: false, message: ''})}>
        <DialogTitle>Notificare</DialogTitle>
        <DialogContent><MuiAlert severity={notifAlert.severity || "info"} sx={{width: '100%'}}>{notifAlert.message}</MuiAlert></DialogContent>
        <DialogActions><Button onClick={() => setNotifAlert({show: false, message: ''})}>OK</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierEditView;