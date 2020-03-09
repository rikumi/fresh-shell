const fs = require('fs');
const util = require('util');
const path = require('path');

const moment = require('moment');
const tokens = require('js-tokens');
const chalk = require('chalk').default;

const expandHomeDir = require('expand-home-dir');
const { parse } = require('shell-quote');

const git = require('git-state');
const branch = require('list-git-branches');
const pathComplete = require('lib-pathcomplete');

const config = {
    verb: 'ƒ',
    shell: '/bin/sh',
    shellArgs: ['-li'],
    env: [require],
    git() {
        let cwd = process.cwd();
        if (!git.isGitSync(cwd)) return '';
        let { branch, ahead, dirty, untracked } = git.checkSync(cwd);
        let str = ' ' + branch;
        if (untracked) str += '*';
        if (dirty) str += '+';
        if (ahead > 0) str += '↑';
        if (ahead < 0) str += '↓';
        return str;
    },
    cwd() {
        return path.basename(process.cwd()) || '/';
    },
    prompt(status = 0) {
        return (status ? chalk.red : chalk.blue)(config.cwd() + chalk.gray(config.git()) + ' ');
    },
    async complete(line, callback) {
        let last = line;
        if (/[^\\]\s$/.test(last)) {
            last = '';
        }
        if (/`/.test(last)) {
            last = /[^`]*$/.exec(last)[0];
        }
        last = parse(last, process.env).slice(-1)[0] || '';
        last = expandHomeDir(last);

        pathComplete(last, (err, data, info) => {
            try {
                if (err) throw err;
                let paths = (data || []).map((file) => {
                    if (fs.statSync(path.join(info.dir, file)).isDirectory()) file += '/';
                    return file.replace(/ /g, '\\ ');
                });
                let branches = /[^\/]+$/.test(last) && ~line.indexOf('git ') && git.isGitSync(process.cwd()) ?
                    branch.sync('.').filter((k) => k.indexOf(/[^\/]+$/.exec(last)[0]) === 0) : [];
                callback(null, [
                    paths.concat(branches).filter((k, i, a) => a.indexOf(k) === i),
                    path.basename(last).replace(/ /g, '\\ ') + (/\/$/.test(last) ? '/' : '')
                ]);
            } catch (e) {
                callback(null, [[]]);
            }
        })
    },
    makeTitle(argv) {
        if (!argv) {
            return config.verb;
        } else {
            const [cmd, ...args] = argv;
            return config.verb + ' > ' + cmd + (args.length ? '…' : '')
        }
    },
    colorizeToken(token) {
        return {
            string: chalk.green,
            comment: chalk.gray,
            regex: chalk.cyan,
            number: chalk.yellow,
            name: token.value === config.verb ? chalk.blue : token.value === 'null' || token.value === 'undefined' ? chalk.gray : chalk.reset,
            punctuator: chalk.reset,
            whitespace: chalk.reset,
            invalid: chalk.red
        }[token.type](token.value);
    },
    colorizeCode(code) {
        if (!code) return '';
        let result = '';
        let match = tokens.default.exec(code);
        while (match) {
            let token = tokens.matchToToken(match);
            result += config.colorizeToken(token);
            match = tokens.default.exec(code);
        }
        return result;
    },
    colorizeCommand(command) {
        return config.colorizeCode(command.trim()) + chalk.gray(' - ' + moment().format('H:mm:ss'));
    },
    colorizeOutput(output) {
        return config.colorizeCode(util.inspect(output));
    }
};

module.exports = config;
