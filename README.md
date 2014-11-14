------------------------------------------------------------------------------
CIS565: Project 6 -- Deferred Shader
-------------------------------------------------------------------------------
Bunny Glow Effect: 

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/bunnyGlow.PNG)

Sponza Toon Effect: 

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/sponzaToon.PNG)

-------------------------------------------------------------------------------
VIDEO AND DEMO:
-------------------------------------------------------------------------------
Video: https://vimeo.com/111820765
-------------------------------------------------------------------------------
OVERVIEW:
-------------------------------------------------------------------------------

The purpose of this project was to get introduced to the deferred shading pipeline. 

The main idea behind deferred shading is that if a pixel does not get to the screen, there is no need to shade it. For this reason, deferred shading post-pones the light calculations and computes them in the image space. Basically, lighting is decoupled from the scene geometry. The deferred shading pipeline is broken into two steps. First, we write the properties of all visible objects into the G-Buffer. Then, for each light in the scene, we compute its contribution using the G-Buffer properties and we accumulate it in the frame buffer. The good thing about storing the color, position, normal and depth, is that creating lighting effects in the second pass is relatively easy, since we have all these values at hand. The basic mechanics of this pipeline is shown in the following image. 

The advantages of this pipeline is that we have fewer shaders: one per material-light combination. Also, we only need to transform and rasterized each object once, unlike in the forward shading pipeline. Here, we only render objects that are not occluded. 

As I mentioned before, the geometry pass processes all of the objects in the scene. We write all the properties of the objects (normals, depth, positions...) into the G-Buffer. These are written into 2D textures, having a texture per vertex attribute. All the pixel that fail the depth test are dropped and we are left with the pixel that will be shown on the screen. 

**Geometry Buffers**

Position

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/position.PNG)

Normal

![alt tag](https://github.com/paula18/Project6-DeferredShaderL/blob/master/resources/normal.PNG)

Color

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/color.PNG)

Depth

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/depth.PNG)



The light accumulation pass reads the properties of the G-Buffer pixel by pixel, and does the lighting calculations the same way we did in forward shading. To create the final image, we render a screen space quad. 

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/deferredShading.PNG)

-------------------------------------------------------------------------------
FEATURES:
-------------------------------------------------------------------------------

**Diffuse and Blinn-Phong Shading**

These lighting calculation were done following the same equations as for forward rendering (see Project5). We read the positions, normal and color from the required textures and we calculate the light contribution. 

Diffuse Lighting: 
![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/diffuseColoring.PNG)

Specular Lighting:
![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/specular.PNG)

Final Color: 
![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/allLighting.PNG)

**Toon Shading**


One noticeable aspect of toon coloring is that there are usually few areas of the same color and the rest is independent of lighting. The way I implemented this feature is by calculating the diffuse lighting of each fragment. Then, I compared it against a few threshold values and assigned it a value depending on each comparison. This way, I achieved "jumps" of diffuse coloring that gives the model a cartoonish appearance. 

Another important feature of toon shading is the silhouette around an object. To create this effect, I used Sobel filtering for edge detection. This algorithm uses two convolution masks to estimate the gradient in the x and y directions. If a fragment is an edge I assign it a specific color (black for example). 

This first image shows the first way I implemented this feature, which was wrong. I was using the texture for the color instead of the texture that has the positions stored. However, I believed I looks good anyways.

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/toonColoring.PNG)

This first image shows the first way I implemented this feature, which was wrong. I was using the texture for the color instead of the texture that has the positions stored. However, I believed I looks good anyways.

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/bunnyToon.PNG)


**Screen Space ambient Occlusion**

Ambient occlusion offers a way of seeing how much a point is occluded by its surroundings. That is, how much light it gets from the light sources.
To calculate ambient occlusion we sample points in a hemisphere around the current fragment point. This hemisphere should be aligned with the point’s normal. I used Poisson-disk samples to create the samples points.
Since we have stored all the positions and normal this methods is very straight forward. Fist we take a look at the sample points around the current fragment’s position and calculate the distance between both. This allows us to limit the influence of points according to their distance to the point we are looking at. Then, we calculate the angle between the fragments normal and the normalized direction of the vector calculated in the previous step. This allows us to see if the sample point is in our hemisphere. Then, we simply multiply these to values to create our AO effect. 

