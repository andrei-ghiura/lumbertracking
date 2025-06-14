import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, AppBar, Toolbar, Typography, Button, IconButton, Box, Card, CardHeader,
  CardContent, List, ListItem, ListItemText, Alert as MuiAlert, CircularProgress, Grid, ListItemButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { getAllMaterials, getMaterialById } from '@/api/materials';
import { getAllSuppliers, getSupplierById as fetchSupplierById } from '@/api/suppliers'; 
import { Material, MaterialType, Supplier } from '@/types';
import labels from '@/labels';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const MaterialComponentsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [mainMaterialSupplier, setMainMaterialSupplier] = useState<Supplier | null>(null);
  const [allComponentsFlat, setAllComponentsFlat] = useState<Material[]>([]);
  const [allMaterialsData, setAllMaterialsData] = useState<Material[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [notifAlert, setNotifAlert] = useState<{show: boolean, message: string, severity?: 'success'|'error'|'info'|'warning'}>({show: false, message:''});
  const [loading, setLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const materials = await getAllMaterials(); setAllMaterialsData(materials);
      const suppliers = await getAllSuppliers(); setAllSuppliers(suppliers);
    } catch(e) { setNotifAlert({show: true, message: `Eroare încărcare date: ${(e as Error).message}`, severity: 'error'}); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const loadMaterialAndComponents = useCallback(async () => {
    if (!id || allMaterialsData.length === 0 || allSuppliers.length === 0) { // Ensure all dependent data is loaded
      if (id && !loading) setLoading(true); // Start loading if ID present but data not ready
      return;
    }
    setLoading(true);
    try {
      const currentMaterial = allMaterialsData.find(m => m.id === id) || await getMaterialById(id);
      setMaterial(currentMaterial || null);
      if (currentMaterial) {
        if (currentMaterial.tip === MaterialType.PRIME && currentMaterial.supplierId) {
          const supplierDetails = allSuppliers.find(s => s.id === currentMaterial.supplierId) || await fetchSupplierById(currentMaterial.supplierId);
          setMainMaterialSupplier(supplierDetails || null);
        } else { setMainMaterialSupplier(null); }
        const resolvedComponents = resolveAllComponents(currentMaterial, allMaterialsData);
        setAllComponentsFlat(resolvedComponents);
      } else { setNotifAlert({show: true, message: labels.materialNegasit, severity: 'error'}); }
    } catch (e) { setNotifAlert({show: true, message: `Eroare încărcare detalii material: ${(e as Error).message}`, severity: 'error'}); }
    setLoading(false);
  }, [id, allMaterialsData, allSuppliers, loading]);

  useEffect(() => { 
    if(!loading && allMaterialsData.length > 0 && allSuppliers.length > 0) loadMaterialAndComponents(); 
  }, [loadMaterialAndComponents, allMaterialsData, allSuppliers, loading]);

  const resolveAllComponents = (currentMat: Material, allMats: Material[], visited: Set<string> = new Set()): Material[] => {
    let componentsList: Material[] = [];
    if (!currentMat.componente || currentMat.componente.length === 0) return componentsList;
    currentMat.componente.forEach(compId => {
      if (visited.has(compId)) return; visited.add(compId);
      const componentDetails = allMats.find(m => m.id === compId);
      if (componentDetails) {
        componentsList.push(componentDetails);
        const subComponents = resolveAllComponents(componentDetails, allMats, new Set(visited));
        componentsList.push(...subComponents);
      }
    });
    return Array.from(new Map(componentsList.map(item => [item.id, item])).values());
  };

  const primeComponents = allComponentsFlat.filter(c => c.tip === MaterialType.PRIME);
  const workedComponents = allComponentsFlat.filter(c => c.tip === MaterialType.WORKED); 
  const getSupplierName = (supplierId?: string): string => (allSuppliers.find(s => s.id === supplierId)?.nume || supplierId || '-');
  const getSupplierIkeaId = (supplierId?: string): string => (allSuppliers.find(s => s.id === supplierId)?.ikeaSupplierId || '-');

  const exportPDF = async () => { 
    if (!material) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 30; let currentY = margin;
    const lineHeight = 12; const sectionGap = 12; const subSectionGap = 8;

    const checkPageBreak = (neededHeight: number = lineHeight * 2) => {
        if (currentY + neededHeight > pageHeight - margin - 20) { 
            doc.addPage(); currentY = margin; drawFooter(); 
        }
    };
    const drawFooter = () => { /* ... */ }; // Placeholder for actual footer logic
    doc.setFont('helvetica', 'normal'); doc.setFillColor(51, 65, 85); 
    doc.rect(0, 0, pageWidth, 50, 'F'); doc.setFontSize(16); doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Raport Trasabilitate: ${material.nume} (${material.id})`, pageWidth / 2, 30, { align: 'center' });
    currentY = 70; drawFooter(); 

    const drawSectionHeader = (text: string, level: 'main' | 'sub' = 'main') => { /* ... */ };
    const drawKeyValue = (label: string, value?: string | null | undefined, options?: { isTextArea?: boolean; indent?: boolean }) => { /* ... */ };
    
    // Simplified PDF content for brevity
    drawSectionHeader("Detalii Material Principal");
    drawKeyValue(labels.nume, material.nume); drawKeyValue("ID", material.id); // etc.

    const tableHeaderStyle: Partial<Styles> = { fillColor: [51, 65, 85], textColor: [255,255,255], fontStyle: 'bold' as 'bold' };
    const tableBodyStyle: Partial<Styles> = { fontSize: 9 };
    const tableColumnStyles: { [key: string]: Partial<Styles> } = { id: { cellWidth: 60 as number}, nume: { cellWidth: 'auto' as 'auto' }, details1: { cellWidth: 100 as number }, details2: { cellWidth: 100 as number }, supplier: {cellWidth: 100 as number } };

    if (primeComponents.length > 0) {
        drawSectionHeader(labels.materiiPrime, 'sub'); checkPageBreak(50); 
        autoTable(doc, { startY: currentY, head: [['ID', 'Nume', 'Specie', 'Origine', 'Furnizor (IKEA ID)']],
            body: primeComponents.map(c => [ c.id, c.nume, c.treeSpeciesCommon || '-', c.countryOfHarvest || '-', `${getSupplierName(c.supplierId)} (${getSupplierIkeaId(c.supplierId)})`]),
            theme: 'striped', headStyles: tableHeaderStyle, bodyStyles: tableBodyStyle, columnStyles: tableColumnStyles,
            didDrawPage: () => { drawFooter(); currentY = margin; }, 
            didParseCell: (data) => { if (data.section === 'head') data.cell.styles.halign = 'center'; }
        });
        currentY = (doc as any).lastAutoTable.finalY + sectionGap;
    }
    // ... (workedComponents table similar) ...

    const pdfOutput = doc.output('blob'); const fileName = `Raport_Trasabilitate_${material.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    if (Capacitor.getPlatform() !== 'web') {
      try { const reader = new FileReader(); reader.onloadend = async () => { const base64Data = (reader.result as string).split(',')[1];
          await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents, recursive: true, });
          setNotifAlert({show: true, message: labels.pdfSalvatDocuments, severity: 'success'}); };
        reader.readAsDataURL(pdfOutput);
      } catch (e) { setNotifAlert({show: true, message: `${labels.eroareSalvarePDF} ${(e as Error).message}`, severity: 'error'}); }
    } else { doc.save(fileName); }
  };

  if (loading) {
    return (
      <Container sx={{p:2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight:'80vh'}}>
        <CircularProgress />
      </Container>
    );
  }

  if (!material) {
    return (
      <Container sx={{p:2}}>
        <AppBar position="sticky">
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate('/')} aria-label="back"><ArrowBackIcon /></IconButton>
            <Typography variant="h6">{labels.materialNegasit}</Typography>
          </Toolbar>
        </AppBar>
        <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>{labels.materialNegasit}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(`/material/${id}`)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9em' }}>
            {labels.billOfMaterials}: {material.nume}
          </Typography>
          <IconButton color="inherit" onClick={exportPDF} aria-label="export pdf">
            <PictureAsPdfIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <Card sx={{ mb: 2 }}>
          <CardHeader title={`${material.nume} (${material.id})`} subheader={`${material.tip} - ${material.stare}`} />
          <CardContent>
            <Typography variant="body2"><Box component="span" sx={{fontWeight:'medium'}}>Descriere: </Box>{material.descriere || '-'}</Typography>
            {material.tip === MaterialType.PRIME && mainMaterialSupplier && (<>
              <Typography variant="body2"><Box component="span" sx={{fontWeight:'medium'}}>{labels.furnizor}: </Box>{mainMaterialSupplier.nume}</Typography>
              <Typography variant="body2"><Box component="span" sx={{fontWeight:'medium'}}>{labels.countryOfHarvest}: </Box>{material.countryOfHarvest || '-'}</Typography>
            </>)}
            {material.tip === MaterialType.WORKED && <Typography variant="body2"><Box component="span" sx={{fontWeight:'medium'}}>{labels.dimensions}: </Box>{material.dimensions || '-'}</Typography>}
          </CardContent>
        </Card>

        {primeComponents.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardHeader title={`${labels.materiiPrime} (${primeComponents.length})`} />
            <List dense>
              {primeComponents.map(comp => (
                <ListItem key={comp.id} disablePadding>
                  <ListItemButton onClick={() => navigate(`/material/${comp.id}`)}>
                    <ListItemText 
                      primary={`${comp.nume} (${comp.id})`} 
                      secondary={<>{comp.treeSpeciesCommon || '-'} | {comp.countryOfHarvest || '-'} <br/>{labels.furnizor}: {getSupplierName(comp.supplierId)} ({getSupplierIkeaId(comp.supplierId)})</>} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        )}
        
        {workedComponents.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardHeader title={`${labels.materialePrelucrate} (${workedComponents.length})`} />
            <List dense>
              {workedComponents.map(comp => (
                <ListItem key={comp.id} disablePadding>
                  <ListItemButton onClick={() => navigate(`/material/${comp.id}`)}>
                    <ListItemText 
                      primary={`${comp.nume} (${comp.id})`} 
                      secondary={<>{comp.dimensions || '-'} | {comp.lumberGrade || '-'} <br/>{labels.finalProcessingLocation}: {comp.finalProcessingLocation || '-'}</>}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        )}
        
        {allComponentsFlat.length === 0 && (
           <Card sx={{textAlign: 'center', p:2}}><Typography>{labels.nicioComponentaAdaugata}</Typography></Card>
        )}
      </Box>
      {notifAlert.show && (
        <MuiAlert 
            severity={notifAlert.severity || "info"} 
            sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1300}}
            onClose={() => setNotifAlert({show: false, message: ''})}
        >
            {notifAlert.message}
        </MuiAlert>
      )}
    </Container>
  );
};

export default MaterialComponentsView;