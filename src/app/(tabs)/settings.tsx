import { StyleSheet, Text, TextInput, View } from "react-native";

export default function Settings() {
    return (
        <View style={styles.container}>
            <Text >Settings</Text>
            <TextInput style={styles.input} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        width: '80%',
        height: 40,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: 'red',
    },
});