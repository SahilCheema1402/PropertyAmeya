export default function DeleteAccount() {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center p-6 overflow-x-hidden">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-12 border border-gray-200">
          {/* Warning Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-red-100 p-4 rounded-full">
              <svg 
                className="w-12 h-12 text-red-600"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-6 text-center">
              Request Account Deletion
            </h1>
          </div>
  
          {/* Process Steps */}
          <div className="space-y-6 mb-8">
            <div className="flex items-start">
              <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-4">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Deletion Request</h3>
                <p className="text-gray-600 mt-2">
                  Initiate deletion by sending an email to our data protection team from your registered email address.
                </p>
              </div>
            </div>
  
            <div className="flex items-start">
              <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-4">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verification Process</h3>
                <p className="text-gray-600 mt-2">
                  Our team will verify your identity and confirm account ownership within 24 hours.
                </p>
              </div>
            </div>
  
            <div className="flex items-start">
              <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center mr-4">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
                <p className="text-gray-600 mt-2">
                  You'll receive a confirmation email before permanent deletion occurs.
                </p>
              </div>
            </div>
          </div>
  
          {/* Email Action Section */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Send your deletion request to:
              </p>
              <div className="flex items-center justify-center space-x-4">
               
                <div className="text-gray-600">
             
                  <span className="font-semibold">info@property360degree.in</span>
                </div>
              </div>
            </div>
          </div>
  
          {/* Important Notes */}
          <div className="mt-8 bg-red-50 p-5 rounded-lg border border-red-200">
            <h3 className="text-red-600 font-semibold mb-3 flex items-center">
              <svg 
                className="w-5 h-5 mr-2"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Important Information
            </h3>
            <ul className="list-disc text-gray-700 space-y-2 pl-6">
              <li>Include your registered email address in the request</li>
              <li>Processing may take up to 72 business hours</li>
              <li>All data will be permanently erased following GDPR guidelines</li>
            </ul>
          </div>

        </div>
      </div>
    );
  }