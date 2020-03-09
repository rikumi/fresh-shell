const readline = require('readline');
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

        this.interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            ...readlineOptions
        });

        this.interface.on('line', (content) => this.handleReturn(content));
        this.interface.on('SIGINT', () => this.handleSIGINT());
        this.makeBothPrompts();
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

    makeHardPrompt(newPrompt = this.hardPrompt) {
        const prompt = typeof this.hardPrompt === 'function' ? this.hardPrompt() : this.hardPrompt;
        this.lastHardPrompt = prompt;
        this.interface.setPrompt(prompt);
        this.interface.prompt();
    }

    makeSoftPrompt(newPrompt = this.softPrompt) {
        const prompt = typeof this.softPrompt === 'function' ? this.softPrompt() : this.softPrompt;
        this.lastSoftPrompt = prompt;
        this.interface.write(prompt);
    }

    makeBothPrompts(newHardPrompt = this.hardPrompt, newSoftPrompt = this.softPrompt) {
        this.makeHardPrompt(newHardPrompt);
        this.makeSoftPrompt(newSoftPrompt);
    }

    async handleReturn(content) {
        const contentToClear = this.lastHardPrompt + content;
        this.clearLinesForText(contentToClear);
        process.stdout.write(this.lastHardPrompt);

        if (!content.trim() || content.trim() === this.lastSoftPrompt.trim()) {
            process.stdout.write(this.lastSoftPrompt);
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
        this.makeBothPrompts();
    }
}