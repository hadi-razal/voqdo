import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import WorkItemCard from '../../../components/workItemCard';

export default function Explore() {

  const [search, setSearch] = useState('');

  const works = [
    {
      id: 1,
      title: 'Check office emails',
      description: 'Review important emails and reply to pending messages.',
      date: '2026-09-04',
      time: '09:00 AM',
    },
    {
      id: 2,
      title: 'Daily team meeting',
      description: 'Discuss today’s priorities and pending work with the team.',
      date: '2026-09-04',
      time: '09:30 AM',
    },
    {
      id: 3,
      title: 'Update Zoho CRM',
      description: 'Review customer records and update missing information.',
      date: '2026-09-04',
      time: '10:00 AM',
    },
    {
      id: 4,
      title: 'Fix website issue',
      description: 'Investigate and fix the reported website loading issue.',
      date: '2026-09-04',
      time: '10:45 AM',
    },
    {
      id: 5,
      title: 'Review project requirements',
      description: 'Go through the requirements for the upcoming development task.',
      date: '2026-09-04',
      time: '11:30 AM',
    },
    {
      id: 6,
      title: 'Lunch break',
      description: 'Take a break and have lunch.',
      date: '2026-09-04',
      time: '01:00 PM',
    },
    {
      id: 7,
      title: 'Work on mobile app',
      description: 'Continue development of the current mobile application.',
      date: '2026-09-04',
      time: '02:00 PM',
    },
    {
      id: 8,
      title: 'Test API integration',
      description: 'Test API requests and verify returned data.',
      date: '2026-09-04',
      time: '03:00 PM',
    },
    {
      id: 9,
      title: 'Client follow-up',
      description: 'Follow up with the client regarding the pending approval.',
      date: '2026-09-04',
      time: '04:00 PM',
    },
    {
      id: 10,
      title: 'Backup project files',
      description: 'Create a backup of important project files and documents.',
      date: '2026-09-04',
      time: '05:00 PM',
    },
    {
      id: 11,
      title: 'Practice DSA',
      description: 'Solve two DSA problems and review the solutions.',
      date: '2026-09-04',
      time: '06:30 PM',
    },
    {
      id: 12,
      title: 'Study machine learning',
      description: 'Continue the current machine learning topic and take notes.',
      date: '2026-09-04',
      time: '07:30 PM',
    },
    {
      id: 13,
      title: 'Football',
      description: 'Play football and complete the evening workout.',
      date: '2026-09-04',
      time: '09:00 PM',
    },
    {
      id: 14,
      title: 'Review GitHub commits',
      description: 'Check today’s code changes and push pending updates.',
      date: '2026-09-04',
      time: '10:30 PM',
    },
    {
      id: 15,
      title: 'Plan tomorrow',
      description: 'Prepare the priority task list for tomorrow.',
      date: '2026-09-04',
      time: '11:00 PM',
    },
    {
      id: 16,
      title: 'Prepare client quotation',
      description: 'Update pricing and prepare the quotation for the client.',
      date: '2026-09-05',
      time: '10:00 AM',
    },
    {
      id: 17,
      title: 'Server maintenance',
      description: 'Check server status, storage usage, and application logs.',
      date: '2026-09-05',
      time: '02:30 PM',
    },
    {
      id: 18,
      title: 'Weekly progress review',
      description: 'Review completed tasks and progress for the week.',
      date: '2026-09-05',
      time: '05:30 PM',
    },
  ] as any[];

  return (
    <View style={styles.container}>
      <View style={styles.search_bar_container}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search for a work" style={styles.input} />
        <Pressable style={styles.search_button} onPress={() => { setSearch('') }}>
          <Text style={styles.search_button_text}>Search</Text>
        </Pressable>

        <ScrollView style={styles.works_list_container}>
          {works.map((work: any) => (
            <WorkItemCard key={work.id} data={work} />
          ))}


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
    gap: 20,
    display: 'flex',
    flexDirection: 'column',
  }
});
