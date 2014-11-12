precision highp float;

#define DISPLAY_TOON 8
#define DISPLAY_AMBIENT 9
#define DISPLAY_BLOOM 7

uniform sampler2D u_shadeTex;
uniform sampler2D u_normalTex;
uniform sampler2D u_positionTex;
uniform sampler2D u_colorTex;
uniform sampler2D u_depthTex; 

uniform float u_zFar;
uniform float u_zNear;
uniform int u_displayType;

uniform vec3 u_lightPos; 
uniform vec3 u_lightColor;

uniform mat4 u_modelview;
uniform vec3 u_cameraPosition;

varying vec2 v_texcoord;

 vec2 poisson16 = (vec2( -0.94201624,  -0.39906216 ),
                                vec2(  0.94558609,  -0.76890725 ),
                                vec2( -0.094184101, -0.92938870 ),
                                vec2(  0.34495938,   0.29387760 ),
                                vec2( -0.91588581,   0.45771432 ),
                                vec2( -0.81544232,  -0.87912464 ),
                                vec2( -0.38277543,   0.27676845 ),
                                vec2(  0.97484398,   0.75648379 ),
                                vec2(  0.44323325,  -0.97511554 ),
                                vec2(  0.53742981,  -0.47373420 ),
                                vec2( -0.26496911,  -0.41893023 ),
                                vec2(  0.79197514,   0.19090188 ),
                                vec2( -0.24188840,   0.99706507 ),
                                vec2( -0.81409955,   0.91437590 ),
                                vec2(  0.19984126,   0.78641367 ),
                                vec2(  0.14383161,  -0.14100790 )
                     );
float linearizeDepth( float exp_depth, float near, float far ){
	return ( 2.0 * near ) / ( far + near - exp_depth * ( far - near ) );
}

vec3 getBrightAreas( float threshold, vec3 color){
  
  vec3 returnColor;
  
  float returnColorX = clamp(( (color.x - threshold)/ (1.0 - threshold) ), 
                           0.0, 1.0);
  float returnColorY = clamp(( (color.y - threshold)/ (1.0 - threshold) ), 
                         0.0, 1.0);
  float returnColorZ = clamp(( (color.z - threshold)/ (1.0 - threshold) ), 
                           0.0, 1.0);
  return vec3(returnColorX, returnColorY, returnColorZ);
  
}

vec3 blurImage( float blurDistance, sampler2D texture, vec2 texcoord){
  
  vec3 returnColor; 
  returnColor  = texture2D( texture, texcoord + vec2(blurDistance)).xyz;
  returnColor += texture2D( texture, texcoord - vec2(blurDistance)).xyz;
  returnColor += texture2D( texture, texcoord - vec2(blurDistance, - blurDistance)).xyz;
  returnColor += texture2D( texture, texcoord - vec2(-blurDistance, blurDistance)).xyz;
  
  returnColor = returnColor / 4.0; 
  
  return returnColor;  
}

vec3 adjustSaturation(vec3 color, float saturation){
  float greyColor = dot(color, vec3(0.3, 0.59, 0.11)); 
  return mix(vec3(greyColor), color, saturation); 

 }

