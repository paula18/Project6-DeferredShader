// Written by Harmony Li. Based on Cheng-Tso Lin's CIS 700 starter engine.
// CIS 565 : GPU Programming, Fall 2014.
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

// Framebuffer
var fbo = null;

// Shader programs
var passProg;     // Shader program for G-Buffer
var shadeProg;    // Shader program for P-Buffer
var diagProg;     // Shader program from diagnostic 
var postProg;     // Shader for post-process effects

var perspMat = mat4.create();
// Multi-Pass programs
var posProg;
var normProg;
var colorProg;

var isDiagnostic = false;
var zNear = 20;
var zFar = 2000;
var texToDisplay = 0;

var lightColor = vec3.create();
lightColor = vec3.fromValues(1.0, 1.0, 1.0);
var lightPos = vec3.create();
lightPos = vec3.fromValues(70.0, 40.0, 70.0); 

//GUIS
var dof = 0.01; 
var ambientColor = vec3.create(); 
ambientColor = vec3.fromValues(0.1, 0.1, 0.1); 
var wOffset = 10.0; 
var bloomSat = 5.0; 
var bloomIntensity = 5.0; 
var colorSat = 3.0;
var silhouetteThreshold = 10.0;
var ambientIntensity = 1.5; 
var modelColor = vec3.create(); 
modelColor = vec3.fromValues(0.34, 0.7, 0.46); 

var stats


var main = function (canvasId, messageId) {
  var canvas;

  // Initialize WebGL
  initGL(canvasId, messageId);

  // Set up camera
  initCamera(canvas);

  // Set up FBOs
  initFramebuffer();

  // Set up models
  initObjs();

  // Set up shaders
  initShaders();


  GUIBox();

  // Register our render callbacks
  CIS565WEBGLCORE.render = render;
  CIS565WEBGLCORE.renderLoop = renderLoop;

  stats = new Stats();
  stats.setMode(1); // 0: fps, 1: ms

// align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';

  document.body.appendChild( stats.domElement );

  // Start the rendering loop
  CIS565WEBGLCORE.run(gl);
};

    var lightPosX = lightPos[0]; 
    var lightPosY = lightPos[1]; 
    var lightPosZ = lightPos[2];

var controller = function () {
  this.dof = 0.01;
  this.ambientColor = [0.1, 0.1, 0.1]; 
  this.wOffset = 2.0; 
  this.attenuation = 1.0; 
  this.silhouetteThreshold = 10.0;
  this.ambientIntensity = 1.5; 
  this.modelColor = [0.4, 0.7, 0.6];
  this.lightPosX = 70.0;
  this.lightPosY = 40.0; 
  this.lightPosZ = 70.0; 
  this.lightColor = [1.0, 1.0, 1.0];
  this.bloomSat = 5.0; 
  this.bloomIntensity = 5.0; 
  this.colorSat = 3.0;
  this.enableDOF = false; 
  this.enableAO = false;
  this.enableBloom = false;
  this.enableToon = false;
  this.enableDiffuse = false;
  this.enableSpecular = false;
  this.onlySil = false;

};

