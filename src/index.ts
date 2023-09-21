import {Console} from 'node:console'
import { 
    DiagLogger
} from '@opentelemetry/api'

export const loggerConsole: Console = new Console(process.stdout, process.stderr, false)

export enum LogLevel {
    debug = 'DEBUG',
    error = 'ERROR',
    info = 'INFO',
    warn = 'WARN',
    verbose = 'VERBOSE'
}

export interface LogEntry {
    logger: string;
    timestamp: string;
    message: string;
    level: LogLevel;
    serviceName: string;
}

export interface LogEntryInput {
    message: string,
    logArguments: unknown[],
    loglevel: LogLevel,
}

/**
 * Logger options to define behavior of logger  
 * @param {string} loggerName - The logger name of the logger.
 * Will be output to "logger" field in JSON.
 * @param {string} serviceName - The service name of the logger.
 * Will be output to "serviceName" field in JSON.
 */
export interface LoggerOptions {
    loggerName: string
    serviceName: string
}

/**
 * Logger implementation that outputs log entries as JSON text to console.
 * Can be useful for log aggregation tools.
 */
export class JsonDiagLogger implements DiagLogger {
    loggerOptions: LoggerOptions

    /**
     * Creates a new instance of Logger.
     * @param {LoggerOptions} options - The logger options to be used
     */
    constructor(options: LoggerOptions) {
        this.loggerOptions = options
    }

    debug(message: string, ...arguments_: unknown[]): void {
        this.logMessage({
            message, 
            logArguments: arguments_, 
            loglevel: LogLevel.debug,
        })
    }

    error(message: string, ...arguments_: unknown[]): void {
        this.logMessage({
            message, 
            logArguments: arguments_, 
            loglevel: LogLevel.error,
        })}

    info(message: string, ...arguments_: unknown[]): void {
        this.logMessage({
            message, 
            logArguments: arguments_, 
            loglevel: LogLevel.info,
        })
    }

    verbose(message: string, ...arguments_: unknown[]): void {
        this.logMessage({
            message, 
            logArguments: arguments_, 
            loglevel: LogLevel.verbose,
        })
    }

    warn(message: string, ...arguments_: unknown[]): void {
        this.logMessage({
            message, 
            logArguments: arguments_, 
            loglevel: LogLevel.warn,
        })
    }

   

    logMessage(logEntryInput: LogEntryInput): void {
        loggerConsole.log(JSON.stringify(this.createLogEntry(logEntryInput)))
    }

    createLogEntry(logEntryInput: LogEntryInput): LogEntry {
        const {
            message,
            logArguments,
            loglevel,
        } = logEntryInput
        return {
            level: loglevel,
            logger: this.loggerOptions.loggerName,
            message: `${message}. Log arguments are: ${JSON.stringify(logArguments)}`,
            serviceName: this.loggerOptions.serviceName,
            timestamp:  new Date().toISOString(),
        }
    } 
}
