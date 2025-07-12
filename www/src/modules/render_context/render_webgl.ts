import type {RenderContextInterface} from "./render_context_interface.ts";
import {mat4} from "gl-matrix";

export default class RenderContextWebGL implements RenderContextInterface {

    private readonly ctx: WebGL2RenderingContext;
    private readonly memory: WebAssembly.Memory;
    private readonly width: number;
    private readonly height: number;

    private buffers: { position: WebGLBuffer };
    private programInfo: any;

    private static readonly VERTEX_SHADER_SOURCE = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main() {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
      `;

    private static readonly FRAGMENT_SHADER_SOURCE = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color
        }
      `;

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

        const shaderProgram = this.initShaderProgram(this.ctx);
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.ctx.getAttribLocation(shaderProgram, "aVertexPosition"),
            },
            uniformLocations: {
                projectionMatrix: this.ctx.getUniformLocation(shaderProgram, "uProjectionMatrix"),
                modelViewMatrix: this.ctx.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            },
        };

        this.buffers = this.initBuffers(this.ctx);

    }

    drawGrid(): void {

        let gl = this.ctx;

        this.drawScene(gl, this.programInfo, this.buffers);

    }

    drawCells(cellsPtr: number): void {
        const numBytes = Math.ceil((this.width * this.height) / 8);
        const cells: Uint8Array = new Uint8Array(this.memory.buffer, cellsPtr, numBytes);
    }

    private initShaderProgram(gl: WebGL2RenderingContext): WebGLProgram {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, RenderContextWebGL.VERTEX_SHADER_SOURCE);
        if (!vertexShader) {
            throw new Error("Failed to load vertex shader");
        }

        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, RenderContextWebGL.FRAGMENT_SHADER_SOURCE);

        if (!fragmentShader) {
            throw new Error("Failed to load fragment shader");
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
        }

        return shaderProgram;

    }

    private loadShader(gl: WebGL2RenderingContext, type: any, source: any) {
        const shader = gl.createShader(type);

        if(!shader) {
            throw new Error("Unable to create shader");
        }

        // Send the source to the shader object

        gl.shaderSource(shader, source);

        // Compile the shader program

        gl.compileShader(shader);

        // See if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(
                `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
            );
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    private initBuffers(gl: WebGL2RenderingContext): { position: WebGLBuffer } {
        const positionBuffer = this.initPositionBuffer(gl);

        return {
            position: positionBuffer,
        };
    }

    private initPositionBuffer(gl: WebGL2RenderingContext): WebGLBuffer {
        // Create a buffer for the square's positions.
        const positionBuffer = gl.createBuffer();

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now create an array of positions for the square.
        const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        return positionBuffer;
    }

    private drawScene(gl: WebGL2RenderingContext, programInfo: any, buffers: any) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        // Clear the canvas before we start drawing on it.

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = this.width / this.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        // note: glMatrix always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        mat4.translate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [-0.0, 0.0, -6.0],
        ); // amount to translate

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        this.setPositionAttribute(gl, buffers, programInfo);

        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        );
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix,
        );

        {
            const offset = 0;
            const vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }
    }

    // Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
    private setPositionAttribute(gl: WebGL2RenderingContext, buffers: any, programInfo: any) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

}