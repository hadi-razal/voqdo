import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function Explore() {
  return (
    <View style={styles.container}>
      <View style={styles.search_bar_container}>
        <Text style={styles.heading}>Your Works</Text>
        <TextInput placeholder="Enter your name" style={styles.input} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heading: {
    color: 'blue',
    fontSize: 24,
    fontWeight: 'bold',
  },
  search_bar_container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    width: '100%',
    height: 40,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: 'gray/10',
  },
});
