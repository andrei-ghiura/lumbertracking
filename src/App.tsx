import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material'; // Using Box for basic layout
// Import views using @/ path alias
import MaterialListView from '@/views/MaterialListView';
import MaterialDetailView from '@/views/MaterialDetailView';
import MaterialComponentsView from '@/views/MaterialComponentsView';
import SupplierListView from '@/views/SupplierListView';
import SupplierEditView from '@/views/SupplierEditView';

// Example of a simple main layout container using MUI Box
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    {/* Header could go here if global */}
    <Box component="main" sx={{ flexGrow: 1, py: 3, px: 2 }}>
      {children}
    </Box>
    {/* Footer could go here if global */}
  </Box>
);

const App: React.FC = () => (
  <BrowserRouter>
    <MainLayout>
      <Routes>
        <Route path="/" element={<MaterialListView />} />
        <Route path="/material/new" element={<MaterialDetailView />} />
        <Route path="/material/:id" element={<MaterialDetailView />} />
        <Route path="/material/:id/components" element={<MaterialComponentsView />} />

        <Route path="/suppliers" element={<SupplierListView />} />
        <Route path="/supplier/new" element={<SupplierEditView />} />
        <Route path="/supplier/:id" element={<SupplierEditView />} />
      </Routes>
    </MainLayout>
  </BrowserRouter>
);

export default App;