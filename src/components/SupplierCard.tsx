import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Supplier } from '@/types';
import labels from '@/labels';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onEdit, onDelete }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardHeader
      titleTypographyProps={{ variant: 'h6', sx: { fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
      title={supplier.nume}
      subheader={`ID: ${supplier.id}`}
      action={
        <>
          <IconButton onClick={() => onEdit(supplier.id)} aria-label={`${labels.editeazaFurnizor} ${supplier.nume}`}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(supplier.id)} aria-label={`${labels.stergeFurnizor} ${supplier.nume}`}>
            <DeleteIcon />
          </IconButton>
        </>
      }
      sx={{ pb: 0 }}
    />
    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ mb: 1 }}>
        {supplier.persoanaContact && (
          <Typography variant="body2" gutterBottom>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.persoanaContact}: </Box>
            {supplier.persoanaContact}
          </Typography>
        )}
        {supplier.email && (
          <Typography variant="body2" gutterBottom sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.email}: </Box>
            {supplier.email}
          </Typography>
        )}
        {supplier.telefon && (
          <Typography variant="body2" gutterBottom>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.telefon}: </Box>
            {supplier.telefon}
          </Typography>
        )}
        {supplier.adresa && (
          <Typography variant="body2" gutterBottom sx={{
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.adresa}: </Box>
            {supplier.adresa}
          </Typography>
        )}
        {supplier.ikeaSupplierId && (
          <Typography variant="body2" gutterBottom>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.ikeaSupplierId}: </Box>
            {supplier.ikeaSupplierId}
          </Typography>
        )}
        {supplier.complianceOfficerInfo && (
          <Typography variant="body2" gutterBottom sx={{
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
          }} title={supplier.complianceOfficerInfo}>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.complianceOfficerInfo.split('(')[0].trim()}: </Box>
            {supplier.complianceOfficerInfo}
          </Typography>
        )}
        {supplier.subSupplierInfo && (
          <Typography variant="body2" gutterBottom sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
          }} title={supplier.subSupplierInfo}>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.subSupplierInfo}: </Box>
            {supplier.subSupplierInfo}
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 'auto', pt: 1 }}>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
          {labels.createdAt}: {new Date(supplier.createdAt).toLocaleString('ro-RO')}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
          {labels.updatedAt}: {new Date(supplier.updatedAt).toLocaleString('ro-RO')}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default SupplierCard;