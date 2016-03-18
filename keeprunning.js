#!/usr/bin/env node

const spawn = require('child_process').spawn;
const execSync = require('child_process').execSync;

var running; // This is where we'll store the currently running child process

function exitWithMessage(message, code) {
    code = (code) ? code : 1;
    console.log(message);
    process.exit(code);
}

function spawnCommand() {
    running = spawn(command, args, {stdio: ['ignore', process.stdout, process.stderr]});
    running.on('close', spawnCommand);
}

// Handle process exit gracefully
process.once('SIGINT', function() {
    if (running) {
        running.removeAllListeners('close');
        running.on('close', (code) => process.exit());
        running.kill('SIGINT');
    } else {
        process.exit();
    }
});
process.once('SIGTERM', function() {
    if (running) {
        running.kill();
    }
    process.exit();
});

// Handle command line arguments
if (!process.argv[2]) {
    exitWithMessage('Must supply a command to run as the argument for this command.');
}
const command = process.argv[2];
const args = process.argv.slice(3);

try {
    execSync(`which ${command}`)
} catch (e) {
    exitWithMessage(`Command "${command}" could not be found.`);
}

// Start up the command
spawnCommand();