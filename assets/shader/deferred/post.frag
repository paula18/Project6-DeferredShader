precision highp float;

#define DISPLAY_BLOOM 7
#define DISPLAY_DOF 10

uniform sampler2D u_shadeTex;
uniform sampler2D u_positionTex;
uniform sampler2D u_colorTex;
uniform sampler2D u_depthTex; 

uniform float u_screenWidth; 
uniform float u_screenHeigth;
uniform float u_dof; 
uniform float u_bloomSat; 
uniform float u_bloomIntensity ;
uniform float u_colorSat; 

uniform float u_zFar;
uniform float u_zNear;
uniform int u_displayType;

uniform vec3 u_cameraPosition;

varying vec2 v_texcoord;

#define PI 3.1419
#define e  2.71828182846
#define APERTURE 10.0

float heightFactor = 1.0/u_screenHeigth; 
float widthFactor = 1.0/u_screenWidth;

float linearizeDepth( float exp_depth, float near, float far ){
  return ( 2.0 * near ) / ( far + near - exp_depth * ( far - near ) );
}

vec3 gaussianBlur(float sigma, sampler2D texture){
  
  vec3 returnColor; 
  float totalSamples = 0.0;
  for (float i = - APERTURE; i < APERTURE; i += 1.0){
    for(float j = - APERTURE; j < APERTURE; j += 1.0){
      float g = (1.0/ (2.0 * PI * sigma * sigma)) * pow(e, -((i*i+j*j)/(2.0*sigma*sigma)));
      vec2 offset = vec2(i *widthFactor, j*heightFactor);
      if(length(offset) > 10.0) continue;
      
      returnColor  += g * texture2D( texture, v_texcoord + offset).xyz;
      totalSamples += g;
    }
  }
  
  returnColor = returnColor/totalSamples;
  return returnColor;  
}

vec3 doDOF(vec3 viewVector, float linearDepth){
   
   vec3 dofColor; 
 
  //Distance between current depth and focal distnce
  float distance = linearDepth - u_dof;

  dofColor = gaussianBlur(5.0*abs(distance), u_shadeTex);
   
   return dofColor;
}


vec3 adjustSaturation(vec3 color, float saturation){
  vec3 saturatedColor; 
  
  float factor = dot(color, vec3(0.3, 0.59, 0.11)); 
  saturatedColor = mix(vec3(factor), color, saturation); 
  
  return saturatedColor;

 }

vec3 doBloom(vec3 color, float linearDepth){
  
  vec3 bloomColor;
  float distance = linearDepth - u_dof;
 
  bloomColor = gaussianBlur(5.0*abs(distance), u_shadeTex);
  bloomColor = adjustSaturation(bloomColor, u_bloomSat) * u_bloomIntensity; 
  color = adjustSaturation(color, u_colorSat); 
  color *= (1.0 - clamp(bloomColor, 0.0, 1.0)); 
  
  bloomColor += color; 
  
  
  return bloomColor; 
}

void main()
{
  
  
  vec3 shade = texture2D( u_shadeTex, v_texcoord ).xyz;
 
  
  if (u_displayType == DISPLAY_DOF){
    float depth = texture2D( u_depthTex, v_texcoord ).x;
    depth = linearizeDepth( depth, u_zNear, u_zFar );
    vec3 position = texture2D(u_positionTex, v_texcoord).xyz;
    vec3 viewVector = normalize(position - u_cameraPosition); 
    shade = doDOF(viewVector, depth);
  }
        

   else if (u_displayType == DISPLAY_BLOOM){
     float depth = texture2D( u_depthTex, v_texcoord ).x;
     depth = linearizeDepth( depth, u_zNear, u_zFar );
     vec3 color = texture2D(u_colorTex, v_texcoord).rgb;
     shade = doBloom(color, depth);
  }

  gl_FragColor = vec4(shade, 1.0);
 
}