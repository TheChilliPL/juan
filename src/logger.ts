export enum LogLevel {
    VERBOSE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}

export abstract class Aggregator {
    abstract log(logger: Logger, level: LogLevel, message: string, ...args: any[]): void;
}

export class ConsoleAggregator extends Aggregator {
    static formatForConsole(message: string, ...args: any[]): any[] {
        let result = [];
        const placeholderRegex = /{\d+}/g;
        let placeholders = message.match(placeholderRegex) ?? [];
        let parts = message.split(placeholderRegex);

        for(let i = 0; i < parts.length; i++) {
            result.push(parts[i]);
            if(i < placeholders.length) {
                let j = Number(placeholders[i].slice(1,-1));
                result.push(args[j]);
            }
        }

        return result;
    }

    log(logger: Logger, level: LogLevel, message: string, ...args: any[]): void {
        let fun = console.log;

        // Use the appropriate console function depending on the log level
        switch(level) {
            case LogLevel.VERBOSE:
            case LogLevel.DEBUG:
                fun = console.debug;
                break;

            case LogLevel.INFO:
                fun = console.info;
                break;

            case LogLevel.WARN:
                fun = console.warn;
                break;

            case LogLevel.ERROR:
            case LogLevel.FATAL:
                fun = console.error;
                break;
        }

        let levelName = LogLevel[level];

        fun(...[
            `[${levelName}] ${logger.name}: `,
            ...ConsoleAggregator.formatForConsole(message, ...args)
        ]);
    }
}

export class LogManager {
    aggregators: Aggregator[] = [];

    log(logger: Logger, level: LogLevel, message: string, ...args: any[]): void {
        for(const aggregator of this.aggregators) {
            try {
                aggregator.log(logger, level, message, ...args);
            } catch (e) {
                console.error(e);
                // Ignore
            }
        }
    }
}

export class Logger {
    constructor(manager: LogManager, name: string) {
        this.name = name;
        this.manager = manager;
    }

    readonly name: string;
    readonly manager: LogManager;

    log(level: LogLevel, message: string, ...args: any[]): void {
        this.manager.log(this, level, message, ...args);
    }

    verbose(message: string, ...args: any[]): void {
        this.log(LogLevel.VERBOSE, message, ...args);
    }

    debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    fatal(message: string, ...args: any[]): void {
        this.log(LogLevel.FATAL, message, ...args);
    }
}

export let logManager: LogManager = new LogManager();
logManager.aggregators.push(
    new ConsoleAggregator()
);
