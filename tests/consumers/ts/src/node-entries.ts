// The Node-side entries: they must type-check under every TypeScript version and resolution.
import { nishThemeInit } from 'nish-ui/vite';
import * as eslintPlugin from 'nish-ui/eslint';
import * as server from 'nish-ui/server';
import * as hono from 'nish-ui/server/hono';

export const used = [nishThemeInit, eslintPlugin, server, hono];
