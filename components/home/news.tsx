import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';

const screenWidth = Dimensions.get('window').width;

const News = () => {
  const { contactData } = useSelector((state: any) => state.services);
   
  const newsText = contactData?.support?.news || '';
//  console.log(contactData);
 
  const translateX = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    translateX.setValue(screenWidth);

    Animated.loop(
      Animated.timing(translateX, {
        toValue: -screenWidth * 2,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start();
  }, [translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.marqueeContainer}>
        <Animated.Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            styles.newsText,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {newsText}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#e9e3e3',
  },

  marqueeContainer: {
    width: '100%',
    overflow: 'hidden',
  },

  newsText: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
    width: 1200, // keeps text in one line
    fontStyle:'italic'
  },
});

export default News;