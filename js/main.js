// Written by Harmony Li. Based on Cheng-Tso Lin's CIS 700 starter engine.
// cIS 565 : GPU Programming, Fall 2014.
// University of Pennsvylania (c) 2014.

// Global Variables
var canvas;     // Canvas DOM Element
var gl;         // GL context object
var camera;     // Camera object
var interactor; // Camera interaction object
var objloader;  // OBJ loader

// Models 
var model;      // Model object
var quad = {};  // Empty object for full-screen quad

// Shader programs
var firstProg;      // Model shader program object
var secondProg; 

var u_projectionLoc;
var u_modelviewLoc;
var u_mvpLoc;
var u_normalMatLoc;

var a_vertexPosLoc; 
var a_texLoc; 
var a_normalLoc; 

var u_zFarLoc;
var u_zNearLoc;
var u_displayTypeLoc;

var u_colorTexLoc;
var u_positionTexLoc;
var u_normalTexLoc;
var u_depthTexLoc;
var u_shadeTexLoc; 

var zFar; 
var zNear; 
var displayType; 

//create gbuffer textures
var normalTex;
var colorTex; 
var depthTex;
var positionTex; 
var shadeTex; 

//FBO
var fbo = [];
var sfbo; 

var verticesName; 
var texCoordsName; 
var indicesName; 

var main = function (canvasId, messageId) {
  var canvas;

  // Initialize WebGL
  initGL(canvasId, messageId);

  // Set up camera
  initCamera(canvas);

  // Set up models
  initObjs();

  // Set up shaders
  initShaders();

  //Set up FBO
  //HARDCODED W, H
  initFBO(960, 540);

  var vertices = new Float32Array(12); 
  vertices = [-1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
      1.0, 1.0, 0.0
  ];
  
  var texcoords = new Float32Array(8); 
  texcoords = [-1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0
  ];

  var indices = new Uint16Array(6); 
  indices = [
      0, 1, 2,
      0, 2, 3
  ];

  //Screenquad initalization
  screenQuad(vertices, texcoords, indices);

  // Register our render callbacks
  CIS565WEBGLCORE.render = render;
  CIS565WEBGLCORE.renderLoop = renderLoop;

  // Start the rendering loop
  CIS565WEBGLCORE.run(gl);
};

var renderLoop = function () {
  window.requestAnimationFrame(renderLoop);
  render();
};

var render = function () {
  
  gl.useProgram(firstProg.ref());

  
  // Bind attributes
  for(var i = 0; i <4; ++i){
    gl.disable(gl.DEPTH_TEST); 
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    bindFBO(fbo[i]); 

    //draw object
    for(var i = 0; i < model.numGroups(); i++) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo(i));
      gl.vertexAttribPointer(firstProg.aVertexPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(firstProg.aVertexPosLoc);

      gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo(i));
      gl.vertexAttribPointer(firstProg.aNormalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(firstProg.aNormalLoc);

      gl.bind(gl.ARRAY_BUFFER, model.tbo(i)); 
      gl.vertexAttribPointer(firstProg.aTexLoc, 2, gl.FlOAT, flase, 0, 0); 
      gl.enableVertexAttribArray(firstProg.aTexLoc);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo(i));
      gl.drawElements(gl.TRIANGLES, model.iboLength(i), gl.UNSIGNED_SHORT, 0);
    }
  }

  gl.disableVertexAttribArray(firstProg.aVertexPosLoc);
  gl.disableVertexAttribArray(firstProg.aNormalLoc);
  gl.disableVertexAttribArray(firstProg.aTexLoc);
  
  //Second
  /*gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
  gl.disable(gl.DEPTH_TEST); 
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  setupScreenQuad(secondProg.ref()); 
  displayScreenQuad(); */


  //Third
  gl.useProgram(thirsProg.ref());
  
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
  gl.disable(gl.DEPTH_TEST); 
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(thirdProg.u_displayTypeLoc, displayType); 
  gl.uniform1f(thirdProg.u_zNearLoc, zNear); 
  gl.uniform1f(thirdProg.u_zFarLoc, zFar);
  
  gl.activeTexture(gl.TEXTURE0); 
  gl.bindTexture(gl.TEXTURE_2D, shadeTex); 
  gl.uniform1i(thirdProg.u_shadeTexLoc, 0); 

  displayScreenQuad();


  //Reset stuff
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D,null);

  gl.useProgram(null);
};

