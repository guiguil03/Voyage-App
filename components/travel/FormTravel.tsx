import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function FormTravel() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>FormTravel</Text>
            <form>
                <TextInput
                    placeholder="Destinatio,"
                    style={styles.input}
                />
            </form>
            </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button:{
        backgroundColor: '#000000',
        borderBottomLeftRadius:30,
        borderBottomRightRadius:30,
        borderTopLeftRadius:30,
        borderTopRightRadius:30,
        width: '100%',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    }
});