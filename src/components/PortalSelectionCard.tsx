// SJCEM Student MIS — React / TypeScript PortalSelectionCard Component
// Institution: St. John College of Engineering and Management, Palghar

import React from 'react';
import type { PortalCardConfig } from '../types/index.ts';

export interface PortalSelectionCardProps {
  config: PortalCardConfig;
  index?: number;
  onNavigate?: (route: string) => void;
  onDirectLogin?: (role: string) => void;
}

export const PortalSelectionCard: React.FC<PortalSelectionCardProps> = ({
  config,
  index = 0,
  onNavigate,
  onDirectLogin,
}) => {
  const {
    role,
    title,
    statusLabel,
    icon,
    description,
    primaryButtonLabel,
    demoButtonLabel,
    helperText,
    targetRoute,
    theme,
  } = config;

  const tabletSpanClass =
    index === 2
      ? 'md:col-span-2 md:max-w-md md:w-full md:mx-auto lg:col-span-1 lg:max-w-none lg:mx-0'
      : '';

  const handlePrimaryClick = () => {
    if (onNavigate) {
      onNavigate(targetRoute);
    } else if (typeof window !== 'undefined' && (window as unknown as { appNavigate?: (r: string) => void }).appNavigate) {
      (window as unknown as { appNavigate: (r: string) => void }).appNavigate(targetRoute);
    }
  };

  const handleDemoClick = () => {
    if (onDirectLogin) {
      onDirectLogin(role);
    } else if (typeof window !== 'undefined' && (window as unknown as { appDirectLogin?: (r: string) => void }).appDirectLogin) {
      (window as unknown as { appDirectLogin: (r: string) => void }).appDirectLogin(role);
    }
  };

  return (
    <div
      id={`portal-card-${role}`}
      data-testid={`portal-card-${role}`}
      className={`portal-selection-card group ${tabletSpanClass} ${theme.hoverBorderClass || ''}`}
    >
      {/* Top Role Accent Strip */}
      <div className={`portal-card-accent-bar ${theme.accentBarClass || 'bg-[#073B70]'}`} />

      {/* Icon Container */}
      <div
        className={`portal-card-icon-wrapper ${theme.iconBgClass || 'bg-slate-100'} ${theme.iconTextClass || 'text-slate-800'} ${theme.iconBorderClass || 'border-slate-200'} ${theme.iconHoverClass || ''}`}
      >
        <i data-lucide={icon} className="w-6 h-6" />
      </div>

      {/* Header: Title and Status Badge */}
      <div className="portal-card-header">
        <h3 className="portal-card-title">{title}</h3>
        <span className={`portal-card-badge ${theme.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {statusLabel}
        </span>
      </div>

      {/* Description Area */}
      <p className="portal-card-desc">{description}</p>

      {/* Actions */}
      <div className="portal-card-actions">
        <button
          id={`btn-portal-login-${role}`}
          type="button"
          onClick={handlePrimaryClick}
          className={`portal-card-primary-btn ${theme.primaryBtnClass || 'bg-[#073B70] text-white'} ${theme.focusRingClass || ''}`}
          aria-label={primaryButtonLabel}
        >
          <span>{primaryButtonLabel}</span>
          <i data-lucide="arrow-right" className="w-4 h-4" />
        </button>

        <button
          id={`btn-portal-demo-${role}`}
          type="button"
          onClick={handleDemoClick}
          className="portal-card-demo-btn"
          title={`Direct Demo Access for ${title}`}
          aria-label={demoButtonLabel}
        >
          <i data-lucide="zap" className="w-3.5 h-3.5 text-amber-500" />
          <span>{demoButtonLabel}</span>
        </button>

        <div className="portal-card-helper">
          <span>{helperText}</span>
        </div>
      </div>
    </div>
  );
};

export default PortalSelectionCard;