var GUIBox = function(){
    var gui = new dat.GUI();

    var control = new controller();

    var modelColorControl = gui.addColor(control, 'modelColor').name('Color of Object');
    modelColorControl.onChange(function () {
      for (var i = 0; i < 3; ++i) {
        modelColor[i] = control.modelColor[i] / 255.0;
    }

    });
    
    var basicColoringControl = gui.addFolder('Basic Lighting Features');
    basicColoringControl.add(control, 'enableDiffuse').name('Diffuse Term Only').onChange(function(){
      if (control.enableDiffuse == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 5;

      }
    })
    basicColoringControl.add(control, 'enableSpecular').name('Specular Term Only').onChange(function(){
      if (control.enableSpecular == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 6;

      }
    })
    basicColoringControl.addColor(control, 'ambientColor').name('Ambient Color').onChange(function () {
      for (var i = 0; i < 3; ++i) {
        ambientColor[i] = control.ambientColor[i] / 255.0;
    }

    });

  
    var toonControl = gui.addFolder('Toon Coloring Controller');
    toonControl.add(control, 'enableToon').name('ON/OFF').onChange(function(){
      if (control.enableToon == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 8;

      }
    })
    toonControl.add(control, 'onlySil').name('Display Silhouette Only').onChange(function(){
      if (control.onlySil == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 11;

      }
    })
    toonControl.add(control, 'wOffset').min(0.1).max(100.0).name('Silhouette Width').onChange(function () {
      wOffset = control.wOffset;
    });

    toonControl.add(control, 'silhouetteThreshold').min(0.1).max(20.0).name('Silhouette Thickness').onChange(function () {
      silhouetteThreshold = control.silhouetteThreshold;
    });

    var ambientIntensityControl = gui.addFolder('AO Controller');
    ambientIntensityControl.add(control, 'enableAO').name('ON/OFF').onChange(function(){
      if (control.enableAO == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 9;

      }
    })
    ambientIntensityControl.add(control, 'ambientIntensity').min(0.0).max(5.0).name('Ambient Occlusion Intensity').onChange(function () {
      ambientIntensity = control.ambientIntensity;
    });

    var dofControl = gui.addFolder('Depth of Field Controller');
    dofControl.add(control, 'enableDOF').name('ON/OFF').onChange(function(){
      if (control.enableDOF == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 10;

      }
    })
    dofControl.add(control, 'dof').min(0.0).max(1.0).name('Depth of Field').onChange(function () {
      dof = control.dof;
    });


    var bloomControl = gui.addFolder('Bloom Controller');
    bloomControl.add(control, 'enableBloom').name('ON/OFF').onChange(function(){
      if (control.enableBloom == false){
        isDiagnostic = false;
        texToDisplay = 0;

      }
      else{
        isDiagnostic = false;
        texToDisplay = 7;

      }
    })
    bloomControl.add(control, 'bloomIntensity').min(0.0).max(10.0).name('Intensity').onChange(function () {
      
        bloomIntensity = control.bloomIntensity;
      });
    bloomControl.add(control, 'bloomSat').min(0.0).max(10.0).name('Bloom Saturation').onChange(function () {
      
        bloomSat = control.bloomSat;
      });
    bloomControl.add(control, 'colorSat').min(0.0).max(10.0).name('Color Saturation').onChange(function () {
      
        colorSat = control.colorSat;
      });

    var lightPosControl = gui.addFolder('Light Controller');
    lightPosControl.add(control, 'lightPosX').name('X Position').onChange(function () {
      
        lightPosX = control.lightPosX;
      });
    lightPosControl.add(control, 'lightPosY').name('Y Position').onChange(function () {
      
        lightPosY = control.lightPosY;
      });
    lightPosControl.add(control, 'lightPosZ').name('Z Position').onChange(function () {
      
        lightPosZ = control.lightPosZ;
      });

    lightPosControl.addColor(control, 'lightColor').name('Light Color').onChange(function () {
      for (var i = 0; i < 3; ++i) {
        lightColor[i] = control.lightColor[i] / 255.0;
    }

    });

  
}

var renderLoop = function () {
  window.requestAnimationFrame(renderLoop);
  stats.update();
  render();

};

var render = function () {
  if (fbo.isMultipleTargets()) {
    renderPass();
  } else {
    renderMulti();
  }

  if (!isDiagnostic) {
    renderShade();
    renderPost();
  } else {
    renderDiagnostic();
  }

  gl.useProgram(null);
};

