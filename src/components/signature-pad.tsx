// Finger signature, stored as a small SVG (no native screenshot module needed).
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { T } from '@/components/ui';
import { colors } from '@/theme';

const INK = '#14110B';

export function SignaturePad({ onChange, height = 180 }: { onChange: (svg: string | null) => void; height?: number }) {
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef('');
  const [live, setLive] = useState('');
  const size = useRef({ w: 300, h: height });

  const emit = (all: string[]) => {
    if (all.length === 0) return onChange(null);
    const { w, h } = size.current;
    onChange(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w)} ${Math.round(h)}">` +
        all.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('') +
        '</svg>',
    );
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderRelease: () => {
        const d = current.current;
        current.current = '';
        setLive('');
        if (!d.includes('L')) return;
        setPaths((prev) => {
          const next = [...prev, d];
          emit(next);
          return next;
        });
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.pad, { height }]} onLayout={onLayout} {...responder.panHandlers}>
        <Svg width="100%" height="100%">
          {paths.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {!!live && <Path d={live} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />}
        </Svg>
        {paths.length === 0 && !live && (
          <View style={styles.hint} pointerEvents="none">
            <T v="small" color="rgba(20,17,11,0.45)">
              Signature du destinataire
            </T>
          </View>
        )}
      </View>
      <Pressable
        onPress={() => {
          setPaths([]);
          onChange(null);
        }}
        style={{ alignSelf: 'flex-end' }}>
        <T v="caption" color={colors.gold}>
          Effacer
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { borderRadius: 14, backgroundColor: '#F7F3EA', overflow: 'hidden', borderWidth: 1, borderColor: colors.borderGold },
  hint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 },
});
