const fs = require('fs');
const os = require('os');
const path = require('path');

let configPath = path.join(os.homedir(), '.freshrc.js');

if (!fs.existsSync(configPath)) {
    let PATH = (process.env.PATH || '')
        .split(':')
        .map(k => k.replace(/\/$/, ''))
        .filter((k, i, a) => a.indexOf(k) === i)
        .sort()
        .sort((a, b) => a.length - b.length)
        .map(k => JSON.stringify(k))
        .join(',\n    ');
        
    fs.writeFileSync(configPath, `
// $-leading global variables are mapped onto process.env.*
// e.g. $PATH is equivalent to process.env.PATH
$PATH = [
    ${PATH}
].join(':');

// Define your own tools here...
ƒ('gl', 'git pull');
ƒ('gp', 'git push');
ƒ('glg', 'git log');
ƒ('glgg', 'git log --graph --pretty=oneline');
ƒ('freshrc', 'code ~/.freshrc.js');

// And custom ƒ-commands:
ƒ('default-config', () => {
    console.log('Displaying fresh default config...');
    ƒ\`code \${require.resolve('fresh/plugins/config.js')}\`
});

// And override the config:
// config.git = () => {
//     return chalk.green('master');
// }
    `.trim());
}