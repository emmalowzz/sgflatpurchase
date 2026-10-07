import React from 'react';
import { TownProfile } from '../types/flat';
import { 
  Train, 
  MapPin, 
  Trees, 
  UtensilsCrossed, 
  GraduationCap, 
  Compass, 
  Clock, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';

interface TownFeaturesBackgroundProps {
  townProfile?: TownProfile;
  selectedTown: string;
  onSelectTown: (townId: string) => void;
  isDetailedView?: boolean;
}

export const TownFeaturesBackground: React.FC<TownFeaturesBackgroundProps> = ({
  townProfile,
  selectedTown,
  onSelectTown,
  isDetailedView = false,
}) => {
  // If no town profile is found or 'ALL' is selected, display Island-Wide Singapore Housing Context
  if (!townProfile) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-slate-950/80 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium mb-2">
              <Compass className="w-4 h-4" />
              <span>Singapore Island-Wide HDB Housing Landscape</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">26 Public Housing Towns</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Explore Resale Flat Prices Across Singapore
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
              From historic mature estates like Queenstown, Toa Payoh, and Bedok to modern eco-waterfront towns like Punggol and Sengkang. Select any town above to inspect localized resale price trends, connectivity, landmarks, and demographic features.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Total HDB Towns</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">26 Towns</div>
              <div className="text-[10px] text-slate-500">Island-wide</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Estate Types</div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">Mature & Non</div>
              <div className="text-[10px] text-slate-500">17 Mature / 9 Non</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Resident Share</div>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">~80%</div>
              <div className="text-[10px] text-slate-500">Live in HDB flats</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
              <div className="text-[11px] text-slate-400">Keyless Open API</div>
              <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">data.gov.sg</div>
              <div className="text-[10px] text-slate-500">Real-time sync</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-md shadow-xl transition-all duration-300">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

      {/* Header Town Meta */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-2.5">
            <span className="font-semibold text-rose-400 tracking-wide uppercase">
              {townProfile.region} Region
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
              townProfile.estateType === 'Mature'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {townProfile.estateType} Estate
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Est. {townProfile.developedYear}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {townProfile.estPopulation} Residents
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {townProfile.displayName}
          </h2>
          <p className="mt-1 text-sm sm:text-base font-medium text-slate-200">
            {townProfile.tagline}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
            {townProfile.overview}
          </p>
        </div>

        {/* Quick Character Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 lg:w-80 shrink-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Town Vibe & Character</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {townProfile.vibe}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Avg Lease Remaining:</span>
            <span className="font-mono font-semibold text-slate-200">
              ~{townProfile.averageLeaseLeftEstimateYears} yrs
            </span>
          </div>
        </div>
      </div>

      {/* Town Key Features Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Feature 1: Transit & MRT Connectivity */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Train className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                MRT & Rapid Transit
              </h3>
              <p className="text-[11px] text-slate-400">Direct Rail Lines & Stations</p>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {townProfile.mrtLines.map((line, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-medium bg-slate-900 border border-slate-800 rounded text-slate-300"
                >
                  {line}
                </span>
              ))}
            </div>
            <div className="text-xs text-slate-300">
              <span className="text-slate-400 text-[11px]">Stations: </span>
              {townProfile.mrtStations.join(', ')}
            </div>
          </div>
        </div>

        {/* Feature 2: Iconic Landmarks & Hubs */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Iconic Landmarks & Hubs
              </h3>
              <p className="text-[11px] text-slate-400">Malls & Integrated Centers</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 mt-2">
            {townProfile.iconicLandmarks.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-rose-500 text-xs mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature 3: Nature Parks & Green Corridors */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Nature & Green Spaces
              </h3>
              <p className="text-[11px] text-slate-400">Parks, Waterways & Trails</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 mt-2">
            {townProfile.natureParks.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 text-xs mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature 4: Famous Hawker Food & Eateries */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Food & Hawker Heritage
              </h3>
              <p className="text-[11px] text-slate-400">Famous Centres & Signature Bites</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 mt-2">
            {townProfile.famousEateries.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 text-xs mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature 5: Top Schools & Institutions */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Academic & School Belt
              </h3>
              <p className="text-[11px] text-slate-400">Primary, Secondary & Tertiary</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 mt-2">
            {townProfile.topSchools.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-indigo-400 text-xs mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature 6: Masterplan & Future Developments */}
        <div className="bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 transition-colors">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Future Masterplan
              </h3>
              <p className="text-[11px] text-slate-400">Upcoming Upgrades & Transit</p>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 mt-2">
            {townProfile.upcomingDevelopments.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-purple-400 text-xs mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
