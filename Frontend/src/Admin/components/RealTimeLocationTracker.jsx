import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  History, 
  X,
  Eye,
  Clock,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCurrentPosition,
  getAddressFromCoords,
  updateAttendanceLocation,
  watchLocation,
  getLocationHistory
} from '../../service/locationService.js';

export default function RealTimeLocationTracker({ 
  attendanceId, 
  onLocationUpdate,
  autoUpdate = false,
  updateInterval = 30000,
  showHistory = true,
  compact = false,
  className = ''
}) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  // Get current location
  const getLocation = async () => {
    setLoading(true);
    setError(null);
    setConnectionStatus('fetching');
    
    try {
      const position = await getCurrentPosition();
      const addressData = await getAddressFromCoords(position.latitude, position.longitude, true);
      
      const locationData = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp
      };
      
      setLocation(locationData);
      setAddress(addressData.locationName || `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`);
      setConnectionStatus('connected');
      
      toast.success('Location captured successfully!');
      return locationData;
    } catch (err) {
      setError(err.message);
      setConnectionStatus('error');
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update location in database
  const updateLocation = async () => {
    if (!attendanceId) {
      toast.error('No attendance record found');
      return;
    }

    if (!location) {
      toast.error('Please get location first');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const result = await updateAttendanceLocation(
        attendanceId,
        location.latitude,
        location.longitude,
        {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          browser: navigator.userAgent,
          connection: navigator.connection ? {
            type: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink
          } : null
        }
      );

      setLastUpdated(new Date());
      setAddress(result.data?.locationAddress || location.address);
      
      toast.success('Location updated successfully!');
      
      if (onLocationUpdate) {
        onLocationUpdate(result.data);
      }
      
      // Refresh history if loaded
      if (historyLoaded) {
        await loadHistory();
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Load location history
  const loadHistory = async () => {
    if (!attendanceId) return;
    
    try {
      const result = await getLocationHistory(attendanceId, 50);
      if (result.success) {
        setHistory(result.data.history || []);
        setHistoryLoaded(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Start real-time tracking
  const startTracking = () => {
    if (tracking) return;
    
    setTracking(true);
    setError(null);
    setConnectionStatus('tracking');
    
    watchIdRef.current = watchLocation(
      async (newLocation) => {
        setLocation({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          accuracy: newLocation.accuracy,
          timestamp: newLocation.timestamp
        });
        setAddress(newLocation.address);
        setConnectionStatus('tracking');
        
        // Auto-update if enabled
        if (autoUpdate) {
          try {
            await updateAttendanceLocation(
              attendanceId,
              newLocation.latitude,
              newLocation.longitude,
              {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                autoUpdate: true
              }
            );
            setLastUpdated(new Date());
          } catch (err) {
            console.error('Auto-update error:', err);
          }
        }
      },
      (err) => {
        setError(err.message);
        setConnectionStatus('error');
        toast.error(err.message);
        setTracking(false);
      }
    );

    toast.success('Real-time tracking started');
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTracking(false);
    setConnectionStatus('idle');
    toast.info('Tracking stopped');
  };

  // Auto-update interval
  useEffect(() => {
    if (autoUpdate && tracking) {
      intervalRef.current = setInterval(() => {
        updateLocation();
      }, updateInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoUpdate, tracking, updateInterval]);

  // Load history on mount
  useEffect(() => {
    if (attendanceId && showHistory) {
      loadHistory();
    }
  }, [attendanceId, showHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get connection status icon
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'tracking':
      case 'connected':
        return <Wifi className="w-3 h-3 text-emerald-500" />;
      case 'fetching':
        return <Loader2 className="w-3 h-3 animate-spin text-amber-500" />;
      case 'error':
        return <WifiOff className="w-3 h-3 text-red-500" />;
      default:
        return <Wifi className="w-3 h-3 text-[var(--text-muted)]" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'tracking':
      case 'connected':
        return 'text-emerald-600';
      case 'fetching':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-[var(--text-muted)]';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'tracking':
        return 'Live Tracking';
      case 'connected':
        return 'Connected';
      case 'fetching':
        return 'Fetching...';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg ${compact ? 'p-3' : 'p-4 sm:p-5'} ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Real-Time Location
              </h4>
              {!compact && (
                <p className="text-xs text-[var(--text-muted)]">
                  Track and update your current location
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()} ${
              connectionStatus === 'tracking' || connectionStatus === 'connected' 
                ? 'bg-emerald-50 border-emerald-200' 
                : connectionStatus === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
            }`}>
              {getConnectionIcon()}
              <span className="hidden xs:inline">{getStatusText()}</span>
              {connectionStatus === 'tracking' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </div>

            {/* Toggle Expand Button (mobile) */}
            {!compact && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition lg:hidden"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            {/* History Button */}
            {showHistory && history.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
                title="View History"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {(expanded || !compact) && (
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {/* Location Display */}
            <div className="bg-[var(--bg-primary)] rounded-lg p-3 sm:p-4 space-y-2 border border-[var(--border-color)]">
              {loading ? (
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <div>
                    <p className="text-sm font-medium">Getting location...</p>
                    <p className="text-xs text-[var(--text-muted)]">Please wait</p>
                  </div>
                </div>
              ) : location ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-[var(--text-primary)] break-words leading-relaxed">
                        {address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                        <span>
                          📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                        {location.accuracy && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-hover)]">
                            ±{Math.round(location.accuracy)}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {lastUpdated && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-muted)] border-t border-[var(--border-color)]/50">
                      <Clock className="w-3 h-3" />
                      <span>Last updated: {formatTime(lastUpdated)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div>
                    <p className="text-sm font-medium">No location captured</p>
                    <p className="text-xs">Click "Get Location" to start</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600">Error</p>
                  <p className="text-sm text-red-600 break-words">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-1 text-red-400 hover:text-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {!tracking ? (
                <>
                  <button
                    onClick={getLocation}
                    disabled={loading}
                    className="ui-btn flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm px-3 py-2 sm:px-4 sm:py-2.5"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span className="hidden xs:inline">Get</span> Location
                  </button>
                  <button
                    onClick={startTracking}
                    className="ui-btn ui-btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm px-3 py-2 sm:px-4 sm:py-2.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden xs:inline">Start</span> Tracking
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={updateLocation}
                    disabled={updating || !location}
                    className="ui-btn flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm px-3 py-2 sm:px-4 sm:py-2.5"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Update Now
                  </button>
                  <button
                    onClick={stopTracking}
                    className="ui-btn bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger)]/20 flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm px-3 py-2 sm:px-4 sm:py-2.5"
                  >
                    Stop Tracking
                  </button>
                </>
              )}
            </div>

            {/* Status Info */}
            {autoUpdate && tracking && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-emerald-700 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Auto-updating every {updateInterval / 1000} seconds
                </p>
              </div>
            )}

            {tracking && !autoUpdate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-amber-700 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Tracking active - click "Update Now" to save location
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowHistoryModal(false)} 
          />
          
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-primary)] rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                    Location History
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {history.length} location records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MapPin className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[var(--text-muted)]">No location history available</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Location updates will appear here</p>
                </div>
              ) : (
                history.map((entry, index) => (
                  <div 
                    key={index} 
                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 sm:p-4 hover:border-[var(--border-hover)] transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] break-words">
                              {entry.locationAddress || `${entry.latitude.toFixed(6)}, ${entry.longitude.toFixed(6)}`}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-1 break-all">
                              📍 {entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(entry.timestamp)}</span>
                        </div>
                        <div className="hidden sm:block text-[var(--text-muted)]/50">|</div>
                        <div className="hidden sm:block">
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    {entry.deviceInfo && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)]/50 flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-muted)]">
                        {entry.deviceInfo.platform && (
                          <span className="flex items-center gap-1">
                            {entry.deviceInfo.platform.includes('Win') ? (
                              <Monitor className="w-3 h-3" />
                            ) : entry.deviceInfo.platform.includes('iPhone') || entry.deviceInfo.platform.includes('Android') ? (
                              <Smartphone className="w-3 h-3" />
                            ) : (
                              <Monitor className="w-3 h-3" />
                            )}
                            {entry.deviceInfo.platform}
                          </span>
                        )}
                        {entry.deviceInfo.browser && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {entry.deviceInfo.browser.split('/')[0]}
                          </span>
                        )}
                        {entry.deviceInfo.ip && (
                          <span className="flex items-center gap-1">
                            IP: {entry.deviceInfo.ip}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[var(--border-color)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--bg-primary)] rounded-b-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Showing {history.length} location records
                </p>
                <button
                  onClick={() => {
                    loadHistory();
                    toast.success('History refreshed');
                  }}
                  className="ui-btn text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
        
        @media (max-width: 400px) {
          .xs\\:inline {
            display: inline;
          }
          .xs\\:hidden {
            display: none;
          }
        }
      `}</style>
    </>
  );
}