var initGL = function (canvasId, messageId) {
  var msg;

  // Get WebGL context
  canvas = document.getElementById(canvasId);
  msg = document.getElementById(messageId);
  gl = CIS565WEBGLCORE.getWebGLContext(canvas, msg);

  if (!gl) {
    return; // return if a WebGL context not found
  }

  // Set up WebGL stuff
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3, 0.3, 0.3, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
};

var initCamera = function () {
  // Setup camera
  persp = mat4.create();
  mat4.perspective(persp, todeg(60), canvas.width / canvas.height, 0.1, 2000);

  camera = CIS565WEBGLCORE.createCamera(CAMERA_TRACKING_TYPE);
  camera.goHome([0, 0, 4]);
  interactor = CIS565WEBGLCORE.CameraInteractor(camera, canvas);
};

var initObjs = function () {
  // Create an OBJ loader
  objloader = CIS565WEBGLCORE.createOBJLoader();

  // Load the OBJ from file
  objloader.loadFromFile(gl, "assets/models/suzanne.obj", null);

  // Add callback to upload the vertices once loaded
  objloader.addCallback(function () {
    model = new Model(gl, objloader);
  });

  // Register callback item
  CIS565WEBGLCORE.registerAsyncObj(gl, objloader);
};

var initShaders = function () {
  // Create a shader program for rendering the object we are loading
  firstProg = CIS565WEBGLCORE.createShaderProgram();
 
  // Load the shader source asynchronously
  firstProg.loadShader(gl, "assets/shader/deferred/pass.vert", "assets/shader/deferred/pass1.frag");

  // Register the necessary callback functions
  firstProg.addCallback( function() {
    gl.useProgram(firstProg.ref());

    // Add uniform locations
    firstProg.a_vertexPosLoc = gl.getAttribLocation(firstProg.ref(), "a_pos");
    firstProg.a_normalLoc = gl.getAttribLocation(firstProg.ref(), "a_normal");
    firstProg.a_texLoc = gl.AttribLocation(firstProg.ref(), "a_texcoord"); 

    firstProg.u_colorTexLoc = gl.getUniformLocation(firstProg.ref(), "u_colorTex");
    firstProg.u_positionTexLoc = gl.getUniformLocation(firstProg.ref(), "u_positionTex");
    firstProg.u_normalTexLoc = gl.getUniformLocation(firstProg.ref(), "u_normalTex");
    firstProg.u_depthTexLoc = gl.getUniformLocation(firstProg.ref(), "u_depthTex");
    firstProg.u_shadeTexLoc = gl.getUniformLocation(firstProg.ref(), "u_shadeTex");

    firstProg.u_projectionLoc = gl.getUniformLocation(firstProg.ref(), "u_projection");
    firstProg.u_modelviewLoc = gl.getUniformLocation(firstProg.ref(), "u_modelview");
    firstProg.u_mvpLoc = gl.getUniformLocation(firstProg.ref(), "u_mvp");
    firstProg.u_normalMatLoc = gl.getUniformLocation(firstProg.ref(), "u_normalMat");
  });

  CIS565WEBGLCORE.registerAsyncObj(gl, firstProg);

  //Second program
  secondProg = CIS565WEBGLCORE.createShaderProgram(); 

  secondProg.loadShader(gl, "assets/shader/deferred/quad.vert", "assets/shader/deferred/diagnostic.frag")

  secondProg.addCallback( function() {
    gl.useProgram(secondProg.ref());

    secondProg.a_vertexPosLoc = gl.getAttribLocation(secondProg.ref(), "a_pos");
    secondProg.a_normalLoc = gl.getAttribLocation(secondProg.ref(), "a_normal");
    secondProg.a_texLoc = gl.AttribLocation(secondProg.ref(), "a_texcoord"); 

    secondProg.u_colorTexLoc = gl.getUniformLocation(secondProg.ref(), "u_colorTex");
    secondProg.u_positionTexLoc = gl.getUniformLocation(secondProg.ref(), "u_positionTex");
    secondProg.u_normalTexLoc = gl.getUniformLocation(secondProg.ref(), "u_normalTex");
    secondProg.u_depthTexLoc = gl.getUniformLocation(secondProg.ref(), "u_depthTex");
    secondProg.u_shadeTexLoc = gl.getUniformLocation(secondProg.ref(), "u_shadeTex");

    secondProg.u_zFarLoc = gl.getUniformLocation(secondProg.ref(), "u_zFar");
    secondProg.u_zNearLoc = gl.getUniformLocation(secondProg.ref(), "u_zNear");
    secondProg.u_displayTypeLoc = gl.getUniformLocation(secondProg.ref(), "u_displayType");

   });

  CIS565WEBGLCORE.registerAsyncObj(gl, secondProg);

  //Third program
  thirdProg = CIS565WEBGLCORE.createShaderProgram(); 

  thirdProg.loadShader(gl, "assets/shader/deferred/quad.vert", "assets/shader/deferred/post.frag")

  thirdProg.addCallback( function() {
    gl.useProgram(thirdProg.ref());

    thirdProg.a_vertexPosLoc = gl.getAttribLocation(thirdProg.ref(), "a_pos");
    thirdProg.a_normalLoc = gl.getAttribLocation(thirdProg.ref(), "a_normal");
    thirdProg.a_texLoc = gl.AttribLocation(thirdProg.ref(), "a_texcoord"); 

    thirdProg.u_colorTexLoc = gl.getUniformLocation(thirdProg.ref(), "u_colorTex");
    thirdProg.u_positionTexLoc = gl.getUniformLocation(thirdProg.ref(), "u_positionTex");
    thirdProg.u_normalTexLoc = gl.getUniformLocation(thirdProg.ref(), "u_normalTex");
    thirdProg.u_depthTexLoc = gl.getUniformLocation(thirdProg.ref(), "u_depthTex");
    thirdProg.u_shadeTexLoc = gl.getUniformLocation(thirdProg.ref(), "u_shadeTex");

    thirdProg.u_zFarLoc = gl.getUniformLocation(thirdProg.ref(), "u_zFar");
    thirdProg.u_zNearLoc = gl.getUniformLocation(thirdProg.ref(), "u_zNear");
    thirdProg.u_displayTypeLoc = gl.getUniformLocation(thirdProg.ref(), "u_displayType");

  });

};
 

