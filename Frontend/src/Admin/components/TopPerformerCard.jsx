import React from 'react';
import { Star, Award, Medal, Loader2, Crown, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopPerformerCard = ({ performers, loading = false, compact = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  if (!performers || performers.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">No performer data available</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Tasks need to be completed with marks</p>
      </div>
    );
  }

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return <Star className="w-4 h-4 text-[var(--text-muted)]" />;
  };

  const getRankColor = (index) => {
    if (index === 0) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    if (index === 1) return 'bg-gray-400/20 text-gray-500 border-gray-400/30';
    if (index === 2) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    return 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-color)]';
  };

  const getMarksColor = (marks) => {
    if (marks >= 80) return 'text-emerald-600';
    if (marks >= 60) return 'text-blue-600';
    if (marks >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {performers.map((performer, index) => {
        const rank = index + 1;
        const avgMarks = performer.avgMarks || 0;
        const taskCount = performer.taskCount || 0;

        return (
          <div 
            key={performer.userId || index} 
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[var(--border-hover)] bg-[var(--bg-card)] ${getRankColor(index)}`}
          >
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(index)} border-2`}>
                {rank}
              </div>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--text-primary)] font-semibold text-sm flex-shrink-0 border border-[var(--accent-primary)]/20">
              {performer.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {performer.name || 'Unknown'}
                </p>
                {rank <= 3 && getRankIcon(index)}
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>{taskCount} tasks</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                <span className={getMarksColor(avgMarks)}>
                  {avgMarks}% avg
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <p className={`text-lg font-bold ${getMarksColor(avgMarks)}`}>
                {avgMarks}%
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">score</p>
            </div>
          </div>
        );
      })}

      {/* View All Button */}
      <button 
        onClick={() => navigate('/admin/ranking')}
        className="w-full mt-2 text-center text-xs text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition font-medium py-2 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-hover)]"
      >
        View All Performers
      </button>
    </div>
  );
};

export default TopPerformerCard;