var drawModel = function (program, mask) {
  // Bind attributes
  for(var i = 0; i < model.numGroups(); i++) {
    if (mask & 0x1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo(i));
      gl.vertexAttribPointer(program.aVertexPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.aVertexPosLoc);
    }

    if (mask & 0x2) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.nbo(i));
      gl.vertexAttribPointer(program.aVertexNormalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(program.aVertexNormalLoc);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo(i));
    gl.drawElements(gl.TRIANGLES, model.iboLength(i), gl.UNSIGNED_SHORT, 0);
  }

  if (mask & 0x1) gl.disableVertexAttribArray(program.aVertexPosLoc);
  if (mask & 0x2) gl.disableVertexAttribArray(program.aVertexNormalLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

var drawQuad = function (program) {
  gl.bindBuffer(gl.ARRAY_BUFFER, quad.vbo);
  gl.vertexAttribPointer(program.aVertexPosLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.aVertexPosLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad.tbo);
  gl.vertexAttribPointer(program.aVertexTexcoordLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.aVertexTexcoordLoc);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.ibo);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
 
  gl.disableVertexAttribArray(program.aVertexPosLoc);
  gl.disableVertexAttribArray(program.aVertexTexcoordLoc);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

var renderPass = function () {
  // Bind framebuffer object for gbuffer
  fbo.bind(gl, FBO_GBUFFER);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(passProg.ref());

  //update the model-view matrix
  var mvpMat = mat4.create();
  mat4.multiply( mvpMat, persp, camera.getViewTransform() );

  //update the normal matrix
  var nmlMat = mat4.create();
  mat4.invert( nmlMat, camera.getViewTransform() );
  mat4.transpose( nmlMat, nmlMat);

  gl.uniformMatrix4fv( passProg.uModelViewLoc, false, camera.getViewTransform());        
  gl.uniformMatrix4fv( passProg.uMVPLoc, false, mvpMat );        
  gl.uniformMatrix4fv( passProg.uNormalMatLoc, false, nmlMat );     
  gl.uniform3fv(passProg.uModelColorLoc, modelColor);
  

  drawModel(passProg, 0x3);

  // Unbind framebuffer
  fbo.unbind(gl);
};

var renderMulti = function () {
  fbo.bind(gl, FBO_GBUFFER_POSITION);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(posProg.ref());
 
  //update the model-view matrix
  var mvpMat = mat4.create();
  mat4.multiply( mvpMat, persp, camera.getViewTransform() );

  gl.uniformMatrix4fv( posProg.uModelViewLoc, false, camera.getViewTransform());        
  gl.uniformMatrix4fv( posProg.uMVPLoc, false, mvpMat );

  drawModel(posProg, 1);

  //gl.disable(gl.DEPTH_TEST);
  fbo.unbind(gl);

  gl.useProgram(null);

  fbo.bind(gl, FBO_GBUFFER_NORMAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(normProg.ref());

  //update the normal matrix
  var nmlMat = mat4.create();
  mat4.invert( nmlMat, camera.getViewTransform() );
  mat4.transpose( nmlMat, nmlMat);
  
  gl.uniformMatrix4fv(normProg.uMVPLoc, false, mvpMat);
  gl.uniformMatrix4fv(normProg.uNormalMatLoc, false, nmlMat);

  drawModel(normProg, 3);

  gl.useProgram(null);
  fbo.unbind(gl);

  fbo.bind(gl, FBO_GBUFFER_COLOR);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(colorProg.ref());

  gl.uniformMatrix4fv(colorProg.uMVPLoc, false, mvpMat);
  gl.uniform3fv(colorProg.uModelColorLoc, modelColor);

  drawModel(colorProg, 1);

  gl.useProgram(null);
  fbo.unbind(gl);
};

var renderShade = function () {
  gl.useProgram(shadeProg.ref());
  gl.disable(gl.DEPTH_TEST);

  // Bind FBO
  fbo.bind(gl, FBO_PBUFFER);

  gl.clear(gl.COLOR_BUFFER_BIT);

  
  // Bind necessary textures
  gl.activeTexture( gl.TEXTURE0 );  //position
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(0) );
  gl.uniform1i( shadeProg.uPosSamplerLoc, 0 );

  gl.activeTexture( gl.TEXTURE1 );  //normal
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(1) );
  gl.uniform1i( shadeProg.uNormalSamplerLoc, 1 );

  gl.activeTexture( gl.TEXTURE2 );  //color
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(2) );
  gl.uniform1i( shadeProg.uColorSamplerLoc, 2 );

  gl.activeTexture( gl.TEXTURE3 );  //depth
  gl.bindTexture( gl.TEXTURE_2D, fbo.depthTexture() );
  gl.uniform1i( shadeProg.uDepthSamplerLoc, 3 );

  // Bind necessary uniforms 
  gl.uniform1f( shadeProg.uZNearLoc, zNear );
  gl.uniform1f( shadeProg.uZFarLoc, zFar );
  gl.uniform1i( shadeProg.uDisplayTypeLoc, texToDisplay );

  //update the model-view matrix
  
  gl.uniformMatrix4fv( shadeProg.uModelViewLoc, false, camera.getViewTransform());
  gl.uniform3fv(shadeProg.uCameraPositionLoc, camera.getCameraPosition());
  gl.uniformMatrix4fv( shadeProg.uPerspMatLoc, false, perspMat);

  gl.uniform3fv(shadeProg.uLightColorLoc, lightColor); 
  
  lightPos = vec3.set(lightPos, lightPosX, lightPosY, lightPosZ);
  gl.uniform3fv(shadeProg.ulightPosLoc, lightPos); 

  //GUIS
  gl.uniform3fv(shadeProg.uAmbientColorLoc, ambientColor); 
  gl.uniform1f( shadeProg.uAmbientIntensityLoc, ambientIntensity );
  gl.uniform1f( shadeProg.uSilhouetteThresholdLoc, silhouetteThreshold );
  gl.uniform1f( shadeProg.uScreenWidthLoc, canvas.width ); 
  gl.uniform1f( shadeProg.uScreenHeightLoc, canvas.height ); 
  gl.uniform1f( shadeProg.uWidthOffsetLoc, wOffset ); 

  
  drawQuad(shadeProg);

  // Unbind FBO
  fbo.unbind(gl);
};

