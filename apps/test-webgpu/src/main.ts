import shaderCode from "./shaders.wgsl" with {type: "text"};

export {};
const init = async () => {
  const canvas = document.getElementById("gpuCanvas") as HTMLCanvasElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No GPU adapter");

  const device = await adapter.requestDevice();

  const context = canvas.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: "premultiplied",
  });

  return { device, context };
}

const { device, context } = await init();

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

function computeAspectScale(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const imageAspect = imageWidth / imageHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  if (imageAspect > canvasAspect) {
    // Image is wider than canvas
    return [1, canvasAspect / imageAspect];
  } else {
    // Image is taller than canvas
    return [imageAspect / canvasAspect, 1];
  }
}

function createTextureFromImage(
  device: GPUDevice,
  image: ImageBitmap
) {
  const texture = device.createTexture({
    size: [image.width, image.height],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: image },
    { texture },
    [image.width, image.height]
  );

  return texture;
}

const sampler = device.createSampler({
  magFilter: "linear",
  minFilter: "linear",
});

const format = navigator.gpu.getPreferredCanvasFormat();
const pipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module: device.createShaderModule({ code: shaderCode }),
    entryPoint: "vs",
    buffers: [{
      arrayStride: 16, // 4 floats * 4 bytes
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x2", // position
        },
        {
          shaderLocation: 1,
          offset: 8,
          format: "float32x2", // uv
        },
      ],
    }],
  },
  fragment: {
    module: device.createShaderModule({ code: shaderCode }),
    entryPoint: "fs",
    targets: [{ format }],
  },
  primitive: {
    topology: "triangle-list",
  },
});

const transformBuffer = device.createBuffer({
  size: 8, // 2 floats
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});


function render(texture: GPUTexture) {
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: texture.createView() },
      { binding: 2, resource: { buffer: transformBuffer } },
    ],
  });

  const vertices = new Float32Array([
    // x,    y,    u,  v
    -1.0, -1.0, 0.0, 1.0,
     1.0, -1.0, 1.0, 1.0,
    -1.0,  1.0, 0.0, 0.0,
    -1.0,  1.0, 0.0, 0.0,
     1.0, -1.0, 1.0, 1.0,
     1.0,  1.0, 1.0, 0.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
    }],
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(6);
  pass.end();

  device.queue.submit([encoder.finish()]);
}

const input = document.getElementById("imageInput") as HTMLInputElement;
input.addEventListener("change", async () => {
  if (!input.files?.[0]) return;

  const bitmap = await loadImageBitmap(input.files[0]);
  const texture = createTextureFromImage(device, bitmap);

  const [scaleX, scaleY] = computeAspectScale(
    texture.width,
    texture.height,
    context.canvas.width,
    context.canvas.height
  );
  const transformData = new Float32Array([scaleX, scaleY]);
  device.queue.writeBuffer(transformBuffer, 0, transformData);


  render(texture);
});