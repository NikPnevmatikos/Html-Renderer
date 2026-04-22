import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import type { RenderImage } from '../types';

export interface RenderedImageProps {
  node: RenderImage;
  contentWidth?: number;
}

export function RenderedImage({
  node,
  contentWidth,
}: RenderedImageProps): React.ReactElement {
  const hasExplicitSize = node.width !== undefined && node.height !== undefined;
  const [resolvedSize, setResolvedSize] = React.useState<
    { w: number; h: number } | null
  >(null);

  React.useEffect(() => {
    if (hasExplicitSize) return;
    let cancelled = false;
    Image.getSize(
      node.src,
      (w, h) => {
        if (!cancelled) setResolvedSize({ w, h });
      },
      () => {
        if (!cancelled) setResolvedSize({ w: 0, h: 0 });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [node.src, hasExplicitSize]);

  if (hasExplicitSize) {
    const fitted = fit(node.width!, node.height!, contentWidth);
    return (
      <Image
        source={{ uri: node.src }}
        style={{ width: fitted.w, height: fitted.h }}
        accessibilityLabel={node.alt}
      />
    );
  }

  if (!resolvedSize) {
    return <View style={styles.placeholder} />;
  }

  if (resolvedSize.w === 0 || resolvedSize.h === 0) {
    return (
      <View style={styles.broken}>
        <Text style={styles.brokenLabel}>{node.alt ?? '[broken image]'}</Text>
      </View>
    );
  }

  const fitted = fit(resolvedSize.w, resolvedSize.h, contentWidth);
  return (
    <Image
      source={{ uri: node.src }}
      style={{ width: fitted.w, height: fitted.h }}
      accessibilityLabel={node.alt}
    />
  );
}

function fit(w: number, h: number, maxWidth: number | undefined): { w: number; h: number } {
  if (maxWidth === undefined || w <= maxWidth) return { w, h };
  const scale = maxWidth / w;
  return { w: maxWidth, h: h * scale };
}

const styles = StyleSheet.create({
  placeholder: {
    height: 80,
    backgroundColor: '#eee',
  },
  broken: {
    padding: 8,
    backgroundColor: '#fee',
  },
  brokenLabel: {
    color: '#900',
    fontSize: 12,
  },
});
