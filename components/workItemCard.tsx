import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function WorkItemCard() {
    return (

        <View style={styles.container}>
            <Pressable>
                <Text style={styles.title}>Work Item Card</Text>
                <Text style={styles.description}>This si the description of the work item card</Text>
                <Text style={styles.description}>This is the description of the work item card</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'gray/50',
        width: '100%',
        borderRadius: 10,
        marginVertical: 10,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    description: {
        fontSize: 16,
        color: 'black',
    },
})