var renderDiagnostic = function () {
  gl.useProgram(diagProg.ref());

  gl.disable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Bind necessary textures
  gl.activeTexture( gl.TEXTURE0 );  //position
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(0) );
  gl.uniform1i( diagProg.uPosSamplerLoc, 0 );

  gl.activeTexture( gl.TEXTURE1 );  //normal
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(1) );
  gl.uniform1i( diagProg.uNormalSamplerLoc, 1 );

  gl.activeTexture( gl.TEXTURE2 );  //color
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(2) );
  gl.uniform1i( diagProg.uColorSamplerLoc, 2 );

  gl.activeTexture( gl.TEXTURE3 );  //depth
  gl.bindTexture( gl.TEXTURE_2D, fbo.depthTexture() );
  gl.uniform1i( diagProg.uDepthSamplerLoc, 3 ); 

  // Bind necessary uniforms 
  gl.uniform1f( diagProg.uZNearLoc, zNear );
  gl.uniform1f( diagProg.uZFarLoc, zFar );
  gl.uniform1i( diagProg.uDisplayTypeLoc, texToDisplay ); 

  
  drawQuad(diagProg);

  //  fbo.unbind(gl);

};

var renderPost = function () {
  gl.useProgram(postProg.ref());

  gl.disable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Bind necessary textures
  // Bind necessary textures
  gl.activeTexture( gl.TEXTURE0 );  //position
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(0) );
  gl.uniform1i( postProg.uPosSamplerLoc, 0 );

  gl.activeTexture( gl.TEXTURE2 );  //color
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(2) );
  gl.uniform1i( postProg.uColorSamplerLoc, 2 );

  gl.activeTexture( gl.TEXTURE3 );  //depth
  gl.bindTexture( gl.TEXTURE_2D, fbo.depthTexture() );
  gl.uniform1i( postProg.uDepthSamplerLoc, 3 ); 

  gl.activeTexture( gl.TEXTURE4 ); //shade
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(4) );
  gl.uniform1i(postProg.uShadeSamplerLoc, 4 );

 /* gl.activeTexture( gl.TEXTURE5 ); //glow
  gl.bindTexture( gl.TEXTURE_2D, fbo.texture(5) );
  gl.uniform1i(postProg.uGlowSamplerLoc, 5 );
*/

  gl.uniform3fv(postProg.uCameraPositionLoc, camera.getCameraPosition());

  gl.uniform1f( postProg.uZNearLoc, zNear );
  gl.uniform1f( postProg.uZFarLoc, zFar );
  gl.uniform1i( postProg.uDisplayTypeLoc, texToDisplay ); 

  //GUIS
  gl.uniform1f( postProg.uScreenWidthLoc, canvas.width ); 
  gl.uniform1f( postProg.uScreenHeightLoc, canvas.height ); 
  gl.uniform1f( postProg.uBloomSatLoc, bloomSat );
  gl.uniform1f( postProg.uBloomIntensityLoc, bloomIntensity );
  gl.uniform1f( postProg.uColorSatLoc, colorSat );
  gl.uniform1f( postProg.uDofLoc, dof);

  drawQuad(postProg);

 // fbo.unbind(gl);

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

  perspMat = persp;

  camera = CIS565WEBGLCORE.createCamera(CAMERA_TRACKING_TYPE);
  camera.goHome([0, 0, 4]);
  //camera.goHome([0, 0, 200]);
  //camera.goHome([1, 400, 0])
  interactor = CIS565WEBGLCORE.CameraInteractor(camera, canvas);

  // Add key-input controls
  window.onkeydown = function (e) {
    interactor.onKeyDown(e);
    switch(e.keyCode) {
      case 48: //0
        isDiagnostic = false;
        texToDisplay = 0;
        break;
      case 49:
        isDiagnostic = true;
        texToDisplay = 1;
        break;
      case 50: 
        isDiagnostic = true;
        texToDisplay = 2;
        break;
      case 51:
        isDiagnostic = true;
        texToDisplay = 3;
        break;
      case 52:
        isDiagnostic = true;
        texToDisplay = 4;
        break;
      case 53:
        isDiagnostic = false;
        texToDisplay = 5;
        break;
      case 54:
        isDiagnostic = false;
        texToDisplay = 6;
        break;
      case 55:  //bloom 
        isDiagnostic = false;
        texToDisplay = 7;
        break;
      case 56: //toon
        isDiagnostic = false;
        texToDisplay = 8;
        break;
      case 57: //ambiet
        isDiagnostic = false;
        texToDisplay = 9;
        break;
      case 219: // [ key dof
        isDiagnostic = false;
        texToDisplay = 10;
        break;
    }
  }
};

