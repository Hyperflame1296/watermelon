// declaration
export interface PolygonRenderOptions {
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
    /**
     * Whether this polygon is filled or not.
     */
    fill?: boolean
}