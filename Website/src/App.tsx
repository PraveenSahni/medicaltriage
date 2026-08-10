/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BusinessProblem } from './components/BusinessProblem';
import { Impact } from './components/Impact';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Compliance } from './components/Compliance';
import { WhyUs } from './components/WhyUs';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

function Home() {
  return (
    <>
      <Hero />
      <BusinessProblem />
      <Impact />
      <CTA />
    </>
  );
}

function Platform() {
  return (
    <>
      <div className="pt-20">
        <HowItWorks />
        <Features />
        <CTA />
      </div>
    </>
  );
}

function CompliancePage() {
  return (
    <>
      <div className="pt-20">
        <Compliance />
        <CTA />
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <div className="pt-20">
        <WhyUs />
        <CTA />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
