function initWebGLProgram(
    gl: WebGL2RenderingContext,
    vertexShaderSrc: string,
    fragmentShaderSrc: string,
): WebGLProgram {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    if (!vertexShader) {
        throw new Error(`Failed to load vertex shader fom source ${vertexShaderSrc}`);
    }

    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!fragmentShader) {
        throw new Error(`Failed to load fragment shader ${fragmentShaderSrc}`);
    }

    const webGLProgram = gl.createProgram();
    gl.attachShader(webGLProgram, vertexShader);
    gl.attachShader(webGLProgram, fragmentShader);

    gl.linkProgram(webGLProgram);

    if (!gl.getProgramParameter(webGLProgram, gl.LINK_STATUS)) {
        throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(webGLProgram)}`);
    }

    return webGLProgram;
}

function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type);

    if(!shader) {
        throw new Error("Unable to create shader");
    }

    // Send the source to the shader object
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
}

export { initWebGLProgram };