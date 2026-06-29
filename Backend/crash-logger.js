process.on('uncaughtException', (err) => {
    require('fs').appendFileSync('crash.log', 'Uncaught Exception: ' + err.stack + '\n');
});
process.on('unhandledRejection', (reason, promise) => {
    require('fs').appendFileSync('crash.log', 'Unhandled Rejection: ' + (reason.stack || reason) + '\n');
});
