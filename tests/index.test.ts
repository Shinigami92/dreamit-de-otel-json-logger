/* eslint-disable max-len */
import {
    JsonDiagLogger, 
    LogLevel, 
    loggerConsole 
} from '@/index'

const logger = new JsonDiagLogger({
    loggerName: 'test-logger', 
    serviceName: 'test-service',
})
const testMessage = 'I am a log message!'
const timeoutMessage = '{"stack":"Error: 14 UNAVAILABLE: No connection established}'
const circularStructure: unknown[] = [1, 'test']
circularStructure.push(circularStructure)
const complexObject = { 'one': { 'two': { 'three': { 'message': 'test' } } } }

test.each`
    message                             | logArguments                       | loglevel            | expectedLogMessage                                                                             | expectedLogLevel 
    ${undefined}                        | ${undefined}                       | ${LogLevel.verbose} | ${undefined + '. Log arguments are: undefined'}                                                | ${LogLevel.verbose}
    ${testMessage}                      | ${undefined}                       | ${LogLevel.info}    | ${testMessage + '. Log arguments are: undefined'}                                              | ${LogLevel.info}
    ${testMessage}                      | ${1}                               | ${LogLevel.warn}    | ${testMessage + '. Log arguments are: 1'}                                                      | ${LogLevel.warn}
    ${testMessage}                      | ${[1, 'test']}                     | ${LogLevel.error}   | ${testMessage + '. Log arguments are: [ 1, \'test\' ]'}                                        | ${LogLevel.error}
    ${''}                               | ${[]}                              | ${LogLevel.debug}   | ${'. Log arguments are: []'}                                                                   | ${LogLevel.debug}
    ${'{context: {info:"something"}}' } | ${undefined}                       | ${LogLevel.info}    | ${'\'{context: {info:"something"}}\'. Log arguments are: undefined'}                           | ${LogLevel.info}
    ${'["one", "two"]' }                | ${undefined}                       | ${LogLevel.info}    | ${'\'["one", "two"]\'. Log arguments are: undefined'}                                          | ${LogLevel.info}
    ${testMessage}                      | ${[{context: {info:'something'}}]} | ${LogLevel.warn}    | ${testMessage + '. Log arguments are: [ { context: { info: \'something\' } } ]'}               | ${LogLevel.warn}
    ${testMessage}                      | ${circularStructure}               | ${LogLevel.warn}    | ${testMessage + '. Log arguments are: <ref *1> [ 1, \'test\', [Circular *1] ]'}                | ${LogLevel.warn}
    ${testMessage}                      | ${complexObject}                   | ${LogLevel.info}    | ${testMessage + '. Log arguments are: {\n  one: { two: { three: { message: \'test\' } } }\n}'} | ${LogLevel.info}
    ${JSON.stringify(complexObject)}    | ${[1, 'test']}                     | ${LogLevel.info}    | ${'\'{"one":{"two":{"three":{"message":"test"}}}}\'. Log arguments are: [ 1, \'test\' ]'}      | ${LogLevel.info}
    `('expects a correct logEntry is created for given $message , $logArguments and $loglevel ', ({message, logArguments, loglevel, expectedLogMessage, expectedLogLevel}) => {
    const logEntry = logger.createLogEntry({
        message,
        logArguments,
        loglevel,
    })
    expect(logEntry.message).toBe(expectedLogMessage)
    expect(logEntry.level).toBe(expectedLogLevel)
    expect(logEntry.logger).toBe('test-logger')
    expect(logEntry.serviceName).toBe('test-service')
})


