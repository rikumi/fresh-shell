const cp = require('child_process');
const expand = require('expand-home-dir');
const { parse } = require('shell-quote');
const config = require('./config');
const chalk = require('chalk').default;

const setTitle = (title) => {
    process.stdout.write(
        String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
    );
}

setTitle('ƒ');

const exec = (interactive, command, ...interpolations) => {
    if (Array.isArray(command)) {
        command = command.map((k, i) => k + (interpolations[i] || '')).join('');
    }

    if (!command) {
        return '';
    }

    let argv = parse(command, process.env);
    let [cmd, ...args] = argv;

    if (cmd === 'exit') {
        process.exit();
    } else if (cmd === 'cd' && args.length === 1) {
        process.chdir(expand(args[0]));
        return '';
    } else if (cmd === 'export' && args.length === 1) {
        const [key, value] = args[0].split('=');
        process.env[key] = value;
        return '';
    }

    if (argv.includes('cd')) {
        console.log(chalk.yellow('Warning: complex commands with `cd` will not affect the working directory of fresh shell. This can be a no-op. Use simple `cd <directory>` command instead.'));
    }

    if (argv.includes('export')) {
        console.log(chalk.yellow('Warning: complex commands with `export` will not affect the environment variables of fresh shell. This can be a no-op. Use simple `export <key>=<value>` command instead.'));
    }

    if (argv.includes('exit')) {
        console.log(chalk.yellow('Warning: complex commands with `exit` will not affect fresh shell. This can be a no-op. Use simple `exit` command instead.'));
    }

    try {
        setTitle('ƒ > ' + cmd + (args.length ? '…' : ''));
        process.stdin.setRawMode(false);

        // Use sh to execute the command
        const {
            status,
            stdout,
            stderr,
            error = null
        } = cp.spawnSync(config.shell, [...config.shellArgs, '-c', command], {
            stdio: [
                'inherit',
                interactive ? 'inherit' : 'pipe',
                interactive ? 'inherit' : 'pipe'
            ]
        });

        return Object.assign((stdout || '').toString().replace(/\n$/, ''), {
            status,
            stderr: (stderr || '').toString(),
            error: error,
        });
    } finally {
        process.stdin.setRawMode(true);
        setTitle('ƒ');
    }
};

module.exports = exec;