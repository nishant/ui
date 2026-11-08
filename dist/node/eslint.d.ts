/** Every `<name>` in `bg-th-<name>` that @nish/ui defines. */
declare const TH_COLOR_NAMES: ReadonlySet<string>;

interface RuleContext {
    report(d: {
        node: unknown;
        message?: string;
        messageId?: string;
        data?: Record<string, string>;
    }): void;
}
interface StringNode {
    value?: unknown;
}
interface TemplateNode {
    value: {
        cooked?: string | null;
    };
}
interface NishRule {
    meta: {
        type: 'problem';
        docs: {
            description: string;
            url: string;
        };
        schema: [];
        messages?: Record<string, string>;
    };
    create(context: RuleContext): {
        Literal(node: StringNode): void;
        TemplateElement(node: TemplateNode): void;
    };
}
declare const rules: Record<string, NishRule>;
/** The ESLint plugin object: `plugins: { nish: plugin }`. */
declare const plugin: {
    meta: {
        name: string;
    };
    rules: Record<string, NishRule>;
};

/** One flat-config object, structurally what ESLint's `Linter.Config` accepts. */
interface NishFlatConfig {
    name: string;
    files: string[];
    plugins?: Record<string, typeof plugin>;
    rules: Record<string, unknown>;
}
/** Flat-config arrays to spread after `tseslint.configs.recommended`:
 *  react (an app's UI: the core rules plus the six nish/* theme rules), node (servers and scripts:
 *  the core rules only), recommended (= react). */
declare const configs: Record<'recommended' | 'react' | 'node', NishFlatConfig[]>;
declare const nish: {
    meta: {
        name: string;
    };
    plugin: {
        meta: {
            name: string;
        };
        rules: Record<string, NishRule>;
    };
    rules: Record<string, NishRule>;
    configs: Record<"recommended" | "react" | "node", NishFlatConfig[]>;
};

export { TH_COLOR_NAMES, configs, nish as default, plugin, rules };
export type { NishFlatConfig };
