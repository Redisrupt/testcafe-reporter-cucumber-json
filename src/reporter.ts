// tslint:disable:no-console
import * as chalk from "chalk";
import { ICucumberJsonReport } from "./cucumber-json-interface";
import {nativeFormatError, nativeNewLine, nativeSetIndent, nativeWrite} from "./reporter-helpers";
import { IError, IExtendedReporterPlugin, ITestRunInfo } from "./reporter-interface";

export const extendedReporterPlugin: IExtendedReporterPlugin = {
    reportTaskStart(startTime: Date, userAgents: string[], testCount: number, report: ICucumberJsonReport ) {
        if (report) {
            report.initializeWith(startTime, userAgents, testCount);
        }
    },
    reportFixtureStart(name: string, path: string, report: ICucumberJsonReport) {
        report.createFeature(name, path);
    },
    reportTestDone(name: string, testRunInfo: ITestRunInfo, report: ICucumberJsonReport) {
        if (testRunInfo.errs && testRunInfo.errs.length > 0) {
            const formattedErrorMessage = this.renderErrors(testRunInfo.errs);
            const screenshotPath = testRunInfo.errs
                                    .map ((err: IError) => err.screenshotPath)
                                    .filter((path) => path.endsWith(".png"))
                                    .shift();
            report
                .createScenario(name, testRunInfo)
                .withError(formattedErrorMessage)
                .withScreenshot(screenshotPath);
            return;
        }
        report.createScenario(name, testRunInfo);
    },
    reportTaskDone(endTime: Date, passed: number, warnings: string[], report: ICucumberJsonReport) {
        if (report) {
            const result = report
                    .finalizeWith(endTime, passed, warnings)
                    .toJson();
            this.write(result);
            return;
        }
        this.write("[]");
    },
    chalk: chalk.default,
    formatError: (err: any, prefix: string) => {
        return nativeFormatError(err, prefix);
    },
    newline: () => {
        return nativeNewLine();
    },
    setIndent: (val: number) => {
        return nativeSetIndent(val);
    },
    write: (text: string) => {
        return nativeWrite(text);
    },
    renderErrors(errs: any[]): string {
        const lines: string[] = [];
        errs
            .map((err: any, idx: number) => {
                const prefix = this.chalk.red(`${idx + 1}) `);
                lines.push(this.formatError(err, prefix));
            });
        return lines.join("\n");
    },
    createErrorDecorator() {
        let hasShownError: boolean = false;
        const lineSeparator = "--------------------------------------------\n";
        return {
            "a":                       (str: string) => `"${this.chalk.underline(str)}"`,
            "a screenshot-path":       (str: string) => this.chalk.grey.underline(str),
            "code":                    (str: string) => str,
            "div code-frame":          (str: string) => str,
            "div code-line":           (str: string) => {
                if (hasShownError) {
                    hasShownError = false;
                    return `${str}\n${lineSeparator}`;
                }
                return `${str}\n`;
            },
            "div code-line-last":      (str: string) => str,
            "div code-line-num":       (str: string) => `   ${str} |`,
            "div code-line-num-base":  (str: string) => {
                hasShownError = true;
                return lineSeparator + this.chalk.bgRed(` &rarr; ${str} `) + "|";
            },
            "div code-line-src":       (str: string) => str,
            "div message":             (str: string) => this.chalk.bold.red(str),
            "div screenshot-info":     (str: string) => str,
            "div stack":               (str: string) => "\n\n" + str,
            "div stack-line":          (str: string) => str + "\n",
            "div stack-line-last":     (str: string) => str,
            "div stack-line-location": (str: string) => ` (${this.chalk.grey.underline(str)})`,
            "div stack-line-name":     (str: string) => `   at ${this.chalk.bold(str)}`,
            "span subtitle":           (str: string) => `- ${this.chalk.bold.red(str)} -`,
            "span syntax-comment":     (str: string) => this.chalk.grey.bold(str),
            "span syntax-invalid":     (str: string) => this.chalk.inverse(str),
            "span syntax-keyword":     (str: string) => this.chalk.cyan(str),
            "span syntax-number":      (str: string) => this.chalk.magenta(str),
            "span syntax-punctuator":  (str: string) => this.chalk.grey(str),
            "span syntax-regex":       (str: string) => this.chalk.magenta(str),
            "span syntax-string":      (str: string) => this.chalk.green(str),
            "span user-agent":         (str: string) => this.chalk.grey(str),
            "strong":                  (str: string) => this.chalk.bold(str),
        };
    },
};