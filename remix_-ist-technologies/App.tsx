import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Impact } from './components/Impact';
import { CTA } from './components/CTA';
import { ScrollToTop } from './components/ScrollToTop';
import { BookingProvider } from './context/BookingContext';
import { BookingModal } from './components/BookingModal';

// Lazy load detail components
const InnovationDetails = lazy(() => import('./components/InnovationDetails').then(module => ({ default: module.InnovationDetails })));
const SourcingDetails = lazy(() => import('./components/SourcingDetails').then(module => ({ default: module.SourcingDetails })));
const TrainingDetails = lazy(() => import('./components/TrainingDetails').then(module => ({ default: module.TrainingDetails })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const SkillsConsole = lazy(() => import('./pages/SkillsConsole').then(module => ({ default: module.SkillsConsole })));

const Home = () => (
  <>
    <Hero />
    <Impact />
    <CTA />
  </>
);

function App() {
  return (
    <BookingProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-ist-blue border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/innovation" element={<InnovationDetails />} />
              <Route path="/sourcing" element={<SourcingDetails />} />
              <Route path="/training" element={<TrainingDetails />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/console" element={<SkillsConsole />} />
            </Routes>
          </Suspense>
        </Layout>
        <BookingModal />
      </Router>
    </BookingProvider>
  );
}

export default App;
