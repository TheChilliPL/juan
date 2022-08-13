function doNothing(callSite: TemplateStringsArray, ...substitutions: string[]) {
    let result = "";
    callSite.forEach((str, i) => {
        result += str + (i === str.length - 1 ? "" : substitutions[i]);
    });
    return result;
}

export function css(callSite: TemplateStringsArray, ...substitutions: string[]) {
    return doNothing(callSite, ...substitutions);
}