void main()
{
  // Currently acts as a pass filter that immmediately renders the shaded texture
  // Fill in post-processing as necessary HERE
  // NOTE : You may choose to use a key-controlled switch system to display one feature at a time

  //Toom Color
  float attenuation = 1.0; 
  float lineThreshold = 0.3;
  
  vec3 normal = normalize(texture2D( u_normalTex, v_texcoord ).xyz);
  vec3 shade = texture2D( u_shadeTex, v_texcoord ).xyz;
  vec3 position = texture2D(u_positionTex, v_texcoord).xyz;
  vec3 color = texture2D(u_colorTex, v_texcoord).rgb;
 
  vec3 lightPos = (u_modelview*vec4(u_lightPos, 1.0)).xyz; 
  vec3 lightDir =normalize(lightPos - position); 
  
  vec3 viewVector = normalize(position - u_cameraPosition); 
  
  vec3 fragmentColor = shade;
  
  float diffuse = max(dot(lightDir, normal), 0.0);
  
  if (diffuse > 0.95)
      fragmentColor = color;
  else if (diffuse > 0.5)
      fragmentColor = vec3(0.7,0.7,0.7) * color;
  else if (diffuse > 0.05)
      fragmentColor = vec3(0.35,0.35,0.35) * color;
  else
      fragmentColor = vec3(0.1,0.1,0.1) * color;

     //HARDCODED
  float heightFactor = 1.0/540.0; 
    float widthFactor = 1.0/960.0;
    //edge detection usinng sobel convolution
  vec2 heightStep = vec2(0.0, heightFactor); 
  vec2 widthStep = vec2(widthFactor, 0.0);
  
   vec2 center = v_texcoord.xy;
    vec2 left = v_texcoord.xy - widthStep;
    vec2 right = v_texcoord.xy + widthStep;

    vec2 top = v_texcoord.xy + heightStep;
    vec2 topLeft = v_texcoord.xy - widthStep + heightStep;
    vec2 topRight = v_texcoord.xy + widthStep + heightStep;

    vec2 bottom = v_texcoord.xy - heightStep;
    vec2 bottomLeft = v_texcoord.xy - widthStep - heightStep;
    vec2 bottomRight= v_texcoord.xy + widthStep - heightStep;
  
   vec4 i00 = texture2D(u_shadeTex, topLeft); 
     vec4 i01 = texture2D(u_shadeTex, top);
     vec4 i02 = texture2D(u_shadeTex, topRight);
     vec4 i10 = texture2D(u_shadeTex, left);
     vec4 i11 = texture2D(u_shadeTex, center);
     vec4 i12 = texture2D(u_shadeTex, right);
   vec4 i20 = texture2D(u_shadeTex, bottomLeft);
   vec4 i21 = texture2D(u_shadeTex, bottom);
   vec4 i22 = texture2D(u_shadeTex, bottomRight);
  
   vec4 h = -i00 - 2.0 * i01 - i02 + i20 + 2.0 * i21 + i22;
   vec4 v = -i20 - 2.0 * i10 - i00 + i22 + 2.0 * i12 + i01;
  
   float l = length(h) + length(v); 
  
  //Bloom 
  float bloomThreshold = 0.4; 
  float blurDistance = 0.001;
  float bloomSat = 5.0; 
  float bloomIntensity = 1.0;
  float colorSat = 1.0; 
  float colorIntensity = 0.2; 
  
  
  vec3 bloomColor = getBrightAreas(bloomThreshold, shade);
  //bloomColor = blurImage( blurDistance, u_shadeTex, v_texcoord);
  bloomColor = adjustSaturation(bloomColor, bloomSat) * bloomIntensity; 
 color = adjustSaturation(color, colorSat)*colorIntensity; 
  color *= (1.0 - clamp(bloomColor, 0.0, 1.0)); 
  
  bloomColor += color; 
  //Ambient 
  float ao = 0.0;
  const int count = 16; 
  vec2 rad = vec2 (0.03, 0.03); 
  float distThreshold = 0.05;
  
  for (int i = 0; i < count; ++i)
    {
        vec2 sampleTexcoord = v_texcoord + (poisson16[i] * (rad));
        float sampleDepth = texture2D(u_depthTex, sampleTexcoord).r;
        vec3 samplePos = texture2D(u_positionTex, sampleTexcoord).xyz;//getPositionFromDepth(v_texcoord); 
        vec3 sampleDir = normalize(samplePos - position);
    
        sampleDepth = linearizeDepth( sampleDepth, u_zNear, u_zFar );
        normal = normal * 2.0 - 1.0; 
        normal = normalize(normal); 
        float alpha = max(dot(normal, sampleDir), 0.0);

       float dist = distance(position, samplePos);
 
        float a = 1.0 - smoothstep(distThreshold, distThreshold * 2.0, dist);
        // b = dot-Product
        float b = alpha;
 
        ao += (a * b);
    }
 
  
   float ambientColor = 1.0 - (ao/16.0); 
  
  
  
  
  if (u_displayType == DISPLAY_TOON){
    if(l > lineThreshold)
      fragmentColor *= vec3(0.0);
     gl_FragColor = vec4(fragmentColor, 1.0); 
   }
  else if (u_displayType == DISPLAY_AMBIENT)
     gl_FragColor.a = ambientColor; 
  else if (u_displayType == DISPLAY_BLOOM)
    gl_FragColor = vec4(bloomColor, 1.0); 
  else
     gl_FragColor = vec4(shade, 1.0);
  

}