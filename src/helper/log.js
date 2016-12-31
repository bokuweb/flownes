/* @flow */

import log from 'loglevel';

if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-undef
  log.setLevel('debug');
} else {
  log.setLevel('info');
}

export default log;
