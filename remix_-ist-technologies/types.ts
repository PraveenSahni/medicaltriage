import React from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  bullets?: string[];
}

export interface StatProps {
  value: string;
  label: string;
}

export enum SectionId {
  Home = 'home',
  Services = 'services',
  About = 'about',
  Impact = 'impact',
  Contact = 'contact'
}