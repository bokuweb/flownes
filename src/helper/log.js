/* @flow */

const log = {
  debug: () => { },
  info(...args: any) { console.info(...args) }, // eslint-disable-line no-console
  error(...args: any) { console.error(...args) }, // eslint-disable-line no-console
}

if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-undef
  log.debug = (...args: any) => { console.log(...args); }// eslint-disable-line no-console
}

export default log;