var initFBO = function(screenWidth, screenHeight){
  
  normalTex = gl.createTexture();
  positionTex = gl.createTexture(); 
  depthTex = gl.createTexture();
  colorTex = gl.createTexture(); 
  shadeTex = gl.createTexture(); 


  gl.getExtension("OES_texture_float");
  gl.getExtension("OES_texture_float_linear");
  var extension = gl.getExtension("WEBGL_depth_texture");

  var status; 

  //G-BUFFER

  //Set up Color
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, 0, gl.RGBA, gl.FLOAT, null);

  
  //Set up normals 
  gl.bindTexture(gl.TEXTURE_2D, normalTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, 0, gl.RGBA, gl.FLOAT, null);

  ///Set up depth 
  gl.bindTexture(gl.TEXTURE_2D, depthTex); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, screenWidth, screenHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null); 

  ///Set up position
  gl.bindTexture(gl.TEXTURE_2D, positionTex); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, 0, gl.RGBA, gl.FLOAT, null); 

  //Create fbo 
  fbo[0] = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);

  //Depth
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
  
  //check error
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE)
    console.log("DEPTH FBO FAILED!");

  //Reset everything
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //Color
  fbo[1] = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1]);

  var rbufferColor = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbufferColor);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, screenWidth, screenHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
  //Attach depth buffer to fbo
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbufferColor);

  //check error
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE)
    console.log("COLOR FBO FAILED!");

  //Reset everything
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //Nromals
  fbo[2] = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[2]);

  var rbufferNormals = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbufferNormals);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, screenWidth, screenHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, normalTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbufferNormals);

    //check error
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE)
    console.log("NORMALS FBO FAILED!");

  //Reset everything
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //Positions
  fbo[3] = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[3]);

  var rbufferPos = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbufferPos);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, screenWidth, screenHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbufferPos);

  //check error
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE)
    console.log("POSITIONS FBO FAILED!");

  //Reset everything
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  

  //SHADE-BUFFER
  gl.bindTexture(gl.TEXTURE_2D, shadeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, 0, gl.RGBA, gl.FLOAT, null);

  sfbo = gl.createFramebuffer(); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, sfbo); 
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadeTex, 0); 


  var rbufferShade = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbufferShade);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, screenWidth, screenHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadeTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbufferShade);

  //check error
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE)
    console.log("POSITIONS FBO FAILED!");

  //Reset everything
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

};

