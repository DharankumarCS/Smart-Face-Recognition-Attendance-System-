import { Alert } from 'react-native';

export const handleError = (error: any) => {
  if (error.response) {
    const detail = error.response.data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : 'Something went wrong';
    Alert.alert('Error', message);
  } else if (error.request) {
    Alert.alert(
      'Connection Error',
      'Cannot connect to server.\n' +
        'Check:\n' +
        '• Same WiFi network?\n' +
        '• Backend running?\n' +
        '• Correct IP address?'
    );
  } else {
    Alert.alert('Error', error.message || 'Something went wrong');
  }
};
