precision highp float;


#define DISPLAY_DIFF 5
#define DISPLAY_SPECULAR 6


uniform sampler2D u_positionTex;
uniform sampler2D u_normalTex;
uniform sampler2D u_colorTex;
uniform sampler2D u_depthTex;

uniform float u_zFar;
uniform float u_zNear;
uniform int u_displayType;

uniform vec3 u_lightColor; 
uniform vec3 u_lightPos; 

uniform mat4 u_modelview; 
uniform vec3 u_cameraPosition;

varying vec2 v_texcoord;

float linearizeDepth( float exp_depth, float near, float far ){
	return ( 2.0 * near ) / ( far + near - exp_depth * ( far - near ) );
}

void main()
{
  	// Write a diffuse shader and a Blinn-Phong shader
  	// NOTE : You may need to add your own normals to fulfill the second's requirements
   vec3 color = texture2D(u_colorTex, v_texcoord).rgb; 
   vec3 normal = normalize(texture2D(u_normalTex, v_texcoord).rgb);
   vec3 position = texture2D(u_positionTex, v_texcoord).rgb;
   float depth = texture2D( u_depthTex, v_texcoord ).x;

	  depth = linearizeDepth( depth, u_zNear, u_zFar );
  
   vec3 ambient = vec3(0.1, 0.1, 0.1);
  
   vec3 lightPos = (u_modelview*vec4(u_lightPos, 1.0)).xyz; 
   vec3 lightDir = normalize(lightPos - position); 
  
    vec3 viewVector = normalize(position - u_cameraPosition); 
  
   //Diffuse
   float kdiff = 0.8;
   float diffuse = max(dot(lightDir, normal), 0.0); 
   vec3 diffColor = kdiff * u_lightColor * color * diffuse; 
  
   //Specular
   float kspec = 0.9; 
   float n = 2.0; 
	 vec3 ref = normalize(reflect(lightDir, normal));
  		
	 float dotSpec = clamp(dot(ref, viewVector), 0.0, 1.0);
			
	 float specular = pow(dotSpec, n); 				
	
   vec3 specColor = kspec * u_lightColor * color * specular; 
   
   vec3 finalColor = ambient + diffColor + specColor;
   
  
     if( u_displayType == DISPLAY_DIFF )
         gl_FragColor = vec4(diffColor, 1.0);
   
     else if( u_displayType == DISPLAY_SPECULAR )
        gl_FragColor = vec4(specColor, 1.0);
      
      else 
        gl_FragColor = vec4(finalColor, 1.0);

   
   
}