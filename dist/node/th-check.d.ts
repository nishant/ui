/** Every unknown th-* class in the given files and directories, with its file and 1-based line. */
declare function checkFiles(paths: string[]): {
    file: string;
    line: number;
    cls: string;
}[];

export { checkFiles };