This first image shows the first way I implemented this feature, which was wrong. I was using the texture for the color instead of the texture that has the positions stored. However, I believed I looks good anyways.

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/ao.PNG)

**Depth of field**

The effect of depth of field is created using a Gaussian Blur. First, I calculate the distance between the fragment’s depth and a user defined focal length. I then used the length of this distance as the sigma value of the Gaussian equation.

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/gaussian.PNG)

![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/ao.PNG)

**Bloom Effect**

I don’t think my bloom effect is very accurate, but it works. The way I created this feature is by first blurring the image the same way I did for DOF. Then, I interpolated the resulting color and a specific color with a user defined value. Finally I multiplied this result by a user defined intensity and clamp the result between 0.0 and 1.0. To be honest, I don’t know if this is the right way to do it. I ended up playing with values and formulas to see what looked better to me. 
 
![alt tag](https://github.com/paula18/Project6-DeferredShader/blob/master/resources/bloom.PNG)

**User Interface**

I got rid of the keyboard interaction and added a GUI Box for easier user interface. The user can play with some values to modify the effects I have implemented.  However there is a bug that I need to fix. If you change any of the color values that the user is able to modify and then click on the screen, this color turns very dark. So, do any camera movement before changing the color. 

-------------------------------------------------------------------------------
PERFORMANCE EVALUATION
-------------------------------------------------------------------------------

For my performance analysis I calculated the FPS it takes for each feature to render. I got the results I was expecting. For the basic lighting features (diffuse and specular) and for the toon coloring and ambient occlusion there is no noticeable change in performance. These computations are simple and inexpensive. However, when we turn the bloom controller or the depth of field controller on, the performance decreases drastically. I believe this is due to the Gaussian Blur I used to sample points. During this computation, we sample over values in the x and y direction and then compute a power function, which is already expensive. The following graph shows the performance behavior.   


-------------------------------------------------------------------------------
RUNNING THE CODE:
-------------------------------------------------------------------------------

Since the code attempts to access files that are local to your computer, you
will either need to:

* Run your browser under modified security settings, or
* Create a simple local server that serves the files


FIREFOX: change ``strict_origin_policy`` to false in about:config 

CHROME:  run with the following argument : `--allow-file-access-from-files`

(You can do this on OSX by running Chrome from /Applications/Google
Chrome/Contents/MacOS with `open -a "Google Chrome" --args
--allow-file-access-from-files`)

* To check if you have set the flag properly, you can open chrome://version and
  check under the flags

RUNNING A SIMPLE SERVER: 

If you have Python installed, you can simply run a simple HTTP server off your
machine from the root directory of this repository with the following command:

`python -m SimpleHTTPServer`

-------------------------------------------------------------------------------
RESOURCES:
-------------------------------------------------------------------------------

Sobel Operator: https://www.google.com/search?q=sobel+operator+edge+detection+shading&ie=utf-8&oe=utf-8&aq=t&rls=org.mozilla:en-US:official&client=firefox-a&channel=sb

Bloom Effect: http://digitalerr0r.wordpress.com/2009/10/04/xna-shader-programming-tutorial-24-bloom/

SSAO: http://blog.evoserv.at/index.php/2012/12/hemispherical-screen-space-ambient-occlusion-ssao-for-deferred-renderers-using-openglglsl/

-------------------------------------------------------------------------------
THIRD PARTY CODE 
-------------------------------------------------------------------------------

* dat.gui
* Stats.js

---
ACKNOWLEDGEMENTS
---

Many thanks to Cheng-Tso Lin, whose framework for CIS700 we used for this
assignment.

This project makes use of [three.js](http://www.threejs.org).
