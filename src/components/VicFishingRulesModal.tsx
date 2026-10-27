/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VICTORIAN_SPECIES_RULES } from '../data/victorianMarineData';
import { ShieldCheck, X, Search, AlertCircle, Info, Fish } from 'lucide-react';

interface VicFishingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VicFishingRulesModal: React.FC<VicFishingRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredRules = VICTORIAN_SPECIES_RULES.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.commonName.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-sky-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-800/80 bg-slate-950 p-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-sky-600/30 p-2 text-sky-400 border border-sky-500/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Victorian Recreational Fishing Rules
              </h3>
              <p className="text-xs text-sky-300">
                Official Victorian Fisheries Authority (VFA) Legal Sizes & Bag Limits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-sky-900/60 bg-slate-950/60">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fish (e.g. Snapper, Whiting, Calamari, Shark)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Rules Table / Cards */}
        <div className="overflow-y-auto p-4 space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.commonName}
              className="rounded-xl border border-sky-800/60 bg-slate-950/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-white">{rule.commonName}</h4>
                  <span className="text-[11px] font-mono italic text-slate-400">
                    {rule.scientificName}
                  </span>
                </div>
                <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-800">
                  {rule.category}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Legal Minimum Length:
                  </span>
                  <span className="text-sm font-black text-cyan-300">
                    {rule.minSizeCm ? `${rule.minSizeCm} cm` : 'No Minimum Size'}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Daily Bag Limit:
                  </span>
                  <span className="text-sm font-black text-emerald-300">
                    {rule.bagLimit}
                  </span>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <Info className="inline h-3.5 w-3.5 text-sky-400 mr-1" />
                {rule.notes}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-sky-900/60 bg-slate-950 p-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
