precision highp float;


#define DISPLAY_DIFF 5
#define DISPLAY_SPECULAR 6
#define DISPLAY_DOF 10
#define DISPLAY_AMBIENT 9
#define DISPLAY_EDGE 11

#define ambientRadius 0.01
#define samples 6.0


uniform sampler2D u_positionTex;
uniform sampler2D u_normalTex;
uniform sampler2D u_colorTex;
uniform sampler2D u_depthTex;

uniform float u_screenWidth; 
uniform float u_screenHeigth;
uniform float u_dof; 
uniform float u_wOffset; 
uniform vec3 u_ambientColor; 
uniform float u_ambientIntensity;
uniform float u_silhouetteThreshold;

uniform float u_zFar;
uniform float u_zNear;
uniform int u_displayType;


uniform vec3 u_lightColor; 
uniform vec3 u_lightPos; 

uniform mat4 u_modelview; 
uniform mat4 u_perspective;
uniform vec3 u_cameraPosition;

varying vec2 v_texcoord;

float heightFactor = 1.0/540.0;
float widthFactor = 1.0/960.0;

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

float doAmbientOcclusion(vec3 position, vec3 normal, float ambientIntensity, float depth){
  float ambientColor; 
  
  vec2 radius = vec2 (0.001, 0.001); 
  float distThreshold = 0.5;

  float ao = 0.0;
  const int count = 16; 
  
  for (int i = 0; i < count; ++i)
  {
    //Samples points with poisson-disk samples and calculate sample positions. 
    vec3 samplePos =  texture2D(u_positionTex, v_texcoord + (radius) * poisson16[i]).xyz;

    //Distance between fragments sample point and current frament position
    vec3 sampleDir = normalize(samplePos - position);
    
    //Calculate angle between fragments normal and direction. 
    vec4 pnormal = u_perspective * vec4(vec3(normal), 1.0);
    normal = vec3(pnormal) * 2.0 - 1.0; 
    normal = normalize(normal); 
    float alpha = max(dot(normal, sampleDir), 0.0);

    float dist = distance(samplePos, position);
  
  //Do blending between 1, 0 to limit inflence of points that are far away. 
    float a = 1.0 - smoothstep(distThreshold, distThreshold * 2.0, dist);
    float b = alpha;
 
     ao += (a * alpha * ambientIntensity);
    
    }
  
  ambientColor = (ao/16.0); 
  return ambientColor; 
}

float doSilhouette(){
    //edge detection usinng sobel convolution
  
  float silhouette; 
  vec2 heightStep = vec2(0.0, heightFactor); 
  vec2 widthStep = vec2(widthFactor, 0.0);
  float silhouetteFactor = 0.34; 
   
  vec2 center = v_texcoord.xy;
  vec2 left = v_texcoord.xy - widthStep;
  vec2 right = v_texcoord.xy + widthStep;

  vec2 top = v_texcoord.xy + heightStep;
  vec2 topLeft = v_texcoord.xy - widthStep + heightStep;
  vec2 topRight = v_texcoord.xy + widthStep + heightStep;

  vec2 bottom = v_texcoord.xy - heightStep;
  vec2 bottomLeft = v_texcoord.xy - widthStep - heightStep;
  vec2 bottomRight= v_texcoord.xy + widthStep - heightStep;
  
  vec4 i00 = texture2D(u_positionTex, topLeft); 
  vec4 i01 = texture2D(u_positionTex, top); 
  vec4 i02 = texture2D(u_positionTex, topRight); 
  vec4 i10 = texture2D(u_positionTex, left); 
  vec4 i11 = texture2D(u_positionTex, center); 
  vec4 i12 = texture2D(u_positionTex, right); 
  vec4 i20 = texture2D(u_positionTex, bottomLeft); 
  vec4 i21 = texture2D(u_positionTex, bottom); 
  vec4 i22 = texture2D(u_positionTex, bottomRight); 
  
  vec4 h = -i00 - 2.0 * i01 - i02 + i20 + 2.0 * i21 + i22;
  vec4 v = -i20 - 2.0 * i10 - i00 + i22 + 2.0 * i12 + i01;
  silhouette = u_wOffset * (length(h) + length(v)); 
  
  return silhouette;
  
}

