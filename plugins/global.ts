import Vue from 'vue';
import moment from 'moment';

Vue.filter('formatDate', (value: string) => {
  if (!value) {
    return value;
  }

  const time = moment(String(value));

  if (!time.isValid()) {
    return value;
  }

  return time.format('MM/DD/YYYY HH:mm');
});
