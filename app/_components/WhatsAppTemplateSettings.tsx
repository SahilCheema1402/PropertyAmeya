import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaCog, FaSave, FaTimes, FaEdit, FaSpinner, FaHistory } from 'react-icons/fa';
import { 
  useGetWhatsAppTemplateQuery, 
  useUpdateWhatsAppTemplateMutation,
  useResetWhatsAppTemplateMutation 
} from '@app/_api_query/whatsapp/whatsapp.api';
import { toast } from 'react-toastify';

const WhatsAppTemplateSettings = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [template, setTemplate] = useState('');
  const [userRole, setUserRole] = useState<number | null>(null);

  // RTK Query hooks
  const { data: templateData, isLoading: isLoadingTemplate, refetch } = useGetWhatsAppTemplateQuery(undefined, {
    skip: !isSettingsOpen, // Only fetch when modal is open
  });
  
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateWhatsAppTemplateMutation();
  const [resetTemplate, { isLoading: isResetting }] = useResetWhatsAppTemplateMutation();

  // Available variables that can be used in template
  const availableVariables = [
    { key: '{clientName}', description: 'Lead Name' },
    { key: '{userName}', description: 'Your Name' },
    { key: '{designation}', description: 'Your Designation' },
    { key: '{companyName}', description: 'Company Name' },
    { key: '{phone}', description: "Lead's Phone" }
  ];

  // Load user role
  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role ? parseInt(role) : null);
  }, []);

  // Load template from API when data is available
  useEffect(() => {
    if (templateData?.data?.template) {
      setTemplate(templateData.data.template);
    }
  }, [templateData]);

  const canEditTemplate = () => {
    return userRole === 1 || userRole === 2 || userRole === 31;
  };

  const handleSaveTemplate = async () => {
    if (!canEditTemplate()) {
      toast.error('You do not have permission to edit the template');
      return;
    }

    if (!template.trim()) {
      toast.error('Template cannot be empty');
      return;
    }

    try {
      await updateTemplate({ template }).unwrap();
      toast.success('Template saved successfully!');
      setTimeout(() => {
        setIsSettingsOpen(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save template');
    }
  };

  const handleResetToDefault = async () => {
    if (!canEditTemplate()) {
      toast.error('You do not have permission to reset the template');
      return;
    }

    if (!confirm('Are you sure you want to reset to the default template? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await resetTemplate({}).unwrap();
      setTemplate(result.data.template);
      toast.success('Template reset to default successfully!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reset template');
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template;
    const before = text.substring(0, start);
    const after = text.substring(end);
    setTemplate(before + variable + after);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    // Refetch to get latest template
    refetch();
  };

  return (
    <div className="relative">
      {/* Settings Button - Only show to authorized users */}
      {canEditTemplate() && (
        <button
          onClick={handleOpenSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md transition-all"
          title="WhatsApp Template Settings"
        >
          <FaWhatsapp size={20} />
          <FaCog size={16} />
          <span className="hidden sm:inline">Template Settings</span>
        </button>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaWhatsapp size={28} />
                <div>
                  <h2 className="text-2xl font-bold">WhatsApp Message Template</h2>
                  <p className="text-green-100 text-sm">
                    Customize your default WhatsApp message for all leads
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Loading State */}
            {isLoadingTemplate ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-green-600 mx-auto mb-4" size={48} />
                  <p className="text-gray-600">Loading template...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Template Editor */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Message Template
                          </label>
                          {templateData?.data?.lastUpdatedBy && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FaHistory />
                              <span>
                                Last updated by {templateData.data.lastUpdatedBy.userName}
                              </span>
                            </div>
                          )}
                        </div>
                        <textarea
                          id="template-textarea"
                          value={template}
                          onChange={(e) => setTemplate(e.target.value)}
                          className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm resize-none"
                          placeholder="Enter your WhatsApp message template..."
                          disabled={!canEditTemplate()}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Character count: {template.length}
                          </p>
                          <p className="text-xs text-gray-500">
                            Company-wide template • Changes affect all users
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {canEditTemplate() && (
                        <div className="flex gap-3">
                          <button
                            onClick={handleResetToDefault}
                            disabled={isResetting || isUpdating}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isResetting && <FaSpinner className="animate-spin" />}
                            Reset to Default
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Variables Panel */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FaEdit className="text-green-600" />
                          Available Variables
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Click to insert variables into your template. These will be automatically replaced with actual data when sending.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {availableVariables.map((variable) => (
                          <button
                            key={variable.key}
                            onClick={() => insertVariable(variable.key)}
                            className="w-full text-left p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!canEditTemplate()}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <code className="text-sm font-mono text-green-700 font-semibold">
                                  {variable.key}
                                </code>
                                <p className="text-xs text-gray-600 mt-1">
                                  {variable.description}
                                </p>
                              </div>
                              <span className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                +
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Preview Note */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold text-blue-900 mb-2">📝 Note</h4>
                        <p className="text-sm text-blue-800">
                          Variables in curly braces will be replaced with actual data when the message is sent to a lead.
                        </p>
                      </div>

                      {/* Permission Info */}
                      {!canEditTemplate() && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Permission Required</h4>
                          <p className="text-sm text-yellow-800">
                            You don't have permission to edit this template. Only users with roles 1, 2, or 31 can modify it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {canEditTemplate() ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        You have permission to edit this template
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        View only - No edit permission
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-all"
                      disabled={isUpdating || isResetting}
                    >
                      Cancel
                    </button>
                    {canEditTemplate() && (
                      <button
                        onClick={handleSaveTemplate}
                        disabled={isUpdating || isResetting}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save Template
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplateSettings;