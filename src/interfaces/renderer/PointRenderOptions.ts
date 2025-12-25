// declaration
export interface PointRenderOptions {
    /**
     * Shader options.
     */
    shader: {
        /**
         * The vertex shader that this object will use to render.
         */
        vertex: string
        /**
         * The fragment shader that this object will use to render.
         */
        fragment: string
    }
}