# Notification Sounds

This directory contains notification sound files for the Task Management System.

## Required Sound Files

Place the following MP3 files in this directory:

### 1. notification.mp3
- **Purpose:** Default notification sound
- **Duration:** ~800ms
- **Frequency:** Recommended: 1-2 beeps
- **Volume:** Should be moderate

### 2. task-assigned.mp3
- **Purpose:** When a task is assigned to user
- **Duration:** ~1000ms
- **Frequency:** Recommended: 2-3 ascending beeps
- **Volume:** Slightly higher than default

### 3. marks-deducted.mp3
- **Purpose:** When marks are deducted
- **Duration:** ~800ms
- **Frequency:** Recommended: 2 descending beeps
- **Volume:** Moderate

### 4. urgent.mp3
- **Purpose:** Urgent alerts and priority notifications
- **Duration:** ~1200ms
- **Frequency:** Recommended: 3-4 rapid beeps or alarm sound
- **Volume:** Loud

## How to Create Sound Files

### Option 1: Use Tone.js (Programmatically)
```javascript
// Example: Create notification sound using Tone.js
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease("C4", "0.5");
```

### Option 2: Use Web Audio API
```javascript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);
oscillator.start();
oscillator.stop(audioContext.currentTime + 0.2);
```

### Option 3: Download from free resources
- Zapsplat.com - Free sound effects
- Freesound.org - Community sounds
- Pixabay.com - Free sound effects
- Mixkit.co - Royalty-free sounds

### Option 4: Use system sounds
- Windows: C:\Windows\Media\
- Mac: /System/Library/Sounds/
- Linux: /usr/share/sounds/

## Audio Format Requirements

- **Format:** MP3 (for browser compatibility)
- **Codec:** MPEG-1 Layer III
- **Sample Rate:** 44.1kHz or 48kHz
- **Channels:** Mono or Stereo
- **Bitrate:** 128kbps - 320kbps (higher = better quality)

## Testing Audio Files

```javascript
// Test if audio files load correctly
import { testNotificationEffects } from '../src/service/notificationSound';

// Test all notification sounds and vibrations
await testNotificationEffects({
  soundEnabled: true,
  vibrationEnabled: true,
});
```

## Browser Compatibility

✅ Chrome/Chromium - Full support
✅ Firefox - Full support  
✅ Safari - Support (may require user gesture first)
✅ Edge - Full support
⚠️ Mobile browsers - Varies by device

## Autoplay Policy

Modern browsers require user interaction before playing audio:
- ✅ Allowed: After user clicks a button
- ✅ Allowed: In response to user action
- ❌ Not allowed: Auto-play on page load

The notification system respects this policy - sounds only play in response to actual notifications.

## Licensing

Ensure all sound files you use are:
- ✅ Royalty-free or properly licensed
- ✅ Free for commercial use
- ✅ Properly attributed if required

Recommended free license: CC0 (Public Domain)

## Troubleshooting

### Sounds not playing
1. Check browser console for errors
2. Verify audio files exist in `/public/sounds/`
3. Check browser autoplay policy
4. Test with DevTools → Device Emulation

### Sounds too loud/quiet
1. Adjust volume in `notificationSound.js` (line: `audio.volume = 0.7`)
2. Edit audio file with Audacity to normalize levels
3. Use browser DevTools to check volume settings

### Sounds not working on mobile
1. Ensure audio files are in correct format (MP3)
2. Check device sound settings
3. Test with user gesture (notification click)
4. Check if browser has autoplay restrictions

## Converting Audio Files

### Using FFmpeg
```bash
# Convert WAV to MP3
ffmpeg -i sound.wav -q:a 5 sound.mp3

# Compress existing MP3
ffmpeg -i sound.mp3 -q:a 5 sound-compressed.mp3

# Adjust volume
ffmpeg -i sound.mp3 -af 'volume=0.7' sound-quieter.mp3
```

### Using Audacity (GUI)
1. Open audio file
2. Select all (Ctrl+A)
3. Effect → Normalize (set to 0dB)
4. Effect → Amplify if needed
5. File → Export → MP3

## Quick Start

1. Download one of the recommended sound sets
2. Place MP3 files in this directory
3. Test in application via notification settings
4. Adjust volume/preferences as needed

---

**Note:** The application will work without these sound files (will show warning in console), but notification sounds won't play.