vec3 doDiffuse(float kdiff, vec3 lightDir, vec3 normal, vec3 color){
   
   vec3 diffuseColor;
   float diffuse = max(dot(lightDir, normal), 0.0); 
   diffuseColor = kdiff * u_lightColor * color * diffuse; 
   
   return diffuseColor;
}

vec3 doSpecular(float kspec, float n, vec3 lightDir, vec3 viewVector, vec3 normal, vec3 color){
   vec3 specularColor; 
   
   vec3 ref = normalize(reflect(lightDir, normal));
   float dotSpec = clamp(dot(ref, viewVector), 0.0, 1.0);
   float specular = pow(dotSpec, n);        
   specularColor = kspec * u_lightColor * color * specular; 
   
   return specularColor;   
}

vec2 doToonColor (vec3 position, vec3 normal, vec3 color){
  
   vec2 diffSpec; 
   vec3 lightPos = (u_modelview*vec4(u_lightPos, 1.0)).xyz; 
   vec3 lightDir =normalize(lightPos - position); 
  
   vec3 viewVector = normalize(position - u_cameraPosition); 
  

   float diffuse = max(dot(lightDir, normal), 0.0);
  
   if (diffuse > 0.95)
      diffuse = 0.95;
   else if (diffuse > 0.806)
      diffuse = (0.85) ;
   else if (diffuse > 0.567)
      diffuse = (0.76);
   else if (diffuse > 0.326)
      diffuse = (0.4) ;
   else    
     diffuse = (0.1); 
     
     
  /* vec3 ref = normalize(reflect(lightDir, normal));
   float dotSpec = clamp(dot(ref, viewVector), 0.0, 1.0);
   float specular = pow(dotSpec, 2.0);  
  
   if (specular < 0.3)
     specular = 0.3; 
   else if (specular < 0.5)
    specular = 0.5; 
   else
    specular = 1.0;
   */
   diffSpec = vec2(diffuse, 0.0); 
     
   return diffSpec; 
}



void main()
{

   vec3 color = texture2D(u_colorTex, v_texcoord).rgb; 
   vec3 normal = normalize(texture2D(u_normalTex, v_texcoord).rgb);
   vec3 position = texture2D(u_positionTex, v_texcoord).rgb;
   float depth = texture2D( u_depthTex, v_texcoord ).x;
   
   vec3 lightPos = (u_modelview*vec4(u_lightPos, 1.0)).xyz; 
   vec3 lightDir = normalize(lightPos - position); 
   vec3 viewVector = normalize(position - u_cameraPosition); 
   
   // depth = linearizeDepth( depth, u_zNear, u_zFar );

   //ADD GUI
   float kdiff = 0.8;

   float kspec = 1.0; 
   float n = 2.0; 
   
   vec3 diffuseColor = doDiffuse(kdiff, lightDir, normal, color);
   vec3 specularColor = doSpecular(kspec, n, lightDir, viewVector, normal, color);    
  
  
   vec3 finalColor = u_ambientColor + diffuseColor + specularColor;
   vec2 diffSpec = doToonColor(position, normal, color); 
   vec3 toonColor = u_ambientColor + kdiff * u_lightColor * color * diffSpec.x +
      kspec * u_lightColor * color * diffSpec.y;
   
   float silhouette = doSilhouette();

   float ambientColor =  doAmbientOcclusion(position, normal, u_ambientIntensity, depth); 
  
    if( u_displayType == DISPLAY_DIFF )
         gl_FragColor = vec4(diffuseColor, 1.0);
   else if (u_displayType == 8){
    if(silhouette > length(position) * u_silhouetteThreshold)
       toonColor *= vec3(0.0);
     gl_FragColor = vec4(toonColor, 1.0); 
   }
   else if (u_displayType == 11){
    if(silhouette > length(position) * u_silhouetteThreshold)
       finalColor *= vec3(0.0);
     gl_FragColor = vec4(finalColor, 1.0); 
   }
     else if( u_displayType == DISPLAY_SPECULAR )
        gl_FragColor = vec4(specularColor, 1.0);
     else if (u_displayType == DISPLAY_AMBIENT){
       gl_FragColor = vec4(vec3(ambientColor), 1.0); 
     }
     else 
         gl_FragColor = vec4(finalColor, 1.0);
        

   
}