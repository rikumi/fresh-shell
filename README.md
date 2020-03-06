# fresh-shell

基于 Node.js 的 JavaScript「壳中壳」

![image](https://user-images.githubusercontent.com/5051300/76057979-0e7d4a00-5fb6-11ea-9db8-188b083578e4.png)

## 介绍

Shell 是 Unix 世界中一个不可或缺的工具，但它的语法也许不那么优雅、难以学习，阻止了你很多突发奇想，让很多需要高生产力的临时需求不得不变成写一个冗长的 Node 脚本再去调试运行。

例如，你如何批量重命名一大堆文件？如何把一个文件夹里所有的 png 文件都调用一次 `tinypng` CLI，并用得到的压缩图片文件替换原文件？对于没有系统学习过 Shell 语法的开发者，这些任务都是艰巨的，写一个这样的脚本往往要用到 Node.js，同时一些细小的任务还是需要用到 Shell。

人们曾经想过改进 Shell 的语法，但事实证明，这是一个大工程，而且是一个社会工程。我们常用的 Zsh 对 Bash 兼容性很好，但它语法也就跟 Bash 一样复杂；假如我们下决心用上稍微优雅一些的 Fish，如何把别人留在开发文档里的 Bash 复杂命令改成 Fish？如何去说服你的同事跟你一起用 Fish 来避免分享高级用法的过程中出现语法冲突？

有开发者想到了将两种语法融合，[Xonsh](https://xon.sh/) 就是这样一个产物。但经过长期使用，我们会发现 Xonsh 并没有实现全部的 Shell 语法，很多语法都是缺失的，这些问题的根源在于 Xonsh 试图把两个语法糅合在一起，而不是区分它们的上下文。

Fresh 是一个构造极简的 JavaScript Unix Shell。它能在**不破坏语法**的前提下，让 JavaScript 语法和**任意一种标准 Shell** 的语法融合，并同时满足你基于 Shell 语法的日常使用和基于 JavaScript 的 Hacking。

为什么不破坏语法？因为 Fresh 区分上下文，使用自动补全的 Tag Function 来处理 Shell 语法。

## 安装和使用

安装 Fresh 之前，请确保你的 Node.JS 已安装并位于 `/usr/local/bin/node` 下。

```sh
rikumi $ npm i -g fresh-shell
rikumi $ fresh

rikumi ƒ`|
```

安装后，你可以将 fresh 的入口程序（通常为 `/usr/local/bin/fresh`）设置为终端和 VS Code 的默认 Shell。

Fresh 中必备的两个字符是 ƒ\`，我们可以称之为「软提示符」（位于标准输入流而非输出流中、可以删除和修改的提示符）。软提示符的存在让我们可以直接键入 Shell 命令，而不需要多余的语法。

输入任何你需要的 Shell 命令（如 `ls`），回车之后，Fresh 会自动补全末尾的反引号 \`，因此会产生 Tag Function Call 语法：ƒ\``ls`\`，其中函数 ƒ 的含义为**同步执行 Shell**，因此 `ls` 命令会被执行。这就是 Fresh 的基本工作原理。

## 如何输入 ƒ`

使用 option+F 可以输入 ƒ；\`（反引号）是半角状态下 Tab 上方的按键。

## 交互执行和隐藏执行

ƒ 函数（`exec` 函数）有两种模式：交互执行和隐藏执行。

当输入的命令行是单一的 ƒ 调用时，会进入交互执行状态，输入输出以标准输入输出的形式提供；当 ƒ 调用是输入的表达式中的一部分，会进入隐藏执行状态，标准输出和标准错误输出不会直接上屏，而是作为 ƒ 函数的返回值提供。

ƒ 函数的返回值是一个特殊字符串，字符串的值为子程序的标准输出（经过 UTF-8 解码得到的内容）；该字符串上附加有 `status`、`stderr`、`error` 三个属性，分别表示状态码、标准错误输出（经过 UTF-8 解码得到的内容）和 JavaScript 错误对象。

下图中分别展示了命令 `git status` 的交互执行模式，以及隐藏执行模式下的 `status`、`stderr`、`error` 属性。

![image](https://user-images.githubusercontent.com/5051300/76059992-302d0000-5fbb-11ea-8c11-99db4e89bcaa.png)

## 环境变量与当前工作目录（CWD）

Fresh 本身并不是 Unix Shell，而是 Unix Shell 的一层封装，所有的 Shell 命令都是在子进程中执行的。这也就意味着 Fresh 执行的 Shell 无法改变 Fresh 本身的环境变量与当前工作目录（CWD）。

这带来的几个最主要问题是 `cd`/`export`/`exit` 语句。如果我们用 Shell 模式执行这些语句，它们退出后不会对 Fresh 本身产生任何影响；因此，Fresh 简易实现了 `cd`/`export`/`exit` 语句的基本功能，让单一的 `cd`/`export`/`exit` 语句能够工作。

注意，Fresh 只支持在单一语句中独立使用 `cd <directory>`、`export KEY=value`、`exit` 的语法，其中 `cd` 和 `export` 支持在其中进行简单的环境变量插值；复杂的用法将会以 Unix Shell 模式执行，导致它们不会对 Fresh 本身的状态产生影响。以下是一个对比简单 `cd`/`export` 语句和复杂 `cd`/`export`/`exit` 语句的例子。

![image](https://user-images.githubusercontent.com/5051300/76062025-c3683480-5fbf-11ea-83c5-aa1d4e9e49e0.png)

可以看到，简单的 `cd`/`export` 语句会被 Fresh 捕获，转换为改变当前工作目录和环境变量；复杂的 `cd`/`export`/`exit` 语句会采用 Shell 模式进行执行，因此不会对 Fresh 本身的状态产生影响。

## Node.js 环境与自动 require

Fresh 的本质是一个 Node.js REPL（但并没有使用 Node.js REPL 库，而是用表现更稳定、可定制性更强的 Node.js Readline 库进行实现），其中只有 ƒ 函数是与 Shell 执行相关的；除 ƒ 函数之外，Fresh 也是一个完整的 Node.js 执行环境。

相比标准 Node REPL，Fresh 面向终端场景，加入了自动 `require` 的能力，即在全局命名空间下，找不到的对象，会自动尝试 `require`。同时，在配置文件中也可以增加新的自动导入函数。

![image](https://user-images.githubusercontent.com/5051300/76062665-17274d80-5fc1-11ea-9925-bc6d2f8459c3.png)

## 融合使用

借助上述特性，可以将 Shell 命令与 JavaScript 融合使用，Shell 中使用模板插值语法 `${}` 可以嵌入 JavaScript 表达式；JavaScript 中也可以使用 ƒ 函数嵌入 Shell 执行结果：

![image](https://user-images.githubusercontent.com/5051300/76063500-cd3f6700-5fc2-11ea-9ab9-f35371766d24.png)

## 配置文件

Fresh 支持使用配置文件进行自定义，实现嵌套 Shell 和配置继承、提示符美化（如实现简易的 Powerline 风格）、定制 JavaScript 环境、定制 Tab 自动完成、定制颜色高亮等。

配置文件位于 `~/.freshrc.js`，会在 Fresh 启动时被执行。在配置文件中，可以像在 Fresh 内一样使用 ƒ 函数，但固定处于隐藏执行模式，如果要查看输出，需要配合 `console.log` 等方式。

配置文件中可以对全局配置对象 `config` 进行修改。预设的 config 对象参见[这里](https://github.com/rikumi/fresh-shell/blob/master/src/core/config.js)。

### 定制动词

修改 `config.verb`，可以将默认的动词 ƒ 修改成其他**合法的 JavaScript 标识符**。

### 嵌套 Shell 与配置继承

Fresh 可以使用 Bash、Zsh、Fish、Xonsh 等任何支持 `-c` 参数的第三方 Shell 作为内嵌 Shell 工具，只需在配置文件中更改 `config.shell` 即可：

```js
config.shell = '/bin/zsh';
```

Fresh 尽可能保持原有 Shell 的使用体验，因此，被嵌套的 Shell 默认以 `--login` 方式执行，以便于加载它们的用户配置，例如环境变量等。因此，使用 Fresh 后，你仍然可以通过修改原有 Shell 的配置文件来影响它们在 Fresh 中的行为。

如要修改被嵌套的 Shell 的执行参数（默认为 `['--login']`），可以在配置文件中操作 `config.shellArgs`。

### 定制提示符（以 Powerline 风格为例）

为了方便自定义，配置对象中 `config.prompt` 函数被拆成三个函数：`config.prompt`、`config.git`、`config.cwd`（实际被 Fresh 调用的只有 `config.prompt` 函数），以便于分别改写提示符样式、Git 显示格式和 CWD 显示格式。

这里以 Powerline 风格提示符为例，展示如何改写提示符样式。

```js
const chalk = require('chalk').default;

config.prompt = (status = 0) => {
    const bgColor = status ? chalk.bgRed : chalk.bgBlue;
    const fgColor = status ? chalk.red : chalk.blue;
    const bgBlack = chalk.bgBlack;
    const fgBlack = chalk.black;
    const fgWhite = chalk.white;
    const git = config.git();
    if (git) {
        return bgColor(' ' + fgBlack(config.cwd()) + ' ') +
            bgBlack(fgColor('') + fgWhite(config.git()) + ' ') +
            fgBlack('') + ' ';
    } else {
        return bgColor(' ' + fgBlack(config.cwd()) + ' ') +
            fgColor('') + ' ';
    }
}
```

效果如下：

![image](https://user-images.githubusercontent.com/5051300/76068492-35df1180-5fcc-11ea-9720-e9209b4f86f0.png)

### 定制 Tab 自动完成

Fresh 默认配置中提供了路径自动完成和 Git 分支自动完成；你还可以修改 `config.complete` 函数来完善这一特性。自动完成函数的写法参见 [Readline 文档](https://nodejs.org/api/readline.html#readline_use_of_the_completer_function)。

### 定制语法高亮

为了方便自定义，默认配置对象中将语法高亮分为四个函数：`config.colorizeToken`、`config.colorizeCode`、`config.colorizeCommand`、`config.colorizeOutput`，它们分别对应于对单个 JavaScript Token 的高亮、对一段代码的 Token 解析与高亮、对输入命令的高亮以及对 JavaScript 输出结果的高亮。实际被 Fresh 调用的只有 `config.colorizeCommand` 和 `config.colorizeOutput` 两个函数。

### 定制进程标题

改变 `config.makeTitle` 函数可以定制 Fresh 的进程标题，用于显示在 GUI 终端中。该函数接受零个或一个参数，接受零个参数时，需要返回 Fresh 处于空闲状态时的进程标题；接受一个参数时，该参数是要执行的命令行程序的 argv 列表，需要返回 Fresh 执行该子程序时的默认进程标题。

## 建议与贡献

欢迎对本项目提出 Issue 或 Pull Requests。需要注意的是，Fresh 作为一个外壳程序，对于功能上的要求会进行一定的取舍，在保持实现简单的前提下合理迭代。

因为 Fresh 的最大意义是用 < 500 行代码实现 JavaScript 与其他 Shell 的融合，而非做一个完美无缺的 Shell 本身。
