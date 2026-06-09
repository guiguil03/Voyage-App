import { StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  return (
    <View style={styles.bg}>
      <View style={styles.topBorder} />
    </View>
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,8,0.95)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(245,237,214,0.15)',
  },
});
