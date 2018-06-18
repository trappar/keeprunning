#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const {spawn, execSync} = require('child_process');

const options = commandLineArgs([
    { name: 'command', alias: 'c', multiple: true, type: String,  defaultOption: true },
    { name: 'errorsOnly', alias: 'e', type: Boolean }
]);

// Handle command line arguments
if (!options.command || !options.command[0]) {
    exitWithMessage('Must supply a command to run as the argument for this command.');
}

let running; // This is where we'll store the currently running child process
const command = options.command[0];
const args = options.command.slice(1);

function exitWithMessage(message, code) {
    code = (code) ? code : 1;
    console.log(message);
    process.exit(code);
}

function spawnCommand(exitStatus) {
    if (!options.errorsOnly || exitStatus !== 0) {
        running = spawn(command, args, {stdio: ['ignore', process.stdout, process.stderr]});
        running.on('close', spawnCommand);
    }
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

try {
    execSync(`which ${command}`)
} catch (e) {
    exitWithMessage(`Command "${command}" could not be found.`);
}

// Start up the command
spawnCommand(1);