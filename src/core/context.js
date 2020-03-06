const importCwd = require('import-cwd');
const config = require('./config');
const exec = require('./exec');

const context = new Proxy(
    Object.assign(global, {
        require: Object.assign(require, importCwd),
        config,
        ƒ: exec.bind(null, true),
    }),
    {
        get(target, key) {
            if (key in target) {
                return target[key];
            }

            let result;
            if (typeof key === 'string' && key !== '') {
                config.env.find((env) => {
                    try {
                        return (result = env(key));
                    } catch (e) {}
                });
            }
            return result;
        },
        set(target, key, value) {
            target[key] = value;
            return true;
        }
    }
);

context.global = context;
module.exports = context;
