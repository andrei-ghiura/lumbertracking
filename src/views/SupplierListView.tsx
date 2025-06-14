
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, AppBar, Toolbar, Typography, Fab, Button, IconButton, Grid,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Alert as MuiAlert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt'; // For demo reset

import { getAllSuppliers, deleteSupplierById, resetSuppliersStore } from '@/api/suppliers';
import { removeSupplierFromMaterials } from '@/api/materials';
import { Supplier } from '@/types';
import labels from '@/labels';
import SupplierCard from '@/components/SupplierCard';

const SupplierListView: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<{show: boolean, message: string}>({show: false, message:''});

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      setErrorAlert({show: true, message: "Eroare la încărcarea furnizorilor: " + (error as Error).message});
    }
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const handleEditSupplier = (id: string) => navigate(`/supplier/${id}`);
  const attemptDeleteSupplier = (id: string) => { setSupplierToDeleteId(id); setShowDeleteConfirm(true); };

  const confirmDeleteSupplier = async () => {
    if (supplierToDeleteId) {
      try {
        await deleteSupplierById(supplierToDeleteId);
        await removeSupplierFromMaterials(supplierToDeleteId);
        await loadSuppliers();
      } catch (error) { setErrorAlert({show: true, message: "Eroare la ștergerea furnizorului: " + (error as Error).message}); }
    }
    setSupplierToDeleteId(null);
    setShowDeleteConfirm(false);
  };

  const handleResetDemoSuppliers = async () => { await resetSuppliersStore(); await loadSuppliers(); };

  return (
    <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>{labels.gestiuneFurnizori}</Typography>
          <IconButton color="inherit" onClick={handleResetDemoSuppliers} aria-label="reset demo data">
            <RestartAltIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {suppliers.length > 0 ? (
          <Grid container spacing={2}>
            {suppliers.map(supplier => (
              <Grid item={true} xs={12} sm={6} md={4} key={supplier.id}>
                <SupplierCard supplier={supplier} onEdit={handleEditSupplier} onDelete={attemptDeleteSupplier} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>{labels.niciunFurnizorGasit}</Typography>
        )}
      </Box>

      <Fab color="primary" aria-label="add supplier" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => navigate('/supplier/new')}>
        <AddIcon />
      </Fab>

      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>{labels.confirmareStergere}</DialogTitle>
        <DialogContent><Typography>{labels.confirmareStergereFurnizorInfo}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>{labels.anuleaza}</Button>
          <Button onClick={confirmDeleteSupplier} color="error">{labels.daSterge}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorAlert.show} onClose={() => setErrorAlert({show: false, message: ''})}>
        <DialogTitle>Eroare</DialogTitle>
        <DialogContent><MuiAlert severity="error" sx={{width: '100%'}}>{errorAlert.message}</MuiAlert></DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorAlert({show: false, message: ''})}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierListView;
