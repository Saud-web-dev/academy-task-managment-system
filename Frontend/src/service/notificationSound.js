// ============================================
// NOTIFICATION SOUND & VIBRATION SERVICE
// ============================================

// Sound presets
const SOUND_PRESETS = {
  notification: {
    url: '/sounds/notification.mp3',
    duration: 800,
  },
  taskAssigned: {
    url: '/sounds/task-assigned.mp3',
    duration: 1000,
  },
  marksDeducted: {
    url: '/sounds/marks-deducted.mp3',
    duration: 800,
  },
  urgent: {
    url: '/sounds/urgent.mp3',
    duration: 1200,
  },
};

// Vibration patterns
const VIBRATION_PATTERNS = {
  light: [100],
  medium: [200, 100, 200],
  heavy: [300, 150, 300, 150, 300],
  urgent: [200, 100, 200, 100, 200, 100, 400],
  alert: [100, 50, 100, 50, 100, 50, 200, 100, 200],
};

// ============================================
// PLAY NOTIFICATION SOUND
// ============================================
export const playNotificationSound = async (soundType = 'notification', enabled = true) => {
  if (!enabled) return;

  try {
    const soundConfig = SOUND_PRESETS[soundType] || SOUND_PRESETS.notification;
    
    // ✅ Try using Web Audio API for better control
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await fetch(soundConfig.url)
      .then(res => res.arrayBuffer())
      .then(buffer => audioContext.decodeAudioData(buffer));

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

    console.log(`✅ Sound played: ${soundType}`);
  } catch (audioError) {
    console.warn('⚠️ Web Audio API failed, trying HTML5 Audio:', audioError);
    
    // ✅ Fallback to HTML5 Audio element
    try {
      const soundConfig = SOUND_PRESETS[soundType] || SOUND_PRESETS.notification;
      const audio = new Audio(soundConfig.url);
      audio.volume = 0.7; // ✅ 70% volume
      await audio.play();
      console.log(`✅ Sound played (HTML5): ${soundType}`);
    } catch (error) {
      console.warn('❌ Could not play notification sound:', error);
    }
  }
};

// ============================================
// TRIGGER VIBRATION
// ============================================
export const triggerVibration = (pattern = 'medium', enabled = true) => {
  if (!enabled || !navigator.vibrate) {
    console.warn('⚠️ Vibration not supported on this device');
    return;
  }

  try {
    const vibrationPattern = VIBRATION_PATTERNS[pattern] || VIBRATION_PATTERNS.medium;
    navigator.vibrate(vibrationPattern);
    console.log(`✅ Vibration triggered: ${pattern}`);
  } catch (error) {
    console.warn('❌ Vibration error:', error);
  }
};

// ============================================
// PLAY NOTIFICATION WITH EFFECTS
// ============================================
export const playNotificationWithEffects = async (options = {}) => {
  const {
    soundType = 'notification',
    vibrationPattern = 'medium',
    soundEnabled = true,
    vibrationEnabled = true,
    priority = 'normal',
  } = options;

  // ✅ Adjust effects based on priority
  let sound = soundType;
  let vibration = vibrationPattern;

  if (priority === 'urgent') {
    sound = 'urgent';
    vibration = 'urgent';
  } else if (priority === 'high') {
    vibration = 'heavy';
  }

  // ✅ Play sound
  if (soundEnabled) {
    await playNotificationSound(sound, true);
  }

  // ✅ Trigger vibration (with slight delay for better UX)
  if (vibrationEnabled) {
    setTimeout(() => {
      triggerVibration(vibration, true);
    }, 100);
  }
};

// ============================================
// STORE NOTIFICATION PREFERENCES
// ============================================
export const setNotificationPreferences = (preferences) => {
  localStorage.setItem(
    'notificationPreferences',
    JSON.stringify({
      soundEnabled: preferences.soundEnabled !== false,
      vibrationEnabled: preferences.vibrationEnabled !== false,
      volume: Math.max(0, Math.min(100, preferences.volume || 70)),
      ...preferences,
    })
  );
};

// ============================================
// GET NOTIFICATION PREFERENCES
// ============================================
export const getNotificationPreferences = () => {
  const stored = localStorage.getItem('notificationPreferences');
  const defaults = {
    soundEnabled: true,
    vibrationEnabled: true,
    volume: 70,
  };

  if (!stored) return defaults;

  try {
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
};

// ============================================
// CHECK DEVICE CAPABILITIES
// ============================================
export const checkDeviceCapabilities = () => {
  return {
    hasVibration: !!navigator.vibrate,
    hasAudio: !!window.AudioContext || !!window.webkitAudioContext,
    isDesktop: /win|mac|linux/i.test(navigator.platform),
    isMobile: /android|iphone|ipad|ipod/i.test(navigator.platform.toLowerCase()),
  };
};

// ============================================
// TEST NOTIFICATION SOUND & VIBRATION
// ============================================
export const testNotificationEffects = async (options = {}) => {
  const {
    soundEnabled = true,
    vibrationEnabled = true,
  } = options;

  console.log('🧪 Testing notification effects...');

  // ✅ Play test sound
  if (soundEnabled) {
    console.log('🔊 Playing test sound...');
    await playNotificationSound('notification', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ✅ Trigger test vibration
  if (vibrationEnabled) {
    console.log('📳 Triggering test vibration...');
    triggerVibration('medium', true);
  }

  console.log('✅ Test complete');
};

// ============================================
// EXPORT DEFAULTS
// ============================================
export default {
  playNotificationSound,
  triggerVibration,
  playNotificationWithEffects,
  setNotificationPreferences,
  getNotificationPreferences,
  checkDeviceCapabilities,
  testNotificationEffects,
  SOUND_PRESETS,
  VIBRATION_PATTERNS,
};
