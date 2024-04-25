'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let camera;
let conv = 50, eyes = 1, fov = 20, near_clips = 1;
let count_horisontal_steps = 0;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }

    this.DrawLines = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        let n = this.count / count_horisontal_steps
        for (let i = 0; i < count_horisontal_steps; i++) {
            gl.drawArrays(gl.LINE_STRIP, n * i, n);
        }
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-2, 2, -2, 2, 0, 16);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    camera.ApplyLeftFrustum()
    modelViewProjection = m4.multiply(camera.projection, m4.multiply(camera.modelView, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(true, false, false, false);
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    surface.Draw();
    gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]);
    surface.DrawLines();

    gl.clear(gl.DEPTH_BUFFER_BIT)

    camera.ApplyRightFrustum()
    modelViewProjection = m4.multiply(camera.projection, m4.multiply(camera.modelView, matAccum1));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.colorMask(false, true, true, false);
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    surface.Draw();
    gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]);
    surface.DrawLines();

    gl.colorMask(true, true, true, true);
}

function CreateSurfaceData() {
    let vertexList = [];
    let a = 2;
    let b = 2;
    let n = 1;

    let u_min = 0;
    let u_max = 2 * Math.PI;
    let v_min = 0;
    let v_max = 2;
    let step_v = 0.1;
    let step_u = 0.1;

    const countX = (u, v) => ((a + b * Math.sin(n * u)) * Math.cos(u) - v * Math.sin(u)) / 4;
    const countY = (u, v) => ((a + b * Math.sin(n * u)) * Math.sin(u) + v * Math.cos(u)) / 4;
    const countZ = (u) => (b * Math.cos(n * u)) / 4;
    const countVertex = (u, v) => [countX(u, v), countY(u, v), countZ(u)];

    for (let u = u_min; u <= u_max; u += step_u) {
        for (let v = v_min; v <= v_max; v += step_v) {
            let vertex1 = countVertex(u, v);
            let vertex2 = countVertex(u, v + step_v);
            let vertex3 = countVertex(u + step_u, v);
            let vertex4 = countVertex(u + step_u, v + step_v);
            
            vertexList.push(...vertex1, ...vertex2, ...vertex3, ...vertex3, ...vertex2, ...vertex4);
            count_horisontal_steps++;
        }
    }
    for (let v = v_min; v <= v_max; v += step_v) {
        for (let u = u_min; u <=  u_max; u += step_u) {
            let vertex1 = countVertex(u, v);
            let vertex2 = countVertex(u, v + 0.1);
            let vertex3 = countVertex(u + 0.1, v);
            let vertex4 = countVertex(u + 0.1, v + 0.1);

            vertexList.push(...vertex1, ...vertex2, ...vertex3, ...vertex3, ...vertex2, ...vertex4);
            count_horisontal_steps++;
        }
    }
    return vertexList;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;

    document.getElementById('conv').addEventListener("change", () => {
        conv = parseFloat(document.getElementById('conv').value);
        document.getElementById("conv_indicator").innerHTML  = conv;
        camera.mConvergence = conv;
        draw();
    });
    document.getElementById('eyes').addEventListener("change", () => {
        eyes = parseFloat(document.getElementById('eyes').value);
        document.getElementById("eyes_indicator").innerHTML = eyes;
        camera.mEyeSeparation = eyes; 
        draw();
    });
    document.getElementById('fov').addEventListener("change", () => {
        fov = deg2rad(parseFloat(document.getElementById('fov').value));
        document.getElementById("fov_indicator").innerHTML = (Math.round(fov*100)/100).toString();
        camera.mFOV = fov;
        draw();
    });
    document.getElementById('near_clips').addEventListener("change", () => {
        near_clips = parseFloat(document.getElementById('near_clips').value);
        document.getElementById("near_clips_indicator").innerHTML = near_clips;
        camera.mNearClippingDistance = near_clips;
        draw();
    });


    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        camera = new Camera(
            conv,     // Convergence
            eyes,       // Eye Separation
            1,     // Aspect Ratio
            fov,       // FOV along Y in degrees
            near_clips,       // Near Clipping Distance
            30.0);   // Far Clipping Distance
        initGL(); 
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}