var initObjs = function () {
  // Create an OBJ loader
  objloader = CIS565WEBGLCORE.createOBJLoader();

  // Load the OBJ from file
  objloader.loadFromFile(gl, "assets/models/suzanne1.obj", null);
  //objloader.loadFromFile(gl, "assets/models/teapot/teapot.obj", null);
  //objloader.loadFromFile(gl, "assets/models/crytek-sponza/sponza.obj", null);
 //objloader.loadFromFile(gl, "assets/models/budda.obj", null);
  // Add callback to upload the vertices once loaded
  objloader.addCallback(function () {
    model = new Model(gl, objloader);
  });

  // Register callback item
  CIS565WEBGLCORE.registerAsyncObj(gl, objloader);

  // Initialize full-screen quad
  quad.vbo = gl.createBuffer();
  quad.ibo = gl.createBuffer();
  quad.tbo = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, quad.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad.vertices), gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, quad.tbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenQuad.texcoords), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(screenQuad.indices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

var initShaders = function () {
  if (fbo.isMultipleTargets()) {
    // Create a shader program for rendering the object we are loading
    passProg = CIS565WEBGLCORE.createShaderProgram();

    // Load the shader source asynchronously
    passProg.loadShader(gl, "assets/shader/deferred/pass.vert", "assets/shader/deferred/pass.frag");

    // Register the necessary callback functions
    passProg.addCallback( function() {
      gl.useProgram(passProg.ref());

      // Add uniform locations
      passProg.aVertexPosLoc = gl.getAttribLocation( passProg.ref(), "a_pos" );
      passProg.aVertexNormalLoc = gl.getAttribLocation( passProg.ref(), "a_normal" );
      passProg.aVertexTexcoordLoc = gl.getAttribLocation( passProg.ref(), "a_texcoord" );

      passProg.uModelViewLoc = gl.getUniformLocation( passProg.ref(), "u_modelview" );
      passProg.uMVPLoc = gl.getUniformLocation( passProg.ref(), "u_mvp" );
      passProg.uNormalMatLoc = gl.getUniformLocation( passProg.ref(), "u_normalMat");
      passProg.uSamplerLoc = gl.getUniformLocation( passProg.ref(), "u_sampler");
      passProg.uModelColorLoc = gl.getUniformLocation( passProg.ref(), "u_modelColor");

    });

    CIS565WEBGLCORE.registerAsyncObj(gl, passProg);
  } else {
    posProg = CIS565WEBGLCORE.createShaderProgram();
    posProg.loadShader(gl, "assets/shader/deferred/posPass.vert", "assets/shader/deferred/posPass.frag");
    posProg.addCallback(function() {
      posProg.aVertexPosLoc = gl.getAttribLocation(posProg.ref(), "a_pos");

      posProg.uModelViewLoc = gl.getUniformLocation(posProg.ref(), "u_modelview");
      posProg.uMVPLoc = gl.getUniformLocation(posProg.ref(), "u_mvp");
    });

    CIS565WEBGLCORE.registerAsyncObj(gl, posProg);

    normProg = CIS565WEBGLCORE.createShaderProgram();
    normProg.loadShader(gl, "assets/shader/deferred/normPass.vert", "assets/shader/deferred/normPass.frag");
    normProg.addCallback(function() {
      normProg.aVertexPosLoc = gl.getAttribLocation(normProg.ref(), "a_pos");
      normProg.aVertexNormalLoc = gl.getAttribLocation(normProg.ref(), "a_normal");

      normProg.uMVPLoc = gl.getUniformLocation(normProg.ref(), "u_mvp");
      normProg.uNormalMatLoc = gl.getUniformLocation(normProg.ref(), "u_normalMat");
    });

    CIS565WEBGLCORE.registerAsyncObj(gl, normProg);

    colorProg = CIS565WEBGLCORE.createShaderProgram();
    colorProg.loadShader(gl, "assets/shader/deferred/colorPass.vert", "assets/shader/deferred/colorPass.frag");
    colorProg.addCallback(function(){
      colorProg.aVertexPosLoc = gl.getAttribLocation(colorProg.ref(), "a_pos");

      colorProg.uMVPLoc = gl.getUniformLocation(colorProg.ref(), "u_mvp");
      colorProg.uModelColorLoc = gl.getUniformLocation(colorProg.ref(), "u_modelColor");
    });

    CIS565WEBGLCORE.registerAsyncObj(gl, colorProg);
  }

  // Create shader program for diagnostic
  diagProg = CIS565WEBGLCORE.createShaderProgram();
  diagProg.loadShader(gl, "assets/shader/deferred/quad.vert", "assets/shader/deferred/diagnostic.frag");
  diagProg.addCallback( function() { 
    diagProg.aVertexPosLoc = gl.getAttribLocation( diagProg.ref(), "a_pos" );
    diagProg.aVertexTexcoordLoc = gl.getAttribLocation( diagProg.ref(), "a_texcoord" );

    diagProg.uPosSamplerLoc = gl.getUniformLocation( diagProg.ref(), "u_positionTex");
    diagProg.uNormalSamplerLoc = gl.getUniformLocation( diagProg.ref(), "u_normalTex");
    diagProg.uColorSamplerLoc = gl.getUniformLocation( diagProg.ref(), "u_colorTex");
    diagProg.uDepthSamplerLoc = gl.getUniformLocation( diagProg.ref(), "u_depthTex");

    diagProg.uZNearLoc = gl.getUniformLocation( diagProg.ref(), "u_zNear" );
    diagProg.uZFarLoc = gl.getUniformLocation( diagProg.ref(), "u_zFar" );
    diagProg.uDisplayTypeLoc = gl.getUniformLocation( diagProg.ref(), "u_displayType" );
  });
  CIS565WEBGLCORE.registerAsyncObj(gl, diagProg);

  // Create shader program for shade
  shadeProg = CIS565WEBGLCORE.createShaderProgram();
  shadeProg.loadShader(gl, "assets/shader/deferred/quad.vert", "assets/shader/deferred/diffuse.frag");
  shadeProg.addCallback( function() { 
    shadeProg.aVertexPosLoc = gl.getAttribLocation( shadeProg.ref(), "a_pos" );
    shadeProg.aVertexTexcoordLoc = gl.getAttribLocation( shadeProg.ref(), "a_texcoord" );

    shadeProg.uPosSamplerLoc = gl.getUniformLocation( shadeProg.ref(), "u_positionTex");
    shadeProg.uNormalSamplerLoc = gl.getUniformLocation( shadeProg.ref(), "u_normalTex");
    shadeProg.uColorSamplerLoc = gl.getUniformLocation( shadeProg.ref(), "u_colorTex");
    shadeProg.uDepthSamplerLoc = gl.getUniformLocation( shadeProg.ref(), "u_depthTex");

    shadeProg.uZNearLoc = gl.getUniformLocation( shadeProg.ref(), "u_zNear" );
    shadeProg.uZFarLoc = gl.getUniformLocation( shadeProg.ref(), "u_zFar" );
    shadeProg.uDisplayTypeLoc = gl.getUniformLocation( shadeProg.ref(), "u_displayType" );

    shadeProg.uPerspMatLoc = gl.getUniformLocation( shadeProg.ref(), "u_perspective");
    shadeProg.uModelViewLoc = gl.getUniformLocation( shadeProg.ref(), "u_modelview" );
    shadeProg.uCameraPositionLoc = gl.getUniformLocation( shadeProg.ref(), "u_cameraPosition");
    shadeProg.uLightColorLoc = gl.getUniformLocation( shadeProg.ref(), "u_lightColor"); 
    shadeProg.ulightPosLoc = gl.getUniformLocation( shadeProg.ref(), "u_lightPos"); 

    shadeProg.uAmbientColorLoc = gl.getUniformLocation( shadeProg.ref(), "u_ambientColor");
    shadeProg.uAmbientIntensityLoc = gl.getUniformLocation( shadeProg.ref(), "u_ambientIntensity"); 
    shadeProg.uScreenWidthLoc = gl.getUniformLocation( shadeProg.ref(), "u_screenWidth"); 
    shadeProg.uScreenHeightLoc = gl.getUniformLocation( shadeProg.ref(), "u_screenHeight"); 
    shadeProg.uSilhouetteThresholdLoc = gl.getUniformLocation( shadeProg.ref(), "u_silhouetteThreshold");
    shadeProg.uWidthOffsetLoc = gl.getUniformLocation( shadeProg.ref(), "u_wOffset"); 

  });
  CIS565WEBGLCORE.registerAsyncObj(gl, shadeProg); 

  // Create shader program for post-process
  postProg = CIS565WEBGLCORE.createShaderProgram();
  postProg.loadShader(gl, "assets/shader/deferred/quad.vert", "assets/shader/deferred/post.frag");
  postProg.addCallback( function() { 
    postProg.aVertexPosLoc = gl.getAttribLocation( postProg.ref(), "a_pos" );
    postProg.aVertexTexcoordLoc = gl.getAttribLocation( postProg.ref(), "a_texcoord" );

    postProg.uShadeSamplerLoc = gl.getUniformLocation( postProg.ref(), "u_shadeTex");
    //postProg.uGlowSamplerLoc = gl.getUniformLocation( postProg.ref(), "u_glowTex");
    postProg.uPosSamplerLoc = gl.getUniformLocation( postProg.ref(), "u_positionTex");
    postProg.uColorSamplerLoc = gl.getUniformLocation( postProg.ref(), "u_colorTex");
    postProg.uDepthSamplerLoc = gl.getUniformLocation( postProg.ref(), "u_depthTex");
   
    postProg.uZNearLoc = gl.getUniformLocation( postProg.ref(), "u_zNear" );
    postProg.uZFarLoc = gl.getUniformLocation( postProg.ref(), "u_zFar" );
    postProg.uDisplayTypeLoc = gl.getUniformLocation( postProg.ref(), "u_displayType" );

    postProg.uCameraPositionLoc = gl.getUniformLocation( postProg.ref(), "u_cameraPosition");

    postProg.uScreenWidthLoc = gl.getUniformLocation( postProg.ref(), "u_screenWidth"); 
    postProg.uScreenHeightLoc = gl.getUniformLocation( postProg.ref(), "u_screenHeight"); 
    postProg.uDofLoc = gl.getUniformLocation( postProg.ref(), "u_dof"); 
    postProg.uBloomSatLoc = gl.getUniformLocation( postProg.ref(), "u_bloomSat"); 
    postProg.uBloomIntensityLoc = gl.getUniformLocation( postProg.ref(), "u_bloomIntensity"); 
    postProg.uColorSatLoc = gl.getUniformLocation( postProg.ref(), "u_colorSat"); 

  });
  CIS565WEBGLCORE.registerAsyncObj(gl, postProg); 
};

var initFramebuffer = function () {
  fbo = CIS565WEBGLCORE.createFBO();
  if (!fbo.initialize(gl, canvas.width, canvas.height)) {
    console.log("FBO Initialization failed");
    return;
  }
};
 

