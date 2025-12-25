// import: local interfaces
import { PolygonRenderOptions } from '../../interfaces/renderer/PolygonRenderOptions.js'
import { PointRenderOptions } from '../../interfaces/renderer/PointRenderOptions.js'
import { ShaderCache } from '../../interfaces/renderer/ShaderCache.js'
import { ShaderOptions } from '../../interfaces/shader/ShaderOptions.js'

// import: local types
import { Vector2 } from '../../types/math/Vector2.js'
import { Vector3 } from '../../types/math/Vector3.js'
import { Vector4 } from '../../types/math/Vector4.js'
import { FragmentShader } from '../../types/shader/FragmentShader.js'
import { VertexShader } from '../../types/shader/VertexShader.js'

// import: local modules
import { util } from '../../modules/util.js'

// code
export class Renderer {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    shaderCache: ShaderCache = { vertex: {}, fragment: {} }
    imageData: ImageData
    #gcm = {
        _linePixels: {},
        _linePixelYList: new Set<number>()
    }
    constructor(canvas: HTMLCanvasElement) {
        // get canvas & context
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        // create image data
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height)
    }
    clear() {
        // clear imageData
        this.imageData.data.fill(0)
    }
    resize() {
        // resize imageData
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height)
    }
    registerShader(name: string, shader: VertexShader | FragmentShader, options?: ShaderOptions) {
        // get shader options
        let opts = {
            type: options?.type ?? (() => {
                console.warn(`Shader type not specified for shader \'${name}\'. Defaulting to \'vertex\'.`)
                return 'vertex'
            })()
        }

        // ignore if this shader is already registered
        if (name in this.shaderCache[opts.type])
            return

        // throw a warning if the shader has an invalid type
        if (opts.type !== 'vertex' && opts.type !== 'fragment')
            return console.warn(`Invalid shader type for shader \'${name}\'. Defaulting to \'vertex\'.`)

        // add shader
        this.shaderCache[opts.type][name] = shader
    }
    getVertexShader(name: string) {
        // return vertex shader with specified name
        return this.shaderCache.vertex[name]
    }
    getFragmentShader(name: string) {
        // return fragment shader with specified name
        return this.shaderCache.fragment[name]
    }
    #plotPixel(pos: Vector2, fShader: FragmentShader) {
        // get pixel position
        let x = Math.trunc(pos[0])
        let y = Math.trunc(pos[1])

        // get pixel index
        let index = (y * this.imageData.width + x) * 4

        // avoid pixels that are outside of range
        if (x < 0 || y < 0 || x > this.imageData.width || y > this.imageData.height)
            return

        let fColor = fShader({ screenPosition: pos }).color
        let fColorWrap = [
            fColor[0] ?? 0.0,
            fColor[1] ?? 0.0,
            fColor[2] ?? 0.0,
            fColor[3] ?? 1.0,
        ]
        let color = [
            Math.trunc(util.math.blend.lerp(this.imageData.data[index + 0] / 255, fColorWrap[0], fColorWrap[3]) * 255),
            Math.trunc(util.math.blend.lerp(this.imageData.data[index + 1] / 255, fColorWrap[1], fColorWrap[3]) * 255),
            Math.trunc(util.math.blend.lerp(this.imageData.data[index + 2] / 255, fColorWrap[2], fColorWrap[3]) * 255),
            255
        ]

        // write pixel
        this.imageData.data[index + 0] = color[0]
        this.imageData.data[index + 1] = color[1]
        this.imageData.data[index + 2] = color[2]
        this.imageData.data[index + 3] = color[3]
    }
    #plotLine(pos0: Vector2, pos1: Vector2, fShader: FragmentShader) {
        let x0 = Math.trunc(pos0[0]), 
            x1 = Math.trunc(pos1[0])
        let y0 = Math.trunc(pos0[1]), 
            y1 = Math.trunc(pos1[1])

        let dx = Math.abs(x1 - x0), 
            dy = -Math.abs(y1 - y0)
        let sx = x0 < x1 ? 1 : -1,
            sy = y0 < y1 ? 1 : -1
        let error = dx + dy

        while (true) {
            if (
                x0 >= 0 && x0 <= this.imageData.width  &&
                y0 >= 0 && y0 <= this.imageData.height
            )
                this.#plotPixel([x0, y0], fShader)
            if (!this.#gcm._linePixels[y0])
                this.#gcm._linePixels[y0] = new Set<number>()
            this.#gcm._linePixels[y0].add(x0)
            this.#gcm._linePixelYList.add(y0)
            let e2 = 2 * error
            if (e2 >= dy) {
                if (x0 === x1)
                    break
                error += dy
                x0 += sx
            }
            if (e2 <= dx) {
                if (y0 === y1)
                    break
                error += dx
                y0 += sy
            }
        }
    }
    drawPolygon(points: (Vector2 | Vector3 | Vector4)[] = [], options: PolygonRenderOptions) {
        this.#gcm._linePixels = {}
        this.#gcm._linePixelYList.clear()
        // do nothing if there's no points to use
        if (points.length == 0)
            return

        // get shaders
        let vShader = this.getVertexShader(options.shader?.vertex)
        let fShader = this.getFragmentShader(options.shader?.fragment)

        // check if shaders exist
        if (!vShader || !fShader)
            return console.warn('One or more shaders are missing for this object. The object will not be rendered.')

        // render points
        if (points.length === 2) {
            // if there's only two points, render one line
            let p1 = points[0]
            let p2 = points[1]

            // skip points if one of them is undefined
            if (!p1 || !p2)
                return

            // do nothing if one or more numbers aren't valid
            if (
                p1.find(n => !Number.isFinite(n)) !== undefined ||
                p2.find(n => !Number.isFinite(n)) !== undefined
            )
                return

            // run shaders
            let vsOutput1 = vShader({ position: p1 })
            let vsOutput2 = vShader({ position: p2 })

            // skip if either number in these points are invalid
            if (
                vsOutput1.position.find(n => !Number.isFinite(n)) !== undefined ||
                vsOutput2.position.find(n => !Number.isFinite(n)) !== undefined
            )
                return

            // skip if the both points are out of bounds
            if (
                (
                    vsOutput1.position[0] >  1.0 ||
                    vsOutput1.position[0] < -1.0 ||
                    vsOutput1.position[1] >  1.0 ||
                    vsOutput1.position[1] < -1.0
                ) &&
                (
                    vsOutput2.position[0] >  1.0 ||
                    vsOutput2.position[0] < -1.0 ||
                    vsOutput2.position[1] >  1.0 ||
                    vsOutput2.position[1] < -1.0
                )
            )
                return

            // draw line
            this.#plotLine(
                [ 
                    ( (vsOutput1.position[0] ?? 0.0) * 0.5 + 0.5) * this.imageData.width, 
                    (-(vsOutput1.position[1] ?? 0.0) * 0.5 + 0.5) * this.imageData.height 
                ], 
                [ 
                    ( (vsOutput2.position[0] ?? 0.0) * 0.5 + 0.5) * this.imageData.width, 
                    (-(vsOutput2.position[1] ?? 0.0) * 0.5 + 0.5) * this.imageData.height 
                ], 
                fShader
            )
        } else {
            for (let i = 0; i < points.length; i++) {
                // get current & next point
                let point = points[i]
                let next = points[(i + 1) % points.length]

                // skip poinnst if one or more are undefined
                if (!point || !next)
                    continue

                // do nothing if one or more numbers aren't valid
                if (
                    point.find(n => !Number.isFinite(n)) !== undefined ||
                    next .find(n => !Number.isFinite(n)) !== undefined 
                )
                    continue

                // run shaders
                let vsOutput1 = vShader({ position: point })
                let vsOutput2 = vShader({ position: next  })

                // skip if either number in these points are invalid
                if (
                    vsOutput1.position.find(n => !Number.isFinite(n)) !== undefined ||
                    vsOutput2.position.find(n => !Number.isFinite(n)) !== undefined
                )
                    continue

                // skip if the both points are out of bounds
                if (
                    (
                        vsOutput1.position[0] >  1.0 ||
                        vsOutput1.position[0] < -1.0 ||
                        vsOutput1.position[1] >  1.0 ||
                        vsOutput1.position[1] < -1.0
                    ) &&
                    (
                        vsOutput2.position[0] >  1.0 ||
                        vsOutput2.position[0] < -1.0 ||
                        vsOutput2.position[1] >  1.0 ||
                        vsOutput2.position[1] < -1.0
                    )
                )
                    continue

                // draw line
                this.#plotLine(
                    [ 
                        ( (vsOutput1.position[0] ?? 0.0) * 0.5 + 0.5) * this.imageData.width, 
                        (-(vsOutput1.position[1] ?? 0.0) * 0.5 + 0.5) * this.imageData.height 
                    ], 
                    [ 
                        ( (vsOutput2.position[0] ?? 0.0) * 0.5 + 0.5) * this.imageData.width, 
                        (-(vsOutput2.position[1] ?? 0.0) * 0.5 + 0.5) * this.imageData.height 
                    ],
                    fShader
                )
            }
            // if fill is enabled...
            if (options?.fill) {
                // get min & max y position across all pixels
                let y0 = util.math.min(this.#gcm._linePixelYList)
                let y1 = util.math.max(this.#gcm._linePixelYList)

                for (let y = y0; y <= y1; y++) {
                    // skip if row is out of height range
                    if (y < 0 || y > this.imageData.height)
                        continue
                    // skip if there's no pixels for this Y position
                    if (!this.#gcm._linePixels[y])
                        continue

                    // get gap start & stop
                    let p1 = util.math.min(this.#gcm._linePixels[y])
                    let p2 = util.math.max(this.#gcm._linePixels[y])

                    // skip if one of the points are undefined
                    if (p1 === undefined || p2 === undefined)
                        continue

                    // if there's no gap, skip
                    if (p1 + 1 >= p2)
                        continue

                    // iterate through the gap
                    for (let x = p1 + 1; x < p2; x++) {
                        // skip if x is out of width range
                        if (x < 0 || x > this.imageData.width)
                            continue

                        // draw pixel
                        this.#plotPixel([x, y], fShader)
                    }
                }
            }
        }
    }
    drawPoints(points: (Vector2 | Vector3 | Vector4)[] = [], options: PointRenderOptions) {
        // do nothing if there's no points to use
        if (points.length == 0)
            return

        // get shaders
        let vShader = this.getVertexShader(options.shader?.vertex)
        let fShader = this.getFragmentShader(options.shader?.fragment)

        // check if shaders exist
        if (!vShader || !fShader)
            return console.warn('One or more shaders are missing for this object. The object will not be rendered.')

        // render points
        for (let point of points) {
            // do nothing if one or more numbers aren't valid
            if (point.find(n => !Number.isFinite(n)) !== undefined)
                continue

            // run shaders
            let vsOutput = vShader({ position: point })

            // skip if the point is out of bounds
            if (
                vsOutput.position[0] >  1.0 ||
                vsOutput.position[0] < -1.0 ||
                vsOutput.position[1] >  1.0 ||
                vsOutput.position[1] < -1.0
            )
                continue

            // draw pixel
            this.#plotPixel(
                [ 
                    ( (vsOutput.position[0] ?? 0.0) * 0.5 + 0.5) * this.imageData.width, 
                    (-(vsOutput.position[1] ?? 0.0) * 0.5 + 0.5) * this.imageData.height 
                ], 
                fShader
            )
        }
    }
    render() {
        this.ctx.putImageData(this.imageData, 0, 0)
    }
}