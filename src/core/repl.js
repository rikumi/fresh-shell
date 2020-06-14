const os = require('os');
const path = require('path');
const readline = require('historic-readline');
const stringWidth = require('string-width');

const noop = k => k;

module.exports = class Repl {
    constructor(options, readlineOptions) {
        this.interface = null;
        this.hardPrompt = '';
        this.softPrompt = '';
        this.lastHardPrompt = '';
        this.lastSoftPrompt = '';
        this.transformer = noop;
        this.formatter = noop;
        this.executor = noop;

        Object.assign(this, options);

        readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            path: path.join(os.homedir(), '.fresh_history'),
            ...readlineOptions,
            next: (rl) => {
                this.interface = rl;
                this.interface.on('line', (content) => this.handleReturn(content));
                this.interface.on('SIGINT', () => this.handleSIGINT());
                this.makeBothPrompts();
            }
        });
    }

    getLineCountFromText(text) {
        return (text + '|')
            .split('\n')
            .map(cmd => Math.ceil(Math.max(1, stringWidth(cmd)) / (process.stdout.columns || 60)))
            .reduce((a, b) => a + b, 0);
    }

    clearLines(lineCount) {
        while (lineCount--) {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(0);
        }
    }

    clearLinesForText(text) {
        this.clearLines(this.getLineCountFromText(text));
    }

    makeHardPrompt(cached = false) {
        if (cached) {
            process.stdout.write(this.lastHardPrompt);
        } else {
            const prompt = typeof this.hardPrompt === 'function' ? this.hardPrompt() : this.hardPrompt;
            this.lastHardPrompt = prompt;
            this.interface.setPrompt(prompt);
            this.interface.prompt();
        }
    }

    makeSoftPrompt(cached = false) {
        if (cached) {
            this.interface.write(this.lastSoftPrompt);
        } else {
            const prompt = typeof this.softPrompt === 'function' ? this.softPrompt() : this.softPrompt;
            this.lastSoftPrompt = prompt;
            this.interface.write(prompt);
        }
    }

    makeBothPrompts(cached = false) {
        this.makeHardPrompt(cached);
        this.makeSoftPrompt(cached);
    }

    async handleReturn(content) {
        const contentToClear = this.lastHardPrompt + content;
        this.clearLinesForText(contentToClear);
        this.makeHardPrompt(true);

        if (!content.trim() || content.trim() === this.lastSoftPrompt.trim()) {
            this.makeSoftPrompt(true);
            return;
        }

        content = this.transformer(content);
        const reformattedContent = this.formatter(content);
        process.stdout.write(reformattedContent + '\n');

        await this.executor(content);

        this.makeBothPrompts();
    }

    handleSIGINT() {
        this.interface.clearLine();
        this.clearLines(process.stdout.rows);
        this.makeBothPrompts(true);
    }
}