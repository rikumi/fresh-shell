# fresh-shell
🍫 Your shell interactive outputs, now into JavaScript string.

![](https://user-images.githubusercontent.com/5051300/51076431-3c793e00-16d3-11e9-85b9-3b82c1a72012.png)

## Features
1. I made the function ƒ that receives bash commands as string templates, and choose to execute them in the foreground or background according to context.
2. The beginning characters ƒ` are initially positioned there, and can be changed, thus making it as easy to use as a bash.
3. When the command is executed directly, it is interactive with full compatibility like a normal bash; when nested in expressions, they are just hidden and still interactive. This is a feature. Try typing:
    ```
    ƒ`vim`.length
    ```
    and then use your mind and keyboard to quit it.
4. Fully customizable. If it's not fully enough, edit the code and don't be worried about not understanding bash syntaxes.
