import log from 'loglevel';

if (process.env.NODE_ENV !== 'production') {
  log.setLevel('debug');
} else {
  log.setLevel('info');
}

export default log;
