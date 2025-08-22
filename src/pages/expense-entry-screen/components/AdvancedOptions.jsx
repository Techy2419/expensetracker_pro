import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const AdvancedOptions = ({ 
  isExpanded = false,
  onToggle = () => {},
  recurringData = {},
  onRecurringChange = () => {},
  splitData = {},
  onSplitChange = () => {},
  attachments = [],
  onAttachmentAdd = () => {},
  onAttachmentRemove = () => {},
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('recurring');

  const recurringOptions = [
    { value: 'none', label: 'No Repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e?.target?.files);
    files?.forEach(file => {
      if (file?.size <= 5 * 1024 * 1024) { // 5MB limit
        const reader = new FileReader();
        reader.onload = (event) => {
          onAttachmentAdd({
            id: Date.now() + Math.random(),
            name: file?.name,
            size: file?.size,
            type: file?.type,
            url: event?.target?.result
          });
        };
        reader?.readAsDataURL(file);
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  return (
    <div className={className}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          <Icon name="Settings" size={20} className="text-muted-foreground" />
          <span className="text-foreground font-medium">More Details</span>
        </div>
        <Icon 
          name="ChevronDown" 
          size={20} 
          className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      {isExpanded && (
        <div className="mt-4 bg-card border border-border rounded-lg p-4 animate-slide-in">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-background rounded-lg p-1">
            <button
              onClick={() => setActiveTab('recurring')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'recurring' ?'bg-accent text-accent-foreground' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Repeat" size={16} />
              <span>Recurring</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'split' ?'bg-accent text-accent-foreground' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Users" size={16} />
              <span>Split</span>
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'attachments' ?'bg-accent text-accent-foreground' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Paperclip" size={16} />
              <span>Attachments</span>
              {attachments?.length > 0 && (
                <span className="bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {attachments?.length}
                </span>
              )}
            </button>
          </div>

          {/* Recurring Tab */}
          {activeTab === 'recurring' && (
            <div className="space-y-4">
              <Select
                label="Repeat Frequency"
                options={recurringOptions}
                value={recurringData?.frequency || 'none'}
                onChange={(value) => onRecurringChange({ ...recurringData, frequency: value })}
              />

              {recurringData?.frequency && recurringData?.frequency !== 'none' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Repeat Every"
                      value={recurringData?.interval || 1}
                      onChange={(e) => onRecurringChange({ ...recurringData, interval: parseInt(e?.target?.value) })}
                      min="1"
                      max="365"
                    />
                    <Input
                      type="date"
                      label="End Date (Optional)"
                      value={recurringData?.endDate || ''}
                      onChange={(e) => onRecurringChange({ ...recurringData, endDate: e?.target?.value })}
                    />
                  </div>

                  <div className="p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Icon name="Info" size={16} />
                      <span>
                        This expense will repeat every {recurringData?.interval || 1} {recurringData?.frequency}
                        {recurringData?.endDate ? ` until ${new Date(recurringData.endDate)?.toLocaleDateString()}` : ''}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Split Tab */}
          {activeTab === 'split' && (
            <div className="space-y-4">
              <Checkbox
                label="Split this expense"
                checked={splitData?.enabled || false}
                onChange={(e) => onSplitChange({ ...splitData, enabled: e?.target?.checked })}
              />

              {splitData?.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Split with contacts
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {/* mockContacts?.map((contact) => ( */}
                        <div key="1" className="flex items-center space-x-3 p-2 hover:bg-background rounded-lg">
                          <Checkbox
                            checked={splitData?.contacts?.includes('1') || false}
                            onChange={(e) => {
                              const contacts = splitData?.contacts || [];
                              if (e?.target?.checked) {
                                onSplitChange({ 
                                  ...splitData, 
                                  contacts: [...contacts, '1'] 
                                });
                              } else {
                                onSplitChange({ 
                                  ...splitData, 
                                  contacts: contacts?.filter(id => id !== '1') 
                                });
                              }
                            }}
                          />
                          <img 
                            src="https://randomuser.me/api/portraits/men/1.jpg" 
                            alt="John Smith"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">John Smith</p>
                            <p className="text-xs text-muted-foreground">john@example.com</p>
                          </div>
                        </div>
                      {/* ))} */}
                    </div>
                  </div>

                  {splitData?.contacts && splitData?.contacts?.length > 0 && (
                    <div className="p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <Icon name="Calculator" size={16} />
                        <span>Split calculation</span>
                      </div>
                      <p className="text-sm text-foreground">
                        Split between {splitData?.contacts?.length + 1} people
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Add Receipt or Photo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors duration-200">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Icon name="Upload" size={32} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground font-medium">Click to upload files</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images and PDFs up to 5MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Attachment List */}
              {attachments?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Attached Files</h4>
                  {attachments?.map((attachment) => (
                    <div key={attachment?.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                          <Icon 
                            name={attachment?.type?.startsWith('image/') ? 'Image' : 'FileText'} 
                            size={20} 
                            className="text-accent" 
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-48">
                            {attachment?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment?.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAttachmentRemove(attachment?.id)}
                        className="p-1 text-muted-foreground hover:text-error transition-colors duration-200"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedOptions;