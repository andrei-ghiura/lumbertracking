import React, { useEffect, useRef } from 'react';
import QRious from 'qrious';
import { Material, MaterialType, Supplier } from '@/types';
import labels from '@/labels';
import { Box } from '@mui/material'; // For potential wrapper

interface MaterialLabelCanvasProps {
  material: Material | null;
  allSuppliers: Supplier[];
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
}

const MaterialLabelCanvas: React.FC<MaterialLabelCanvasProps> = ({ material, allSuppliers, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!material || !canvasRef.current) {
      onCanvasReady(null);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onCanvasReady(null);
      return;
    }

    const drawLabel = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Constants for label design - ALWAYS LIGHT THEME FOR PRINT
      const labelWidth = 300, labelHeight = 450, padding = 15;
      const headerBg = '#334155'; // primary (slate-700 like) - For print, dark header is fine
      const headerTextC = '#FFFFFF';
      const textColor = '#1e293b'; // neutral-dark (slate-800 like)
      const detailColor = '#475569'; // slate-600 like
      const accentColor = '#0d9488'; // accent (teal-600 like)
      const qrSize = Math.min(labelWidth - 2 * padding - 20, 150);

      // Main background - always light for print
      ctx.fillStyle = '#f8fafc'; // slate-50 or white
      ctx.fillRect(0, 0, labelWidth, labelHeight);
      // Border - always light for print
      ctx.strokeStyle = '#e2e8f0'; // neutral-medium (slate-200 like)
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, labelWidth, labelHeight);

      let currentY = 0;

      // Header background
      ctx.fillStyle = headerBg;
      ctx.fillRect(0, currentY, labelWidth, 50);
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = headerTextC;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let materialNameText = material.nume || 'N/A';
      if (ctx.measureText(materialNameText).width > labelWidth - padding * 2) {
        materialNameText = materialNameText.substring(0, 25) + '...';
      }
      ctx.fillText(materialNameText, labelWidth / 2, 25);
      currentY += 50;

      // ID Bar background
      ctx.fillStyle = '#e2e8f0'; // neutral-medium (slate-200 like)
      ctx.fillRect(0, currentY, labelWidth, 30);
      ctx.font = 'normal 14px Arial';
      ctx.fillStyle = textColor; // Dark text on light bar
      ctx.fillText(`ID: ${material.id || 'N/A'}`, labelWidth / 2, currentY + 15);
      currentY += 30 + padding;

      const qrTempCanvas = document.createElement('canvas');
      new QRious({
        element: qrTempCanvas,
        value: JSON.stringify({ id: material.id }),
        size: qrSize,
        background: 'white', // Ensure QR background is white for scanning
        foreground: 'black', // Ensure QR foreground is black
        level: 'H',
        padding: 0,
      });
      const qrX = (labelWidth - qrSize) / 2;
      ctx.drawImage(qrTempCanvas, qrX, currentY);
      currentY += qrSize + padding;

      ctx.textAlign = 'left';
      ctx.font = 'bold 13px Arial';
      ctx.fillStyle = textColor; // Dark text

      const addDetail = (label: string, value?: string) => {
        if (currentY + 20 > labelHeight - padding) return;
        ctx.fillText(label, padding, currentY);
        ctx.font = 'normal 13px Arial';
        ctx.fillStyle = detailColor; // Darker gray for detail value
        let displayValue = value || '-';
        if (label.length + (value || '').length > 35) {
          if (ctx.measureText(`${label} ${displayValue}`).width > labelWidth - padding * 2.5) {
            displayValue = displayValue.substring(0, 20) + '...';
          }
        }
        ctx.fillText(displayValue, padding + ctx.measureText(label).width + 5, currentY);
        currentY += 20;
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = textColor;
      };

      addDetail(`${labels.tip}: `, material.tip);
      addDetail(`${labels.stare}: `, material.stare);

      if (material.tip === MaterialType.PRIME) {
        const supplier = allSuppliers.find(s => s.id === material.supplierId);
        addDetail(`${labels.furnizor}: `, supplier?.nume);
        addDetail(`${labels.treeSpeciesCommon}: `, material.treeSpeciesCommon);
      } else if (material.tip === MaterialType.WORKED) {
        addDetail(`${labels.ikeaProductType}: `, material.ikeaProductType);
      }

      // Footer accent bar
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, labelHeight - 10, labelWidth, 10);
    };

    drawLabel();
    onCanvasReady(canvas);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, allSuppliers]);

  if (!material) return null;

  // The canvas element itself should ideally not have its own border/shadow if it's meant for print.
  // Visual styling for display in the app can be done by a wrapping Box.
  return (
    <Box sx={{ display: 'inline-block', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 1, backgroundColor: 'common.white' }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={450}
      />
    </Box>
  );
};

export default MaterialLabelCanvas;