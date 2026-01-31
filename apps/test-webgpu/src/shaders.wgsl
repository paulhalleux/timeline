struct Uniforms {
  scale : vec2f,
};

@group(0) @binding(0) var imgSampler : sampler;
@group(0) @binding(1) var imgTexture : texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

struct VSOut {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vs(
  @location(0) pos : vec2f,
  @location(1) uv : vec2f
) -> VSOut {
  var out : VSOut;
  let scaled = pos * uniforms.scale;
  out.position = vec4f(scaled, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs(@location(0) uv : vec2f) -> @location(0) vec4f {
  return textureSample(imgTexture, imgSampler, uv);
}
