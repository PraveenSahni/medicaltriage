import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File as FileIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const BOOKING_URL = "https://outlook.office.com/bookwithme/user/4a7ee7e825c84fbabf53ff98399b0221@irisstar.tech/meetingtype/3CalTeDkuki8CSXJVWIUuQ2?anonymous&ep=mlink";

export const BookingModal: React.FC = () => {
  const { isOpen, closeBooking } = useBooking();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    workEmail: '',
    message: '',
    consent: false,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFallbackLink, setShowFallbackLink] = useState(false);
  const [finalBookingUrl, setFinalBookingUrl] = useState(BOOKING_URL);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        companyName: '',
        workEmail: '',
        message: '',
        consent: false,
      });
      setFiles([]);
      setFileErrors([]);
      setIsSubmitting(false);
      setShowFallbackLink(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    selectedFiles.forEach((file: File) => {
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(doc|docx|pdf|ppt|pptx)$/i)) {
        newErrors.push(`"${file.name}" is not a supported format.`);
      } else if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`"${file.name}" exceeds the 5MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (files.length + validFiles.length > MAX_FILES) {
      newErrors.push(`You can only upload up to ${MAX_FILES} files.`);
      validFiles.splice(MAX_FILES - files.length);
    }

    setFileErrors(newErrors);
    setFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = 
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.companyName.trim() !== '' &&
    isValidEmail(formData.workEmail) &&
    formData.message.trim() !== '' &&
    formData.consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setShowFallbackLink(false);

    try {
      // Collect UTM parameters if any
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || 'none';
      const utm_medium = urlParams.get('utm_medium') || 'none';
      const utm_campaign = urlParams.get('utm_campaign') || 'none';

      const timestamp = new Date().toISOString();
      const pageUrl = window.location.href;
      const attachmentsList = files.length > 0 ? files.map(f => f.name).join(', ') : 'None';

      const formattedDescription = `Name: ${formData.firstName} ${formData.lastName}
Company: ${formData.companyName}
Email: ${formData.workEmail}
Objective: ${formData.message}
Attachments: ${attachmentsList}
Source: ${pageUrl}
Submitted: ${timestamp}
UTM: ${utm_source}/${utm_medium}/${utm_campaign}`;

      // Prepare data to store
      const submissionData = {
        ...formData,
        attachments: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        timestamp,
        pageUrl,
        utmParams: { utm_source, utm_medium, utm_campaign },
        formattedDescription
      };

      // Store in localStorage (simulating backend save)
      const existingSubmissions = JSON.parse(localStorage.getItem('bookingSubmissions') || '[]');
      localStorage.setItem('bookingSubmissions', JSON.stringify([...existingSubmissions, submissionData]));
      
      console.log('Form submitted successfully:', submissionData);

      // Redirect to booking URL
      const bookingUrl = new URL(BOOKING_URL);
      bookingUrl.searchParams.append('notes', formattedDescription);
      bookingUrl.searchParams.append('body', formattedDescription);
      
      const newWindow = window.open(bookingUrl.toString(), '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.error('Popup blocked or failed to open. Showing fallback link.');
        setFinalBookingUrl(bookingUrl.toString());
        setShowFallbackLink(true);
        setIsSubmitting(false);
      } else {
        // Success
        setTimeout(() => {
          closeBooking();
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error during submission:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeBooking}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-ist-dark-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0">
              <h2 className="text-xl font-bold text-ist-blue dark:text-white">Request a Discovery Call</h2>
              <button 
                onClick={closeBooking}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name *</label>
                    <input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-ist-dark border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-ist-gold focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name *</label>
                    <input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-ist-dark border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-ist-gold focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company name *</label>
                    <input 
                      type="text" 
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-ist-dark border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-ist-gold focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input 
                      type="email" 
                      name="workEmail"
                      value={formData.workEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white dark:bg-ist-dark border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-ist-gold focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objective of the call *</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Briefly share what you want to discuss so we can prepare.</p>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-white dark:bg-ist-dark border border-gray-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-ist-gold focus:border-transparent outline-none transition-all text-gray-900 dark:text-white resize-none"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attach file(s) <span className="text-gray-400 font-normal">(Optional, max 3 files, up to 5MB each)</span>
                  </label>
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      DOC, DOCX, PDF, PPT, PPTX
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      accept=".doc,.docx,.pdf,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    />
                  </div>

                  {fileErrors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {fileErrors.map((err, i) => (
                        <p key={i} className="text-xs text-red-500">{err}</p>
                      ))}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileIcon className="w-5 h-5 text-ist-blue dark:text-ist-gold shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input 
                      type="checkbox" 
                      name="consent"
                      id="consent"
                      checked={formData.consent}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-ist-gold bg-white border-gray-300 rounded focus:ring-ist-gold focus:ring-2 dark:bg-ist-dark dark:border-white/20"
                      required
                    />
                  </div>
                  <label htmlFor="consent" className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                    I agree to the <Link to="/privacy-policy" target="_blank" className="text-ist-blue dark:text-ist-gold hover:underline">Privacy policy</Link> and consent to having my information stored to process this inquiry. *
                  </label>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0 flex justify-end gap-3 items-center">
              {showFallbackLink && (
                <a 
                  href={finalBookingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-ist-blue dark:text-ist-gold underline text-sm font-medium mr-auto"
                  onClick={() => {
                    setTimeout(() => {
                      closeBooking();
                      setShowFallbackLink(false);
                    }, 500);
                  }}
                >
                  Open scheduler
                </a>
              )}
              <button 
                type="button"
                onClick={closeBooking}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="booking-form"
                disabled={!isFormValid || isSubmitting}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-ist-blue dark:bg-ist-gold hover:bg-ist-gold dark:hover:bg-white dark:hover:text-ist-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? 'Redirecting...' : 'Continue to Schedule'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
