const cp = require('child_process');
const chalk = require('chalk').default;
const argv = require('string-to-argv').default;
const expand = require('expand-home-dir');

const define = {};

const setTitle = (title) => {
    process.stdout.write(
        String.fromCharCode(27) + "]0;" + title + String.fromCharCode(7)
    );
}

setTitle('ƒ');

module.exports = (command, ...interpolations) => {
    if (Array.isArray(command)) {
        command = command.map((k, i) => k + (interpolations[i] || '')).join('');
    }
    
    // define a command: ƒ('command', 'alias') or ƒ('command', () => { /**/ })
    else if (interpolations.length === 1 &&
        argv(command).length === 1 &&
        interpolations[0] &&
        (typeof interpolations[0] === 'string' || typeof interpolations[0] === 'function')) {
    
        define[command] = interpolations[0];
        return;
    }

    if (!command.trim()) {
        return '';
    }

    if (define[command]) {
        if (typeof define[command] === 'string') {
            command = define[command]
        }
        if (typeof define[command] === 'function') {
            return define[command]();
        }
    }

    let [file, ...args] = argv(command);
    let isExecuted = false;
    let result = null;

    let getter = (interactive = true) => {
        if (!isExecuted) {
            if (file === 'exit') {
                process.exit();
            } else if (file === 'cd') {
                process.chdir(expand(args[0]));
                return;
            }

            try {
                setTitle('ƒ > ' + file);
                process.stdin.setRawMode(false);
                if (!interactive) {
                    process.stdout.write(chalk.gray('[Executing]', command, '…'))
                }

                // With shell set to true, it is more compatible with some bash syntax
                // And path finding is transparently supported
                // But args passed to shell should be escaped
                let returns = cp.spawnSync(file, args.map(arg => JSON.stringify(expand(arg))), {
                    shell: true,
                    stdio: [
                        'inherit',
                        interactive ? 'inherit' : 'pipe',
                        interactive ? 'inherit' : 'pipe'
                    ],
                    windowsHide: !interactive
                });

                let { stdout, stderr } = returns;
                result = [stdout, stderr]
                    .filter((k) => k)
                    .map((k) => k.toString())
                    .filter((k) => k.trim())
                    .join('\n\nError: ');
                isExecuted = true;
            } finally {
                if (!interactive) {
                    process.stdout.clearLine(0);
                }
                process.stdin.setRawMode(true);
                setTitle('ƒ');
            }
        }
        return result;
    };

    getter.FRESH_EXECUTABLE = true;
    getter.toString = getter.bind(null, false);

    return new Proxy(getter, {
        get(target, key, value) {
            if (key in getter && key !== 'length') {
                return getter[key];
            } else {
                return getter.toString()[key];
            }
        }
    });
};
