#!/usr/bin/env node
const vm = require('vm');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Repl = require('./core/repl');
const config = require('./core/config');
const context = require('./core/context');
const { exec, setTitle } = require('./core/exec');

const sandbox = vm.createContext(context);

process.on('unhandledRejection', (e) => { throw e });
process.on('uncaughtException', console.log);
process.on('SIGINT', () => {});

try {
    vm.runInContext(fs.readFileSync(path.join(os.homedir(), '.freshrc.js')).toString(), context);
} catch (e) { }

setTitle(config.makeTitle());

const repl = new Repl({
    hardPrompt: config.prompt,
    softPrompt: () => config.verb + '`',
    transformer: (text) => {
        if (new RegExp(config.verb + '`([^`\\\\]|\\\\.)+$').test(text)) {
            text += '`';
        }
        return text;
    },
    formatter: config.colorizeCommand,
    executor: (cmd) => {
        const isInteractive = new RegExp('^' + config.verb + '`([^`\\\\]|\\\\.)+`$').test(cmd);
        sandbox[config.verb] = exec.bind(null, isInteractive);
        try {
            let result = vm.runInContext(cmd, sandbox);
            if (isInteractive) {
                repl.hardPrompt = config.prompt.bind(null, result.status);
            } else {
                console.log('>', config.colorizeOutput(result));
            }
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('\n');
    }
}, {
    maxLength: config.historySize,
    completer: config.complete
});
