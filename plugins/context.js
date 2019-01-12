const importCwd = require('import-cwd');
const config = require('./config');
const ƒ = require('./exec');

const context = new Proxy(
    Object.assign(global, {
        require: Object.assign(require, importCwd),
        config,
        ƒ
    }),
    {
        get(target, key) {
            if (typeof key === 'string' && /^\$/.test(key)) {
                return process.env[key.slice(1)];
            }

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
            if (typeof key === 'string' && /^\$/.test(key)) {
                process.env[key.slice(1)] = value;
                return true;
            }

            target[key] = value;
            return true;
        }
    }
);

context.global = context;
module.exports = context;
