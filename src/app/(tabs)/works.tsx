import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import WorkItemCard from '../../../components/workItemCard';

export default function Explore() {

  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.search_bar_container}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search for a work" style={styles.input} />
        <Pressable style={styles.search_button} onPress={() => { setSearch('') }}>
          <Text style={styles.search_button_text}>Search</Text>
        </Pressable>

        <ScrollView style={styles.works_list_container}>
          <WorkItemCard />
          <WorkItemCard />
          <WorkItemCard />
          <WorkItemCard />
          <WorkItemCard />
          <WorkItemCard />
          <WorkItemCard />
        </ScrollView>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  search_bar_container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search_button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search_button_text: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
    fontFamily: 'Arial',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    width: '100%',
    height: 40,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: 'gray/20',
  },
  works_list_container: {
    width: '100%',
  }
});
