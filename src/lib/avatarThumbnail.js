const MAX_BYTES = 100 * 1024;

export async function createAvatarThumbnail(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image conversion unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 256, 256);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
    for (const type of ["image/webp", "image/jpeg"]) {
      for (const quality of [0.8, 0.65, 0.5]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
        if (blob && blob.type === type && blob.size <= MAX_BYTES) return blob;
      }
    }
    throw new Error("Image conversion failed");
  } finally {
    bitmap.close();
  }
}