test.each`
    message                             | truncatedText                      | truncateLimit  | expectedLogMessage                                                                         
    ${timeoutMessage}                   | ${undefined}                       | ${undefined}   | ${`'${timeoutMessage}'. Log arguments are: []`}                                                
    ${timeoutMessage}                   | ${undefined}                       | ${20}          | ${'\'{"stack"_TRUNCATED_'}                                        
    ${timeoutMessage}                   | ${'_TRUNC_'}                       | ${20}          | ${'\'{"stack":"Er_TRUNC_'}                                                
    ${timeoutMessage}                   | ${undefined}                       | ${2}           | ${'\'{'}                                        
    ${timeoutMessage}                   | ${undefined}                       | ${2000}        | ${`'${timeoutMessage}'. Log arguments are: []`}                                                
    ${timeoutMessage}                   | ${undefined}                       | ${73}          | ${`'${timeoutMessage}'. Log arguments are: []`}                                   
    ${timeoutMessage}                   | ${undefined}                       | ${72}          | ${`'${timeoutMessage}'_TRUNCATED_`}   
    `('expects the log message to be truncated correctly for given $message , $truncatedText and $truncateLimit', ({message, truncatedText, truncateLimit, expectedLogMessage}) => {
    const testLogger = new JsonDiagLogger({
        loggerName: 'test-logger',
        serviceName: 'test-service',
        truncatedText: truncatedText,
        truncateLimit: truncateLimit,
    })
    const logEntry = testLogger.createLogEntry({
        message,
        logArguments: [],
        loglevel: LogLevel.info,
    })
    expect(logEntry.message).toBe(expectedLogMessage)
})

describe('Logger writes expected output to command line', () => {
    beforeEach(() => {
        // Set default options
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
        })
        jest.spyOn(loggerConsole, 'log').mockImplementation()
        jest.useFakeTimers({now: new Date('2023-09-06T00:00:00Z')})
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    test('Test DiagLogger interface functions', () => {
        // Call each log function once. Should call console.log for all log levels
        logger.debug('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(1, generateExpectedLogMessage('test', 'DEBUG'))
        logger.verbose('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(2, generateExpectedLogMessage('test','VERBOSE'))
        logger.info('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(3, generateExpectedLogMessage('test','INFO'))
        logger.error('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(4, generateExpectedLogMessage('test','ERROR'))
        logger.warn('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(5, generateExpectedLogMessage('test','WARN'))
    })

    test('Test Service Request error message logging', () => {
        // Should log service request message on error if option "logLevelForServiceRequestErrorMessages" is not set
        logger.error('Service request', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(1, generateExpectedLogMessage('Service request','ERROR'))
 
        // Should log service request message on info if option "logLevelForServiceRequestErrorMessages" is set to INFO
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForServiceRequestErrorMessages: LogLevel.info
        })
        logger.error('Service request', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(2, generateExpectedLogMessage('Service request','INFO'))
    })

    test('Test Timeout error message logging', () => {         
        // Should log Timeout message on error if option "logLevelForTimeoutErrorMessages" is not set
        logger.error(timeoutMessage, 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(1, generateExpectedTimeoutMessage('ERROR'))

        // Should log Timeout error message on info if option "logLevelForServiceRequestErrorMessages" is set to INFO
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForTimeoutErrorMessages: LogLevel.info
        })
        logger.error(timeoutMessage, 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(2, generateExpectedTimeoutMessage('INFO'))
    })

    test('Test downgrading and ignoring verbose message', () => {
        // Downgrade verbose log entry
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForVerbose: LogLevel.debug
        })
        logger.verbose('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(1, generateExpectedLogMessage('test','DEBUG'))
   
        // Do not log verbose log entry
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForVerbose: LogLevel.off
        })
        logger.verbose('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenCalledTimes(1)
    })
})

function generateExpectedLogMessage(message: string, loglevel: string): string {
    return `{"level":"${loglevel}","logger":"test-logger","message":"${message}. Log arguments are: [ 1, { name: 'myname' } ]","serviceName":"test-service","timestamp":"2023-09-06T00:00:00.000Z"}`
}

function generateExpectedTimeoutMessage(loglevel: string) : string {
    return `{"level":"${loglevel}","logger":"test-logger","message":"'{\\"stack\\":\\"Error: 14 UNAVAILABLE: No connection established}'. Log arguments are: [ 1, { name: 'myname' } ]","serviceName":"test-service","timestamp":"2023-09-06T00:00:00.000Z"}`
}
