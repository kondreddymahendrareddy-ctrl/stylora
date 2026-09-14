import React from 'react';
import { Occasion, WeatherCondition, BodyFitPreference, GenerateOutfitRequest } from '../types/fashion';
import { Sparkles, Sun, CloudRain, Wind, Thermometer, SlidersHorizontal, Loader2 } from 'lucide-react';

interface OutfitGeneratorProps {
  onGenerate: (req: GenerateOutfitRequest) => void;
  isGenerating: boolean;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [occasion, setOccasion] = React.useState<Occasion>('smart_casual');
  const [tempC, setTempC] = React.useState<number>(20);
  const [weatherCondition, setWeatherCondition] = React.useState<WeatherCondition['condition']>('sunny');
  const [fitPreference, setFitPreference] = React.useState<BodyFitPreference>('balanced');

  const occasions: { id: Occasion; label: string; desc: string }[] = [
    { id: 'casual', label: 'Casual', desc: 'Weekend errands, coffee runs' },
    { id: 'smart_casual', label: 'Smart Casual', desc: 'Work, dinner with friends' },
    { id: 'date_night', label: 'Date Night', desc: 'Dinner date, evening out' },
    { id: 'business_formal', label: 'Business Formal', desc: 'Office, client meetings' },
    { id: 'evening_cocktail', label: 'Party / Evening', desc: 'Celebrations, dressy nights' },
    { id: 'vacation_resort', label: 'Vacation & Resort', desc: 'Sunny weather, beach, holiday' },
    { id: 'athleisure', label: 'Sporty & Comfy', desc: 'Travel, relaxed lounging' }
  ];

  const fitOptions: { id: BodyFitPreference; label: string }[] = [
    { id: 'balanced', label: 'Regular Fit (Balanced)' },
    { id: 'oversized_top_slim_bottom', label: 'Baggy Top + Slim Bottom' },
    { id: 'fitted_top_relaxed_bottom', label: 'Fitted Top + Loose Bottom' },
    { id: 'tailored_all', label: 'Fitted & Sharp All Around' }
  ];

  const handleGenerateClick = () => {
    onGenerate({
      occasion,
      weather: {
        temperatureC: tempC,
        condition: weatherCondition
      },
      fitPreference
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-[#ECE5DB] p-6 sm:p-8 shadow-sm space-y-8">
      {/* Occasion Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            1. Where are you going?
          </label>
          <span className="text-[11px] font-medium text-neutral-500">
            Picks clothes that fit your day
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {occasions.map(occ => (
            <button
              key={occ.id}
              onClick={() => setOccasion(occ.id)}
              className={`text-left p-3 rounded-2xl border transition-all ${
                occasion === occ.id
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                  : 'border-[#ECE5DB] bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <div className="font-serif text-sm font-medium">{occ.label}</div>
              <div className={`text-[10px] mt-0.5 line-clamp-1 ${occasion === occ.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {occ.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weather & Fit Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weather Controls */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center space-x-1.5">
              <Thermometer className="w-3.5 h-3.5 text-neutral-700" />
              <span>2. What's the weather like?</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sunny' as const, label: 'Sunny / Warm', temp: 24, icon: Sun },
              { id: 'rainy' as const, label: 'Rainy', temp: 18, icon: CloudRain },
              { id: 'breezy' as const, label: 'Cold & Windy', temp: 12, icon: Wind }
            ].map(w => {
              const Icon = w.icon;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWeatherCondition(w.id);
                    setTempC(w.temp);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-3 px-2 rounded-xl text-xs font-medium border transition-all ${
                    weatherCondition === w.id
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-center">{w.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fit / Silhouette Preference */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-700" />
              <span>3. How should your clothes fit?</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {fitOptions.map(fit => (
              <button
                key={fit.id}
                onClick={() => setFitPreference(fit.id)}
                className={`text-center py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                  fitPreference === fit.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {fit.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full sm:w-auto px-10 py-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white rounded-full font-semibold text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2.5 active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Finding your best outfits...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Create Outfits For Me</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
