import React from 'react';


const PrivacyPolicy = () => {
    return (
        <div className="flex min-h-screen bg-white">
            <div className="flex-1 p-4">
                <div className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="bg-purple-100 rounded-t-3xl shadow-md mx-4 p-6">
                        <h1 className="text-center text-2xl font-bold text-gray-900">Privacy Policy</h1>
                        <p className="text-center text-sm bg-slate-700 rounded-lg p-1 text-yellow-300 mt-2">
                            Last updated on {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="mx-8 mt-10 border-l-4 border-black space-y-4 px-4">
                        {/* Introduction */}
                        <div>
                            <p className="text-sm text-gray-600 mt-2">
                                Welcome to the Property 360 app. The Property 360 app empowers real estate agents and employees of Property 360 Private Ltd organization to efficiently log in, manage user data, and streamline calling or follow-up activities for enhanced customer engagement.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Property 360 (“we,” “our,” or “us”) values your privacy and is committed to protecting your personal information. This Privacy Policy describes how we collect, use, and safeguard your data when you use our mobile application (the “App”). By using the App, you agree to the terms of this Privacy Policy.
                            </p>
                        </div>

                        {/* Section 1 */}
                        <h2 className="text-xl font-bold">1. Information We Collect</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We collect the following types of information:
                        </p>
                        <h3 className="font-semibold">a. Personal Information</h3>
                        <ul className="mb-4">
                            <li>- Name</li>
                            <li>- Contact details (e.g., phone number, email address)</li>
                            <li>- Aadhar Number, PAN</li>
                            <li>- User account credentials</li>
                        </ul>
                        <h3 className="font-semibold">b. Non-Personal Information</h3>
                        <p className="text-sm text-gray-600">- Location of the user using the device</p>
                        <h3 className="font-semibold">c. Data Entered by Users</h3>
                        <p className="text-sm text-gray-600">- User data entered for business purposes, such as client names, contact details, and follow-up information.</p>

                        {/* Section 2 */}
                        <h2 className="text-lg font-semibold text-gray-800 mt-10">2. How We Use Your Information</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We use the collected information to:
                        </p>
                        <ul className="text-sm text-gray-600 mt-2">
                            <li>- Facilitate account creation and logins.</li>
                            <li>- Store and manage user data for calling and follow-up purposes.</li>
                            <li>- Improve the App’s functionality and performance.</li>
                            <li>- Provide customer support.</li>
                            <li>- Ensure compliance with legal requirements.</li>
                        </ul>

                        {/* Section 3 */}
                        <h2 className="text-lg font-semibold text-gray-800 mt-10">3. How We Share Your Information</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We do not sell, trade, or rent your personal information. However, we may share data in the following situations:
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-bold">Service Providers:</span> With third-party vendors who assist in App operations (e.g., cloud storage, analytics).
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-bold">Legal Requirements:</span> When required to comply with legal obligations or protect our rights.
                        </p>

                        {/* Section 4 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">4. Data Security</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
                        </p>

                        {/* Section 5 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">5. Data Retention</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We retain your personal data for as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law.
                        </p>

                        {/* Section 6 */}
                        <h2 className="text-lg font-semibold text-gray-800 mt-10">6. Your Rights</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Depending on your location, you may have the right to:
                        </p>
                        <ul className="text-sm text-gray-600 mt-2">
                            <li>- Access, update, or delete your personal information.</li>
                            <li>- Opt-out of data collection for marketing purposes.</li>
                            <li>- Restrict certain data processing activities.</li>
                        </ul>
                        <p className="text-sm text-gray-600 mt-2">
                            To exercise your rights, contact us at{' '}
                            <a href="mailto:info@iameya.in" className="text-blue-600 underline">info@iameya.in</a>.
                        </p>

                        {/* Section 7 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">7. Third-Party Links</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            The App may contain links to third-party websites or services. We are not responsible for the privacy practices of these external platforms.
                        </p>

                        {/* Section 8 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">8. Children’s Privacy</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            The App is not intended for children under the age of 13. We do not knowingly collect data from children. If you believe a child has provided us with personal information, contact us to delete it.
                        </p>

                        {/* Section 9 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">9. Changes to This Privacy Policy</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            We may update this Privacy Policy from time to time. Any changes will be posted within the App, and your continued use after such changes indicates your acceptance of the updated policy.
                        </p>

                        {/* Section 10 */}
                        <h2 className="text-xl font-semibold text-gray-800 mt-10">10. Contact Us</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            If you have any questions about this Privacy Policy or the Service, you can contact us via email at{' '}
                            <a href="mailto:info@iameya.in" className="text-blue-600 underline">info@iameya.in</a> or our website at{' '}
                            <a href="https://iameya.in/" className="text-blue-600 underline">https://iameya.in/</a>.
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            Using the Property 360 App, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;