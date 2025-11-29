import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { NavigationContainer, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
    Login: undefined; // Define the 'Login' route and its params if any
};

const HomePage = ({ navigation }: { navigation: NavigationProp<RootStackParamList> }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.navigate('walkins' as never); // Ensure 'Login' matches a valid route name in your navigation setup
        }, 3000);

        return () => clearTimeout(timer); // Cleanup the timer
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image
                source={{
                    uri: 'https://www.pngall.com/wp-content/uploads/8/Restaurant-Logo-PNG-Clipart.png',
                }}
                style={styles.image}
                resizeMode="contain"
            />
            <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 30, marginTop: 20 }}>PRANAVI’S SAMSKRITI CANTEEN</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 200,
        height: 200,
    },
});

export default HomePage;