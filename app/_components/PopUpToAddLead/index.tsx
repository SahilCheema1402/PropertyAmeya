import React, { useEffect } from 'react';
import { MdUpload, MdClose } from 'react-icons/md';
import { FaRegKeyboard } from 'react-icons/fa';
import { useState } from 'react';
import BulkLeadUpload from './../BulkLeadUpload';

export default function PopUpToAddLead({ setPop, setLeadForm }: any) {
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    return (
        <div 
            className="fixed inset-0 bg-black/30 dark:bg-zinc-700/50 z-50 flex justify-center items-center"
            onClick={(e) => e.stopPropagation()}
        >
            {!showBulkUpload ? (
                <div className="bg-white rounded-xl px-4 py-8 w-[90%] max-w-md">
                    {/* Close Button */}
                    <div className="flex justify-end mb-4">
                        <button 
                            className="bg-[#004aad] p-1 rounded-full hover:bg-[#003a8d] transition-colors"
                            onClick={() => setPop(false)}
                        >
                            <MdClose size={16} color="white" />
                        </button>
                    </div>

                    {/* Bulk Lead Button */}
                    <div className="mb-4">
                        <button 
                            className="w-full bg-gradient-to-br from-[#606c88] to-[#3f4c6b] rounded-xl hover:opacity-90 transition-opacity"
                            onClick={() => setShowBulkUpload(true)}
                        >
                            <div className="flex items-center justify-center p-4 space-x-2">
                                <MdUpload size={24} color="#fff" />
                                <span className="text-white font-semibold text-xl">Bulk Lead</span>
                            </div>
                        </button>
                    </div>

                    {/* Single Lead Button */}
                    <div>
                        <button 
                            className="w-full bg-gradient-to-br from-[#606c88] to-[#3f4c6b] rounded-xl hover:opacity-90 transition-opacity"
                            onClick={() => {
                                setLeadForm(true);
                                setPop(false);
                            }}
                        >
                            <div className="flex items-center justify-center p-4 space-x-2">
                                <FaRegKeyboard size={24} color="#fff" />
                                <span className="text-white font-semibold text-xl">Single Lead</span>
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <BulkLeadUpload 
                onClose={() => {
                    setShowBulkUpload(false);
                    setPop(false);
                  }}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
