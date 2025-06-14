import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon,
  IonButton, IonButtons, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
  IonModal, IonCard, IonCardContent, IonActionSheet, IonAlert
} from '@ionic/react';
import { add, qrCodeOutline, chevronDown, sunnyOutline, moonOutline, optionsOutline, listCircleOutline } from 'ionicons/icons';
import { getAllMaterials, resetStore as resetMaterialsStore, getMaterialById } from '../api/materials';
import { getAllSuppliers, resetSuppliersStore } from '../api/suppliers';
import { Material, MaterialState, QRCodeData, Supplier } from '../types';
import labels from '../labels';
import MaterialCard from '../src/components/MaterialCard'; // Will be refactored
import { useAppTheme } from '../src/hooks/useTheme'; // Changed from useTheme
// @ts-ignore
import { Html5Qrcode } from 'html5-qrcode'; // For web QR scanner

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
  const [showScanErrorAlert, setShowScanErrorAlert] = useState(false);
  const [scanErrorAlertMessage, setScanErrorAlertMessage] = useState('');
  
  const [currentThemeMode, toggleTheme] = useAppTheme(); // Changed variable name for clarity
  const webQrRef = useRef<HTMLDivElement>(null);
  const html5QrInstance = useRef<any>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const materialData = await getAllMaterials();
      setMaterials(materialData);
      const supplierData = await getAllSuppliers();
      setAllSuppliers(supplierData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setScanErrorAlertMessage("Eroare la încărcarea datelor: " + (error as Error).message);
      setShowScanErrorAlert(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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
      if (parsed && parsed.id) {
        id = parsed.id;
      }
    } catch (e) {
      id = scannedText.trim(); // Fallback if not JSON
    }

    if (id) {
      const materialExists = await getMaterialById(id);
      if (materialExists) {
        navigate(`/material/${id}`);
      } else {
        setScanErrorAlertMessage(labels.materialInexistentInfo + id);
        setShowScanErrorAlert(true);
      }
    } else {
      setScanErrorAlertMessage(labels.qrInvalidMaterial);
      setShowScanErrorAlert(true);
    }
  }, [navigate]);
  
  const closeWebQrModal = useCallback(async () => {
    if (html5QrInstance.current) {
      try {
        if (html5QrInstance.current.getState() === 2) { // Html5Qrcode.Html5QrcodeScannerState.SCANNING = 2
          await html5QrInstance.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping QR scanner:', e);
      } finally {
         if (webQrRef.current) webQrRef.current.innerHTML = ""; // Clear the div
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
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              processScannedData(decodedText);
              closeWebQrModal();
            },
            (errorMessage: string) => { /* ignore */ }
          ).catch((err: any) => {
            console.error("QR Scanner Start Error:", err);
            setScanErrorAlertMessage(`Eroare pornire scaner: ${err.message || err.name}`);
            setShowScanErrorAlert(true);
            closeWebQrModal();
          });
        } else {
            setScanErrorAlertMessage("Nicio cameră găsită.");
            setShowScanErrorAlert(true);
            closeWebQrModal();
        }
      }).catch((err: any) => {
        console.error("Error getting cameras:", err);
        setScanErrorAlertMessage(`Eroare accesare camere: ${err.message || err.name}`);
        setShowScanErrorAlert(true);
        closeWebQrModal();
      });
    }
    // Cleanup function
    return () => {
      if (html5QrInstance.current && typeof html5QrInstance.current.stop === 'function' && html5QrInstance.current.getState() === 2) {
         html5QrInstance.current.stop().catch((e:any) => console.warn("Cleanup stop error:", e));
         if (webQrRef.current) webQrRef.current.innerHTML = "";
         html5QrInstance.current = null;
      }
    };
  }, [showWebQrModal, processScannedData, closeWebQrModal]);

  const handleNativeScan = async () => {
    try {
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        processScannedData(barcodes[0].rawValue);
      }
    } catch (error) {
      console.error(labels.eroareScanare, error);
      setScanErrorAlertMessage(labels.eroareScanare + (error as Error).message);
      setShowScanErrorAlert(true);
    }
  };

  const handleScan = () => {
    if (isWeb()) {
      setShowWebQrModal(true);
    } else {
      handleNativeScan();
    }
  };

  const handleResetDemo = async () => {
    await resetMaterialsStore();
    await resetSuppliersStore();
    await loadInitialData();
  };

  const getSupplierName = (supplierId?: string): string | undefined => {
    if (!supplierId) return undefined;
    const supplier = allSuppliers.find(s => s.id === supplierId);
    return supplier?.nume;
  };
  
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{labels.tab1}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={toggleTheme}>
              <IonIcon slot="icon-only" icon={currentThemeMode === 'light' ? moonOutline : sunnyOutline} />
            </IonButton>
            <IonButton onClick={() => setShowActionSheet(true)}>
                <IonIcon slot="icon-only" icon={optionsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{labels.tab1}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonItem button onClick={() => setShowFilters(!showFilters)} lines="full">
          <IonLabel>{labels.filtre}</IonLabel>
          <IonIcon slot="end" icon={chevronDown} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </IonItem>

        {showFilters && (
          <IonList className="ion-padding-bottom">
            <IonItem>
              <IonLabel position="stacked">{labels.filtruStare}</IonLabel>
              <IonSelect
                value={selectedState}
                placeholder={labels.toate}
                onIonChange={e => setSelectedState(e.detail.value)}
                interface="action-sheet"
              >
                <IonSelectOption value="">{labels.toate}</IonSelectOption>
                {Object.values(MaterialState).map(state => (
                  <IonSelectOption key={state} value={state}>{state}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{labels.deLa}</IonLabel>
              <IonInput
                type="date"
                value={dateFrom}
                onIonChange={e => setDateFrom(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{labels.panaLa}</IonLabel>
              <IonInput
                type="date"
                value={dateTo}
                onIonChange={e => setDateTo(e.detail.value!)}
              />
            </IonItem>
          </IonList>
        )}

        {filteredMaterials.length > 0 ? (
          <div className="ion-padding grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                supplierName={getSupplierName(material.supplierId)}
                onClick={() => navigate(`/material/${material.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="ion-text-center ion-padding-top">
            <p className="text-text-muted dark:text-slate-400">{labels.niciunMaterialGasit}</p>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => navigate('/material/new')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
            <IonFabButton onClick={handleScan} color="secondary">
                <IonIcon icon={qrCodeOutline} />
            </IonFabButton>
        </IonFab>
      </IonContent>

      <IonModal isOpen={showWebQrModal} onDidDismiss={closeWebQrModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{labels.scan}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={closeWebQrModal}>{labels.inchide}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div ref={webQrRef} style={{ width: '100%', height: '300px' }} id="web-qr-reader-list"></div>
        </IonContent>
      </IonModal>
      
      <IonAlert
        isOpen={showScanErrorAlert}
        onDidDismiss={() => setShowScanErrorAlert(false)}
        header={labels.eroareScanare}
        message={scanErrorAlertMessage}
        buttons={['OK']}
      />

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Opțiuni"
        buttons={[
          {
            text: labels.gestiuneFurnizori,
            icon: listCircleOutline,
            handler: () => navigate('/suppliers'),
          },
          {
            text: labels.demo,
            role: 'destructive', // Or 'selected' if you want to highlight it differently
            handler: handleResetDemo,
          },
          {
            text: labels.anuleaza,
            role: 'cancel',
            icon: 'close',
          },
        ]}
      />
    </IonPage>
  );
};

export default MaterialListView;