import type {RenderContextInterface} from "./render_context_interface.ts";

// @ts-ignore
import shaderVert from "../webgl/shaders/vertex.glsl?raw";
// @ts-ignore
import shaderFrag from "../webgl/shaders/fragment.glsl?raw";
import { initWebGLProgram } from "../webgl/shaders.ts";

export default class RenderContextWebGL implements RenderContextInterface {

    private readonly ctx: WebGL2RenderingContext;
    private readonly memory: WebAssembly.Memory;
    private readonly width: number;
    private readonly height: number;

    private readonly buffers: { position: WebGLBuffer, uv: WebGLBuffer };
    private readonly programInfo: any;

    constructor(
        canvas: HTMLCanvasElement,
        memory: WebAssembly.Memory,
        width: number,
        height: number
    ) {

        this.ctx = canvas.getContext("webgl2") as WebGL2RenderingContext;

        if (!this.ctx) {
            throw new Error("Failed to get WebGL rendering context");
        }

        this.memory = memory;

        this.width = width;
        this.height = height;

        const shaderProgram = initWebGLProgram(this.ctx, shaderVert, shaderFrag);

        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                positionLoc: this.ctx.getAttribLocation(shaderProgram, "a_position"),
                textureCoords: this.ctx.getAttribLocation(shaderProgram, "a_texCoord")
            },
            uniformLocations: {
                texture: this.ctx.getUniformLocation(shaderProgram, "u_texture")
            },
        };

        this.buffers = this.initBuffers(this.ctx);

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(this.ctx, this.buffers.position, this.programInfo);
        this.setUVAttribute(this.ctx, this.buffers.uv, this.programInfo);

    }

    drawGrid(): void {
        // todo
    }

    drawCells(cellsPtr: number): void {

        let gl = this.ctx;

        const numBytes = Math.ceil((this.width * this.height) / 8);
        const cells: Uint8Array = new Uint8Array(this.memory.buffer, cellsPtr, numBytes);

        let gridWidth = this.width;
        let gridHeight = this.height;

        const input = new Uint8Array(gridWidth * gridHeight * 4);
        for (let i = 0; i < gridWidth * gridHeight; i++) {
            const alive = (cells[Math.floor(i / 8)] >> (i % 8)) & 1;
            const v = alive ? 255 : 0; // Black for alive, white for dead
            input[i * 4 + 0] = v;
            input[i * 4 + 1] = v;
            input[i * 4 + 2] = v;
            input[i * 4 + 3] = 255;
        }

        const tex = this.createTextureWithGridData(gl, input, this.width, this.height);
        const fb = this.createFramebuffer(gl);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        this.drawScene(gl, this.programInfo);
    }

    private initBuffers(gl: WebGL2RenderingContext): { position: WebGLBuffer; uv: WebGLBuffer } {
        const positionBuffer = this.initPositionBuffer(gl);
        const uvBuffer = this.initUVBuffer(gl);

        return {
            position: positionBuffer,
            uv: uvBuffer,
        };
    }

    private drawScene(gl: WebGL2RenderingContext, programInfo: any) {
        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private initPositionBuffer(gl: WebGL2RenderingContext): WebGLBuffer {

        // create an array of positions for the square.
        const positions = [
            -1.0, -1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
        ];

        // Create a buffer for the square's positions.
        const positionBuffer = gl.createBuffer();

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        return positionBuffer;
    }

    private initUVBuffer(gl: WebGL2RenderingContext): WebGLBuffer {

        // Define UV coordinates for a fullscreen quad
        const uvCoordinates = [
            0.0, 0.0, // Bottom-left
            0.0, 1.0, // Top-left
            1.0, 0.0, // Bottom-right
            1.0, 1.0, // Top-right
            0.0, 1.0,
            1.0, 0.0, // Repeat the last two for the triangle strip
        ];

        // Create a buffer for the UV coordinates
        const uvBuffer = gl.createBuffer();

        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

        // Pass the UV data to the buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvCoordinates), gl.STATIC_DRAW);

        return uvBuffer;
    }

    private setUVAttribute(gl: WebGL2RenderingContext, uvBuffer: WebGLBuffer, programInfo: any) {
        const numComponents = 2; // 2 values per UV coordinate
        const type = gl.FLOAT; // 32-bit float
        const normalize = false; // Don't normalize
        const stride = 0; // No stride
        const offset = 0; // Start at the beginning of the buffer

        // Bind the UV buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

        // Set up the attribute pointer
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoords, numComponents, type, normalize, stride, offset);

        // Enable the attribute
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoords);
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    private setPositionAttribute(gl: WebGL2RenderingContext, buffer: WebGLBuffer, programInfo: any) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.positionLoc,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.positionLoc);
    }

    private createTexture(gl: WebGLRenderingContext) {
        const tex = gl.createTexture();
        if (tex === null) {
            throw Error("failed to create texture");
        }

        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
    }

    private createTextureWithGridData(
        gl: WebGLRenderingContext,
        arr: ArrayBufferView | null,
        width: number,
        height: number
    ) {
        const srcWidth = width;
        const srcHeight = height;

        const tex = this.createTexture(gl);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,                // mip level
            gl.RGBA,          // internal format
            srcWidth,
            srcHeight,
            0,                // border
            gl.RGBA,          // format
            gl.UNSIGNED_BYTE, // type
            arr);
        return tex;
    }

    private createFramebuffer(gl: WebGLRenderingContext): WebGLFramebuffer {
        const fb = gl.createFramebuffer();
        if (fb === null) {
            throw Error("failed to create framebuffer");
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        return fb;
    }

}