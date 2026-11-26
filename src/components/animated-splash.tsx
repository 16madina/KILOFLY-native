// Animated logo shown once when the app starts, on top of the app, then fades away.
// The native splash (same background colour) stays until the video's first frame is ready,
// so there is no flash between the two.
import * as SplashScreen from 'expo-splash-screen';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

export const SPLASH_BG = '#1F242C';
const MAX_MS = 5000; // safety net: never block the app longer than this

export function AnimatedSplash({ ready }: { ready: boolean }) {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const finishing = useRef(false);

  const player = useVideoPlayer(require('@/assets/video/splash.mp4'), (p) => {
    p.muted = true;
    p.loop = false;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  const finish = () => {
    if (finishing.current) return;
    finishing.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => setDone(true));
  };

  // Start once the app (fonts) and the video are ready; hide the native splash at that moment.
  useEffect(() => {
    if (!ready) return;
    if (status === 'readyToPlay') {
      SplashScreen.hideAsync();
      player.play();
    } else if (status === 'error') {
      SplashScreen.hideAsync();
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', finish);
    const t = setTimeout(() => {
      SplashScreen.hideAsync();
      finish();
    }, MAX_MS);
    return () => {
      sub.remove();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  if (done) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: SPLASH_BG, opacity, zIndex: 1000 }]}>
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        contentFit="cover"
        nativeControls={false}
      />
    </Animated.View>
  );
}
