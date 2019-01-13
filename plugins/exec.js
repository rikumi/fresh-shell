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
        return '';
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

    let executor = (interactive = true) => {
        if (!isExecuted) {
            if (file === 'exit') {
                process.exit();
            } else if (file === 'cd') {
                args[0] && process.chdir(expand(args[0]));
                return '';
            }

            try {
                setTitle('ƒ > ' + file + (args.length ? '…' : ''));
                process.stdin.setRawMode(false);

                // Use sh to execute the command
                // 
                let returns = cp.spawnSync('sh', ['-c', command], {
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
                    .map((k) => k.toString().replace(/\n$/, '')) // Trim the ending newline
                    .filter((k) => k.trim())
                    .join('\n\nError: ');
            } finally {
                if (!interactive) {
                    process.stdout.clearLine(0);
                }
                process.stdin.setRawMode(true);
                isExecuted = true;
                setTitle('ƒ');
            }
        }
        return result;
    };

    executor.FRESH_EXECUTABLE = true;
    executor.toString = executor.bind(null, false);

    return new Proxy(executor, {
        get(target, key, value) {
            if (key in executor && key !== 'length') {
                return executor[key];
            } else {
                return executor.toString()[key];
            }
        }
    });
};