import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-ist-blue dark:text-white">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-12">
                <strong>Effective Date:</strong> 16 March 2020<br/>
                <strong>Last Updated:</strong> 24 February 2026
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-ist-blue dark:prose-headings:text-white prose-a:text-ist-gold hover:prose-a:text-ist-blue dark:hover:prose-a:text-white">
                <h2>1. Who We Are</h2>
                <p>This Privacy Policy applies to the websites, landing pages, and digital properties operated by IRIS STAR Technologies L.L.C. and its related/sister entities presented on the website(s) (collectively, "IST Group," "we," "us," or "our").</p>
                <p>For the purpose of this Policy, the applicable contracting or operating entity may vary depending on the website/domain, service, or country of engagement, including entities in:</p>
                <ul>
                    <li>United Arab Emirates (UAE)</li>
                    <li>India</li>
                    <li>Qatar</li>
                    <li>United States (USA)</li>
                </ul>
                <p>The specific legal entity responsible for your personal data may be identified in the relevant website footer, the contact page, the proposal/contract you sign, or a country-specific notice.</p>

                <h2>2. Scope of This Policy</h2>
                <p>This Policy explains how we collect, use, disclose, store, and protect personal data when you:</p>
                <ul>
                    <li>visit our websites,</li>
                    <li>submit an inquiry or contact form,</li>
                    <li>request information, proposals, demos, or consultations,</li>
                    <li>apply for jobs or submit resumes/CVs,</li>
                    <li>interact with us for recruitment, staffing, training, or business services,</li>
                    <li>subscribe to newsletters/updates,</li>
                    <li>communicate with us through email, phone, chat, messaging apps (including WhatsApp where applicable), or other channels.</li>
                </ul>
                <p>This Policy does not govern personal data processing under client project contracts where separate agreements (e.g., MSA, SOW, DPA, staffing agreements) apply.</p>

                <h2>3. Information We Collect</h2>
                <h3>A. Information You Provide Directly</h3>
                <ul>
                    <li>Name</li>
                    <li>Company name</li>
                    <li>Job title/designation</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Country/location</li>
                    <li>Inquiry details / project requirements</li>
                    <li>Resume/CV, employment history, skills, certifications, and other recruitment-related information</li>
                    <li>Training registration details</li>
                    <li>Any content you submit in forms, emails, or messages</li>
                </ul>

                <h3>B. Information Collected Automatically</h3>
                <p>When you use our website, we may collect:</p>
                <ul>
                    <li>IP address</li>
                    <li>Device type</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent</li>
                    <li>Referring URLs</li>
                    <li>Clickstream and navigation behavior</li>
                    <li>Approximate geolocation (derived from IP)</li>
                    <li>Cookie and similar technology data (subject to your preferences where required)</li>
                </ul>

                <h3>C. Information from Third Parties</h3>
                <p>We may receive information from:</p>
                <ul>
                    <li>recruitment/job portals,</li>
                    <li>professional networks (e.g., LinkedIn),</li>
                    <li>business partners/referrals,</li>
                    <li>analytics providers,</li>
                    <li>marketing platforms,</li>
                    <li>publicly available sources.</li>
                </ul>

                <h2>4. How We Use Your Information</h2>
                <p>We use personal data for legitimate business purposes, including to:</p>
                
                <h3>A. Provide and Improve Services</h3>
                <ul>
                    <li>respond to inquiries and requests,</li>
                    <li>prepare proposals, quotations, and service communications,</li>
                    <li>deliver consulting, staffing, managed services, digital engineering, AI, and training-related interactions,</li>
                    <li>improve website usability and performance.</li>
                </ul>

                <h3>B. Recruitment and Talent Sourcing</h3>
                <ul>
                    <li>review resumes/CVs and profiles,</li>
                    <li>assess role fit and communicate with candidates,</li>
                    <li>coordinate interviews, screening, and onboarding steps,</li>
                    <li>maintain talent pools (subject to applicable law and retention rules).</li>
                </ul>

                <h3>C. Business Operations</h3>
                <ul>
                    <li>manage vendor/customer relationships,</li>
                    <li>maintain records, audit trails, and internal administration,</li>
                    <li>protect our systems, websites, and users,</li>
                    <li>detect, investigate, and prevent fraud, abuse, or security incidents.</li>
                </ul>

                <h3>D. Marketing and Communications</h3>
                <ul>
                    <li>send updates, service information, event invitations, or newsletters (subject to opt-out rights and applicable consent requirements),</li>
                    <li>personalize website content and outreach.</li>
                </ul>

                <h3>E. Legal and Compliance</h3>
                <ul>
                    <li>comply with applicable laws, regulations, court orders, and lawful requests,</li>
                    <li>establish, exercise, or defend legal claims.</li>
                </ul>

                <h2>5. Legal Basis for Processing (Where Applicable)</h2>
                <p>Depending on your location and the applicable law, we process personal data on one or more of the following grounds:</p>
                <ul>
                    <li>your consent,</li>
                    <li>performance of a contract or steps prior to entering into a contract,</li>
                    <li>our legitimate business interests,</li>
                    <li>compliance with legal obligations,</li>
                    <li>other lawful bases permitted by applicable law.</li>
                </ul>
                <p>IST Group recognizes that privacy and personal data processing are subject to applicable data protection laws in the jurisdictions in which it operates, including the UAE's federal personal data protection framework, Qatar's personal data privacy law, and India's Digital Personal Data Protection Act, 2023.</p>

                <h2>6. Cookies and Similar Technologies</h2>
                <p>We may use cookies, pixels, tags, and similar technologies to:</p>
                <ul>
                    <li>keep the website functioning,</li>
                    <li>remember preferences,</li>
                    <li>analyze traffic and performance,</li>
                    <li>improve content and user experience,</li>
                    <li>support marketing and campaign measurement (where used).</li>
                </ul>
                <p>Where required by law, we will request your consent before placing non-essential cookies. You can manage cookies via our cookie banner/settings (if enabled), and/or your browser settings.</p>

                <h2>7. How We Share Your Information</h2>
                <p>We do not sell personal data in exchange for money. We may share personal data only as needed for legitimate business purposes, including with:</p>
                
                <h3>A. IST Group Entities</h3>
                <p>Our related/sister entities in UAE, India, Qatar, and USA for shared operations, recruitment coordination, service delivery, internal administration, compliance and reporting.</p>

                <h3>B. Service Providers / Processors</h3>
                <p>Third parties acting on our behalf, such as hosting/cloud providers, email and communication providers, CRM and ATS/recruitment tools, analytics providers, IT/security support, training/event platforms, payment processors (if applicable).</p>

                <h3>C. Clients / Prospective Clients (Recruitment/Staffing Context)</h3>
                <p>Where relevant and lawful, we may share candidate profiles/resumes and related professional information with clients or prospects for job evaluation, interviews, and staffing opportunities.</p>

                <h3>D. Legal and Compliance Disclosures</h3>
                <p>If required to comply with law or legal process, protect rights, property, or safety, investigate misuse, fraud, or security incidents, support corporate transactions (e.g., restructuring, merger, sale, subject to confidentiality and legal controls).</p>

                <h2>8. International / Cross-Border Transfers</h2>
                <p>Because IST Group operates across multiple countries, your personal data may be processed or accessed outside your country of residence, including in the UAE, India, Qatar, USA, or other jurisdictions where our group entities or service providers operate.</p>
                <p>Where required, we take reasonable steps to implement appropriate safeguards for cross-border transfers in line with applicable law.</p>

                <h2>9. Data Retention</h2>
                <p>We retain personal data only for as long as necessary for the purposes described in this Policy, including service inquiries and client relationship management, recruitment and talent pool management, legal, tax, accounting, and compliance obligations, dispute resolution and enforcement of agreements.</p>
                <p>Retention periods may vary by data type and jurisdiction. When no longer required, data is deleted, anonymized, or securely archived in accordance with our retention practices and legal requirements.</p>

                <h2>10. Your Privacy Rights</h2>
                <p>Depending on your location and applicable law, you may have rights such as access to your personal data, correction/rectification, deletion/erasure, withdrawal of consent, objection to certain processing, restriction of processing, data portability (where applicable), complaint to a competent authority/regulator.</p>
                <p>We will respond to requests in accordance with applicable law and may need to verify your identity before processing your request. To exercise your rights, contact us at: <a href="mailto:info@irisstar.tech">info@irisstar.tech</a></p>

                <h2>11. Marketing Preferences</h2>
                <p>If you receive marketing emails from us, you can opt out at any time by clicking the unsubscribe link in the email, or contacting us at <a href="mailto:info@irisstar.tech">info@irisstar.tech</a>.</p>
                <p>Please note that we may still send non-marketing communications related to ongoing business inquiries, services, applications, or contracts.</p>

                <h2>12. Data Security</h2>
                <p>We implement reasonable technical, administrative, and organizational safeguards designed to protect personal data against unauthorized access, loss, misuse, alteration, or disclosure. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>

                <h2>13. Children's Privacy</h2>
                <p>Our websites and services are generally intended for businesses, professionals, and adult users. We do not knowingly collect personal data from children except where expressly permitted and handled under applicable law (e.g., training programs requiring parental/guardian consent).</p>

                <h2>14. Third-Party Websites and Links</h2>
                <p>Our websites may contain links to third-party sites, platforms, or services. We are not responsible for the privacy practices or content of third-party websites. Please review their privacy notices before providing personal data.</p>

                <h2>15. Country / Region-Specific Notes</h2>
                <h3>A. UAE</h3>
                <p>Processing involving UAE operations may be subject to applicable UAE data protection requirements, including the UAE's federal personal data protection framework.</p>
                <h3>B. Qatar</h3>
                <p>Processing involving Qatar operations may be subject to Qatar Law No. (13) of 2016 on Protecting Personal Data Privacy and related guidance.</p>
                <h3>C. India</h3>
                <p>Processing involving India operations may be subject to the Digital Personal Data Protection Act, 2023 and applicable rules/notifications.</p>
                <h3>D. United States</h3>
                <p>For U.S.-related operations, IST Group seeks to comply with applicable U.S. federal and state privacy/security requirements relevant to its activities. U.S. privacy and security enforcement may involve federal and state regulators, including the FTC in applicable contexts.</p>

                <h2>16. Changes to This Privacy Policy</h2>
                <p>We may update this Policy from time to time to reflect legal/regulatory changes, operational changes, service updates, security or technical improvements. The updated version will be posted on this page with the revised "Last Updated" date. Where required, we will provide additional notice or obtain consent.</p>

                <h2>17. Contact Us</h2>
                <p>For privacy-related questions, requests, or complaints, please contact:</p>
                <p>
                    <strong>IRIS STAR Technologies Group – Privacy Office</strong><br/>
                    Email: <a href="mailto:info@irisstar.tech">info@irisstar.tech</a><br/>
                    Website: <a href="https://irisstar.tech">irisstar.tech</a>
                </p>

                <h3>Registered/Operating Entities:</h3>
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
