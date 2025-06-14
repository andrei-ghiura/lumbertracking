
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import {
  Container, AppBar, Toolbar, Typography, Fab, Button, IconButton, Grid,
  Box, Menu, MenuItem, TextField, Select, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert as MuiAlert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // moon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // sun
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ListAltIcon from '@mui/icons-material/ListAlt'; // For supplier list
import RestartAltIcon from '@mui/icons-material/RestartAlt'; // For demo reset

import { getAllMaterials, resetStore as resetMaterialsStore, getMaterialById } from '@/api/materials';
import { getAllSuppliers, resetSuppliersStore } from '@/api/suppliers';
import { Material, MaterialState, QRCodeData, Supplier } from '@/types';
import labels from '@/labels';
import MaterialCard from '@/components/MaterialCard';
import { useAppTheme } from '@/hooks/useTheme';
// @ts-ignore
import { Html5Qrcode } from 'html5-qrcode';

const isWeb = (): boolean => typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.();

const MaterialListView: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');

  const today = new Date();
  const lastTwoWeeks = new Date(today);
  lastTwoWeeks.setDate(today.getDate() - 14);

  const [dateFrom, setDateFrom] = useState<string>(lastTwoWeeks.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState<string>(today.toISOString().split('T')[0]);

  const [showFilters, setShowFilters] = useState(false);
  const [showWebQrModal, setShowWebQrModal] = useState(false);
  const [scanErrorAlert, setScanErrorAlert] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  const [currentThemeMode, toggleTheme] = useAppTheme();
  const webQrRef = useRef<HTMLDivElement>(null);
  const html5QrInstance = useRef<any>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const actionMenuOpen = Boolean(anchorEl);

  const handleActionMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleActionMenuClose = () => {
    setAnchorEl(null);
  };

  const loadInitialData = useCallback(async () => {
    try {
      const materialData = await getAllMaterials();
      setMaterials(materialData);
      const supplierData = await getAllSuppliers();
      setAllSuppliers(supplierData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setScanErrorAlert({ show: true, message: "Eroare la încărcarea datelor: " + (error as Error).message});
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    let tempMaterials = [...materials];
    if (selectedState) {
      tempMaterials = tempMaterials.filter(m => m.stare === selectedState);
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      tempMaterials = tempMaterials.filter(m => new Date(m.createdAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      tempMaterials = tempMaterials.filter(m => new Date(m.createdAt) <= toDate);
    }
    setFilteredMaterials(tempMaterials.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [materials, selectedState, dateFrom, dateTo]);

  const processScannedData = useCallback(async (scannedText: string) => {
    let id: string | null = null;
    try {
      const rawValue = scannedText.trim();
      const parsed: QRCodeData = JSON.parse(rawValue);
      id = parsed?.id || rawValue; // Use parsed ID if available, otherwise raw value
    } catch (e) {
      id = scannedText.trim();
    }

    if (id) {
      const materialExists = await getMaterialById(id);
      if (materialExists) {
        navigate(`/material/${id}`);
      } else {
        setScanErrorAlert({show: true, message: labels.materialInexistentInfo + id });
      }
    } else {
      setScanErrorAlert({show: true, message: labels.qrInvalidMaterial});
    }
  }, [navigate]);

  const closeWebQrModal = useCallback(async () => {
    if (html5QrInstance.current) {
      try {
        if (html5QrInstance.current.getState() === 2) {
          await html5QrInstance.current.stop();
        }
      } catch (e) { console.warn('Error stopping QR scanner:', e); }
      finally {
         if (webQrRef.current) webQrRef.current.innerHTML = "";
        html5QrInstance.current = null;
      }
    }
    setShowWebQrModal(false);
  }, []);

  useEffect(() => {
    if (showWebQrModal && webQrRef.current && !html5QrInstance.current && isWeb()) {
      const qrReaderElementId = `material-list-qr-${Date.now()}`;
      if (webQrRef.current) webQrRef.current.id = qrReaderElementId;
      const instance = new Html5Qrcode(qrReaderElementId);
      html5QrInstance.current = instance;
      Html5Qrcode.getCameras().then((cameras: any[]) => {
        if (cameras && cameras.length) {
          instance.start(
            { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => { processScannedData(decodedText); closeWebQrModal(); },
            () => { /* ignore */ }
          ).catch((err: any) => {
            setScanErrorAlert({show: true, message: `Eroare pornire scaner: ${err.message || err.name}`});
            closeWebQrModal();
          });
        } else {
            setScanErrorAlert({show: true, message: "Nicio cameră găsită."}); closeWebQrModal();
        }
      }).catch((err: any) => {
        setScanErrorAlert({show: true, message: `Eroare accesare camere: ${err.message || err.name}`});
        closeWebQrModal();
      });
    }
    return () => {
      if (html5QrInstance.current && typeof html5QrInstance.current.stop === 'function' && html5QrInstance.current.getState() === 2) {
         html5QrInstance.current.stop().catch((e:any) => console.warn("Cleanup stop error:", e));
         if (webQrRef.current) webQrRef.current.innerHTML = ""; html5QrInstance.current = null;
      }
    };
  }, [showWebQrModal, processScannedData, closeWebQrModal]);

  const handleNativeScan = async () => {
    try {
      await BarcodeScanner.requestPermissions(); const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) processScannedData(barcodes[0].rawValue);
    } catch (error) { setScanErrorAlert({show: true, message: labels.eroareScanare + (error as Error).message }); }
  };
  const handleScan = () => { isWeb() ? setShowWebQrModal(true) : handleNativeScan(); };
  const handleResetDemo = async () => { await resetMaterialsStore(); await resetSuppliersStore(); await loadInitialData(); handleActionMenuClose(); };
  const getSupplierName = (supplierId?: string): string | undefined => allSuppliers.find(s => s.id === supplierId)?.nume;

  return (
    <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{labels.tab1}</Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {currentThemeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
          <IconButton color="inherit" onClick={handleActionMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={actionMenuOpen} onClose={handleActionMenuClose}>
            <MenuItem onClick={() => { navigate('/suppliers'); handleActionMenuClose(); }}>
              <ListAltIcon sx={{mr:1}}/>{labels.gestiuneFurnizori}
            </MenuItem>
            <MenuItem onClick={handleResetDemo} sx={{color: 'error.main'}}>
              <RestartAltIcon sx={{mr:1}}/>{labels.demo}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowFilters(!showFilters)}>
        <Typography variant="subtitle1">{labels.filtre}</Typography>
        <ExpandMoreIcon sx={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </Box>

      {showFilters && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
          <FormControl fullWidth>
            <InputLabel id="filter-state-label">{labels.filtruStare}</InputLabel>
            <Select labelId="filter-state-label" value={selectedState} label={labels.filtruStare} onChange={e => setSelectedState(e.target.value as string)}>
              <MenuItem value="">{labels.toate}</MenuItem>
              {Object.values(MaterialState).map(state => <MenuItem key={state} value={state}>{state}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={labels.deLa} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label={labels.panaLa} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {filteredMaterials.length > 0 ? (
          <Grid container spacing={2}>
            {filteredMaterials.map(material => (
              <Grid item={true} xs={12} sm={6} md={4} lg={3} key={material.id}>
                <MaterialCard material={material} supplierName={getSupplierName(material.supplierId)} onClick={() => navigate(`/material/${material.id}`)} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>{labels.niciunMaterialGasit}</Typography>
        )}
      </Box>

      <Fab color="primary" aria-label="add material" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => navigate('/material/new')}>
        <AddIcon />
      </Fab>
      <Fab color="secondary" aria-label="scan qr" sx={{ position: 'fixed', bottom: 16, left: 16 }} onClick={handleScan}>
        <QrCodeScannerIcon />
      </Fab>

      <Dialog open={showWebQrModal} onClose={closeWebQrModal} fullWidth maxWidth="sm">
        <DialogTitle>{labels.scan}</DialogTitle>
        <DialogContent>
          <Box ref={webQrRef} sx={{ width: '100%', minHeight: '300px' }} id="web-qr-reader-list"></Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWebQrModal}>{labels.inchide}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scanErrorAlert.show} onClose={() => setScanErrorAlert({show: false, message: ''})}>
        <DialogTitle>{labels.eroareScanare}</DialogTitle>
        <DialogContent>
          <MuiAlert severity="error" sx={{width: '100%'}}>{scanErrorAlert.message}</MuiAlert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanErrorAlert({show: false, message: ''})}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialListView;
