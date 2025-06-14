import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material'; // Using Box for basic layout
// Import views using @/ path alias
import MaterialListView from '@/views/MaterialListView';
import MaterialDetailView from '@/views/MaterialDetailView';
import MaterialComponentsView from '@/views/MaterialComponentsView';
import SupplierListView from '@/views/SupplierListView';
import SupplierEditView from '@/views/SupplierEditView';


const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MaterialListView />} />
      <Route path="/material/new" element={<MaterialDetailView />} />
      <Route path="/material/:id" element={<MaterialDetailView />} />
      <Route path="/material/:id/components" element={<MaterialComponentsView />} />
      <Route path="/suppliers" element={<SupplierListView />} />
      <Route path="/supplier/new" element={<SupplierEditView />} />
      <Route path="/supplier/:id" element={<SupplierEditView />} />
    </Routes>
  </BrowserRouter>
);

export default App;