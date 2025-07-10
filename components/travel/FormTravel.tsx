import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FormTravel() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>FormTravel</Text>
            <TouchableOpacity style={styles.button} onPress={() => {
                console.log('Créer un voyage');
            }}>
                <Text style={styles.buttonText}>Créer un voyage</Text>
            </TouchableOpacity>
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
    }
});