import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-ist-dark text-ist-blue dark:text-white font-sans selection:bg-ist-gold selection:text-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <button 
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-ist-gold transition-colors"
        >
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-ist-blue dark:text-white">Terms of Service</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-12">
                <strong>Effective Date:</strong> 16 March 2020<br/>
                <strong>Last Updated:</strong> 24 February 2026
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-ist-blue dark:prose-headings:text-white prose-a:text-ist-gold hover:prose-a:text-ist-blue dark:hover:prose-a:text-white">
                <h2>1. Acceptance of Terms</h2>
                <p>These Terms of Service ("Terms") govern your access to and use of the websites, landing pages, and digital properties operated by IRIS STAR Technologies L.L.C. and related/sister entities represented on the website(s) (collectively, "IST Group," "we," "us," or "our").</p>
                <p>By accessing or using our website(s), you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use our website(s).</p>

                <h2>2. Who These Terms Apply To</h2>
                <p>These Terms apply to website visitors, prospective clients, clients (for website use only), job applicants/candidates (for website use only), partners/vendors, any user interacting with IST Group websites or forms.</p>
                <p><strong>Important:</strong> If you enter into a separate contract with IST Group (e.g., MSA, SOW, staffing agreement, service agreement, training agreement, NDA, or employment/contractor terms), that separate contract governs the relevant services and will prevail in case of conflict.</p>

                <h2>3. Website Purpose</h2>
                <p>Our website(s) are provided for general information and business engagement purposes, including but not limited to:</p>
                <ul>
                    <li>showcasing company capabilities and services,</li>
                    <li>enabling contact/inquiry submissions,</li>
                    <li>recruitment/career applications,</li>
                    <li>service, staffing, and training-related interactions,</li>
                    <li>sharing updates, resources, and company information.</li>
                </ul>
                <p>Nothing on the website constitutes a binding offer unless expressly stated in a signed written agreement.</p>

                <h2>4. Eligibility and User Responsibilities</h2>
                <p>By using our website(s), you represent that:</p>
                <ul>
                    <li>you have legal capacity to agree to these Terms,</li>
                    <li>the information you submit is true and not misleading,</li>
                    <li>you will use the website lawfully and in good faith,</li>
                    <li>you will not violate any applicable law, regulation, or third-party rights.</li>
                </ul>
                <p>You are responsible for maintaining the confidentiality of any credentials used for any restricted areas (if applicable).</p>

                <h2>5. Prohibited Conduct</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>use the website for unlawful, fraudulent, or harmful purposes,</li>
                    <li>upload or transmit malware, viruses, or malicious code,</li>
                    <li>attempt unauthorized access to systems, accounts, or data,</li>
                    <li>interfere with website security, operation, or performance,</li>
                    <li>scrape, crawl, harvest, or collect data in bulk without permission,</li>
                    <li>submit false resumes, impersonate persons, or misrepresent authority,</li>
                    <li>infringe intellectual property or confidentiality rights,</li>
                    <li>use the website to spam, solicit, or distribute unauthorized promotions,</li>
                    <li>reverse engineer or copy protected elements except as allowed by law.</li>
                </ul>
                <p>We may suspend or block access for misuse, abuse, or suspected violations.</p>

                <h2>6. Intellectual Property Rights</h2>
                <p>Unless otherwise stated, all website content is owned by or licensed to IST Group, including text, graphics, logos, icons, design, layout, look and feel, software, code, and functionality, documents, downloads, images, and materials.</p>
                <p>You are granted a limited, non-exclusive, revocable right to access and use the website for lawful internal/business informational purposes only. You may not copy, reproduce, republish, distribute, modify, or create derivative works from our content without prior written permission, except as permitted by law.</p>

                <h2>7. Trademarks</h2>
                <p>"IRIS STAR Technologies," "IST," and associated logos, marks, and branding elements are trademarks or proprietary identifiers of IST Group and/or its affiliates, unless otherwise indicated. Use of our marks without prior written permission is prohibited.</p>

                <h2>8. User Submissions (Forms, Inquiries, CVs, etc.)</h2>
                <p>If you submit information to us (including contact forms, resumes/CVs, proposals, feedback, or inquiries):</p>
                <ul>
                    <li>you represent you have the right to submit it,</li>
                    <li>the content is accurate to the best of your knowledge,</li>
                    <li>the content does not violate any law or third-party rights.</li>
                </ul>
                <p>You grant IST Group a limited right to use submitted materials as necessary to respond to your inquiry, evaluate your application/profile, provide services, conduct business communications, maintain records and comply with law.</p>
                <p>Recruitment-related submissions may be shared with relevant IST Group entities and clients/prospective clients in accordance with our Privacy Policy and applicable law.</p>

                <h2>9. No Professional Advice</h2>
                <p>Website content is provided for general informational purposes only and does not constitute legal advice, financial or investment advice, tax advice, employment guarantee, regulatory or compliance certification, technical warranty or implementation commitment. You should seek independent professional advice before making decisions based on website content.</p>

                <h2>10. Third-Party Links and Services</h2>
                <p>Our websites may contain links to third-party websites, tools, or platforms. These are provided for convenience only. IST Group does not control and is not responsible for the content, availability, security, privacy practices, terms or policies of third-party websites/services. Your use of third-party websites is at your own risk and subject to their terms.</p>

                <h2>11. Service Descriptions and Availability</h2>
                <p>We may update, modify, suspend, or discontinue any website feature, content, or service description at any time without notice. Descriptions of services, capabilities, sectors, or delivery models are illustrative and may vary by jurisdiction, entity, availability of resources, contractual scope, regulatory restrictions, client requirements.</p>

                <h2>12. Disclaimer of Warranties</h2>
                <p>To the maximum extent permitted by law, the website and its content are provided on an "as is" and "as available" basis without warranties of any kind, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, availability, uninterrupted operation. We do not warrant that the website will be error-free, secure, or continuously available.</p>

                <h2>13. Limitation of Liability</h2>
                <p>To the maximum extent permitted by law, IST Group and its affiliates, directors, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, data, business, goodwill, or opportunity, arising out of or related to your use of (or inability to use) the website.</p>
                <p>Our total liability for claims relating to website use shall not exceed the amount (if any) paid by you to access the website (which is typically zero). Nothing in these Terms excludes liability that cannot be excluded under applicable law.</p>

                <h2>14. Indemnity</h2>
                <p>You agree to indemnify and hold harmless IST Group and its affiliates, directors, officers, employees, and agents from and against claims, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from your misuse of the website, your breach of these Terms, your violation of law or third-party rights, content or information you submit.</p>

                <h2>15. Privacy and Data Protection</h2>
                <p>Your use of the website is also governed by our Privacy Policy, which describes how we collect and process personal data. By using the website and submitting information, you acknowledge that processing may occur across IST Group entities and service providers in multiple jurisdictions, subject to applicable law and our Privacy Policy.</p>

                <h2>16. Electronic Communications</h2>
                <p>By contacting us or submitting forms through our website, you consent to receive communications electronically (e.g., email, phone, messaging, or other channels you provide), subject to applicable law and your preferences.</p>

                <h2>17. Governing Law and Jurisdiction (Website Terms)</h2>
                <p>Because IST Group operates across multiple jurisdictions, the governing law and dispute forum for these website Terms may depend on the specific website/domain and the legal entity identified on that website.</p>
                <ul>
                    <li>UAE-operated site → UAE law and competent courts</li>
                    <li>Qatar-operated site → Qatar law and competent courts</li>
                    <li>India-operated site → India law and competent courts</li>
                    <li>USA-operated site → State law designated in site-specific terms and competent courts</li>
                </ul>

                <h2>18. Changes to These Terms</h2>
                <p>We may update these Terms at any time. Updated Terms will be posted on this page with a revised "Last Updated" date. Your continued use of the website after changes are posted constitutes acceptance of the updated Terms.</p>

                <h2>19. Severability</h2>
                <p>If any provision of these Terms is found invalid or unenforceable, the remaining provisions will continue in full force and effect to the maximum extent permitted by law.</p>

                <h2>20. Waiver</h2>
                <p>Failure by IST Group to enforce any provision of these Terms does not constitute a waiver of that provision or any other rights.</p>

                <h2>21. Entire Agreement (Website Use Only)</h2>
                <p>These Terms and the Privacy Policy constitute the entire agreement between you and IST Group regarding website use, unless superseded by a separate written agreement for services, staffing, training, employment, or partnership.</p>

                <h2>22. Contact Information</h2>
                <p>For questions about these Terms:</p>
                <p>
                    <strong>IRIS STAR Technologies Group</strong><br/>
                    Email: <a href="mailto:info@irisstar.tech">info@irisstar.tech</a><br/>
                    Website: <a href="https://irisstar.tech">irisstar.tech</a>
                </p>

                <h3>Entity/operator details:</h3>
                <ul>
                    <li><strong>UAE:</strong> IRIS STAR Technologies L.L.C. — Level 20, 48, Burj Gate Tower, Downtown Dubai, P.O. BOX 22061</li>
                    <li><strong>Qatar:</strong> IRIS STAR Technologies — Office 214/215, 2nd Floor, Regus D-Ring Building no 65, D-Ring Road, Old Airport, PO Box 32522</li>
                    <li><strong>India:</strong> IRIS STAR Technologies — Prestige Polygon, 3rd Floor, 471 Anna Salai, Teynampet, Chennai-600 035, Tamil Naidu</li>
                    <li><strong>USA:</strong> IRIS STAR Technologies — [Address Pending]</li>
                </ul>
            </div>
        </motion.div>
      </div>
    </div>
  );
};
