precision highp float;

uniform sampler2D u_positionTex;
uniform sampler2D u_normalTex;
uniform sampler2D u_colorTex;
uniform sampler2D u_depthTex;

uniform float u_zFar;
uniform float u_zNear;
uniform int u_displayType;

uniform vec3 u_lightColor; 

varying vec2 v_texcoord;

float linearizeDepth( float exp_depth, float near, float far ){
	return ( 2.0 * near ) / ( far + near - exp_depth * ( far - near ) );
}

void main()
{
  	// Write a diffuse shader and a Blinn-Phong shader
  	// NOTE : You may need to add your own normals to fulfill the second's requirements
  	vec3 color = texture2D(u_colorTex, v_texcoord).rgb; 
  vec3 normal = texture2D(u_normalTex, v_texcoord).rgb;
  vec3 position = texture2D(u_positionTex, v_texcoord).rgb;
  
 /* vec3 ambient = vec3(0.1, 0.1, 0.1) * color;
  
  vec3 lightPos = vec3(10.0, 5.0, -2.0); 
  vec3 lightDir = normalize(lightPos - position); 
  
  vec3 cameraPosition = vec3(0, 0, 4);
	vec3 cameraDir = normalize(cameraPosition - position); 
  
  //Diffuse
  
  float kdiff = max(dot(lightDir, normal), 0.0); 
  vec3 lightColor = vec3(1.0, 1.0, 1.0); 
  vec3 diffColor = kdiff * lightColor; */
  
  //Specular
  /*float n = 30.0; 
	vec3 ref = normalize(reflect(-lightDir, normal));
  
			
	float dotSpec = max(dot(lightDir, normal), 0.0);
  if (dotSpec > 1.0) dotSpec = 1.0; 
			
	float specular = pow(max(dot(ref, cameraDir), 0.0), n); 
				
	float c0 = min(ambient.x + dotSpec * lightColor.x  + specular, 1.0); 
	float c1 = min(ambient.y + dotSpec * lightColor.y  + specular, 1.0); 
	float c2 = min(ambient.z + dotSpec * lightColor.z  + specular, 1.0); 

 
  vec3 specColor = vec3(c0, c1, c2); //*/
  
  gl_FragColor = vec4(u_lightColor, 1.0);
}
