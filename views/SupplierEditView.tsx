import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonBackButton,
  IonList, IonItem, IonLabel, IonInput, IonTextarea, IonAlert, useIonViewWillLeave
} from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import { getSupplierById, saveSupplier } from '../api/suppliers';
import { Supplier } from '../types';
import labels from '../labels';

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
  const [errorAlert, setErrorAlert] = useState<{show: boolean, message: string}>({show: false, message:''});
  const nextNavigationPath = useRef<string | null>(null);

  const loadSupplierData = useCallback(async () => {
    if (!isNewSupplier && supplierId) {
      const fetchedSupplier = await getSupplierById(supplierId);
      if (fetchedSupplier) {
        setSupplier(fetchedSupplier);
        setInitialSupplierJson(JSON.stringify(fetchedSupplier));
      } else {
        setErrorAlert({show: true, message: "Furnizorul nu a fost găsit."});
        navigate('/suppliers', { replace: true });
      }
    } else {
      setSupplier({...initialSupplierState});
      setInitialSupplierJson(JSON.stringify(initialSupplierState));
    }
  }, [supplierId, navigate, isNewSupplier]);

  useEffect(() => { loadSupplierData(); }, [loadSupplierData]);

  useEffect(() => {
    if (initialSupplierJson !== null) {
      setIsDirty(JSON.stringify(supplier) !== initialSupplierJson);
    }
  }, [supplier, initialSupplierJson]);

  useIonViewWillLeave(() => {
    // Logic for unsaved changes can be handled by attemptLeavePage
  });

  const attemptLeavePage = (targetPath: string) => {
    if (isDirty) {
      nextNavigationPath.current = targetPath;
      setShowLeaveConfirm(true);
    } else {
      navigate(targetPath);
    }
  };


  const handleInputChange = (field: keyof Supplier, value: any) => {
    setSupplier(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!supplier.nume || supplier.nume.trim() === '') {
      setErrorAlert({show:true, message: labels.numeFurnizor + " " + labels.campObligatoriu.toLowerCase()});
      return Promise.reject("Nume furnizor obligatoriu");
    }
    try {
        const saved = await saveSupplier(supplier);
        setInitialSupplierJson(JSON.stringify(saved));
        setIsDirty(false);
        // alert(labels.furnizorSalvat); // Consider IonToast
        if (isNewSupplier && saved.id) {
            navigate(`/supplier/${saved.id}`, { replace: true });
        }
        return Promise.resolve();
    } catch(e) {
        setErrorAlert({show:true, message: `Salvare eșuată: ${(e as Error).message}`});
        return Promise.reject(e);
    }
  };

  const createSupplierField = (id: keyof Supplier, labelText: string, type: "text" | "textarea" | "email" | "tel" = "text", required?: boolean, rows?: number) => {
    const value = supplier[id] as any; // Cast to any for simplicity with IonInput/IonTextarea value prop
    return (
      <IonItem lines="full">
        <IonLabel position="stacked">{labelText}{required && <span style={{color: 'var(--ion-color-danger)'}}>*</span>}</IonLabel>
        {type === "textarea" ? (
          <IonTextarea value={value || ''} onIonChange={e => handleInputChange(id, e.detail.value!)} rows={rows || 2} />
        ) : (
          <IonInput type={type as any} value={value || ''} onIonChange={e => handleInputChange(id, e.detail.value!)} />
        )}
      </IonItem>
    );
  };

  if (!isNewSupplier && !supplier.id && supplierId) {
    return <IonPage><IonContent className="ion-padding">Încărcare furnizor...</IonContent></IonPage>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/suppliers" onClick={(e) => { e.preventDefault(); attemptLeavePage('/suppliers'); }}/>
          </IonButtons>
          <IonTitle>{isNewSupplier ? labels.adaugaFurnizor : labels.editeazaFurnizor}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={!isDirty && !isNewSupplier}>
              <IonIcon slot="icon-only" icon={checkmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none" className="ion-padding">
          <IonItem lines="none" className="font-semibold text-lg">{labels.numeFurnizor}</IonItem>
          {createSupplierField('nume', labels.numeFurnizor, 'text', true)}
          {createSupplierField('persoanaContact', labels.persoanaContact)}
          {createSupplierField('email', labels.email, 'email')}
          {createSupplierField('telefon', labels.telefon, 'tel')}
          {createSupplierField('adresa', labels.adresa, 'textarea')}

          <IonItem lines="none" className="font-semibold text-lg ion-margin-top">{labels.detaliiFurnizor} (IKEA)</IonItem>
          {createSupplierField('ikeaSupplierId', labels.ikeaSupplierId)}
          {createSupplierField('complianceOfficerInfo', labels.complianceOfficerInfo, 'textarea', false, 2)}
          {createSupplierField('subSupplierInfo', labels.subSupplierInfo, 'textarea', false, 3)}
          
          <IonItem lines="none" className="font-semibold text-lg ion-margin-top">Sistem Trasabilitate și Audituri IKEA</IonItem>
          {createSupplierField('traceabilitySystemDescription', labels.traceabilitySystemDescription, 'textarea', false, 3)}
          {createSupplierField('supplyChainFlowChartData', labels.supplyChainFlowChartData, 'textarea', false, 3)}
          {createSupplierField('latestThirdPartyAuditReports', labels.latestThirdPartyAuditReports, 'textarea', false, 3)}
          {createSupplierField('correctiveActionPlans', labels.correctiveActionPlans, 'textarea', false, 3)}
          {createSupplierField('ikeaOwnAuditResults', labels.ikeaOwnAuditResults, 'textarea', false, 3)}
          {createSupplierField('legalComplianceDeclarations', labels.legalComplianceDeclarations, 'textarea', false, 3)}
        </IonList>
      </IonContent>

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
        isOpen={errorAlert.show}
        onDidDismiss={() => setErrorAlert({show: false, message: ''})}
        header={"Notificare"}
        message={errorAlert.message}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default SupplierEditView;