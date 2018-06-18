#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { spawn, execSync } = require('child_process');

const optionDefinitions = [
    { name: 'errorsOnly', alias: 'e', type: Boolean }
];

const parsedArgv = getParsedArgv(optionDefinitions);

const options = commandLineArgs(
    optionDefinitions,
    { argv: parsedArgv.args }
);

// Handle command line arguments
if (!parsedArgv.command) {
    exitWithMessage('Must supply a command to run as the argument for this command.');
}

let running; // This is where we'll store the currently running child process

function getParsedArgv(optionDefinitions) {
    for (let i = 2; ; i++) {
        const option = process.argv[i];
        let optionKnown = false;
        optionDefinitions.forEach(definition => {
            if (option === `--${definition.name}` || option === `-${definition.alias}`) {
                optionKnown = true;
                if (definition.type !== Boolean) {
                    i++;
                }
            }
        });

        if (!optionKnown) {
            return {
                args: process.argv.slice(2, i),
                command: process.argv[i],
                commandArgs: process.argv.slice(i + 1)
            }
        }
    }
}

function exitWithMessage(message, code) {
    code = (code) ? code : 1;
    console.log(message);
    process.exit(code);
}

function spawnCommand(exitStatus) {
    if (!options.errorsOnly || exitStatus !== 0) {
        running = spawn(parsedArgv.command, parsedArgv.commandArgs, { stdio: ['ignore', process.stdout, process.stderr] });
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
    execSync(`which ${parsedArgv.command}`)
} catch (e) {
    exitWithMessage(`Command "${parsedArgv.command}" could not be found.`);
}

// Start up the command
spawnCommand(1);