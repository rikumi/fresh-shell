# fresh-shell
🍫 Your shell interactive outputs, now into JavaScript string.

![](https://user-images.githubusercontent.com/5051300/51085784-09898580-1779-11e9-9917-a6dea80a5303.png)

## How to type ƒ
Use `option+F`.

## Features
1. I made the function ƒ that receives bash commands as string templates, and choose to execute them in the foreground or background according to context.
2. The beginning two characters ƒ-backtick are __automatically put in__, and can be changed; The final backtick is also auto-completed. This makes it no hard than using a bash.
3. When the command is executed directly, it is interactive with full compatibility like a normal bash; when nested in expressions, they are just hidden and still interactive. This is a feature. Try typing:
    ```
    ƒ`vim`.length
    ```
    and then use your mind and keyboard to quit it.
4. Fully customizable. If it's not full enough, edit the code and don't be worried about not understanding bash syntaxes.
