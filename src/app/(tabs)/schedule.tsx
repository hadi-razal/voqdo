import { StyleSheet, Text, View } from 'react-native';

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hello, World!</Text>
      <Text style={styles.body}>This is the explore page.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: 'blue',
    fontSize: 24,
    fontWeight: 'bold',
  },
  body: {
    color: 'black',
    marginTop: 8,
  },
});
