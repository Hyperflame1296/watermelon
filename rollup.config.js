import terser     from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import resolve    from '@rollup/plugin-node-resolve'

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'iife',
        name: 'Watermelon'
    },
    plugins: [
        resolve({
            browser: true,
            extensions: ['.js', '.ts']
        }),
        typescript(),
        terser()
    ]
}