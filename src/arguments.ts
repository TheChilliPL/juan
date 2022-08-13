import {css} from "./templates";

type ParameterExecuteFunction =
    | (() => void)
    | ((value: string) => void);

export interface Parameter<T extends ParameterExecuteFunction = ParameterExecuteFunction> {
    name: string;
    aliases?: string[];
    description?: string;
    execute: T;
}

export function isNotValued(parameter: Parameter): parameter is Parameter<(() => void)> {
    switch(parameter.execute.length) {
        case 0:
            return true;
        case 1:
            return false;
        default:
            throw new Error("Unexpected parameter count of the parameter execution function.");
    }
}

export function parseArguments(parameters: Parameter[], args = process.argv.slice(2)) {
    let valuedLeft: Parameter[] = [];
    let processDashes = true;
    let remaining: string[] = [];

    function findParam(name: string): Parameter | undefined {
        return parameters.find(p => p.name == name || p.aliases?.includes(name));
    }

    function dealWith(param: Parameter) {
        if (isNotValued(param)) {
            param.execute();
        } else {
            valuedLeft.push(param);
        }
    }

    for(let arg of args) {
        if(processDashes) {
            if(arg.startsWith("-")) {
                if(arg.startsWith("--")) {
                    if (arg == "--") {
                        processDashes = false;
                        continue;
                    }

                    let paramName = arg.slice(2);
                    let param = findParam(paramName);
                    if(param) dealWith(param);
                    continue;
                }

                for(let letter of arg.slice(1)) {
                    let param = findParam(letter);
                    if(param) dealWith(param);
                }
                continue;
            }
        }

        let param = valuedLeft.shift();

        if(param) {
            param.execute(arg);
            continue;
        }

        remaining.push(arg);
    }

    return remaining;
}

export function logHelp(parameters: Parameter[]) {
    let text = "";
    let styles = [];

    let primaryColor = css`color: #fff;`;
    let secondaryColor = css`color: #aaa;`
    let monoFont = css`border: 1px #aaa solid; border-radius: 5px; font-family: monospace;`;
    let bold = css`font-weight: bold;`;

    function addDashes(name: string) {
        return name.length == 1 ? `-${name}` : `--${name}`;
    }

    for(let param of parameters) {
        text += `%c${addDashes(param.name)}`;
        styles.push(primaryColor + monoFont + bold);

        if(param.aliases) {
            for(let alias of param.aliases) {
                text += `%c, %c${addDashes(alias)}`
                styles.push(primaryColor);
                styles.push(primaryColor + monoFont);
            }
        }

        if(!isNotValued(param)) {
            text += `%c [value]`;
            styles.push(secondaryColor + css`font-style: italic;`);
        }

        text += `\n%c${param.description}\n`;
        styles.push(secondaryColor + css`display: block; padding-left: 50px;`);
    }

    console.info(text, ...styles);
}