var bindFBO = function(fbuffer){
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbuffer);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.enable(gl.DEPTH_TEST);
};

var deleteFBO = function(){
  gl.deleteTexture(normalTex); 
  gl.deleteTexture(depthTex);
  gl.deleteTexture(colorTex); 
  gl.deleteTexture(positionTex);
  gl.deleteTexture(shadeTex);
  gl.bindFramebuffer(gl.FRAMEBUFFER, 0); 
  gl.deleteFramebuffer(fbo);
};

var screenQuad = function(vertices, texCoords, indices){
            
  //Vertices
  verticesName = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesName);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

 // TextureCoords
  texCoordsName = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  
  // Indices
  indicesName = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

};

var setupScreenQuad = function(program){
  gl.useProgram(program);


  gl.activeTexture(gl.TEXTURE0); 
  gl.bindTexture(gl.TEXTURE_2D, depthTex); 
  gl.uniform1i(gl.getUniformLocation(program, "u_depthTex"), 0); 

  gl.activeTexture(gl.TEXTURE1); 
  gl.bindTexture(gl.TEXTURE_2D, colorTex); 
  gl.uniform1i(gl.getUniformLocation(program, "u_colorTex"), 1);

  gl.activeTexture(gl.TEXTURE2); 
  gl.bindTexture(gl.TEXTURE_2D, normalTex); 
  gl.uniform1i(gl.getUniformLocation(program, "u_normalTex"), 2); 

  gl.activeTexture(gl.TEXTURE3); 
  gl.bindTexture(gl.TEXTURE_2D, positionTex); 
  gl.uniform1i(gl.getUniformLocation(program, "u_positionTex"), 3);

  gl.uniform1i(gl.getUniformLocation(program, "u_displayType"), displayType);
  gl.uniform1f(gl.getUniformLocation(program, "u_zNear"), zNear);
  gl.uniform1f(gl.getUniformLocation(program, "u_zFar"), zFar);

  
};

var displayScreenQuad = function(){

  //Positions
  gl.enableVertexAttribArray(a_vertexPosLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesName);  
  gl.vertexAttribPointer(a_vertexPosLoc, 3, gl.FLOAT, false, 0, 0);

  //Texture
  gl.enableVertexAttribArray(a_texLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsName);
  gl.vertexAttribPointer(a_texLoc, 2, gl.FLOAT, false, 0, 0);
 
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesName); 

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); 

  gl.disableVertexAttribArray(a_vertexPosLoc); 
  gl.disableVertexAttribArray(a_texLoc); 

}






