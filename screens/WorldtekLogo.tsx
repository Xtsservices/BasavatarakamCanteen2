import React from 'react';
import { View, Text, Image, Linking, TouchableOpacity, StyleSheet } from 'react-native';

const WorldtekLogo: React.FC = () => {
  const handlePress = () => {
    Linking.openURL('https://worldtek.in/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.poweredText}>Powered by</Text>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.logoContainer}>
          <Image
            source={require('./images/footerLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  poweredText: {
    color: 'gray',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Poppins-Italic',
    marginTop: 10,
    marginRight: 8,
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 120,
    marginTop: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  logo: {
    width: '80%',
    height: 40,
  },
});

export default WorldtekLogo;
