import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportModal = ({ isOpen, onClose, onExport, selectedTransactions = [] }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRange, setExportRange] = useState('filtered');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV File' }
  ];

  const rangeOptions = [
    { value: 'filtered', label: 'Current filtered results' },
    { value: 'selected', label: `Selected transactions (${selectedTransactions?.length})` },
    { value: 'all', label: 'All transactions' },
    { value: 'month', label: 'Current month' },
    { value: 'year', label: 'Current year' }
  ];

  const handleExport = () => {
    onExport({
      format: exportFormat,
      range: exportRange,
      includeCharts,
      includeSummary,
      selectedTransactions
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-400" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-popover border border-border rounded-lg shadow-modal z-500 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-popover-foreground">Export Expenses</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Format */}
          <Select
            label="Export Format"
            options={formatOptions}
            value={exportFormat}
            onChange={setExportFormat}
          />

          {/* Export Range */}
          <Select
            label="Export Range"
            options={rangeOptions?.filter(option => 
              option?.value !== 'selected' || selectedTransactions?.length > 0
            )}
            value={exportRange}
            onChange={setExportRange}
          />

          {/* Additional Options */}
          {exportFormat === 'pdf' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-popover-foreground">Include in Report</h4>
              <div className="space-y-2">
                <Checkbox
                  label="Summary statistics"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e?.target?.checked)}
                />
                <Checkbox
                  label="Charts and graphs"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e?.target?.checked)}
                />
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-accent" />
              <span className="text-sm font-medium text-popover-foreground">Export Preview</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Format: {formatOptions?.find(f => f?.value === exportFormat)?.label}</p>
              <p>Range: {rangeOptions?.find(r => r?.value === exportRange)?.label}</p>
              {exportFormat === 'pdf' && (
                <p>Includes: {[includeSummary && 'Summary', includeCharts && 'Charts']?.filter(Boolean)?.join(', ') || 'Transaction list only'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleExport} className="flex-1" iconName="Download" iconPosition="left">
            Export
          </Button>
        </div>
      </div>
    </>
  );
};

export default ExportModal;