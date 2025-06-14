import React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Box } from '@mui/material';
import { Material, MaterialState, MaterialType } from '@/types';
import labels from '@/labels';

interface MaterialCardProps {
  material: Material;
  supplierName?: string;
  onClick: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, supplierName, onClick }) => {
  const getStateColor = (state: MaterialState | string): "success" | "warning" | "error" | "info" | "primary" | "secondary" | "default" => {
    switch (state) {
      case MaterialState.RECEIVED: return 'success';
      case MaterialState.IN_PROGRESS: return 'warning';
      case MaterialState.DELIVERED: return 'primary'; // MUI doesn't have 'tertiary' by default
      default: return 'default';
    }
  };

  return (
    <Card onClick={onClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <CardHeader
        titleTypographyProps={{ variant: 'h6', sx: { fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
        title={material.nume}
        subheader={`ID: ${material.id}`}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" gutterBottom>
            <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.tip}: </Box>
            {material.tip}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.stare}: </Box>
            </Typography>
            <Chip label={material.stare} color={getStateColor(material.stare)} size="small" />
          </Box>
          {material.tip === MaterialType.PRIME && supplierName && (
            <Typography variant="body2" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.furnizor}: </Box>
              {supplierName}
            </Typography>
          )}
          {material.tip === MaterialType.WORKED && material.dimensions && (
            <Typography variant="body2" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.dimensions}: </Box>
              {material.dimensions}
            </Typography>
          )}
          {material.treeSpeciesCommon && (
            <Typography variant="body2" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.treeSpeciesCommon}: </Box>
              {material.treeSpeciesCommon}
            </Typography>
          )}
          {material.logGrade && material.tip === MaterialType.PRIME && (
            <Typography variant="body2" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.logGrade}: </Box>
              {material.logGrade}
            </Typography>
          )}
          {material.lumberGrade && material.tip === MaterialType.WORKED && (
            <Typography variant="body2" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>{labels.lumberGrade}: </Box>
              {material.lumberGrade}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 'auto', pt: 1 }}>
          {labels.createdAt}: {new Date(material.createdAt).toLocaleDateString('ro-RO')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MaterialCard;