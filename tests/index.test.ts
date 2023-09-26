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

test.each`
    message                             | logArguments                       | loglevel            | expectedLogMessage                                                         | expectedLogLevel 
    ${undefined}                        | ${undefined}                       | ${LogLevel.verbose} | ${undefined + '. Log arguments are: undefined'}                            | ${LogLevel.verbose}
    ${testMessage}                      | ${undefined}                       | ${LogLevel.info}    | ${testMessage + '. Log arguments are: undefined'}                          | ${LogLevel.info}
    ${testMessage}                      | ${1}                               | ${LogLevel.warn}    | ${testMessage + '. Log arguments are: 1'}                                  | ${LogLevel.warn}
    ${testMessage}                      | ${[1, 'test']}                     | ${LogLevel.error}   | ${testMessage + '. Log arguments are: [1,"test"]'}                         | ${LogLevel.error}
    ${''}                               | ${[]}                              | ${LogLevel.debug}   | ${'. Log arguments are: []'}                                               | ${LogLevel.debug}
    ${'{context: {info:"something"}}' } | ${undefined}                       | ${LogLevel.info}    | ${'"{context: {info:\\"something\\"}}". Log arguments are: undefined'}     | ${LogLevel.info}
    ${'["one", "two"]' }                | ${undefined}                       | ${LogLevel.info}    | ${'"[\\"one\\", \\"two\\"]". Log arguments are: undefined'}                | ${LogLevel.info}
    ${testMessage}                      | ${[{context: {info:'something'}}]} | ${LogLevel.warn}    | ${testMessage + '. Log arguments are: [{"context":{"info":"something"}}]'} | ${LogLevel.warn}
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

describe('Logger writes expected output to command line', () => {
    beforeAll(() => {
        jest.spyOn(loggerConsole, 'log').mockImplementation()
        jest.useFakeTimers({now: new Date('2023-09-06T00:00:00Z')})
    })

    afterAll(() => {
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

        // Should log service request message on error if option "logLevelForServiceRequestErrorMessages" is not set
        logger.error('Service request', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(6, generateExpectedLogMessage('Service request','ERROR'))
        
        // Downgrade verbose log entry
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForVerbose: LogLevel.debug
        })
        logger.verbose('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(7, generateExpectedLogMessage('test','DEBUG'))
       
        // Do not log verbose log entry
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForVerbose: LogLevel.off
        })
        logger.verbose('test', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenCalledTimes(7)       

        // Should log service request message on warn if option "logLevelForServiceRequestErrorMessages" is set to WARN
        logger.setOptions({
            loggerName: 'test-logger', 
            serviceName: 'test-service',
            logLevelForServiceRequestErrorMessages: LogLevel.warn
        })
        logger.error('Service request', 1, {name: 'myname'})
        expect(loggerConsole.log).toHaveBeenNthCalledWith(8, generateExpectedLogMessage('Service request','WARN'))
    })
})

function generateExpectedLogMessage(message: string, loglevel: string): string {
    return `{"level":"${loglevel}","logger":"test-logger","message":"${message}. Log arguments are: [1,{\\"name\\":\\"myname\\"}]","serviceName":"test-service","timestamp":"2023-09-06T00:00:00.000Z"}`
}
