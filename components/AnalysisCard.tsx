import React from 'react';
interface AnalysisCardProps {
  analysis: {
    id: string;
    dimensionName: string;
    score: number;
    summary: string;
    tags: string[];
    // D1 fields
    supportingIndicators?: string[];
    // D2 fields
    userPersona?: {
      role: string;
      companyType: string;
      painPoints: string[];
      goals: string[];
    };
    // D3 fields
    revenue_band?: string;
    retention_signal?: string;
    conversion_rate_est?: number;
    // D4 fields
    moat_score?: number;
    scalability_score?: number;
    competitive_advantage?: string[];
  };
  onClick: () => void;
}
export function AnalysisCard({
  analysis,
  onClick
}: AnalysisCardProps) {
  const {
    dimensionName,
    score,
    summary,
    tags,
    id,
    supportingIndicators,
    userPersona,
    revenue_band,
    retention_signal,
    conversion_rate_est,
    moat_score,
    scalability_score,
    competitive_advantage
  } = analysis;
  const circumference = 2 * Math.PI * 32;
  const strokeDashoffset = circumference - score / 10 * circumference;
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return '#10B981';
    if (score >= 7.0) return '#10B981';
    return '#c57d56';
  };
  const getStrokeColor = (score: number) => {
    if (score >= 9.0) return '#10B981';
    if (score >= 8.5) return '#10B981';
    if (score >= 7.0) return '#10B981';
    return '#c57d56';
  };
  return <article onClick={onClick} onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }} tabIndex={0} role="button" aria-label={`${dimensionName}, score ${score} out of 10. Click for details.`} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      {/* Header: Dimension Name */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{dimensionName}</h2>
      </div>
      {/* Main Content: Split into left (score) and right (details) */}
      <div className="flex items-center gap-6 mb-4">
        {/* Left: Main Score Circle */}
        <div className="flex-shrink-0">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
              <circle cx="48" cy="48" r="42" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle cx="48" cy="48" r="42" stroke={getStrokeColor(score)} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{
              color: getScoreColor(score)
            }} aria-hidden="true">
                {score}
              </span>
            </div>
          </div>
        </div>
        {/* Right: Dimension-specific content */}
        <div className="flex-1 flex flex-col gap-3">
          {/* D1: Supporting Indicators */}
          {id === 'D1' && supportingIndicators && <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F6F8' }}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Key Indicators
              </h3>
              <div className="space-y-1">
                {supportingIndicators.map((indicator, index) => <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5 font-bold">✓</span>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {indicator}
                    </span>
                  </div>)}
              </div>
            </div>}
          {/* D2: User Persona */}
          {id === 'D2' && userPersona && <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F6F8' }}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Role
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    {userPersona.role}、{userPersona.companyType}
                  </p>
                </div>
                <div className="flex items-center gap-2"></div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Pain Points
                  </h3>
                  <div className="space-y-1">
                    {userPersona.painPoints.map((point, index) => <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-600 mt-0.5 font-bold">
                          ✓
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {point}
                        </span>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>}
          {/* D3: Conversion & Revenue Metrics */}
          {id === 'D3' && <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F6F8' }}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Revenue Band
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    {revenue_band}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Retention Signal
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    {retention_signal}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">
                    Conversion Rate
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    {conversion_rate_est && `${(conversion_rate_est * 100).toFixed(0)}%`}
                  </p>
                </div>
              </div>
            </div>}
          {/* D4: Competitive Advantages with Sub-scores */}
          {id === 'D4' && competitive_advantage && <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F6F8' }}>
              <div className="flex items-center gap-6 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Moat
                  </span>
                  <span className="text-lg font-bold" style={{
                color: getScoreColor(moat_score || 0)
              }}>
                    {moat_score}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Scalability
                  </span>
                  <span className="text-lg font-bold" style={{
                color: getScoreColor(scalability_score || 0)
              }}>
                    {scalability_score}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Competitive Advantages
              </h3>
              <div className="space-y-1">
                {competitive_advantage.map((advantage, index) => <div key={index} className="flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5 font-bold">✓</span>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      {advantage}
                    </span>
                  </div>)}
              </div>
            </div>}
        </div>
      </div>
      {/* Summary */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-gray-600 leading-relaxed text-sm">{summary}</p>
      </div>
    </article>;
}