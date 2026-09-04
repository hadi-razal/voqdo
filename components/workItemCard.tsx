import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function WorkItemCard({ data }: any) {
    return (

        <View>
            <Pressable style={styles.container}>
                <Text style={styles.title}>{data.title}</Text>
                <Text style={styles.description}>{data.description}</Text>
                <View style={styles.date_container}>
                    <Text style={styles.date}>{data.time}</Text>
                    <Text style={styles.date}>{data.date}</Text>
                </View>

            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'gray/50',
        width: '100%',
        borderRadius: 5,
        borderWidth: 0.3,
        borderColor: 'gray',
        paddingHorizontal: 10,
        marginVertical: 3,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: 'black',
    },
    description: {
        fontSize: 16,
        color: 'black/80',
        fontWeight: 200,
        marginBottom: 10,
    }, date_container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    date: {
        fontSize: 12,
        color: 'gray',
    },
})