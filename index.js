#!/usr/bin/env node
const vm = require('vm');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const stringWidth = require('string-width');

const config = require('./plugins/config');
const context = require('./plugins/context');

const sandbox = vm.createContext(context);

// change error output into only one-line messages
process.on('unhandledRejection', (e) => {
    throw e;
});
process.on('uncaughtException', (e) => {
    console.log(e.message);
});

// ignore Ctrl+C from child processes
process.on('SIGINT', () => {});

// load custom configurations
try {
    vm.runInContext(fs.readFileSync(path.join(os.homedir(), '.freshrc.js')).toString(), context);
} catch (e) {}

const clearLines = (text) => {
    let lines = (text + '|')
        .split('\n')
        .map((cmd) => {
            return Math.ceil(Math.max(1, stringWidth(cmd)) / (process.stdout.columns || 60));
        })
        .reduce((a, b) => a + b, 0);

    for (let line = 0; line < lines; line++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
    }
};

const state = {
    lastPrompt: '',
    incompleteCmd: ''
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    removeHistoryDuplicates: true,
    completer: config.complete
});

const promptWithHinting = () => {
    rl.setPrompt((state.lastPrompt = config.prompt()));
    rl.prompt();
    rl.write('ƒ`');
};

// ignore Ctrl+C from readline
rl.on('SIGINT', () => {
    rl.clearLine(0);
    clearLines(state.lastPrompt);
    state.lastPrompt = '';
    state.incompleteCmd = '';
    promptWithHinting();
});

const getIndent = (previousLines, currentLine = '') => {
    let lastLine = (previousLines.split('\n').filter((k) => k.trim()) || []).slice(-1)[0] || '';
    let indents = lastLine.match(/[\[({]/g);
    let outdents = (lastLine + currentLine).match(/[\])}]/g);
    let lastLineIndentOffset = (indents ? indents.length : 0) - (outdents ? outdents.length : 0);
    let preferTwoSpaces = !!previousLines.split('\n').find((k) => /^( {4})*( {2})\S/.test(k));

    let lastLineIndent;
    let indentCharacter;
    if (/^\t+/.test(lastLine)) {
        indentCharacter = '\t';
    } else {
        indentCharacter = preferTwoSpaces ? '  ' : '    ';
    }

    lastLineIndent = Math.floor(/^\s*/.exec(lastLine)[0].length / indentCharacter.length);
    let newLineIndent = Math.max(0, lastLineIndent + lastLineIndentOffset);
    return Array(newLineIndent)
        .fill(indentCharacter)
        .join('');
};

const reindentLastLine = (text) => {
    let split = text.split('\n');
    let prevLines = split.slice(0, -1).join('\n');
    let lastLine = (split.slice(-1)[0] || '').replace(/^\s*/, '');
    return prevLines + '\n' + getIndent(prevLines, lastLine) + lastLine;
};

rl.on('line', (cmd) => {
    cmd = state.incompleteCmd + cmd;
    let originalCmd = cmd;

    const clearLast = () => {
        clearLines(state.lastPrompt + originalCmd.split('\n').slice(-1)[0]);
    };

    if (!cmd.trim() || cmd === 'ƒ`') {
        clearLast();
        promptWithHinting();
        return;
    }

    loop: while (true) {
        try {
            let result = vm.runInContext(cmd, sandbox);
            clearLast();
            rl.prompt();
            console.log(
                config
                    .colorizeCommand(reindentLastLine(cmd), undefined, true)
                    .split('\n')
                    .slice(-1)[0]
            );

            if (typeof result === 'function' && result.FRESH_EXECUTABLE) {
                result = result();
            }

            if (result !== '') {
                console.log(result);
            }

            process.stdout.write('\n');
            state.incompleteCmd = '';
            break loop;
        } catch (e) {
            switch (e.message) {
                case 'Unterminated template literal':
                    cmd += '`';
                    continue;
                case 'missing ) after argument list':
                case 'Unexpected end of input':
                case 'Unexpected token':
                    clearLast();
                    rl.prompt();
                    console.log(
                        config
                            .colorizeCommand(reindentLastLine(cmd), undefined, false)
                            .split('\n')
                            .slice(-1)[0]
                    );
                    state.incompleteCmd = cmd + '\n';
                    rl.setPrompt((state.lastPrompt = ''));
                    rl.write(getIndent(cmd));
                    return;
                default:
                    clearLast();
                    rl.prompt();
                    console.log(
                        config
                            .colorizeCommand(reindentLastLine(cmd), e, true)
                            .split('\n')
                            .slice(-1)[0]
                    );
                    state.incompleteCmd = '';
                    break loop;
            }
        }
    }
    promptWithHinting();
});

promptWithHinting();
