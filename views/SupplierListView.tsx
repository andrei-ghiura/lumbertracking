import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon,
  IonButton, IonButtons, IonAlert
} from '@ionic/react';
import { add, chevronBackOutline, trashOutline as demoIcon } from 'ionicons/icons'; // Using trash for demo reset for variety
import { getAllSuppliers, deleteSupplierById, resetSuppliersStore } from '../api/suppliers';
import { removeSupplierFromMaterials } from '../api/materials';
import { Supplier } from '../types';
import labels from '../labels';
import SupplierCard from '../src/components/SupplierCard'; // Will be refactored

const SupplierListView: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState('');


  const loadSuppliers = useCallback(async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorAlertMessage("Eroare la încărcarea furnizorilor: " + (error as Error).message);
      setShowErrorAlert(true);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleEditSupplier = (id: string) => {
    navigate(`/supplier/${id}`);
  };

  const attemptDeleteSupplier = (id: string) => {
    setSupplierToDeleteId(id);
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteSupplier = async () => {
    if (supplierToDeleteId) {
      try {
        await deleteSupplierById(supplierToDeleteId);
        await removeSupplierFromMaterials(supplierToDeleteId); // Ensure materials are updated
        await loadSuppliers(); // Refresh list
      } catch (error) {
        console.error("Error deleting supplier:", error);
        setErrorAlertMessage("Eroare la ștergerea furnizorului: " + (error as Error).message);
        setShowErrorAlert(true);
      }
    }
    setSupplierToDeleteId(null); // Clear after attempt
  };

  const handleResetDemoSuppliers = async () => {
    await resetSuppliersStore();
    await loadSuppliers();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => navigate(-1)}>
              <IonIcon slot="icon-only" icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{labels.gestiuneFurnizori}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleResetDemoSuppliers} fill="clear" color="light">
              <IonIcon slot="icon-only" icon={demoIcon} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonTitle size="large">{labels.gestiuneFurnizori}</IonTitle>
          </IonToolbar>
        </IonHeader>

        {suppliers.length > 0 ? (
          <div className="ion-padding grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(supplier => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={handleEditSupplier}
                onDelete={attemptDeleteSupplier}
              />
            ))}
          </div>
        ) : (
          <div className="ion-text-center ion-padding-top">
            <p className="text-text-muted dark:text-slate-400">{labels.niciunFurnizorGasit}</p>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => navigate('/supplier/new')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header={labels.confirmareStergere}
        message={labels.confirmareStergereFurnizorInfo}
        buttons={[
          { text: labels.anuleaza, role: 'cancel' },
          { text: labels.daSterge, role: 'destructive', handler: confirmDeleteSupplier }
        ]}
      />
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header={"Eroare"}
        message={errorAlertMessage}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default SupplierListView;